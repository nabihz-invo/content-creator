import postgres from "postgres";
import type { Deps } from "../_shared/deps.ts";
import type { JobRef } from "../_shared/n8n.ts";
import type { Net } from "../_shared/url-extract.ts";
import { fakeStageAi } from "../_shared/stage-ai.ts";

export const DB_URL =
  Deno.env.get("TEST_DB_URL") ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres";
export const sql = postgres(DB_URL, { max: 4, onnotice: () => {}, transform: { undefined: null } });

export const TG_SECRET = "tg-secret-123";
export const N8N_SECRET = "n8n-secret-456";

export interface TestDeps extends Deps {
  dispatched: { workflow: string; job: JobRef }[];
  uploads: { bucket: string; path: string; size: number }[];
}

export function makeDeps(net?: Net): TestDeps {
  const dispatched: TestDeps["dispatched"] = [];
  const uploads: TestDeps["uploads"] = [];
  return {
    sql,
    // Tokens look like "test:<user uuid>".
    auth: { verify: (token) => Promise.resolve(token.startsWith("test:") ? token.slice(5) : null) },
    dispatcher: {
      dispatch: (workflow, job) => {
        dispatched.push({ workflow, job });
        return Promise.resolve(true);
      },
    },
    storage: {
      upload: (bucket, path, data) => {
        uploads.push({ bucket, path, size: data.byteLength });
        return Promise.resolve();
      },
    },
    config: {
      crmUrl: "https://crm.test",
      allowedOrigins: ["https://crm.test"],
      n8nWebhookSecret: N8N_SECRET,
      telegramWebhookSecret: TG_SECRET,
    },
    net,
    ai: fakeStageAi(),
    dispatched,
    uploads,
  };
}

/** Creates an auth user (trigger bootstraps profile + admin workspace). */
export async function createUser(prefix = "user"): Promise<{ id: string; workspaceId: string }> {
  const id = crypto.randomUUID();
  await sql`
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (${id}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            ${`${prefix}-${id.slice(0, 8)}@example.com`}, '{}'::jsonb, now(), now())`;
  const [ws] = await sql<
    { id: string }[]
  >`select id from public.workspaces where created_by = ${id}`;
  return { id, workspaceId: ws!.id };
}

export async function addMember(
  workspaceId: string,
  userId: string,
  role: "admin" | "editor" | "reviewer",
) {
  await sql`insert into public.workspace_members (workspace_id, user_id, role) values (${workspaceId}, ${userId}, ${role})`;
}

export function authed(userId: string, init: RequestInit & { json?: unknown } = {}): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer test:${userId}`);
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    return { ...init, headers, body: JSON.stringify(init.json) };
  }
  return { ...init, headers };
}

export const unique = () => crypto.randomUUID().slice(0, 8);
