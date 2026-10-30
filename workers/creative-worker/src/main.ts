/**
 * Creative worker loop (ADR-0007): claim creative_worker jobs from Postgres,
 * keep the lease alive, stop when a job is cancelled, and report the outcome.
 */
import postgres from "postgres";
import { loadConfig } from "./config.ts";
import { claudeCodeGenerator, type Generator, templateGenerator } from "./generators.ts";
import { type CreativeJob, JobError, processCreativeJob } from "./job.ts";
import { ensureLocalRepo, gitSourceStore } from "./source-store.ts";
import { supabaseStorage } from "./storage.ts";

const cfg = loadConfig();
const log = (msg: string, extra: Record<string, unknown> = {}) =>
  console.log(
    JSON.stringify({ at: new Date().toISOString(), worker: cfg.workerId, msg, ...extra }),
  );

let generator: Generator = templateGenerator;
if (cfg.generator === "claude-code") {
  if (!cfg.anthropicApiKey)
    throw new Error("CREATIVE_GENERATOR=claude-code needs ANTHROPIC_API_KEY");
  generator = claudeCodeGenerator({
    bin: cfg.claudeBin,
    apiKey: cfg.anthropicApiKey,
    model: cfg.claudeModel,
    effort: cfg.claudeEffort,
    budgetUsd: cfg.claudeBudgetUsd,
    timeoutMs: cfg.jobTimeoutS * 1000,
  });
}

const sql = postgres(cfg.databaseUrl, { max: 3, prepare: false, onnotice: () => {} });
await ensureLocalRepo(cfg.repoUrl, cfg.workDir);
const deps = {
  sql,
  storage: supabaseStorage(cfg.supabaseUrl, cfg.serviceRoleKey),
  source: gitSourceStore(cfg.repoUrl),
  generator,
  repoDisplayUrl: cfg.repoDisplayUrl,
  workDir: cfg.workDir,
  log,
};

let stopping = false;
for (const sig of ["SIGINT", "SIGTERM"] as const)
  process.on(sig, () => ((stopping = true), log("stopping after the current job")));

async function runOne(): Promise<boolean> {
  const [job] = await sql<CreativeJob[]>`
    select id, project_id, input_reference from public.claim_job('creative_worker', ${cfg.workerId}, ${cfg.leaseS})`;
  if (!job) return false;
  log("claimed", { job: job.id, project: job.project_id });

  // Heartbeat keeps the lease; a false heartbeat means cancelled or reclaimed → abort.
  const abort = new AbortController();
  const beat = setInterval(
    async () => {
      try {
        const [{ ok }] =
          (await sql`select public.heartbeat_job(${job.id}, ${cfg.workerId}, null, ${cfg.leaseS}) as ok`) as unknown as [
            { ok: boolean },
          ];
        if (!ok) abort.abort();
      } catch (err) {
        log("heartbeat failed", { error: String(err) });
      }
    },
    Math.max(5_000, (cfg.leaseS * 1000) / 4),
  );

  try {
    const r = await processCreativeJob(deps, job, abort.signal);
    log("done", { job: job.id, ...r });
  } catch (err) {
    if (abort.signal.aborted) {
      log("job no longer ours (cancelled or reclaimed)", { job: job.id });
      return true;
    }
    const e =
      err instanceof JobError
        ? err
        : new JobError(err instanceof Error ? err.message : String(err), true, "internal");
    log("failed", { job: job.id, code: e.code, retryable: e.retryable, error: e.message });
    if (e.code === "obsolete") await sql`select public.cancel_job(${job.id})`;
    else
      await sql`select public.fail_job(${job.id}, ${sql.json({ code: e.code, message: e.message.slice(0, 2000) })}, ${e.retryable}, ${cfg.workerId})`;
  } finally {
    clearInterval(beat);
  }
  return true;
}

log("started", { generator: generator.name, repo: cfg.repoDisplayUrl });
while (!stopping) {
  try {
    const worked = await runOne();
    if (!worked) await new Promise((r) => setTimeout(r, cfg.pollMs));
  } catch (err) {
    log("loop error", { error: String(err) });
    await new Promise((r) => setTimeout(r, cfg.pollMs));
  }
}
await sql.end();
