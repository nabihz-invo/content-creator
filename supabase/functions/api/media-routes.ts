/**
 * Phase 4 endpoints (docs/API.md, ADR-0008): render jobs, publishing packages
 * for manual posting (bundle download, "mark as posted"), and the workflow
 * monitor's retry/cancel.
 */
import type { Context, Hono } from "hono";
import { requireProjectRole, requireUser } from "../_shared/auth.ts";
import type { Deps } from "../_shared/deps.ts";
import { ApiError } from "../_shared/errors.ts";
import { STAGE_WORKFLOW } from "../_shared/n8n.ts";
import { purgeStorage } from "../_shared/storage-cleanup.ts";
import { validate } from "../_shared/validate.ts";
import { checkPublishPackage } from "../_shared/vendor/src/platform-rules.ts";
import { createZip } from "../_shared/vendor/src/zip.ts";

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

/** A JSON body that may be left out entirely (treated as {}). */
async function optionalBody(c: Context): Promise<unknown> {
  const raw = (await c.req.text()).trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError("validation_failed", "body must be valid JSON");
  }
}

/** Retried operations must carry a key; it is scoped to the caller so keys never collide across users. */
function idempotencyKey(c: Context, userId: string): string {
  const key = c.req.header("idempotency-key")?.trim();
  if (!key) throw new ApiError("validation_failed", "Idempotency-Key header is required");
  if (key.length > 200) throw new ApiError("validation_failed", "Idempotency-Key too long");
  return `api:${userId}:${key}`;
}

interface ManifestItem {
  order: number;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  file_size?: number;
  checksum: string;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", data as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function registerMediaRoutes(app: Hono, deps: Deps) {
  const { sql } = deps;

  // POST /api/render-jobs — queue a render of the approved creative (editors)
  app.post("/render-jobs", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const input = validate<{ creative_version_id: string }>("renderJob", await body(c));
    const [cv] = await sql<{ project_id: string }[]>`
      select project_id from public.creative_versions where id = ${input.creative_version_id}`;
    if (!cv) throw new ApiError("not_found", "creative version not found");
    await requireProjectRole(sql, userId, cv.project_id, ["admin", "editor"]);
    const key = idempotencyKey(c, userId);
    const [{ r }] = (await sql`
      select public.request_render(${userId}, ${input.creative_version_id}, ${key}) as r`) as unknown as [
      {
        r: {
          render_job_id: string;
          job_id: string;
          version: number;
          output_type: string;
          created: boolean;
        };
      },
    ];
    return c.json(
      {
        render_job_id: r.render_job_id,
        job_id: r.job_id,
        version: r.version,
        output_type: r.output_type,
        status: "queued",
        replayed: !r.created,
      },
      202,
    );
  });

  // GET /api/render-jobs/:id — status, progress, files, manifest
  app.get("/render-jobs/:id", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "render job");
    const [rj] = await sql<Record<string, unknown>[]>`
      select id, project_id, creative_version_id, version, output_type::text, status, progress, attempts,
             error_details, manifest, manifest_hash, started_at, completed_at, created_at
      from public.render_jobs where id = ${id}`;
    if (!rj) throw new ApiError("not_found", "render job not found");
    await requireProjectRole(sql, userId, rj.project_id as string, ["admin", "editor", "reviewer"]);
    const outputs = await sql`
      select id, asset_type::text, slide_index, storage_path, mime_type, file_size, width, height, checksum, status
      from public.media_assets where render_job_id = ${id} order by slide_index nulls first`;
    return c.json({ ...rj, outputs });
  });

  // POST /api/publishing-jobs — package approved media for manual posting
  app.post("/publishing-jobs", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const input = validate<{
      project_id: string;
      approval_id: string;
      platform: string;
      caption: string;
      hashtags?: string[];
      link?: string | null;
    }>("publishingJob", await body(c));
    await requireProjectRole(sql, userId, input.project_id, ["admin", "editor"]);
    const key = idempotencyKey(c, userId);
    const [m] = await sql<{ output_type: "png" | "carousel" | "mp4"; items: ManifestItem[] }[]>`
      select r.output_type::text as output_type, r.manifest -> 'items' as items
      from public.approvals a join public.render_jobs r on r.id = a.artifact_id
      where a.id = ${input.approval_id} and a.project_id = ${input.project_id} and a.artifact_type = 'media_manifest'`;
    if (!m)
      throw new ApiError(
        "approval_required",
        "an approved media manifest of this project is required",
      );
    const hashtags = (input.hashtags ?? []).map((h) => h.trim()).filter(Boolean);
    const issues = checkPublishPackage({
      platform: input.platform,
      output_type: m.output_type,
      items: m.items ?? [],
      caption: input.caption,
      hashtags,
      link: input.link ?? null,
    });
    if (issues.length)
      throw new ApiError("validation_failed", "the package does not meet the platform's rules", {
        fields: Object.fromEntries(issues.map((i) => [i.field, i.message])),
        issues,
      });
    const [{ r }] = (await sql`
      select public.create_publishing_job(${userId}, ${input.project_id}, ${input.approval_id}, ${input.platform},
        ${input.caption}, ${hashtags}, ${input.link ?? null}, ${key}) as r`) as unknown as [
      { r: { publishing_job_id: string; status: string; created: boolean } },
    ];
    return c.json(
      { publishing_job_id: r.publishing_job_id, status: r.status, replayed: !r.created },
      r.created ? 201 : 200,
    );
  });

  // GET /api/publishing-jobs/:id/bundle — zip: media in order + caption + hashtags + manifest
  app.get("/publishing-jobs/:id/bundle", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "publishing job");
    const [pj] = await sql<
      {
        project_id: string;
        platform: string;
        caption: string | null;
        hashtags: string[];
        link: string | null;
        media_manifest: { items: ManifestItem[] };
        manifest_hash: string;
        title: string;
      }[]
    >`
      select j.project_id, j.platform, j.caption, j.hashtags, j.link, j.media_manifest, j.manifest_hash, p.title
      from public.publishing_jobs j join public.content_projects p on p.id = j.project_id where j.id = ${id}`;
    if (!pj) throw new ApiError("not_found", "publishing job not found");
    await requireProjectRole(sql, userId, pj.project_id, ["admin", "editor", "reviewer"]);
    const enc = new TextEncoder();
    const entries = [];
    for (const item of [...pj.media_manifest.items].sort((a, b) => a.order - b.order)) {
      const data = await deps.storage.download("media", item.storage_path);
      // The bundle carries exactly the approved bytes, or nothing.
      if ((await sha256Hex(data)) !== item.checksum)
        throw new ApiError(
          "internal",
          `stored file ${item.storage_path} does not match its approved checksum`,
        );
      const base = item.storage_path.split("/").pop()!;
      entries.push({ name: `${String(item.order).padStart(2, "0")}-${base}`, data });
    }
    const hashtags = pj.hashtags.join(" ");
    entries.push({
      name: "caption.txt",
      data: enc.encode([pj.caption ?? "", hashtags].filter(Boolean).join("\n\n") + "\n"),
    });
    entries.push({ name: "hashtags.txt", data: enc.encode(hashtags + "\n") });
    if (pj.link) entries.push({ name: "link.txt", data: enc.encode(pj.link + "\n") });
    entries.push({
      name: "manifest.json",
      data: enc.encode(
        JSON.stringify(
          { ...pj.media_manifest, manifest_hash: pj.manifest_hash, platform: pj.platform },
          null,
          2,
        ) + "\n",
      ),
    });
    const zip = createZip(entries);
    const slug =
      pj.title
        .normalize("NFKD")
        .replace(/[^\w]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)
        .toLowerCase() || "post";
    return new Response(zip as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${slug}-${pj.platform}.zip"`,
        "cache-control": "no-store",
      },
    });
  });

  // POST /api/publishing-jobs/:id/mark-published — the user posted it by hand
  app.post("/publishing-jobs/:id/mark-published", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "publishing job");
    const [pj] = await sql<
      { project_id: string }[]
    >`select project_id from public.publishing_jobs where id = ${id}`;
    if (!pj) throw new ApiError("not_found", "publishing job not found");
    await requireProjectRole(sql, userId, pj.project_id, ["admin", "editor"]);
    const input = validate<{ published_url: string }>("markPublished", await body(c));
    const [{ r }] = (await sql`
      select public.mark_published_manually(${userId}, ${id}, ${input.published_url}) as r`) as unknown as [
      { r: { publishing_job_id: string; status: string; project_status: string } },
    ];
    return c.json(r);
  });

  // POST /api/content-projects/:id/mark-published — content-plan import already posted elsewhere
  app.post("/content-projects/:id/mark-published", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{
      published_url: string;
      published_at?: string;
      language?: "en" | "ar" | "both";
      release_storage?: boolean;
    }>("markImportedPublished", await body(c));
    const [{ r }] = (await sql`
      select public.mark_imported_published(${userId}, ${id}, ${input.published_url},
        ${input.published_at ? `${input.published_at}T12:00:00Z` : null}::timestamptz,
        ${input.language ?? null}) as r`) as unknown as [
      {
        r: {
          project_id: string;
          status: string;
          language: string;
          published_url: string;
          replayed: boolean;
        };
      },
    ];
    if (!input.release_storage) return c.json(r);
    const lang = input.language === "en" || input.language === "ar" ? input.language : null;
    const released = await releaseImported(userId, id, lang);
    return c.json({ ...r, released });
  });

  // Frees the storage of live versions (P5-T15): files are removed, rows keep the live link.
  async function releaseImported(userId: string, projectId: string, language: string | null) {
    const [{ r }] = (await sql`
      select public.release_imported_media(${userId}, ${projectId}, ${language}) as r`) as unknown as [
      { r: { released: number; bytes: number } },
    ];
    return { ...r, storage: await purgeStorage(sql, deps.storage) };
  }

  // POST /api/content-projects/:id/imported-media/release
  app.post("/content-projects/:id/imported-media/release", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ language?: "en" | "ar" }>(
      "releaseImportedMedia",
      await optionalBody(c),
    );
    return c.json(await releaseImported(userId, id, input.language ?? null));
  });

  // DELETE /api/imported-media/:id — the row and its stored file
  app.delete("/imported-media/:id", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "file");
    const [m] = await sql<{ project_id: string }[]>`
      select project_id from public.imported_media where id = ${id}`;
    if (!m) throw new ApiError("not_found", "file not found");
    await requireProjectRole(sql, userId, m.project_id, ["admin", "editor"]);
    const [{ r }] = (await sql`
      select public.delete_imported_media(${userId}, ${id}) as r`) as unknown as [
      { r: { id: string; project_id: string; deleted: boolean } },
    ];
    return c.json({ ...r, storage: await purgeStorage(sql, deps.storage) });
  });

  // POST /api/content-projects/:id/imported-review — approve, or request changes with a note (P5-T17)
  app.post("/content-projects/:id/imported-review", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor", "reviewer"]);
    const input = validate<{ decision: string; note?: string }>("importedReview", await body(c));
    const [{ r }] = (await sql`
      select public.review_imported_post(${userId}, ${id}, ${input.decision}, ${input.note ?? null}) as r`) as unknown as [
      { r: { project_id: string; review: Record<string, unknown> } },
    ];
    return c.json(r);
  });

  // GET /api/content-projects/:id/imported-media/bundle?language=en|ar — zip of an approved post's
  // stored files (+ captions); recorded so the version's storage can then be freed.
  app.get("/content-projects/:id/imported-media/bundle", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor", "reviewer"]);
    const language = c.req.query("language") ?? null;
    if (language !== null && language !== "en" && language !== "ar")
      throw new ApiError("validation_failed", "language must be en or ar");
    const [pj] = await sql<
      {
        title: string;
        plan_id: string | null;
        review: { status?: string } | null;
        finished: { captions?: Record<string, string>; hashtags?: string } | null;
        publish_date: string | null;
      }[]
    >`
      select title, source_metadata ->> 'plan_id' as plan_id, source_metadata -> 'review' as review,
        source_metadata -> 'finished' as finished, source_metadata ->> 'publish_date' as publish_date
      from public.content_projects where id = ${id}`;
    if (pj?.review?.status !== "approved")
      throw new ApiError("approval_required", "approve the post before downloading it");
    const files = await sql<
      {
        language: string | null;
        kind: string;
        slide_index: number | null;
        file_name: string;
        storage_path: string;
        checksum: string;
      }[]
    >`
      select language, kind, slide_index, file_name, storage_path, checksum from public.imported_media
      where project_id = ${id} and storage_path is not null
        and (${language}::text is null or language = ${language} or language is null)
      order by language nulls first, kind, slide_index nulls first`;
    if (!files.length) throw new ApiError("not_found", "no stored files to download");
    // Files are named for the day they go out: 2026-11-05_EDU-26_EN_reel.mp4 (P5-T18).
    const date = /^\d{4}-\d{2}-\d{2}/.exec(pj.publish_date ?? "")?.[0];
    const slug = (pj.plan_id ?? pj.title).replace(/[^\w-]+/g, "-").slice(0, 40) || "post";
    const prefix = date ? `${date}_${slug}` : slug;
    const PART: Record<string, string> = {
      video: "reel",
      cover: "cover",
      image: "image",
      document: "document",
    };
    const enc = new TextEncoder();
    const entries = [];
    for (const f of files) {
      const data = await deps.storage.download("media", f.storage_path);
      if ((await sha256Hex(data)) !== f.checksum)
        throw new ApiError("internal", `stored file ${f.file_name} does not match its checksum`);
      const ext = /\.[a-z0-9]+$/i.exec(f.file_name)?.[0].toLowerCase() ?? "";
      const part =
        f.kind === "carousel_slide"
          ? `slide-${String(f.slide_index).padStart(2, "0")}`
          : (PART[f.kind] ?? f.kind);
      const name = `${prefix}_${(f.language ?? "all").toUpperCase()}_${part}${ext}`;
      entries.push({ name: language ? name : `${f.language ?? "all"}/${name}`, data });
    }
    for (const [lang, text] of Object.entries(pj.finished?.captions ?? {}))
      if (!language || lang === language || lang === "default")
        entries.push({
          name: `${prefix}_${lang === "default" ? "" : `${lang.toUpperCase()}_`}caption.txt`,
          data: enc.encode(text + "\n"),
        });
    if (pj.finished?.hashtags)
      entries.push({
        name: `${prefix}_hashtags.txt`,
        data: enc.encode(pj.finished.hashtags + "\n"),
      });
    const zip = createZip(entries);
    await sql`select public.record_imported_download(${userId}, ${id}, ${language})`;
    return new Response(zip as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${prefix}${language ? `_${language.toUpperCase()}` : ""}.zip"`,
        "cache-control": "no-store",
      },
    });
  });

  // POST /api/content-projects/:id/publish-date — planned publish day (also names the downloads)
  app.post("/content-projects/:id/publish-date", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ date: string | null }>("publishDate", await body(c));
    const [{ r }] = (await sql`
      select public.set_publish_date(${userId}, ${id}, ${input.date}::date) as r`) as unknown as [
      { r: Record<string, unknown> },
    ];
    return c.json(r);
  });

  // POST /api/content-projects/:id/discard — remove every finished file (and its storage), cancel the post
  app.post("/content-projects/:id/discard", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ reason?: string; category?: string }>(
      "discardImported",
      await body(c),
    );
    // The reason from the list (P5-T27) is passed only when sent, so older callers keep the 3-argument form.
    const [{ r }] = (input.category
      ? await sql`
      select public.discard_imported_post(${userId}, ${id}, ${input.reason ?? null}, ${input.category}) as r`
      : await sql`
      select public.discard_imported_post(${userId}, ${id}, ${input.reason ?? null}) as r`) as unknown as [
      { r: { project_id: string; files: number; bytes: number; status: string } },
    ];
    return c.json({ ...r, storage: await purgeStorage(sql, deps.storage) });
  });

  // POST /api/content-projects/:id/decline — idea review: a pending idea is declined (cancelled, reason kept)
  app.post("/content-projects/:id/decline", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    const id = idParam(c, "project");
    await requireProjectRole(sql, userId, id, ["admin", "editor"]);
    const input = validate<{ reason?: string }>("declineIdea", await body(c));
    const [{ r }] = (await sql`
      select public.decline_idea(${userId}, ${id}, ${input.reason ?? null}) as r`) as unknown as [
      { r: { project_id: string; status: string } },
    ];
    return c.json(r);
  });

  // POST /api/jobs/:id/retry and /cancel — workflow monitor (workspace admins)
  for (const action of ["retry", "cancel"] as const) {
    app.post(`/jobs/:id/${action}`, async (c) => {
      const userId = await requireUser(c.req.raw, deps.auth);
      const id = idParam(c, "job");
      const [job] = await sql<{ project_id: string | null; kind: string; stage: string }[]>`
        select project_id, kind::text, stage::text from public.workflow_jobs where id = ${id}`;
      if (!job?.project_id) throw new ApiError("not_found", "job not found");
      await requireProjectRole(sql, userId, job.project_id, ["admin"]);
      const [row] =
        action === "retry"
          ? await sql<
              { id: string; status: string }[]
            >`select id, status::text from public.retry_job(${id}, ${userId})`
          : await sql<
              { id: string; status: string }[]
            >`select id, status::text from public.cancel_job(${id}, ${userId})`;
      // Workers poll the queue; n8n-run stages are handed over again right away.
      if (action === "retry" && job.kind === "n8n")
        await deps.dispatcher.dispatch(STAGE_WORKFLOW[job.stage] ?? job.stage, {
          job_id: id,
          project_id: job.project_id,
          stage: job.stage,
        });
      return c.json({ job_id: row!.id, status: row!.status });
    });
  }
}
