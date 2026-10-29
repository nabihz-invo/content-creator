import { assert, assertEquals } from "@std/assert";
import { createApp } from "../api/app.ts";
import { addMember, authed, createUser, makeDeps, sql, unique } from "./helpers.ts";

const BASE = "http://localhost/api";

Deno.test("POST /api/content-projects", async (t) => {
  const deps = makeDeps();
  const app = createApp(deps);
  const admin = await createUser("admin");
  const call = (userId: string, json: unknown, headers: Record<string, string> = {}) =>
    app.request(`${BASE}/content-projects`, authed(userId, { method: "POST", json, headers }));

  await t.step("creates a project, queues analysis, dispatches n8n", async () => {
    const idea = `Ramadan offer carousel ${unique()}`;
    const res = await call(admin.id, {
      original_idea: idea,
      tags: ["Ramadan", "offers", "ramadan"],
    });
    assertEquals(res.status, 201);
    const body = await res.json();
    assertEquals(body.created, true);
    assertEquals(body.status, "analyzing");
    assert(body.job_id);
    assertEquals(deps.dispatched.at(-1), {
      workflow: "analyze",
      job: { job_id: body.job_id, project_id: body.project_id, stage: "analysis" },
    });
    const tags = await sql`
      select t.name from public.project_tags pt join public.tags t on t.id = pt.tag_id
      where pt.project_id = ${body.project_id} order by t.name`;
    assertEquals(
      tags.map((r) => r.name),
      ["offers", "ramadan"],
    );
  });

  await t.step("duplicate idea returns the existing project (200)", async () => {
    const idea = `Duplicate check ${unique()}`;
    const first = await (await call(admin.id, { original_idea: idea })).json();
    const before = deps.dispatched.length;
    const res = await call(admin.id, { original_idea: `  ${idea.toUpperCase()}  ` });
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.created, false);
    assertEquals(body.duplicate_of, first.project_id);
    assertEquals(deps.dispatched.length, before, "no new dispatch for a duplicate");

    const forced = await (
      await call(admin.id, { original_idea: idea, allow_duplicate: true })
    ).json();
    assertEquals(forced.created, true);
    assertEquals(forced.duplicate_of, first.project_id);
  });

  await t.step("URL-only submission is an url intake", async () => {
    const res = await call(admin.id, {
      source_url: `https://example.com/post-${unique()}?utm_source=x`,
    });
    assertEquals(res.status, 201);
    const { project_id } = await res.json();
    const [p] =
      await sql`select input_source, original_idea, source_url from public.content_projects where id = ${project_id}`;
    assertEquals(p!.input_source, "url");
    assertEquals(p!.original_idea, p!.source_url);
  });

  await t.step("Idempotency-Key replays the response and rejects a different body", async () => {
    const key = `idem-${unique()}`;
    const idea = `Idempotent idea ${unique()}`;
    const a = await call(admin.id, { original_idea: idea }, { "idempotency-key": key });
    const b = await call(admin.id, { original_idea: idea }, { "idempotency-key": key });
    assertEquals(a.status, 201);
    assertEquals(b.status, 201);
    assertEquals((await a.json()).project_id, (await b.json()).project_id);
    const c = await call(
      admin.id,
      { original_idea: `${idea} changed` },
      { "idempotency-key": key },
    );
    assertEquals(c.status, 409);
    assertEquals((await c.json()).error.code, "idempotency_conflict");
  });

  await t.step("validation errors are 422 with details", async () => {
    const res = await call(admin.id, { title: "no idea or url", unknown_field: 1 });
    assertEquals(res.status, 422);
    const body = await res.json();
    assertEquals(body.error.code, "validation_failed");
    assert(body.error.details.errors.length > 0);
  });

  await t.step("brand from another workspace is rejected", async () => {
    const other = await createUser("other");
    const [brand] =
      await sql`insert into public.brands (workspace_id, name) values (${other.workspaceId}, ${`B ${unique()}`}) returning id`;
    const res = await call(admin.id, { original_idea: `x ${unique()}`, brand_id: brand!.id });
    assertEquals(res.status, 422);
  });

  await t.step("auth and roles", async () => {
    const noAuth = await app.request(`${BASE}/content-projects`, { method: "POST", body: "{}" });
    assertEquals(noAuth.status, 401);
    const reviewer = await createUser("reviewer");
    await addMember(admin.workspaceId, reviewer.id, "reviewer");
    const res = await call(reviewer.id, { original_idea: "x", workspace_id: admin.workspaceId });
    assertEquals(res.status, 403);
    const outsider = await createUser("outsider");
    const res2 = await call(outsider.id, { original_idea: "x", workspace_id: admin.workspaceId });
    assertEquals(res2.status, 403);
  });

  await t.step("unknown routes are 404 JSON", async () => {
    const res = await app.request(`${BASE}/nope`);
    assertEquals(res.status, 404);
    assertEquals((await res.json()).error.code, "not_found");
  });
});

Deno.test({
  name: "close db",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await sql.end();
  },
});
