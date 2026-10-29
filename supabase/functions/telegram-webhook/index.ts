import { loadConfig } from "../_shared/config.ts";
import { connect } from "../_shared/db.ts";
import { n8nDispatcher } from "../_shared/n8n.ts";
import { supabaseStorage } from "../_shared/storage.ts";
import { createTelegramHandler } from "./handler.ts";

const config = loadConfig();
const handler = createTelegramHandler({
  sql: connect(config.dbUrl),
  // Telegram requests carry no user JWT; identity comes from the linked profile.
  auth: { verify: () => Promise.resolve(null) },
  dispatcher: n8nDispatcher(config.n8nBaseUrl, config.n8nWebhookSecret),
  storage: supabaseStorage(config.supabaseUrl, config.supabaseServiceRoleKey),
  config,
});

Deno.serve(handler);
