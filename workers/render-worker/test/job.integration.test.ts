// Renders approved creatives end to end against the local database (scripts/db.sh reset):
// creative job (template) → creative approval → render job → media in review.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import postgres from "postgres";
import { contentHash, enforceApprovedConfig, fakeBrief, fakeScript } from "@cc/shared";
import {
  ensureLocalRepo,
  gitSourceStore,
  type SourceStore,
} from "@cc/creative-worker/source-store";
import { templateGenerator } from "../../creative-worker/src/generators.ts";
import { type CreativeJob, processCreativeJob } from "../../creative-worker/src/job.ts";
import { processRenderJob, RenderError, type RenderJobRow } from "../src/job.ts";
import { decodePng } from "../src/png.ts";

const sql = postgres(
  process.env.TEST_DB_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  { max: 2, onnotice: () => {} },
);
after(() => sql.end());

async function one<T>(rows: Promise<T[]>): Promise<T> {
  const [row] = await rows;
  assert.ok(row, "query returned a row");
  return row;
}

const root = mkdtempSync(join(tmpdir(), "cc-render-"));
const repoUrl = `file://${join(root, "creatives.git")}`;
const uploads = new Map<string, Buffer>();
const storage = {
  upload: async (b: string, p: string, body: Buffer) => void uploads.set(`${b}/${p}`, body),
};
const source = gitSourceStore(repoUrl);
const renderDeps = (src: SourceStore = source) => ({
  sql,
  storage,
  source: src,
  workDir: root,
  workerId: "test-render",
  pageTimeoutMs: 60_000,
  maxPngBytes: 8 * 1024 * 1024,
  minLumaStddev: 2,
  log: () => {},
});

/** A project whose creative (built by the template generator) has just been approved. */
async function approvedCreative(format: "static" | "carousel") {
  await ensureLocalRepo(repoUrl, root);
  const uid = randomUUID();
  await sql`insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
            values (${uid}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${`r-${uid.slice(0, 8)}@example.com`}, '{}', now(), now())`;
  const ws = await one(
    sql<{ id: string }[]>`select id from public.workspaces where created_by = ${uid}`,
  );
  const created = await one(sql<{ r: { project_id: string } }[]>`
    select public.create_project(${ws.id}, ${uid}, ${sql.json({ original_idea: `render ${uid}`, input_source: "manual" })},
                                 ${"e".repeat(56) + uid.slice(0, 8)}, false, null, false) as r`);
  const pid = created.r.project_id;
  const answers = {
    q_format: format,
    q_aspect_ratio: format === "carousel" ? "4:5" : "1:1",
    q_slide_count: "3",
    q_language: "ar",
    q_visual_style: "editorial",
    q_color_mode: "light",
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
  const a = await one(
    sql<
      { a: { next_job_id: string } }[]
    >`select public.record_approval(${uid}, 'script', ${s.id}, 1, ${hash}, 'approved') as a`,
  );
  const cjob = await one(
    sql<
      CreativeJob[]
    >`select id, project_id, input_reference from public.start_job(${a.a.next_job_id}, 'test', 300) where id is not null`,
  );
  await processCreativeJob(
    {
      sql,
      storage,
      source,
      generator: templateGenerator,
      repoDisplayUrl: "https://github.com/example/content-creatives",
      workDir: root,
      log: () => {},
    },
    cjob,
  );
  const cv = await one(
    sql<
      { id: string; content_hash: string }[]
    >`select id, content_hash from public.creative_versions where project_id = ${pid}`,
  );
  const ca = await one(sql<{ a: { next_job_id: string } }[]>`
    select public.record_approval(${uid}, 'creative_version', ${cv.id}, 1, ${cv.content_hash}, 'approved') as a`);
  const rjob = await one(
    sql<
      RenderJobRow[]
    >`select id, project_id, input_reference from public.start_job(${ca.a.next_job_id}, 'test-render', 300) where id is not null`,
  );
  return { pid, uid, rjob };
}

test(
  "carousel: every slide rendered at the configured size, validated, recorded with a manifest",
  { timeout: 300_000 },
  async () => {
    const { pid, rjob } = await approvedCreative("carousel");
    const r = await processRenderJob(renderDeps(), rjob);
    assert.equal(r.files, 3);

    const project = await one(
      sql<{ status: string }[]>`select status::text from public.content_projects where id = ${pid}`,
    );
    assert.equal(project.status, "media_in_review");
    const rj = await one(sql<
      {
        status: string;
        manifest: {
          items: {
            storage_path: string;
            width: number;
            height: number;
            checksum: string;
            order: number;
          }[];
        };
        manifest_hash: string;
      }[]
    >`
    select status, manifest, manifest_hash from public.render_jobs where id = ${rjob.input_reference.render_job_id}`);
    assert.equal(rj.status, "succeeded");
    assert.deepEqual(
      rj.manifest.items.map((i) => i.order),
      [1, 2, 3],
    );
    for (const item of rj.manifest.items) {
      const png = uploads.get(`media/${item.storage_path}`);
      assert.ok(png, `${item.storage_path} uploaded`);
      const img = decodePng(png);
      assert.deepEqual([img.width, img.height], [1080, 1350], "4:5 carousel at 1080×1350");
      assert.equal(createHash("sha256").update(png).digest("hex"), item.checksum);
    }
    const job = await one(
      sql<
        { status: string }[]
      >`select status::text from public.workflow_jobs where id = ${rjob.id}`,
    );
    assert.equal(job.status, "succeeded");
  },
);

test(
  "static post renders one PNG; a source that changed after approval is refused",
  { timeout: 300_000 },
  async () => {
    const { pid, rjob } = await approvedCreative("static");
    const tampered: SourceStore = {
      ...source,
      async checkout(opts) {
        await source.checkout(opts);
        appendFileSync(join(opts.dest, "index.html"), "<!-- changed -->");
      },
    };
    await assert.rejects(
      processRenderJob(renderDeps(tampered), rjob),
      (e: unknown) => e instanceof RenderError && e.code === "source_mismatch",
    );
    const r = await processRenderJob(renderDeps(), rjob);
    assert.equal(r.files, 1);
    const asset = await one(sql<
      { asset_type: string; width: number; height: number; status: string }[]
    >`
    select asset_type::text, width, height, status from public.media_assets where project_id = ${pid}`);
    assert.deepEqual(asset, {
      asset_type: "png",
      width: 1080,
      height: 1080,
      status: "pending_review",
    });
  },
);
