import Anthropic from "@anthropic-ai/sdk";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { generateJson, LlmError, STAGE_DEFAULTS, type Transport } from "../_shared/llm.ts";

const schema = {
  type: "object",
  properties: { title: { type: "string", maxLength: 10 } },
  required: ["title"],
  additionalProperties: false,
};

function message(
  text: string,
  extra: Partial<Anthropic.Beta.BetaMessage> = {},
): Anthropic.Beta.BetaMessage {
  return {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text, citations: null }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0 },
    ...extra,
  } as unknown as Anthropic.Beta.BetaMessage;
}

function scripted(responses: (Anthropic.Beta.BetaMessage | Error)[]) {
  const calls: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  const transport: Transport = (params) => {
    calls.push(structuredClone(params));
    const next = responses.shift()!;
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  };
  return { transport, calls };
}

const req = {
  stage: "test",
  system: "SYSTEM",
  user: "USER",
  schema,
  settings: STAGE_DEFAULTS.analysis,
};

Deno.test(
  "sends structured-output request with effort, fallbacks, and a cached system prompt",
  async () => {
    const { transport, calls } = scripted([message('{"title":"ok"}')]);
    const r = await generateJson<{ title: string }>(transport, req);
    assertEquals(r.data, { title: "ok" });
    assertEquals(r.attempts, 1);
    const p = calls[0]! as unknown as Record<string, unknown>;
    assertEquals(p.model, "claude-opus-5-5");
    assertEquals(p.fallbacks, "default");
    assertEquals(p.betas, ["server-side-fallback-2026-07-01"]);
    assertEquals((p.output_config as { effort: string }).effort, "medium");
    const fmt = (p.output_config as { format: { type: string; schema: Record<string, unknown> } })
      .format;
    assertEquals(fmt.type, "json_schema");
    assert(!JSON.stringify(fmt.schema).includes("maxLength"), "unsupported keywords are stripped");
    assertEquals((p.system as { cache_control: unknown }[])[0]!.cache_control, {
      type: "ephemeral",
    });
  },
);

Deno.test("retries once with validation feedback, appending to the conversation", async () => {
  const { transport, calls } = scripted([
    message('{"title":"far too long title"}'),
    message('{"title":"short"}'),
  ]);
  const r = await generateJson<{ title: string }>(transport, req);
  assertEquals(r.data.title, "short");
  assertEquals(r.attempts, 2);
  const second = calls[1]!.messages;
  assertEquals(second.length, 3);
  assertEquals(second[1]!.role, "assistant");
  assert(String(second[2]!.content).includes("/title must NOT have more than 10 characters"));
});

Deno.test("stage checks also trigger the retry", async () => {
  const { transport } = scripted([message('{"title":"a"}'), message('{"title":"b"}')]);
  const r = await generateJson<{ title: string }>(transport, {
    ...req,
    check: (d) => ((d as { title: string }).title === "a" ? ["title must not be a"] : []),
  });
  assertEquals(r.data.title, "b");
});

Deno.test("gives up after two invalid answers with a permanent error", async () => {
  const { transport } = scripted([message("not json"), message('{"nope":1}')]);
  const err = await assertRejects(() => generateJson(transport, req), LlmError);
  assertEquals(err.code, "invalid_output");
  assertEquals(err.retryable, false);
});

Deno.test("refusals and max_tokens are permanent; rate limits are retryable", async () => {
  let t = scripted([
    message("", {
      stop_reason: "refusal",
      stop_details: { type: "refusal", category: "cyber", explanation: "x" },
    } as never),
  ]);
  let err = await assertRejects(() => generateJson(t.transport, req), LlmError);
  assertEquals([err.code, err.retryable], ["refusal", false]);

  t = scripted([message('{"title"', { stop_reason: "max_tokens" })]);
  err = await assertRejects(() => generateJson(t.transport, req), LlmError);
  assertEquals([err.code, err.retryable], ["max_tokens", false]);

  t = scripted([new Anthropic.RateLimitError(429, { type: "error" }, "slow down", new Headers())]);
  err = await assertRejects(() => generateJson(t.transport, req), LlmError);
  assertEquals([err.code, err.retryable], ["rate_limited", true]);

  t = scripted([
    new Anthropic.AuthenticationError(401, { type: "error" }, "bad key", new Headers()),
  ]);
  err = await assertRejects(() => generateJson(t.transport, req), LlmError);
  assertEquals([err.code, err.retryable], ["auth", false]);
});
