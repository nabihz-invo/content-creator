import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface RenderConfig {
  databaseUrl: string;
  supabaseUrl: string;
  serviceRoleKey: string;
  repoUrl: string;
  /** Output types this worker renders (Phase 4: png, carousel; Phase 5 adds mp4). */
  outputTypes: ("png" | "carousel" | "mp4")[];
  /** Per page (one PNG or one slide); bounds a job together with the slide count. */
  pageTimeoutS: number;
  maxPngBytes: number;
  minLumaStddev: number;
  leaseS: number;
  pollMs: number;
  concurrency: number;
  workerId: string;
  workDir: string;
  n8nBaseUrl: string | null;
  n8nWebhookSecret: string | null;
}

const env = (k: string, d?: string) => process.env[k] ?? d;

export function loadConfig(): RenderConfig {
  return {
    databaseUrl: env("DATABASE_URL", "postgres://postgres:postgres@127.0.0.1:54322/postgres")!,
    supabaseUrl: env("SUPABASE_URL", "http://127.0.0.1:54321")!,
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY", "")!,
    repoUrl: env(
      "CREATIVES_REPO_URL",
      `file://${fileURLToPath(new URL("../../../tmp/creatives.git", import.meta.url))}`,
    )!,
    outputTypes: env("RENDER_OUTPUT_TYPES", "png,carousel")!
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is "png" | "carousel" => s === "png" || s === "carousel"),
    pageTimeoutS: Number(env("RENDER_PAGE_TIMEOUT_S", "60")),
    maxPngBytes: Number(env("RENDER_MAX_PNG_BYTES", String(8 * 1024 * 1024))),
    minLumaStddev: Number(env("RENDER_MIN_LUMA_STDDEV", "2")),
    leaseS: Number(env("LEASE_S", "120")),
    pollMs: Number(env("POLL_MS", "3000")),
    concurrency: Math.max(1, Number(env("RENDER_CONCURRENCY", "1"))),
    workerId: env("WORKER_ID", `render-${process.pid}`)!,
    workDir: env("WORK_DIR", join(tmpdir(), "cc-render"))!,
    n8nBaseUrl: env("N8N_BASE_URL") ?? null,
    n8nWebhookSecret: env("N8N_WEBHOOK_SECRET") ?? null,
  };
}
