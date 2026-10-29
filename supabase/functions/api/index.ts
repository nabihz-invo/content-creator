import { supabaseAuthVerifier } from "../_shared/auth.ts";
import { loadConfig } from "../_shared/config.ts";
import { connect } from "../_shared/db.ts";
import { n8nDispatcher } from "../_shared/n8n.ts";
import { supabaseStorage } from "../_shared/storage.ts";
import { createApp } from "./app.ts";

const config = loadConfig();
const app = createApp({
  sql: connect(config.dbUrl),
  auth: supabaseAuthVerifier(config.supabaseUrl, config.supabaseAnonKey),
  dispatcher: n8nDispatcher(config.n8nBaseUrl, config.n8nWebhookSecret),
  storage: supabaseStorage(config.supabaseUrl, config.supabaseServiceRoleKey),
  config,
});

Deno.serve(app.fetch);
