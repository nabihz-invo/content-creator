import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface WorkerConfig {
  databaseUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  /** Git remote for creative source; a local bare repo in dev, GitHub (token in URL) in production. */
  repoUrl: string;
  /** Public URL shown in the CRM (never contains credentials). */
  repoDisplayUrl: string;
  generator: "template" | "claude-code";
  anthropicApiKey: string | null;
  claudeBin: string;
  claudeModel: string;
  claudeEffort: string;
  claudeBudgetUsd: number;
  jobTimeoutS: number;
  leaseS: number;
  pollMs: number;
  workerId: string;
  workDir: string;
  n8nBaseUrl: string | null;
  n8nWebhookSecret: string | null;
}

const env = (k: string, d?: string) => process.env[k] ?? d;

export function loadConfig(): WorkerConfig {
  const repoUrl = env(
    "CREATIVES_REPO_URL",
    `file://${fileURLToPath(new URL("../../../tmp/creatives.git", import.meta.url))}`,
  )!;
  return {
    databaseUrl: env("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:54322/postgres")!,
    supabaseUrl: env("SUPABASE_URL", "http://127.0.0.1:54321")!,
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "")!,
    repoUrl,
    repoDisplayUrl: env("CREATIVES_REPO_DISPLAY_URL", repoUrl.replace(/\/\/[^@/]+@/, "//"))!,
    generator: env("CREATIVE_GENERATOR", "template") === "claude-code" ? "claude-code" : "template",
    anthropicApiKey: env("ANTHROPIC_API_KEY") ?? null,
    claudeBin: env("CLAUDE_BIN", "claude")!,
    claudeModel: env("CLAUDE_MODEL", "claude-opus-5-5")!,
    claudeEffort: env("CLAUDE_EFFORT", "high")!,
    claudeBudgetUsd: Number(env("CLAUDE_BUDGET_USD", "5")),
    jobTimeoutS: Number(env("JOB_TIMEOUT_S", "1200")),
    leaseS: Number(env("LEASE_S", "120")),
    pollMs: Number(env("POLL_MS", "3000")),
    workerId: env("WORKER_ID", `creative-${process.pid}`)!,
    workDir: env("WORK_DIR", join(tmpdir(), "cc-creative"))!,
    n8nBaseUrl: env("N8N_BASE_URL") ?? null,
    n8nWebhookSecret: env("N8N_WEBHOOK_SECRET") ?? null,
  };
}
