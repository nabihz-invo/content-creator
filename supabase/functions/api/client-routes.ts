/**
 * Client accounts (P5-T26): an admin adds a client by email (the account is created if needed), and
 * the client approves or sends back a post the team approved. Clients can call nothing else: every
 * other route lists its roles without "client".
 */
import type { Context, Hono } from "hono";
import { requireUser, requireWorkspaceRole } from "../_shared/auth.ts";
import type { Deps } from "../_shared/deps.ts";
import { ApiError } from "../_shared/errors.ts";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { validate } from "../_shared/validate.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idParam(c: Context, what: string): string {
  const id = c.req.param("id") ?? "";
  if (!UUID.test(id)) throw new ApiError("not_found", `${what} not found`);
  return id;
}

async function body(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError("validation_failed", "body must be valid JSON");
  }
}

export function registerClientRoutes(app: Hono, deps: Deps) {
  const { sql } = deps;

  // POST /api/workspaces/:id/clients — add a client login for one or several brands (admins)
  app.post("/workspaces/:id/clients", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const { workspaceId } = await requireWorkspaceRole(sql, userId, idParam(c, "workspace"), [
      "admin",
    ]);
    await enforceRateLimit(sql, `user:${userId}:add-client`, 20);
    const input = validate<{ email: string; brand_ids: string[] }>("addClient", await body(c));
    const email = input.email.trim().toLowerCase();
    const [found] = await sql<{ id: string }[]>`
      select id from auth.users where lower(email) = ${email} limit 1`;
    let clientId = found?.id;
    let created = false;
    if (!clientId) {
      if (!deps.users) throw new ApiError("internal", "account creation is not configured");
      clientId = await deps.users.createClient(email);
      created = true;
    }
    await sql`select public.add_workspace_client(${userId}, ${workspaceId}, ${clientId}, ${input.brand_ids}::uuid[])`;
    return c.json({ user_id: clientId, created }, 201);
  });

  // POST /api/content-projects/:id/client-review — the client approves, or requests changes with a note
  app.post("/content-projects/:id/client-review", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    const input = validate<{ decision: string; note?: string }>("importedReview", await body(c));
    // client_review_post checks the role (client), the brand link and that the post is shown to clients.
    const [{ r }] = (await sql`
      select public.client_review_post(${userId}, ${id}, ${input.decision}, ${input.note ?? null}) as r`) as unknown as [
      { r: { project_id: string; client_review: Record<string, unknown> } },
    ];
    return c.json(r);
  });
}
