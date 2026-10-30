import type { Sql } from "./db.ts";
import { ApiError } from "./errors.ts";
import { createClient } from "@supabase/supabase-js";

export type Role = "admin" | "editor" | "reviewer";

/** Verifies a bearer token and returns the user id. */
export interface AuthVerifier {
  verify(token: string): Promise<string | null>;
}

/** Production verifier: Supabase Auth validates the JWT (JWKS or legacy secret). */
export function supabaseAuthVerifier(url: string, anonKey: string): AuthVerifier {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  return {
    async verify(token) {
      const { data, error } = await client.auth.getClaims(token);
      if (error || !data?.claims?.sub || data.claims.role !== "authenticated") return null;
      return data.claims.sub as string;
    },
  };
}

export async function requireUser(req: Request, auth: AuthVerifier): Promise<string> {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new ApiError("unauthorized", "missing bearer token");
  const userId = await auth.verify(m[1]!.trim());
  if (!userId) throw new ApiError("unauthorized", "invalid or expired token");
  return userId;
}

/**
 * Resolves the workspace for a request (explicit, or the user's first one)
 * and checks the user's role in it.
 */
export async function requireWorkspaceRole(
  sql: Sql,
  userId: string,
  workspaceId: string | undefined,
  roles: Role[],
): Promise<{ workspaceId: string; role: Role }> {
  const rows = workspaceId
    ? await sql<{ workspace_id: string; role: Role }[]>`
        select workspace_id, role from public.workspace_members
        where user_id = ${userId} and workspace_id = ${workspaceId}`
    : await sql<{ workspace_id: string; role: Role }[]>`
        select m.workspace_id, m.role from public.workspace_members m
        join public.workspaces w on w.id = m.workspace_id
        where m.user_id = ${userId}
        order by w.created_at
        limit 1`;
  const row = rows[0];
  if (!row) {
    throw new ApiError(workspaceId ? "forbidden" : "not_found", "no accessible workspace");
  }
  if (!roles.includes(row.role)) {
    throw new ApiError("forbidden", `requires role ${roles.join(" or ")}`);
  }
  return { workspaceId: row.workspace_id, role: row.role };
}

/** Checks the user's role in the project's workspace before any other work (404 hides foreign projects). */
export async function requireProjectRole(
  sql: Sql,
  userId: string,
  projectId: string,
  roles: Role[],
): Promise<Role> {
  const [row] = await sql<{ role: Role | null }[]>`
    select m.role from public.content_projects p
    left join public.workspace_members m on m.workspace_id = p.workspace_id and m.user_id = ${userId}
    where p.id = ${projectId}`;
  if (!row || !row.role) throw new ApiError("not_found", "project not found");
  if (!roles.includes(row.role))
    throw new ApiError("forbidden", `requires role ${roles.join(" or ")}`);
  return row.role;
}
