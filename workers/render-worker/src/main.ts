/**
 * Render worker loop (ADR-0008): claims render jobs of the output types it
 * supports, keeps the lease alive (with progress), stops when cancelled, and
 * reports the outcome. RENDER_CONCURRENCY loops share one process.
 */
import postgres from "postgres";
import { n8nNotifier } from "@cc/creative-worker/notify";
import { gitSourceStore } from "@cc/creative-worker/source-store";
import { supabaseStorage } from "@cc/creative-worker/storage";
import { loadConfig } from "./config.ts";
import { processRenderJob, RenderError, type RenderJobRow } from "./job.ts";

const cfg = loadConfig();
const log = (msg: string, extra: Record<string, unknown> = {}) =>
  console.log(
    JSON.stringify({ at: new Date().toISOString(), worker: cfg.workerId, msg, ...extra }),
  );

const sql = postgres(cfg.databaseUrl, {
  max: 2 + cfg.concurrency,
  prepare: false,
  onnotice: () => {},
});
const storage = supabaseStorage(cfg.supabaseUrl, cfg.serviceRoleKey);
const source = gitSourceStore(cfg.repoUrl);
const notify = n8nNotifier(cfg.n8nBaseUrl, cfg.n8nWebhookSecret);

let stopping = false;
for (const sig of ["SIGINT", "SIGTERM"] as const)
  process.on(sig, () => ((stopping = true), log("stopping after the current job")));

async function runOne(slot: number): Promise<boolean> {
  const workerId = `${cfg.workerId}#${slot}`;
  const [job] = await sql<RenderJobRow[]>`
    select id, project_id, input_reference
    from public.claim_render_job(${workerId}, ${cfg.leaseS}, ${cfg.outputTypes}::public.render_output_type[])`;
  if (!job) return false;
  log("claimed", {
    job: job.id,
    project: job.project_id,
    render: job.input_reference.render_job_id,
  });

  let progress: number | null = null;
  let lost = false;
  const beat = async () => {
    try {
      const [{ ok }] = (await sql`
        select public.heartbeat_job(${job.id}, ${workerId}, ${progress}, ${cfg.leaseS}) as ok`) as unknown as [
        { ok: boolean },
      ];
      if (!ok) lost = true;
    } catch (err) {
      log("heartbeat failed", { error: String(err) });
    }
  };
  const timer = setInterval(beat, Math.max(5_000, (cfg.leaseS * 1000) / 4));

  try {
    const r = await processRenderJob(
      {
        sql,
        storage,
        source,
        workDir: cfg.workDir,
        workerId,
        pageTimeoutMs: cfg.pageTimeoutS * 1000,
        maxPngBytes: cfg.maxPngBytes,
        minLumaStddev: cfg.minLumaStddev,
        log: (m, e) => log(m, { job: job.id, ...e }),
        progress: (p) => {
          progress = p;
          void beat();
        },
      },
      job,
    );
    log("done", { job: job.id, ...r });
    await notify("media_ready", { job_id: job.id, project_id: job.project_id, stage: "render" });
  } catch (err) {
    if (lost) {
      log("job no longer ours (cancelled or reclaimed)", { job: job.id });
      return true;
    }
    const e =
      err instanceof RenderError
        ? err
        : new RenderError(err instanceof Error ? err.message : String(err), true, "internal");
    log("failed", { job: job.id, code: e.code, retryable: e.retryable, error: e.message });
    if (e.code === "obsolete") await sql`select public.cancel_job(${job.id})`;
    else {
      const [{ status }] = (await sql`
        select status::text from public.fail_job(${job.id}, ${sql.json({ code: e.code, message: e.message.slice(0, 2000) })}, ${e.retryable}, ${workerId})`) as unknown as [
        { status: string },
      ];
      if (status === "needs_attention")
        await notify("needs_attention", {
          job_id: job.id,
          project_id: job.project_id,
          stage: "render",
        });
    }
  } finally {
    clearInterval(timer);
  }
  return true;
}

async function loop(slot: number) {
  while (!stopping) {
    try {
      if (!(await runOne(slot))) await new Promise((r) => setTimeout(r, cfg.pollMs));
    } catch (err) {
      log("loop error", { error: String(err) });
      await new Promise((r) => setTimeout(r, cfg.pollMs));
    }
  }
}

log("started", { outputTypes: cfg.outputTypes, concurrency: cfg.concurrency });
await Promise.all(Array.from({ length: cfg.concurrency }, (_, i) => loop(i)));
await sql.end();
