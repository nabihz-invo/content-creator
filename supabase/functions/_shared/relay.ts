/**
 * Claude Code relay (ADR-0011): AI stages answered by Claude Code on the owner's PC, with their
 * Claude subscription, instead of the Anthropic API.
 *
 * The transport doesn't call a model. It looks for the stored reply to this exact request
 * (job + attempt + params); without one it records the request in `ai_requests` and throws
 * `AiDeferred`, and the executor parks the job (`defer_job`). The job runner answers the request
 * with Claude Code and wakes the job; the stage then runs again from the start and this time the
 * transport returns the stored reply, so prompts, schema checks, retries and saving are unchanged.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type Anthropic from "@anthropic-ai/sdk";
import type { Sql } from "./db.ts";
import { LlmError, type Transport } from "./llm.ts";
import { canonicalJson, sha256Hex } from "./vendor/src/hash.ts";

/** The job a stage is running for (set by the executor around each stage). */
export const jobContext = new AsyncLocalStorage<{
  jobId: string;
  attempts: number;
  stage: string;
}>();

/** The request is waiting for Claude Code; not an error. */
export class AiDeferred extends Error {
  /** Checked by generateJson (llm.ts) so the signal passes through untouched. */
  readonly deferred = true;
  constructor(readonly requestId: string | null) {
    super("waiting for Claude Code");
  }
}

export function relayTransport(sql: Sql): Transport {
  return async (params) => {
    const ctx = jobContext.getStore();
    if (!ctx) throw new LlmError("the Claude Code relay runs only inside a job", "unknown", false);
    const key = await sha256Hex(canonicalJson({ job: ctx.jobId, attempt: ctx.attempts, params }));
    const [row] = await sql<
      {
        id: string;
        status: string;
        response: Anthropic.Beta.BetaMessage | null;
        error: string | null;
      }[]
    >`select id, status, response, error from public.ai_requests where key = ${key}`;
    if (row?.status === "done" && row.response) return row.response;
    if (row?.status === "failed")
      throw new LlmError(
        `Claude Code could not answer: ${row.error ?? "unknown error"}`,
        "unknown",
        true,
      );
    if (row) throw new AiDeferred(row.id); // still being answered
    const [created] = await sql<{ id: string }[]>`
      insert into public.ai_requests (job_id, key, stage, params)
      values (${ctx.jobId}, ${key}, ${ctx.stage}, ${sql.json(params as never)})
      on conflict (key) do nothing
      returning id`;
    throw new AiDeferred(created?.id ?? null);
  };
}
