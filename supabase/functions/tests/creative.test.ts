import { assert, assertEquals } from "@std/assert";
import { createApp } from "../api/app.ts";
import { verifyPreviewToken } from "../_shared/vendor/src/preview-token.ts";
import { addMember, authed, createUser, makeDeps, PREVIEW_SECRET, sql } from "./helpers.ts";

const BASE = "http://localhost/api";

/** A project with an approved script and creative v1 in review, built through the RPCs. */
async function creativeInReview() {
  const owner = await createUser("cr-owner");
  const [{ r }] =
    (await sql`select public.create_project(${owner.workspaceId}, ${owner.id}, ${sql.json({ original_idea: `creative ${crypto.randomUUID()}`, input_source: "manual" })},
      ${"c".repeat(56) + crypto.randomUUID().slice(0, 8)}, false, null, false) as r`) as unknown as [
      { r: { project_id: string } },
    ];
  const pid = r.project_id;
  const [b] =
    await sql`insert into public.content_briefs (project_id, version, brief, content_hash, validation_status) values (${pid}, 1, '{}', ${"b".repeat(64)}, 'valid') returning id`;
  await sql.begin(async (tx) => {
    await tx`select set_config('cc.in_transition', 'on', true)`;
    await tx`update public.content_projects set status = 'script_in_review', current_stage = 'script_review' where id = ${pid}`;
  });
  const [s] =
    await sql`insert into public.scripts (project_id, brief_id, version, content, content_hash) values (${pid}, ${b!.id}, 1, '{}', ${"1".repeat(64)}) returning id`;
  const [{ a }] =
    (await sql`select public.record_approval(${owner.id}, 'script', ${s!.id}, 1, ${"1".repeat(64)}, 'approved') as a`) as unknown as [
      { a: { next_job_id: string } },
    ];
  await sql`select public.start_job(${a.next_job_id}, 'w', 300)`;
  const [{ cv }] =
    (await sql`select public.save_creative_version(${a.next_job_id}, ${pid}, ${s!.id}, 1, null, 'https://github.com/o/r', ${"a".repeat(40)},
      ${`projects/${pid}/v1`}, ${`${pid}/creative-v1/`}, '{}', ${"c".repeat(64)}, null, 'template') as cv`) as unknown as [
      { cv: { creative_version_id: string } },
    ];
  return { owner, pid, cvId: cv.creative_version_id };
}

Deno.test("creative preview links and approvals", async (t) => {
  const app = createApp(makeDeps());
  const { owner, pid, cvId } = await creativeInReview();

  await t.step(
    "members get a short-lived link on the preview origin, scoped to this version",
    async () => {
      const res = await app.request(`${BASE}/creative-versions/${cvId}/preview`, authed(owner.id));
      assertEquals(res.status, 200);
      const body = await res.json();
      assert(body.url.startsWith("https://preview.test/p/"));
      const token = body.url.split("/p/")[1].split("/")[0];
      const claims = await verifyPreviewToken(PREVIEW_SECRET, token);
      assertEquals(claims?.p, `${pid}/creative-v1/`);
      assert(claims!.e - Date.now() / 1000 <= 30 * 60 + 5, "expires within 30 minutes");
    },
  );

  await t.step("outsiders cannot get a link", async () => {
    const outsider = await createUser("cr-out");
    const res = await app.request(`${BASE}/creative-versions/${cvId}/preview`, authed(outsider.id));
    assertEquals(res.status, 404);
  });

  await t.step(
    "a reviewer approves the exact creative version; a render job is queued",
    async () => {
      const reviewer = await createUser("cr-rev");
      await addMember(owner.workspaceId, reviewer.id, "reviewer");
      let res = await app.request(
        `${BASE}/approvals`,
        authed(reviewer.id, {
          method: "POST",
          json: {
            artifact_type: "creative_version",
            artifact_id: cvId,
            artifact_version: 1,
            artifact_hash: "0".repeat(64),
            decision: "approved",
          },
        }),
      );
      assertEquals(res.status, 409);
      res = await app.request(
        `${BASE}/approvals`,
        authed(reviewer.id, {
          method: "POST",
          json: {
            artifact_type: "creative_version",
            artifact_id: cvId,
            artifact_version: 1,
            artifact_hash: "c".repeat(64),
            decision: "approved",
          },
        }),
      );
      assertEquals(res.status, 201);
      const [p] = await sql`select status::text from public.content_projects where id = ${pid}`;
      assertEquals(p!.status, "rendering");
      const [j] =
        await sql`select kind::text from public.workflow_jobs where project_id = ${pid} and stage = 'render'`;
      assertEquals(j!.kind, "render_worker");
    },
  );
});

Deno.test({ name: "close db", sanitizeOps: false, sanitizeResources: false, fn: () => sql.end() });
