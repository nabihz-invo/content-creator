import { assert, assertEquals } from "@std/assert";
import { createApp } from "../api/app.ts";
import { addMember, authed, createUser, makeDeps, sql, type TestDeps } from "./helpers.ts";

const BASE = "http://localhost/api";

async function sha256Hex(data: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A carousel project whose render (3 slides, 1080×1350) is in media review; files are in the fake storage. */
async function mediaInReview(deps: TestDeps) {
  const owner = await createUser("md-owner");
  const reviewer = await createUser("md-rev");
  const editor = await createUser("md-ed");
  await addMember(owner.workspaceId, reviewer.id, "reviewer");
  await addMember(owner.workspaceId, editor.id, "editor");
  const [{ r }] = (await sql`select public.create_project(${owner.workspaceId}, ${owner.id},
      ${sql.json({ original_idea: `media ${crypto.randomUUID()}`, input_source: "manual" })},
      ${"d".repeat(56) + crypto.randomUUID().slice(0, 8)}, false, null, false) as r`) as unknown as [
    { r: { project_id: string } },
  ];
  const pid = r.project_id;
  const [b] =
    await sql`insert into public.content_briefs (project_id, version, brief, content_hash, validation_status)
    values (${pid}, 1, '{}', ${"b".repeat(64)}, 'valid') returning id`;
  await sql.begin(async (tx) => {
    await tx`select set_config('cc.in_transition', 'on', true)`;
    await tx`update public.content_projects set status = 'script_in_review', current_stage = 'script_review' where id = ${pid}`;
  });
  const [s] =
    await sql`insert into public.scripts (project_id, brief_id, version, content, content_hash)
    values (${pid}, ${b!.id}, 1, '{}', ${"1".repeat(64)}) returning id`;
  const [{ a }] =
    (await sql`select public.record_approval(${owner.id}, 'script', ${s!.id}, 1, ${"1".repeat(64)}, 'approved') as a`) as unknown as [
      { a: { next_job_id: string } },
    ];
  await sql`select public.start_job(${a.next_job_id}, 'w', 300)`;
  const cfg = { format: "carousel", width: 1080, height: 1350, thumbnails: [{}, {}, {}] };
  const [{ cv }] =
    (await sql`select public.save_creative_version(${a.next_job_id}, ${pid}, ${s!.id}, 1, null, 'https://github.com/o/r',
      ${"a".repeat(40)}, ${`projects/${pid}/v1`}, ${`${pid}/creative-v1/`}, ${sql.json(cfg)}, ${"c".repeat(64)}, null, 'template') as cv`) as unknown as [
      { cv: { creative_version_id: string } },
    ];
  const [{ ca }] =
    (await sql`select public.record_approval(${reviewer.id}, 'creative_version', ${cv.creative_version_id}, 1, ${"c".repeat(64)}, 'approved') as ca`) as unknown as [
      { ca: { next_job_id: string } },
    ];
  const job = ca.next_job_id;
  const [rj] = await sql<
    { id: string }[]
  >`select id from public.render_jobs where workflow_job_id = ${job}`;
  await sql`select public.start_job(${job}, 'rw', 300)`;
  const assets = [];
  for (let i = 1; i <= 3; i++) {
    const path = `${pid}/render-${rj!.id}/slide-0${i}.png`;
    const data = new TextEncoder().encode(`png bytes of slide ${i}`);
    deps.files.set(`media/${path}`, data);
    assets.push({
      asset_type: "carousel_slide",
      slide_index: i,
      storage_path: path,
      mime_type: "image/png",
      file_size: data.length,
      width: 1080,
      height: 1350,
      checksum: await sha256Hex(data),
    });
  }
  const [{ sr }] =
    (await sql`select public.save_render(${job}, 'rw', ${rj!.id}, ${sql.json(assets)}) as sr`) as unknown as [
      { sr: { manifest_hash: string } },
    ];
  return {
    owner,
    reviewer,
    editor,
    pid,
    cvId: cv.creative_version_id,
    renderId: rj!.id,
    hash: sr.manifest_hash,
  };
}

Deno.test("final media approval, render jobs, publishing packages", async (t) => {
  const deps = makeDeps();
  const app = createApp(deps);
  const m = await mediaInReview(deps);
  const post = (user: string, path: string, json: unknown, key?: string) =>
    app.request(
      `${BASE}${path}`,
      authed(user, { method: "POST", json, headers: key ? { "idempotency-key": key } : {} }),
    );

  await t.step("render job details list the validated files", async () => {
    const res = await app.request(`${BASE}/render-jobs/${m.renderId}`, authed(m.reviewer.id));
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.status, "succeeded");
    assertEquals(
      body.outputs.map((o: { slide_index: number }) => o.slide_index),
      [1, 2, 3],
    );
    assertEquals(body.manifest_hash, m.hash);
    const outsider = await createUser("md-out");
    assertEquals(
      (await app.request(`${BASE}/render-jobs/${m.renderId}`, authed(outsider.id))).status,
      404,
    );
  });

  await t.step(
    "approval must name the exact manifest; return_to only for change requests",
    async () => {
      const base = {
        artifact_type: "media_manifest",
        artifact_id: m.renderId,
        artifact_version: 1,
      };
      let res = await post(m.reviewer.id, "/approvals", {
        ...base,
        artifact_hash: "0".repeat(64),
        decision: "approved",
      });
      assertEquals(res.status, 409);
      res = await post(m.reviewer.id, "/approvals", {
        ...base,
        artifact_hash: m.hash,
        decision: "approved",
        return_to: "render",
      });
      assertEquals(res.status, 422);
    },
  );

  await t.step("no publishing package before media approval", async () => {
    const res = await post(
      m.owner.id,
      "/publishing-jobs",
      { project_id: m.pid, approval_id: crypto.randomUUID(), platform: "instagram", caption: "x" },
      "p0",
    );
    assertEquals(res.status, 409);
  });

  let approvalId = "";
  await t.step("a reviewer approves the exact files → ready to publish", async () => {
    const res = await post(m.reviewer.id, "/approvals", {
      artifact_type: "media_manifest",
      artifact_id: m.renderId,
      artifact_version: 1,
      artifact_hash: m.hash,
      decision: "approved",
    });
    assertEquals(res.status, 201);
    const body = await res.json();
    assertEquals(body.status, "ready_to_publish");
    approvalId = body.approval_id;
  });

  await t.step(
    "render requests need an editor, an idempotency key, and a renderable state",
    async () => {
      assertEquals(
        (await post(m.reviewer.id, "/render-jobs", { creative_version_id: m.cvId }, "r1")).status,
        403,
      );
      assertEquals(
        (await post(m.editor.id, "/render-jobs", { creative_version_id: m.cvId })).status,
        422,
      );
      assertEquals(
        (await post(m.editor.id, "/render-jobs", { creative_version_id: m.cvId }, "r1")).status,
        409,
        "approved media is not re-rendered behind the reviewer's back",
      );
    },
  );

  let pjId = "";
  await t.step("packages are checked against the platform's rules", async () => {
    const res = await post(
      m.editor.id,
      "/publishing-jobs",
      { project_id: m.pid, approval_id: approvalId, platform: "x", caption: "a".repeat(300) },
      "p1",
    );
    assertEquals(res.status, 422);
    const body = await res.json();
    assert(body.error.details.fields.caption.includes("280"));
    assertEquals(
      (
        await post(
          m.reviewer.id,
          "/publishing-jobs",
          { project_id: m.pid, approval_id: approvalId, platform: "instagram", caption: "Hi" },
          "p2",
        )
      ).status,
      403,
    );
  });

  await t.step("a valid package is created once, even when retried", async () => {
    const json = {
      project_id: m.pid,
      approval_id: approvalId,
      platform: "instagram",
      caption: "Winter offer ☕",
      hashtags: ["#coffee", "#قهوة"],
      link: "https://noor.example/offer",
    };
    const res = await post(m.editor.id, "/publishing-jobs", json, "p3");
    assertEquals(res.status, 201);
    pjId = (await res.json()).publishing_job_id;
    const again = await post(m.editor.id, "/publishing-jobs", json, "p3");
    assertEquals(again.status, 200);
    assertEquals((await again.json()).publishing_job_id, pjId);
    const [{ n }] = await sql<
      { n: number }[]
    >`select count(*)::int as n from public.publishing_jobs where project_id = ${m.pid}`;
    assertEquals(n, 1);
  });

  await t.step(
    "the bundle holds the approved files in order, the caption and the manifest",
    async () => {
      const res = await app.request(
        `${BASE}/publishing-jobs/${pjId}/bundle`,
        authed(m.reviewer.id),
      );
      assertEquals(res.status, 200);
      assertEquals(res.headers.get("content-type"), "application/zip");
      const zip = new Uint8Array(await res.arrayBuffer());
      assertEquals([...zip.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
      const text = new TextDecoder().decode(zip);
      for (const name of [
        "01-slide-01.png",
        "02-slide-02.png",
        "03-slide-03.png",
        "caption.txt",
        "hashtags.txt",
        "link.txt",
        "manifest.json",
      ])
        assert(text.includes(name), `${name} in bundle`);
      assert(text.indexOf("01-slide-01.png") < text.indexOf("02-slide-02.png"));
      assert(text.includes("Winter offer ☕\n\n#coffee #قهوة"));
    },
  );

  await t.step("a stored file that no longer matches its checksum is never bundled", async () => {
    const path = `media/${m.pid}/render-${m.renderId}/slide-02.png`;
    const original = deps.files.get(path)!;
    deps.files.set(path, new TextEncoder().encode("swapped"));
    const res = await app.request(`${BASE}/publishing-jobs/${pjId}/bundle`, authed(m.owner.id));
    assertEquals(res.status, 500);
    deps.files.set(path, original);
  });

  await t.step("marking as posted needs an https URL and publishes the project", async () => {
    assertEquals(
      (
        await post(m.editor.id, `/publishing-jobs/${pjId}/mark-published`, {
          published_url: "http://insecure",
        })
      ).status,
      422,
    );
    assertEquals(
      (
        await post(m.reviewer.id, `/publishing-jobs/${pjId}/mark-published`, {
          published_url: "https://instagram.com/p/x",
        })
      ).status,
      403,
    );
    const res = await post(m.editor.id, `/publishing-jobs/${pjId}/mark-published`, {
      published_url: "https://instagram.com/p/x",
    });
    assertEquals(res.status, 200);
    assertEquals((await res.json()).project_status, "published");
  });
});

Deno.test("workflow monitor: admins retry and cancel jobs", async () => {
  const deps = makeDeps();
  const app = createApp(deps);
  const owner = await createUser("mon-owner");
  const editor = await createUser("mon-ed");
  await addMember(owner.workspaceId, editor.id, "editor");
  const [{ r }] = (await sql`select public.create_project(${owner.workspaceId}, ${owner.id},
      ${sql.json({ original_idea: `monitor ${crypto.randomUUID()}`, input_source: "manual" })},
      ${"9".repeat(56) + crypto.randomUUID().slice(0, 8)}, false, null, true) as r`) as unknown as [
    { r: { project_id: string; job_id: string } },
  ];
  const [job] = await sql<
    { id: string }[]
  >`select id from public.workflow_jobs where project_id = ${r.project_id} and stage = 'analysis'`;
  const call = (user: string, action: string) =>
    app.request(`${BASE}/jobs/${job!.id}/${action}`, authed(user, { method: "POST" }));

  assertEquals((await call(editor.id, "cancel")).status, 403);
  await sql`select public.start_job(${job!.id}, 'w', 300)`;
  await sql`select public.fail_job(${job!.id}, '{"code":"x","message":"boom"}', false, 'w')`;
  const retried = await call(owner.id, "retry");
  assertEquals(retried.status, 200);
  assertEquals((await retried.json()).status, "queued");
  assert(
    deps.dispatched.some((d) => d.job.job_id === job!.id),
    "n8n jobs are handed over again on retry",
  );
  const cancelled = await call(owner.id, "cancel");
  assertEquals((await cancelled.json()).status, "cancelled");
  assertEquals((await call(owner.id, "cancel")).status, 200, "cancelling twice is harmless");
});

Deno.test("content-plan imports can be closed with their published link", async () => {
  const app = createApp(makeDeps());
  const owner = await createUser("imp-owner");
  const reviewer = await createUser("imp-rev");
  await addMember(owner.workspaceId, reviewer.id, "reviewer");
  const create = async (metadata: Record<string, string>) => {
    const [{ r }] = (await sql`select public.create_project(${owner.workspaceId}, ${owner.id},
        ${sql.json({ title: "Plan item", original_idea: `plan ${crypto.randomUUID()}`, input_source: "csv", source_metadata: metadata })},
        ${"7".repeat(56) + crypto.randomUUID().slice(0, 8)}, false, null, false) as r`) as unknown as [
      { r: { project_id: string } },
    ];
    return r.project_id;
  };
  const imported = await create({ origin: "content_plan_import", plan_id: "NOV-02" });
  const normal = await create({});
  const mark = (user: string, pid: string, json: unknown) =>
    app.request(
      `${BASE}/content-projects/${pid}/mark-published`,
      authed(user, { method: "POST", json }),
    );

  assertEquals(
    (await mark(owner.id, normal, { published_url: "https://instagram.com/p/n" })).status,
    409,
  );
  assertEquals(
    (await mark(reviewer.id, imported, { published_url: "https://instagram.com/p/x" })).status,
    403,
  );
  assertEquals((await mark(owner.id, imported, { published_url: "ftp://x" })).status, 422);
  const res = await mark(owner.id, imported, {
    published_url: "https://instagram.com/p/x",
    published_at: "2026-11-04",
  });
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "published");
  const [p] = await sql<{ status: string; at: string }[]>`
    select status::text, source_metadata -> 'published' ->> 'at' as at from public.content_projects where id = ${imported}`;
  assertEquals(p!.status, "published");
  assert(p!.at.startsWith("2026-11-04"));
});
