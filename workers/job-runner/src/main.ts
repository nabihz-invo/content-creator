/**
 * Job runner (ADR-0010): stands in for n8n. The `api` Edge Function can't reach this machine,
 * so instead of waiting for webhooks it picks up queued AI jobs (analysis, brief, script) and
 * hands each to `POST /internal/run-job`, signed like n8n (n8n/README.md "Calling convention").
 * Every minute it calls `/internal/recover` (expired leases, escalation, storage cleanup).
 * With the Claude Code relay (ADR-0011) it also answers the stages' model requests with Claude Code
 * on this PC. Creative and render jobs are claimed by their own workers.
 */
import { createHmac } from "node:crypto";
import { type AiRequest, answer } from "./claude-code.ts";

const required = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`missing ${k}`);
  return v;
};
const SUPABASE_URL = required("SUPABASE_URL").replace(/\/$/, "");
const KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const SECRET = required("N8N_WEBHOOK_SECRET");
const API = `${SUPABASE_URL}/functions/v1/api`;
const POLL_MS = Number(process.env.RUNNER_POLL_MS ?? 4000);
const RECOVER_MS = Number(process.env.RUNNER_RECOVER_MS ?? 60_000);
/** Stages the api function runs (EXECUTABLE_STAGES in supabase/functions/_shared/executor.ts). */
const STAGES = ["analysis", "brief", "script"];

const log = (msg: string) => console.log(`${new Date().toISOString()} ${msg}`);

async function signed(path: string, payload: unknown) {
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cc-timestamp": String(ts),
      "x-cc-signature": `sha256=${sig}`,
    },
    body,
  });
  return { status: res.status, text: await res.text() };
}

/** Queued AI jobs that are due, oldest first. */
async function due(): Promise<{ id: string; stage: string; project_id: string }[]> {
  const q = new URLSearchParams({
    select: "id,stage,project_id",
    kind: "eq.n8n",
    status: "eq.queued",
    stage: `in.(${STAGES.join(",")})`,
    next_run_at: `lte.${new Date().toISOString()}`,
    order: "next_run_at.asc",
    limit: "5",
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/workflow_jobs?${q}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`queue: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as { id: string; stage: string; project_id: string }[];
}

// A job handed over but not yet started stays `queued` for a moment; don't hand it over twice.
const handed = new Map<string, number>();

async function poll() {
  const now = Date.now();
  for (const [id, at] of handed) if (now - at > 120_000) handed.delete(id);
  for (const j of await due()) {
    if (handed.has(j.id)) continue;
    handed.set(j.id, now);
    const r = await signed("/internal/run-job", { job_id: j.id });
    log(
      `${j.stage} ${j.id.slice(0, 8)} (project ${j.project_id.slice(0, 8)}) → ${r.status} ${r.text.slice(0, 160)}`,
    );
  }
}

async function recover() {
  const r = await signed("/internal/recover", {});
  if (r.status !== 200) log(`recover → ${r.status} ${r.text.slice(0, 200)}`);
  else {
    const o = JSON.parse(r.text) as Record<string, unknown>;
    if (o.requeued || o.escalated || (o.storage as { removed?: number })?.removed)
      log(`recover: ${r.text.slice(0, 200)}`);
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${fn}: ${res.status} ${body.slice(0, 200)}`);
  return (body ? JSON.parse(body) : null) as T;
}

const CLAUDE = process.env.CLAUDE_CODE_OAUTH_TOKEN
  ? {
      bin: required("CLAUDE_BIN"),
      oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
      timeoutMs: Number(process.env.CLAUDE_TIMEOUT_S ?? 900) * 1000,
    }
  : null;
const WORKER = `runner-${process.pid}`;

/** One model request at a time: Claude Code answers, the job wakes and replays its stage. */
async function answerRequests() {
  const [req] = await rpc<AiRequest[]>("claim_ai_request", { p_worker_id: WORKER });
  if (!req) return;
  const t0 = Date.now();
  try {
    const response = await answer(req, CLAUDE!);
    await rpc("finish_ai_request", { p_id: req.id, p_response: response, p_error: null });
    log(
      `claude-code ${req.stage} ${req.id.slice(0, 8)} answered in ${Math.round((Date.now() - t0) / 1000)} s`,
    );
  } catch (e) {
    const msg = (e as Error).message;
    await rpc("finish_ai_request", { p_id: req.id, p_response: null, p_error: msg });
    log(`claude-code ${req.stage} ${req.id.slice(0, 8)} failed: ${msg.slice(0, 300)}`);
  }
}

function every(ms: number, fn: () => Promise<void>, name: string) {
  let busy = false;
  const tick = () => {
    if (busy) return;
    busy = true;
    fn()
      .catch((e: Error) =>
        log(`${name} failed: ${e.cause instanceof Error ? e.cause.message : e.message}`),
      )
      .finally(() => (busy = false));
  };
  tick();
  setInterval(tick, ms);
}

log(
  `job runner: ${STAGES.join(", ")} every ${POLL_MS / 1000} s, recovery every ${RECOVER_MS / 1000} s`,
);
every(POLL_MS, poll, "poll");
every(RECOVER_MS, recover, "recover");
if (CLAUDE) {
  log("answering AI requests with Claude Code (subscription)");
  every(POLL_MS, answerRequests, "claude-code");
} else
  log(
    "CLAUDE_CODE_OAUTH_TOKEN is not set: AI requests wait until it is (run `claude setup-token`)",
  );
