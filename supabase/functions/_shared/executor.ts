/**
 * Runs one pipeline job (analysis, brief, or script) end to end:
 * claim → load inputs from Postgres → AI stage → deterministic post-processing
 * → atomic save_* RPC (which completes the job) → dispatch the next job.
 * Delivered by n8n through /api/internal/run-job; safe to deliver twice.
 */
import type { Sql } from "./db.ts";
import { LlmError } from "./llm.ts";
import type { Dispatcher } from "./n8n.ts";
import { STAGE_WORKFLOW } from "./n8n.ts";
import type { StageAi, StageOverrides } from "./stage-ai.ts";
import { defaultNet, fetchAndExtract, type Net } from "./url-extract.ts";
import type { Analysis, Brief, Script } from "./vendor/src/ai-schemas.ts";
import { contentHash } from "./vendor/src/hash.ts";
import {
  type BrandContext,
  composeClarification,
  composeQuestionnaire,
  enforceApprovedConfig,
} from "./vendor/src/pipeline.ts";
import type { Answers, Questionnaire } from "./vendor/src/questionnaire.ts";

export interface ExecutorDeps {
  sql: Sql;
  ai: StageAi;
  dispatcher: Dispatcher;
  workerId: string;
  net?: Net;
}

export const EXECUTABLE_STAGES = new Set(["analysis", "brief", "script"]);
const MAX_CLARIFICATION_ROUNDS = 2;

interface JobRow {
  id: string;
  project_id: string;
  stage: string;
  status: string;
  attempts: number;
  max_attempts: number;
  input_reference: Record<string, unknown>;
}

interface ProjectRow {
  id: string;
  workspace_id: string;
  title: string;
  original_idea: string;
  input_source: string;
  source_url: string | null;
  source_metadata: Record<string, unknown>;
  content_type: string | null;
  owner_locale: "en" | "ar" | null;
  brand_name: string | null;
  brand_language: string | null;
  brand_settings: BrandContext["settings"] | null;
}

export type RunOutcome =
  | { outcome: "skipped"; reason: string }
  | { outcome: "succeeded"; result: Record<string, unknown> }
  | { outcome: "failed"; retryable: boolean; error: string };

class StageError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

async function loadProject(sql: Sql, id: string): Promise<ProjectRow> {
  const [p] = await sql<ProjectRow[]>`
    select p.id, p.workspace_id, p.title, p.original_idea, p.input_source::text, p.source_url, p.source_metadata,
           p.content_type::text, pr.locale as owner_locale,
           b.name as brand_name, b.default_language as brand_language, b.brand_settings
    from public.content_projects p
    left join public.brands b on b.id = p.brand_id
    left join public.profiles pr on pr.id = p.owner_id
    where p.id = ${id}`;
  if (!p) throw new StageError(`project ${id} not found`, "not_found", false);
  return p;
}

const brandOf = (p: ProjectRow): BrandContext | null =>
  p.brand_name
    ? {
        name: p.brand_name,
        default_language: p.brand_language ?? "en",
        settings: p.brand_settings ?? {},
      }
    : null;

async function overrides(sql: Sql, workspaceId: string, stage: string): Promise<StageOverrides> {
  const [row] = await sql<
    {
      model: string;
      prompt_version: string;
      parameters: { effort?: string; max_tokens?: number };
    }[]
  >`
    select model, prompt_version, parameters from public.ai_settings where workspace_id = ${workspaceId} and stage = ${stage}`;
  if (!row) return {};
  return {
    promptVersion: row.prompt_version,
    settings: {
      model: row.model,
      ...(row.parameters?.effort ? { effort: row.parameters.effort as never } : {}),
      ...(row.parameters?.max_tokens ? { maxTokens: row.parameters.max_tokens } : {}),
    },
  };
}

// ── analysis ────────────────────────────────────────────────────────────────
async function runAnalysis(deps: ExecutorDeps, job: JobRow) {
  const { sql } = deps;
  const p = await loadProject(sql, job.project_id);
  let extracted = p.source_metadata?.extracted as
    { final_url: string; title: string | null; text: string } | undefined;
  if (p.source_url && !extracted) {
    // Read the linked page now if intake didn't; a failure only means less context.
    try {
      const e = await fetchAndExtract(p.source_url, deps.net ?? defaultNet);
      extracted = e;
      await sql`
        update public.content_projects
        set source_metadata = source_metadata || ${sql.json({ extracted: { ...e, fetched_at: new Date().toISOString() } } as never)}
        where id = ${p.id}`;
      await sql`select public.log_event(${p.id}, 'source.extracted', ${sql.json({ final_url: e.final_url, chars: e.text.length } as never)}, null, ${job.id})`;
    } catch (err) {
      await sql`select public.log_event(${p.id}, 'source.extract_failed', ${sql.json({ message: String((err as Error).message ?? err) } as never)}, null, ${job.id})`;
    }
  }
  const brand = brandOf(p);
  const r = await deps.ai.analyze(
    {
      brand,
      title: p.title,
      idea: p.original_idea,
      input_source: p.input_source,
      content_type_hint: p.content_type,
      ui_locale: p.owner_locale ?? "en",
      source_page: extracted
        ? { url: extracted.final_url, title: extracted.title, text: extracted.text }
        : null,
    },
    await overrides(sql, p.workspace_id, "analysis"),
  );
  const questionnaire = composeQuestionnaire(r.output, brand);
  const [row] = await sql<{ r: Record<string, unknown> }[]>`
    select public.save_analysis(${job.id}, ${p.id}, ${sql.json(r.output.analysis as never)}, ${sql.json(questionnaire as never)},
                                ${r.model}, ${r.promptVersion}) as r`;
  return { result: row!.r, notify: "configuration_ready" };
}

// ── brief ───────────────────────────────────────────────────────────────────
async function runBrief(deps: ExecutorDeps, job: JobRow) {
  const { sql } = deps;
  const p = await loadProject(sql, job.project_id);
  const [initial] = await sql<
    { id: string; answers: Answers; questions: Questionnaire; analysis: Analysis | null }[]
  >`
    select a.id, a.answers, q.questions, pa.analysis
    from public.questionnaire_answers a
    join public.questionnaires q on q.id = a.questionnaire_id
    left join public.project_analyses pa on pa.id = q.analysis_id
    where a.project_id = ${p.id} and q.kind = 'initial' and not a.is_draft and a.status = 'current' and q.status = 'answered'
    order by q.version desc, a.submitted_at desc
    limit 1`;
  if (!initial) throw new StageError("no approved configuration", "invalid_transition", false);
  const clar = await sql<{ answers: Answers; questions: Questionnaire }[]>`
    select a.answers, q.questions
    from public.questionnaire_answers a
    join public.questionnaires q on q.id = a.questionnaire_id
    where a.project_id = ${p.id} and q.kind = 'clarification' and q.status = 'answered' and not a.is_draft and a.status = 'current'
    order by q.version`;
  const brand = brandOf(p);
  const r = await deps.ai.brief(
    {
      brand,
      analysis: initial.analysis,
      questionnaire: initial.questions,
      answers: initial.answers,
      clarifications: clar.map((c) => ({ questionnaire: c.questions, answers: c.answers })),
      idea: p.original_idea,
    },
    await overrides(sql, p.workspace_id, "brief"),
  );
  const out = r.output;
  if (out.status === "needs_clarification") {
    if (clar.length >= MAX_CLARIFICATION_ROUNDS) {
      throw new StageError(
        `still missing information after ${clar.length} clarification rounds`,
        "clarification_limit",
        false,
      );
    }
    const q = composeClarification(out.clarification_questions);
    const details = { contradictions: out.contradictions };
    const [row] = await sql<{ r: Record<string, unknown> }[]>`
      select public.save_brief(${job.id}, ${p.id}, ${initial.id}, null, ${await contentHash(details)}, 'needs_clarification',
                               ${sql.json(details as never)}, ${sql.json(q as never)}, ${r.model}, ${r.promptVersion}) as r`;
    return { result: row!.r, notify: "clarification_needed" };
  }
  const brief = enforceApprovedConfig(out.brief!, initial.answers);
  const [row] = await sql<{ r: Record<string, unknown> }[]>`
    select public.save_brief(${job.id}, ${p.id}, ${initial.id}, ${sql.json(brief as never)}, ${await contentHash(brief)}, 'valid',
                             ${sql.json({ contradictions: out.contradictions } as never)}, null, ${r.model}, ${r.promptVersion}) as r`;
  return { result: row!.r, notify: null };
}

// ── script ──────────────────────────────────────────────────────────────────
async function runScript(deps: ExecutorDeps, job: JobRow) {
  const { sql } = deps;
  const p = await loadProject(sql, job.project_id);
  const briefId = String(job.input_reference.brief_id ?? "");
  const [b] = await sql<
    { brief: Brief }[]
  >`select brief from public.content_briefs where id = ${briefId} and project_id = ${p.id}`;
  if (!b) throw new StageError("brief not found", "not_found", false);
  let previous: {
    script: Script;
    version: number;
    comment: string | null;
    instructions: string | null;
  } | null = null;
  const baseId = job.input_reference.base_script_id as string | undefined;
  if (baseId) {
    const [s] = await sql<
      { content: Script; version: number }[]
    >`select content, version from public.scripts where id = ${baseId}`;
    let comment: string | null = null;
    if (job.input_reference.approval_id) {
      const [a] = await sql<
        { comment: string | null }[]
      >`select comment from public.approvals where id = ${String(job.input_reference.approval_id)}`;
      comment = a?.comment ?? null;
    }
    if (s)
      previous = {
        script: s.content,
        version: s.version,
        comment,
        instructions: (job.input_reference.instructions as string | undefined) ?? null,
      };
  }
  const r = await deps.ai.script(
    { brand: brandOf(p), brief: b.brief, previous },
    await overrides(sql, p.workspace_id, "script"),
  );
  const [row] = await sql<{ r: Record<string, unknown> }[]>`
    select public.save_script(${job.id}, ${p.id}, ${briefId}, ${sql.json(r.output as never)}, ${await contentHash(r.output)}, 'ai',
                              ${baseId ?? null}, null, ${r.model}, ${r.promptVersion}) as r`;
  return { result: row!.r, notify: "script_ready" };
}

const RUNNERS: Record<
  string,
  (
    deps: ExecutorDeps,
    job: JobRow,
  ) => Promise<{ result: Record<string, unknown>; notify: string | null }>
> = {
  analysis: runAnalysis,
  brief: runBrief,
  script: runScript,
};

function errorInfo(err: unknown): { code: string; message: string; retryable: boolean } {
  if (err instanceof LlmError || err instanceof StageError)
    return { code: err.code, message: err.message, retryable: err.retryable };
  const e = err as { hint?: string; message?: string };
  // The project moved on (cancelled, configuration resubmitted…): this job is obsolete.
  if (e?.hint === "invalid_transition")
    return { code: "obsolete", message: e.message ?? "project moved on", retryable: false };
  return { code: "internal", message: e?.message ?? String(err), retryable: true };
}

export async function runJob(deps: ExecutorDeps, jobId: string): Promise<RunOutcome> {
  const { sql } = deps;
  const [peek] = await sql<
    { stage: string }[]
  >`select stage::text from public.workflow_jobs where id = ${jobId}`;
  if (!peek) return { outcome: "skipped", reason: "unknown job" };
  if (!EXECUTABLE_STAGES.has(peek.stage))
    return { outcome: "skipped", reason: `stage ${peek.stage} runs elsewhere` };

  const [job] = await sql<JobRow[]>`
    select id, project_id, stage::text, status::text, attempts, max_attempts, input_reference
    from public.start_job(${jobId}, ${deps.workerId}) where id is not null`;
  if (!job)
    return {
      outcome: "skipped",
      reason: "job is not runnable (finished, leased, or waiting for retry)",
    };

  try {
    const { result, notify } = await RUNNERS[job.stage]!(deps, job);
    const next = result.next_job_id as string | undefined;
    if (next) {
      const [nj] = await sql<
        { stage: string }[]
      >`select stage::text from public.workflow_jobs where id = ${next}`;
      if (nj)
        await deps.dispatcher.dispatch(STAGE_WORKFLOW[nj.stage] ?? nj.stage, {
          job_id: next,
          project_id: job.project_id,
          stage: nj.stage,
        });
    }
    if (notify)
      await deps.dispatcher.dispatch("notify", {
        job_id: job.id,
        project_id: job.project_id,
        stage: job.stage,
        event: notify,
      });
    return { outcome: "succeeded", result };
  } catch (err) {
    const info = errorInfo(err);
    console.error(`job ${job.id} (${job.stage}) failed: ${info.code}: ${info.message}`);
    if (info.code === "obsolete") {
      await sql`select public.cancel_job(${job.id})`;
      return { outcome: "failed", retryable: false, error: info.message };
    }
    const [failed] = await sql<{ status: string }[]>`
      select status::text from public.fail_job(${job.id}, ${sql.json({ code: info.code, message: info.message.slice(0, 2000) } as never)},
                                         ${info.retryable}, ${deps.workerId})`;
    if (failed?.status === "needs_attention") {
      await deps.dispatcher.dispatch("notify", {
        job_id: job.id,
        project_id: job.project_id,
        stage: job.stage,
        event: "needs_attention",
      });
    }
    return { outcome: "failed", retryable: failed?.status === "queued", error: info.message };
  }
}

/** Workflow R: reclaim expired leases, then re-dispatch queued jobs whose delivery was lost. */
export async function recover(sql: Sql, dispatcher: Dispatcher, staleSeconds = 120) {
  const [r] = await sql<
    { r: { requeued: number; escalated: number } }[]
  >`select public.recover_jobs() as r`;
  const stale = await sql<{ id: string; project_id: string; stage: string }[]>`
    select id, project_id, stage::text from public.workflow_jobs
    where kind = 'n8n' and status = 'queued' and stage::text = any(${[...EXECUTABLE_STAGES]}::text[])
      and next_run_at < now() - make_interval(secs => ${staleSeconds})
    order by next_run_at limit 50`;
  let dispatched = 0;
  for (const j of stale) {
    if (
      await dispatcher.dispatch(STAGE_WORKFLOW[j.stage] ?? j.stage, {
        job_id: j.id,
        project_id: j.project_id,
        stage: j.stage,
      })
    )
      dispatched++;
  }
  return { ...r!.r, redispatched: dispatched, stale: stale.length };
}
