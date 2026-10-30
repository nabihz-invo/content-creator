// Runs creative jobs end to end against the local database (scripts/db.sh reset).
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import postgres from "postgres";
import { contentHash, enforceApprovedConfig, fakeBrief, fakeScript } from "@cc/shared";
import { git } from "../src/exec.ts";
import { templateGenerator } from "../src/generators.ts";
import { type CreativeJob, processCreativeJob } from "../src/job.ts";
import { ensureLocalRepo, gitSourceStore } from "../src/source-store.ts";

const sql = postgres(
  process.env.TEST_DB_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  { max: 2, onnotice: () => {} },
);
after(() => sql.end());

/** First row of a query; tests know it exists. */
async function one<T>(rows: Promise<T[]>): Promise<T> {
  const [row] = await rows;
  assert.ok(row, "query returned a row");
  return row;
}

const root = mkdtempSync(join(tmpdir(), "cc-job-"));
const repoUrl = `file://${join(root, "creatives.git")}`;
const uploads = new Map<string, Buffer>();
const deps = {
  sql,
  storage: {
    upload: async (bucket: string, path: string, body: Buffer) =>
      void uploads.set(`${bucket}/${path}`, body),
  },
  source: gitSourceStore(repoUrl),
  generator: templateGenerator,
  repoDisplayUrl: "https://github.com/example/content-creatives",
  workDir: root,
  log: () => {},
};

interface CreativeRow {
  id: string;
  status: string;
  commit_sha: string;
  source_path: string;
  repository_url: string;
  generator: string;
  content_hash: string;
  revision_notes: string | null;
  configuration: { thumbnails: unknown[]; base_version: number | null };
}

async function approvedScriptProject(format: "carousel" | "video") {
  const uid = randomUUID();
  await sql`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
            values (${uid}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`w-${uid.slice(0, 8)}@example.com`}, '{}', now(), now())`;
  const ws = await one(
    sql<{ id: string }[]>`select id from public.workspaces where created_by = ${uid}`,
  );
  const brand = await one(sql<{ id: string }[]>`
    insert into public.brands (workspace_id, name, default_language, brand_settings)
    values (${ws.id}, ${`Noor ${uid.slice(0, 6)}`}, 'ar', ${sql.json({ palette: [{ name: "Saffron", hex: "#E8A33D", role: "accent" }] })})
    returning id`);
  const created = await one(sql<{ r: { project_id: string } }[]>`
    select public.create_project(${ws.id}, ${uid}, ${sql.json({ original_idea: `idea ${uid}`, input_source: "manual", brand_id: brand.id })},
                                 ${"f".repeat(56) + uid.slice(0, 8)}, false, null, false) as r`);
  const pid = created.r.project_id;
  const answers = {
    q_format: format,
    q_duration: "6",
    q_slide_count: "3",
    q_language: "en",
    q_visual_style: "glassmorphism",
    q_color_mode: "dark",
    q_accent_color: "#E8A33D",
  };
  const brief = enforceApprovedConfig(
    fakeBrief({ idea: "x", answers, clarification_answered: true, brand_prohibited: [] }).brief!,
    answers,
  );
  const script = fakeScript(brief);
  const b = await one(sql<{ id: string }[]>`
    insert into public.content_briefs (project_id, version, brief, content_hash, validation_status)
    values (${pid}, 1, ${sql.json(brief as never)}, ${await contentHash(brief)}, 'valid') returning id`);
  await sql.begin(async (tx) => {
    await tx`select set_config('cc.in_transition', 'on', true)`;
    await tx`update public.content_projects set status = 'script_in_review', current_stage = 'script_review' where id = ${pid}`;
  });
  const hash = await contentHash(script);
  const s = await one(sql<{ id: string }[]>`
    insert into public.scripts (project_id, brief_id, version, content, content_hash) values (${pid}, ${b.id}, 1, ${sql.json(script as never)}, ${hash}) returning id`);
  const approval = await one(
    sql<
      { a: { next_job_id: string } }[]
    >`select public.record_approval(${uid}, 'script', ${s.id}, 1, ${hash}, 'approved') as a`,
  );
  return { pid, uid, jobId: approval.a.next_job_id };
}

/** Claims this test's job by id (other suites may leave queued jobs in the shared database). */
function claim(jobId: string): Promise<CreativeJob> {
  return one(
    sql<
      CreativeJob[]
    >`select id, project_id, input_reference from public.start_job(${jobId}, 'test-worker', 300) where id is not null`,
  );
}

test(
  "carousel: workspace → commit → preview → version in review; revision starts from v1",
  { timeout: 240_000 },
  async () => {
    await ensureLocalRepo(repoUrl, root);
    const { pid, uid, jobId } = await approvedScriptProject("carousel");
    const r = await processCreativeJob(deps, await claim(jobId));
    assert.equal(r.version, 1);

    const cv = await one(
      sql<CreativeRow[]>`select * from public.creative_versions where project_id = ${pid}`,
    );
    assert.equal(cv.status, "in_review");
    assert.match(cv.commit_sha, /^[0-9a-f]{40}$/);
    assert.equal(cv.source_path, `projects/${pid}/v1`);
    assert.equal(cv.repository_url, "https://github.com/example/content-creatives");
    assert.equal(cv.generator, "template");
    assert.equal(cv.configuration.thumbnails.length, 3, "one thumbnail per slide");
    const project = await one(
      sql<{ status: string }[]>`select status::text from public.content_projects where id = ${pid}`,
    );
    assert.equal(project.status, "creative_in_review");

    // Traceability: the commit holds the source, without vendored binaries or tooling.
    const files = await git(
      [
        "--git-dir",
        join(root, "creatives.git"),
        "ls-tree",
        "-r",
        "--name-only",
        cv.commit_sha,
        cv.source_path,
      ],
      root,
    );
    assert.match(files, /\/index\.html$/m);
    assert.match(files, /\/spec\.js$/m);
    assert.doesNotMatch(files, /\/fonts\/|CLAUDE\.md|check\.mjs/);
    // The preview bundle is self-contained (fonts included) and has thumbnails.
    assert.ok(uploads.has(`previews/${pid}/creative-v1/index.html`));
    assert.ok(uploads.has(`previews/${pid}/creative-v1/fonts/inter-700.woff2`));
    assert.ok(uploads.has(`previews/${pid}/creative-v1/_thumbs/slide-01.png`));

    // Request changes → the revision job starts from v1's committed files.
    const changes = await one(sql<{ a: { next_job_id: string } }[]>`
    select public.record_approval(${uid}, 'creative_version', ${cv.id}, 1, ${cv.content_hash}, 'changes_requested', 'More contrast') as a`);
    const r2 = await processCreativeJob(deps, await claim(changes.a.next_job_id));
    assert.equal(r2.version, 2);
    const cv2 = await one(
      sql<
        CreativeRow[]
      >`select * from public.creative_versions where project_id = ${pid} and version = 2`,
    );
    assert.equal(cv2.configuration.base_version, 1);
    assert.equal(cv2.revision_notes, "More contrast");
    assert.notEqual(cv2.commit_sha, cv.commit_sha);
  },
);

test("video: Three.js creative commits with scene thumbnails", { timeout: 300_000 }, async () => {
  const { pid, jobId } = await approvedScriptProject("video");
  const r = await processCreativeJob(deps, await claim(jobId));
  assert.equal(r.version, 1);
  const cv = await one(
    sql<CreativeRow[]>`select * from public.creative_versions where project_id = ${pid}`,
  );
  assert.ok(cv.configuration.thumbnails.length >= 2, "one thumbnail per scene");
  assert.ok(
    uploads.has(`previews/${pid}/creative-v1/vendor/three.module.js`),
    "the preview bundle carries Three.js",
  );
});
