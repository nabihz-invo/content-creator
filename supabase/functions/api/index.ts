import { supabaseAuthVerifier } from "../_shared/auth.ts";
import { loadConfig } from "../_shared/config.ts";
import { connect } from "../_shared/db.ts";
import { n8nDispatcher } from "../_shared/n8n.ts";
import { sdkTransport } from "../_shared/llm.ts";
import { claudeStageAi, fakeStageAi } from "../_shared/stage-ai.ts";
import { supabaseStorage } from "../_shared/storage.ts";
import { createApp } from "./app.ts";

const config = loadConfig();

// deno-lint-ignore no-explicit-any
const edgeRuntime = (globalThis as any).EdgeRuntime as
  { waitUntil(p: Promise<unknown>): void } | undefined;
const ai =
  config.aiProvider === "fake"
    ? fakeStageAi()
    : config.anthropicApiKey
      ? claudeStageAi(sdkTransport(config.anthropicApiKey))
      : undefined;

const app = createApp({
  ai,
  // On Supabase, long AI stages finish after the 202 response.
  background: edgeRuntime ? (p) => edgeRuntime.waitUntil(p) : undefined,
  sql: connect(config.dbUrl),
  auth: supabaseAuthVerifier(config.supabaseUrl, config.supabaseAnonKey),
  dispatcher: n8nDispatcher(config.n8nBaseUrl, config.n8nWebhookSecret),
  storage: supabaseStorage(config.supabaseUrl, config.supabaseServiceRoleKey),
  config,
});

const port = Deno.env.get("PORT");
if (port) Deno.serve({ port: Number(port) }, app.fetch);
else Deno.serve(app.fetch);
