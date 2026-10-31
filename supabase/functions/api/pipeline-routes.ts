/**
 * Phase 2 endpoints (docs/API.md): analysis, AI configuration review/approval,
 * scripts, approvals, and the internal job runner used by n8n.
 */
import type { Context, Hono } from "hono";
import { requireProjectRole, requireUser } from "../_shared/auth.ts";
import type { Deps } from "../_shared/deps.ts";
import { ApiError } from "../_shared/errors.ts";
import { EXECUTABLE_STAGES, recover, runJob } from "../_shared/executor.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { STAGE_WORKFLOW, verifySignature } from "../_shared/n8n.ts";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { schemaErrors, validate } from "../_shared/validate.ts";
import { type Brief, SCRIPT_SCHEMAS, type Script } from "../_shared/vendor/src/ai-schemas.ts";
import { contentHash } from "../_shared/vendor/src/hash.ts";
import { signPreviewToken } from "../_shared/vendor/src/preview-token.ts";
import { checkScript } from "../_shared/vendor/src/pipeline.ts";
import {
  type Answers,
  type Questionnaire,
  validateAnswers,
} from "../_shared/vendor/src/questionnaire.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function projectId(c: Context): string {
  const id = c.req.param("id") ?? "";
  if (!UUID.test(id)) throw new ApiError("not_found", "project not found");
  return id;
}

async function body(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError("validation_failed", "body must be valid JSON");
  }
}

async function signedBody(c: Context, secret: string | null): Promise<Record<string, unknown>> {
  const raw = await c.req.text();
  if (
    !secret ||
    !(await verifySignature(
      secret,
      c.req.header("x-cc-timestamp") ?? null,
      c.req.header("x-cc-signature") ?? null,
      raw,
    ))
  ) {
    throw new ApiError("unauthorized", "invalid signature");
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError("validation_failed", "body must be valid JSON");
  }
}

export function registerPipelineRoutes(app: Hono, deps: Deps) {
  const { sql } = deps;

  /** Hands n8n-run jobs to n8n; worker jobs (creative, render) are claimed from the queue by their workers. */
  async function dispatchJob(jobId: string | null | undefined, projectId: string) {
    if (!jobId) return;
    const [j] = await sql<
      { stage: string; kind: string }[]
    >`select stage::text, kind::text from public.workflow_jobs where id = ${jobId}`;
    if (j?.kind === "n8n")
      await deps.dispatcher.dispatch(STAGE_WORKFLOW[j.stage] ?? j.stage, {
        job_id: jobId,
        project_id: projectId,
        stage: j.stage,
      });
  }

  // POST /api/content-projects/:id/analyze — (re)run the AI analysis
  app.post("/content-projects/:id/analyze", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:analyze`, 20);
    const id = projectId(c);
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const [{ r }] =
      (await sql`select public.request_analysis(${id}, ${userId}) as r`) as unknown as [
        { r: { job_id: string; status: string } },
      ];
    await dispatchJob(r.job_id, id);
    return c.json(r, 202);
  });

  // POST /api/content-projects/:id/questionnaire/submit — save draft or approve the configuration
  app.post("/content-projects/:id/questionnaire/submit", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:questionnaire`, 60);
    const id = projectId(c);
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ questionnaire_id: string; answers: Answers; draft?: boolean }>(
      "questionnaireSubmit",
      await body(c),
    );
    const [q] = await sql<{ questions: Questionnaire }[]>`
      select questions from public.questionnaires where id = ${input.questionnaire_id} and project_id = ${id}`;
    if (!q) throw new ApiError("not_found", "questionnaire not found");

    if (input.draft) {
      const [{ draft_id }] = (await sql`
        select public.save_answers_draft(${id}, ${input.questionnaire_id}, ${sql.json(input.answers as never)}, ${userId}) as draft_id`) as unknown as [
        { draft_id: string },
      ];
      return c.json({ draft_id, saved: true });
    }

    const check = validateAnswers(q.questions, input.answers);
    if (!check.valid) {
      throw new ApiError("validation_failed", "some answers are missing or invalid", {
        fields: check.errors,
      });
    }
    const hash = await contentHash(check.cleaned);
    const [{ r }] = (await sql`
      select public.submit_answers(${id}, ${input.questionnaire_id}, ${sql.json(check.cleaned as never)}, ${hash}, ${userId}) as r`) as unknown as [
      { r: { answers_id: string; approval_id: string; job_id: string; status: string } },
    ];
    await dispatchJob(r.job_id, id);
    return c.json({ ...r, content_hash: hash }, 202);
  });

  // POST /api/content-projects/:id/scripts/generate — regenerate with instructions
  app.post("/content-projects/:id/scripts/generate", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:script-generate`, 10);
    const id = projectId(c);
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ instructions: string }>("scriptGenerate", await body(c));
    const [{ r }] =
      (await sql`select public.request_script_regeneration(${id}, ${userId}, ${input.instructions}) as r`) as unknown as [
        { r: { job_id: string; status: string } },
      ];
    await dispatchJob(r.job_id, id);
    return c.json(r, 202);
  });

  // POST /api/content-projects/:id/scripts — manual edit → new version
  app.post("/content-projects/:id/scripts", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:script-edit`, 30);
    const id = projectId(c);
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ base_script_id: string; content: Script }>(
      "scriptEdit",
      await body(c),
    );
    const [base] = await sql<{ brief_id: string; brief: Brief }[]>`
      select s.brief_id, b.brief from public.scripts s join public.content_briefs b on b.id = s.brief_id
      where s.id = ${input.base_script_id} and s.project_id = ${id}`;
    if (!base) throw new ApiError("not_found", "script not found");
    const problems = [...schemaErrors(SCRIPT_SCHEMAS[base.brief.content_type], input.content)];
    if (!problems.length) problems.push(...checkScript(input.content, base.brief));
    if (problems.length)
      throw new ApiError("validation_failed", "the script is not valid", { errors: problems });
    const hash = await contentHash(input.content);
    const r = await withIdempotency(
      sql,
      {
        scope: `script-edit:${userId}`,
        key: c.req.header("idempotency-key") ?? null,
        userId,
        request: input,
      },
      async () => {
        const [{ r }] = (await sql`
          select public.save_script(null, ${id}, ${base.brief_id}, ${sql.json(input.content as never)}, ${hash}, 'manual_edit',
                                    ${input.base_script_id}, ${userId}, null, null) as r`) as unknown as [
          { r: Record<string, unknown> },
        ];
        return { status: 201, body: { ...r, content_hash: hash } };
      },
    );
    return c.json(r.body as Record<string, unknown>, r.status as 201);
  });

  // POST /api/approvals — approve / request changes / reject an exact version
  app.post("/approvals", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:approvals`, 30);
    const input = validate<{
      artifact_type: string;
      artifact_id: string;
      artifact_version: number;
      artifact_hash: string;
      decision: "approved" | "changes_requested" | "rejected";
      comment?: string;
      return_to?: "render" | "creative";
    }>("approval", await body(c));
    const [{ r }] = (await sql`
      select public.record_approval(${userId}, ${input.artifact_type}, ${input.artifact_id}, ${input.artifact_version},
                                    ${input.artifact_hash}, ${input.decision}::public.approval_decision, ${input.comment ?? null},
                                    ${input.return_to ?? null}) as r`) as unknown as [
      { r: { approval_id: string; status: string; next_job_id: string | null } },
    ];
    const [p] = await sql<
      { project_id: string }[]
    >`select project_id from public.approvals where id = ${r.approval_id}`;
    await dispatchJob(r.next_job_id, p!.project_id);
    return c.json(r, 201);
  });

  // GET /api/creative-versions/:id/preview — short-lived link on the isolated preview origin
  app.get("/creative-versions/:id/preview", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = c.req.param("id") ?? "";
    if (!UUID.test(id)) throw new ApiError("not_found", "creative version not found");
    const [cv] = await sql<{ project_id: string; preview_path: string | null }[]>`
      select project_id, preview_path from public.creative_versions where id = ${id}`;
    if (!cv?.preview_path) throw new ApiError("not_found", "creative version not found");
    await requireProjectRole(sql, userId, cv.project_id, ["admin", "editor", "reviewer"]);
    const origin = deps.config.previewOrigin;
    const secret = deps.config.previewSigningSecret;
    if (!origin || !secret) throw new ApiError("internal", "preview origin is not configured");
    const expires = Math.floor(Date.now() / 1000) + 30 * 60;
    const token = await signPreviewToken(secret, { p: cv.preview_path, e: expires });
    const base = `${origin.replace(/\/$/, "")}/p/${token}/`;
    return c.json({
      url: `${base}index.html`,
      base,
      expires_at: new Date(expires * 1000).toISOString(),
    });
  });

  // POST /api/internal/run-job — n8n delivers a job id (HMAC-signed)
  app.post("/internal/run-job", async (c) => {
    const payload = await signedBody(c, deps.config.n8nWebhookSecret);
    const jobId = String(payload.job_id ?? "");
    if (!UUID.test(jobId)) throw new ApiError("validation_failed", "job_id is required");
    if (!deps.ai) throw new ApiError("internal", "AI provider is not configured");
    const [j] = await sql<
      { stage: string; status: string }[]
    >`select stage::text, status::text from public.workflow_jobs where id = ${jobId}`;
    if (!j) throw new ApiError("not_found", "job not found");
    if (!EXECUTABLE_STAGES.has(j.stage))
      return c.json({ accepted: false, reason: `stage ${j.stage} is not run here` });
    const work = runJob(
      {
        sql,
        ai: deps.ai,
        dispatcher: deps.dispatcher,
        workerId: `edge:${crypto.randomUUID().slice(0, 8)}`,
        net: deps.net,
      },
      jobId,
    );
    if (deps.background) {
      deps.background(work);
      return c.json({ accepted: true, job_id: jobId }, 202);
    }
    return c.json({ accepted: true, job_id: jobId, ...(await work) }, 200);
  });

  // POST /api/internal/recover — Workflow R cron (HMAC-signed)
  app.post("/internal/recover", async (c) => {
    await signedBody(c, deps.config.n8nWebhookSecret);
    return c.json(await recover(sql, deps.dispatcher));
  });
}
