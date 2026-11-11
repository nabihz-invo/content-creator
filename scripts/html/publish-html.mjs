#!/usr/bin/env node
/**
 * HTML posts → the CRM (P5-T25). Replaces finished-posts.mjs for posts built from source HTML.
 *
 *   node --env-file=workers/.env scripts/html/publish-html.mjs --only IDEA-054,IDEA-060 [--dry-run] [--keep-files]
 *
 * For each plan ID: finds content/posts/<month>/<ID>_<slug>/source/*.html, bundles every page
 * (lib.mjs → bundlePage), stores the pages as imported_media rows of kind 'html' (one per language
 * and slide) and the captions / hashtags from caption_en.txt, caption_ar.txt, caption.txt, hashtags.txt.
 * Pictures and fonts are stored once per brand: a file already in the brand library is reused,
 * any other file goes to brand-assets/<brand>/html-assets/<sha256>/<name> (html_assets).
 * Then, unless --keep-files: the post's old PNG / MP4 rows and pages that no longer exist are removed
 * with their storage, and shared files no page uses any more are deleted.
 * A changed page puts the post back in review (P5-T18 trigger); unchanged pages are not re-uploaded.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import {
  CONTENT,
  PAGE_MIME,
  api,
  bundlePage,
  mimeOf,
  postFolder,
  postPages,
  purgeQueue,
  rpc,
  sha256,
  upload,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
const ids =
  typeof opt("only") === "string"
    ? opt("only")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
const dry = Boolean(opt("dry-run"));
const keepFiles = Boolean(opt("keep-files"));
if (!ids.length) {
  console.error("usage: publish-html.mjs --only ID[,ID…] [--dry-run] [--keep-files]");
  process.exit(2);
}

const readText = (dir, name) =>
  existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8").trim() : undefined;

// checksum → storage path, per brand (brand library first, then html_assets)
const known = new Map();
async function loadKnown(brand) {
  if (known.has(brand)) return known.get(brand);
  const m = new Map();
  for (let from = 0; ; from += 1000) {
    const rows = await api(
      `/rest/v1/brand_assets?brand_id=eq.${brand}&checksum=not.is.null&select=checksum,storage_path&order=created_at.asc`,
      { headers: { Range: `${from}-${from + 999}` } },
    );
    for (const r of rows) if (!m.has(r.checksum)) m.set(r.checksum, r.storage_path);
    if (rows.length < 1000) break;
  }
  // A dry run may come before the P5-T25 migration is applied (no html_assets table yet).
  const shared = await api(
    `/rest/v1/html_assets?brand_id=eq.${brand}&select=checksum,storage_path`,
  ).catch((e) => {
    if (dry && /PGRST205|42P01/.test(e.message)) return [];
    throw e;
  });
  for (const r of shared) if (!m.has(r.checksum)) m.set(r.checksum, r.storage_path);
  known.set(brand, m);
  return m;
}

const stats = { pages: 0, uploadedPages: 0, newAssets: 0, newAssetBytes: 0, removed: 0 };

async function resolverFor(brand) {
  const m = await loadKnown(brand);
  return async (rootPath, buf) => {
    const sum = sha256(buf);
    if (m.has(sum)) return m.get(sum);
    const name = basename(rootPath).replace(/[^A-Za-z0-9._-]/g, "_");
    const path = `${brand}/html-assets/${sum}/${name}`;
    if (!dry) {
      await upload("brand-assets", path, buf, mimeOf(rootPath));
      await api("/rest/v1/html_assets", {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify({
          brand_id: brand,
          checksum: sum,
          storage_path: path,
          mime_type: mimeOf(rootPath),
          file_size: buf.length,
          source_path: rootPath.replace(/^\/+/, ""),
        }),
      });
    }
    stats.newAssets++;
    stats.newAssetBytes += buf.length;
    m.set(sum, path);
    return path;
  };
}

/**
 * A motion reel (reel.html, studio engine) cannot run inside the CRM sandbox (the engine loads its
 * files at run time), so it is reviewed as a small preview video per language: half size, lower
 * quality. The full video is rendered locally after approval (render-approved.mjs), from the same
 * reel.html (its checksum is kept in the row).
 */
async function reelItems(id, project, reel, existing) {
  const source = sha256(readFileSync(reel));
  const tmp = mkdtempSync(join(tmpdir(), `reel-${id}-`));
  const items = [];
  for (const language of ["en", "ar"]) {
    const cur = existing.find((e) => e.kind === "video" && e.language === language);
    if (cur?.metadata?.preview && cur.metadata.source_sha256 === source && cur.storage_path) {
      const { id: _i, live_url: _l, ...keep } = cur;
      items.push(keep);
      continue;
    }
    const out = join(tmp, `${id}_${language.toUpperCase()}_preview.mp4`);
    if (dry) {
      console.log(`    would render the ${language} preview of ${relative(CONTENT, reel)}`);
      continue;
    }
    const r = spawnSync(
      process.execPath,
      [
        "studio/render.mjs",
        relative(CONTENT, reel),
        "--lang",
        language,
        "--scale",
        "0.5",
        "--crf",
        "30",
        "--out",
        out,
      ],
      { cwd: CONTENT, stdio: ["ignore", "ignore", "inherit"] },
    );
    if (r.status || !existsSync(out))
      throw new Error(`the ${language} preview of reel.html did not render`);
    const buf = readFileSync(out);
    const sum = sha256(buf);
    const file = `${id}_${language.toUpperCase()}_preview.mp4`;
    const path = `${project.id}/imported/${language}/${sum.slice(0, 8)}-${file}`;
    await upload("media", path, buf, "video/mp4");
    stats.uploadedPages++;
    items.push({
      language,
      kind: "video",
      slide_index: null,
      file_name: file,
      storage_path: path,
      mime_type: "video/mp4",
      file_size: buf.length,
      width: null,
      height: null,
      duration: videoSeconds(out),
      checksum: sum,
      metadata: {
        preview: true,
        scale: 0.5,
        source: relative(CONTENT, reel).split("\\").join("/"),
        source_sha256: source,
      },
    });
  }
  rmSync(tmp, { recursive: true, force: true });
  return items;
}

function videoSeconds(file) {
  try {
    const ff = createRequire(join(CONTENT, "studio", "package.json"))("ffmpeg-static");
    const r = spawnSync(ff, ["-hide_banner", "-i", file], { encoding: "utf8" });
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr ?? "");
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
  } catch {
    return null;
  }
}

const projects = await api(
  "/rest/v1/content_projects?source_metadata->>origin=eq.content_plan_import&select=id,title,status,brand_id,source_metadata",
);
const brands = new Set();
let failed = 0;

for (const id of ids) {
  const matches = projects.filter((p) => p.source_metadata?.plan_id === id);
  if (matches.length !== 1) {
    console.log(
      `${id}: ${matches.length ? "more than one project has this plan ID" : "no imported project"} — skipped`,
    );
    failed++;
    continue;
  }
  const project = matches[0];
  if (!project.brand_id) {
    console.log(`${id}: the project has no brand — skipped`);
    failed++;
    continue;
  }
  if (!["new", "ready_to_publish"].includes(project.status)) {
    console.log(`${id}: the project is ${project.status} — skipped`);
    failed++;
    continue;
  }
  const dir = postFolder(id);
  const pages = dir ? postPages(id, dir) : [];
  const reel =
    dir && !pages.length && existsSync(join(dir, "reel.html")) ? join(dir, "reel.html") : null;
  if (!pages.length && !reel) {
    console.log(
      `${id}: no source/*.html pages or reel.html${dir ? ` in ${relative(CONTENT, dir)}` : " (no post folder)"} — skipped`,
    );
    failed++;
    continue;
  }
  brands.add(project.brand_id);
  try {
    const resolve = await resolverFor(project.brand_id);
    const existing = await api(
      `/rest/v1/imported_media?project_id=eq.${project.id}&select=id,language,kind,slide_index,file_name,checksum,storage_path,mime_type,file_size,width,height,duration,metadata,live_url`,
    );
    const same = new Map(
      existing.filter((e) => e.kind === "html").map((e) => [`${e.language}|${e.slide_index}`, e]),
    );
    const items = reel ? await reelItems(id, project, reel, existing) : [];
    for (const p of pages) {
      const { html, assets, size } = await bundlePage(p.file, resolve);
      const buf = Buffer.from(html, "utf8");
      const sum = sha256(buf);
      const cur = same.get(`${p.language}|${p.slide}`);
      const file = `slide-${String(p.slide).padStart(2, "0")}.html`;
      const storage =
        cur?.checksum === sum
          ? cur.storage_path
          : `${project.id}/html/${p.language}/${sum.slice(0, 8)}-${file}`;
      if (cur?.checksum !== sum) {
        if (!dry) await upload("media", storage, buf, "text/plain; charset=utf-8"); // never served as a page
        stats.uploadedPages++;
      }
      stats.pages++;
      items.push({
        language: p.language,
        kind: "html",
        slide_index: p.slide,
        file_name: file,
        storage_path: storage,
        mime_type: PAGE_MIME,
        file_size: buf.length,
        width: size.width,
        height: size.height,
        duration: null,
        checksum: sum,
        metadata: { assets, source: relative(CONTENT, p.file).split("\\").join("/") },
      });
    }
    const langs = [...new Set(items.map((i) => i.language))].join("+");
    const slot = (i) => `${i.language}|${i.kind}|${i.slide_index ?? 0}`;
    const before = new Map(existing.map((e) => [slot(e), e]));
    const changed = items.filter((i) => before.get(slot(i))?.checksum !== i.checksum).length;
    const slots = new Set(items.map(slot));
    // Rows in a slot this run fills are replaced in place; the rest go (old PNG/MP4 versions too,
    // unless --keep-files or the version is already live).
    const stale = existing.filter(
      (e) => !slots.has(slot(e)) && (e.kind === "html" || (!keepFiles && !e.live_url)),
    );
    console.log(
      `${id} → ${project.title} [${project.status}] ${langs}: ${items.length} ${reel ? "reel previews" : "pages"} ` +
        `(${changed} changed), ${stale.length} old files to remove`,
    );
    if (dry) continue;

    const finished = { format: "html", source: id };
    const captions = {};
    for (const l of ["en", "ar"]) {
      const t = readText(dir, `caption_${l}.txt`);
      if (t) captions[l] = t;
    }
    const general = readText(dir, "caption.txt");
    if (general) captions.default = general;
    if (Object.keys(captions).length) finished.captions = captions;
    const hashtags = readText(dir, "hashtags.txt");
    if (hashtags) finished.hashtags = hashtags;
    const r = await rpc("save_imported_media", {
      p_project_id: project.id,
      p_items: items,
      p_finished: finished,
    });
    console.log(`    saved: ${r.new} new, ${r.replaced} replaced, ${r.unchanged} unchanged`);
    for (const e of stale) {
      await api(`/rest/v1/imported_media?id=eq.${e.id}`, { method: "DELETE" });
      stats.removed++;
    }
  } catch (e) {
    console.error(`${id}: ${e.message}`);
    failed++;
  }
}

if (!dry) {
  for (const brand of brands) {
    const unused = await rpc("unused_html_assets", { p_brand_id: brand });
    for (const u of unused) await api(`/rest/v1/html_assets?id=eq.${u.id}`, { method: "DELETE" });
    if (unused.length) console.log(`shared files no page uses: ${unused.length} removed`);
  }
  const purged = await purgeQueue();
  if (purged) console.log(`storage: ${purged} files removed`);
}
console.log(
  `${dry ? "[dry run] " : ""}${stats.pages} pages (${stats.uploadedPages} uploaded), ` +
    `${stats.newAssets} new shared files (${(stats.newAssetBytes / 1e6).toFixed(1)} MB), ${stats.removed} old files removed` +
    (failed ? `; ${failed} posts skipped or failed` : ""),
);
process.exit(failed ? 1 : 0);
