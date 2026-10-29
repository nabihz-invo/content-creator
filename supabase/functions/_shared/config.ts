/** Environment configuration for Edge Functions. Values are server-side secrets. */
export interface Config {
  dbUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  n8nBaseUrl: string | null;
  n8nWebhookSecret: string | null;
  telegramWebhookSecret: string | null;
  crmUrl: string;
  allowedOrigins: string[];
}

function required(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing environment variable ${name}`);
  return v;
}

export function loadConfig(): Config {
  return {
    dbUrl: required("SUPABASE_DB_URL"),
    supabaseUrl: required("SUPABASE_URL"),
    supabaseAnonKey: required("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    n8nBaseUrl: Deno.env.get("N8N_BASE_URL") ?? null,
    n8nWebhookSecret: Deno.env.get("N8N_WEBHOOK_SECRET") ?? null,
    telegramWebhookSecret: Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? null,
    crmUrl: Deno.env.get("CRM_URL") ?? "http://localhost:5173",
    allowedOrigins: (
      Deno.env.get("CRM_ALLOWED_ORIGINS") ??
      Deno.env.get("CRM_URL") ??
      "http://localhost:5173"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
