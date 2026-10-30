/**
 * Claude client for structured stage outputs (ADR-0006 §5).
 *
 * - Official SDK, streaming (long outputs never hit HTTP timeouts).
 * - Structured outputs: `output_config.format` with a strict-compatible schema;
 *   the full schema (lengths, ranges) is re-checked with ajv, plus optional
 *   stage-specific checks. One retry shows the model its validation errors.
 * - `effort` set per stage (Opus 5.5 defaults to medium otherwise).
 * - Server-side refusal fallbacks (`fallbacks: "default"`).
 * - Errors are classified: retryable (rate limit, overload, network) vs.
 *   permanent (auth, bad request, refusal, repeated invalid output).
 */
import Anthropic from "@anthropic-ai/sdk";
import { toApiSchema } from "./vendor/src/ai-schemas.ts";
import { schemaErrors } from "./validate.ts";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface StageSettings {
  model: string;
  effort: Effort;
  maxTokens: number;
}

export const DEFAULT_MODEL = "claude-opus-5-5";

export const STAGE_DEFAULTS: Record<"analysis" | "brief" | "script", StageSettings> = {
  analysis: { model: DEFAULT_MODEL, effort: "medium", maxTokens: 16000 },
  brief: { model: DEFAULT_MODEL, effort: "medium", maxTokens: 16000 },
  script: { model: DEFAULT_MODEL, effort: "high", maxTokens: 32000 },
};

export class LlmError extends Error {
  constructor(
    message: string,
    readonly code:
      | "rate_limited"
      | "overloaded"
      | "network"
      | "auth"
      | "bad_request"
      | "refusal"
      | "max_tokens"
      | "invalid_output"
      | "unknown",
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export interface JsonRequest {
  stage: string;
  system: string;
  user: string;
  schema: object;
  settings: StageSettings;
  /** Extra checks the schema can't express; non-empty = invalid. */
  check?: (data: unknown) => string[];
}

export interface JsonResult<T> {
  data: T;
  model: string;
  attempts: number;
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number | null };
}

/** One Messages API round trip; production uses the SDK stream, tests inject responses. */
export type Transport = (
  params: Anthropic.Beta.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Beta.BetaMessage>;

export function sdkTransport(apiKey: string): Transport {
  const client = new Anthropic({ apiKey, maxRetries: 2 });
  return (params) => client.beta.messages.stream(params).finalMessage();
}

function classify(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.RateLimitError)
    return new LlmError(err.message, "rate_limited", true);
  if (
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return new LlmError(err.message, "auth", false);
  }
  if (
    err instanceof Anthropic.BadRequestError ||
    err instanceof Anthropic.NotFoundError ||
    err instanceof Anthropic.UnprocessableEntityError
  ) {
    return new LlmError(err.message, "bad_request", false);
  }
  if (err instanceof Anthropic.InternalServerError)
    return new LlmError(err.message, "overloaded", true);
  if (err instanceof Anthropic.APIConnectionError)
    return new LlmError(err.message, "network", true);
  if (err instanceof Anthropic.APIError)
    return new LlmError(err.message, "unknown", (err.status ?? 500) >= 500);
  return new LlmError(err instanceof Error ? err.message : String(err), "unknown", true);
}

const MAX_ATTEMPTS = 2;

export async function generateJson<T>(
  transport: Transport,
  req: JsonRequest,
): Promise<JsonResult<T>> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: req.user }];
  let lastProblems: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Anthropic.Beta.BetaMessage;
    try {
      res = await transport({
        model: req.settings.model,
        max_tokens: req.settings.maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // Stable per prompt version → cached across projects.
        system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
        output_config: {
          effort: req.settings.effort,
          format: {
            type: "json_schema",
            schema: toApiSchema(req.schema) as Record<string, unknown>,
          },
        },
        messages,
      });
    } catch (err) {
      throw classify(err);
    }

    if (res.stop_reason === "refusal") {
      const details = res.stop_details as
        { category?: string | null; explanation?: string | null } | null | undefined;
      throw new LlmError(
        `model declined (${details?.category ?? "unspecified"}): ${details?.explanation ?? ""}`.trim(),
        "refusal",
        false,
      );
    }
    if (res.stop_reason === "max_tokens") {
      throw new LlmError(`output exceeded ${req.settings.maxTokens} tokens`, "max_tokens", false);
    }

    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    let data: unknown;
    try {
      data = JSON.parse(text);
      lastProblems = schemaErrors(req.schema, data);
      if (!lastProblems.length && req.check) lastProblems = req.check(data);
    } catch {
      lastProblems = ["response was not valid JSON"];
    }
    if (!lastProblems.length) {
      return {
        data: data as T,
        model: res.model,
        attempts: attempt,
        usage: {
          input_tokens: res.usage.input_tokens,
          output_tokens: res.usage.output_tokens,
          cache_read_input_tokens: res.usage.cache_read_input_tokens ?? null,
        },
      };
    }
    console.warn(`${req.stage}: attempt ${attempt} invalid`, lastProblems.slice(0, 10));
    // Append-only retry: keep the full assistant turn, then explain what to fix.
    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: `Your JSON did not pass validation:\n${lastProblems
        .slice(0, 20)
        .map((p) => `- ${p}`)
        .join("\n")}\n\nReturn the complete corrected JSON.`,
    });
  }
  throw new LlmError(
    `invalid output after ${MAX_ATTEMPTS} attempts: ${lastProblems.slice(0, 5).join("; ")}`,
    "invalid_output",
    false,
  );
}
