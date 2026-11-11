#!/usr/bin/env node
/**
 * Approved HTML posts → PNGs on this computer (P5-T25). Nothing is uploaded.
 *
 *   node --env-file=workers/.env scripts/html/render-approved.mjs [--only IDEA-054,IDEA-060] [--out DIR] [--force] [--scale 1]
 *
 * Renders the pages exactly as they were approved in the CRM: each page is downloaded from storage,
 * its @@asset:…@@ tokens are swapped for signed URLs and it is screenshot in Chromium at its own size.
 * Output: <post folder>/final/en/slide-01.png …, ar/… plus approved.json (page checksums), or
 * <DIR>/<ID>/en/… with --out. Without --only, every approved HTML post that has no approved.json yet
 * (or an older one) is rendered; --force renders again.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  CONTENT,
  api,
  chromium,
  download,
  postFolder,
  resolveTokens,
  sha256,
  signMany,
  tokenPaths,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
const only =
  typeof opt("only") === "string"
    ? new Set(
        opt("only")
          .split(",")
          .map((s) => s.trim()),
      )
    : null;
const outRoot = typeof opt("out") === "string" ? opt("out") : null;
const force = Boolean(opt("force"));
const scale = Number(opt("scale") ?? 1);

const projects = await api(
  "/rest/v1/content_projects?source_metadata->>origin=eq.content_plan_import&select=id,title,status,source_metadata&source_metadata->review->>status=eq.approved",
);
const todo = [];
for (const p of projects) {
  const id = p.source_metadata?.plan_id;
  if (!id || (only && !only.has(id))) continue;
  const rows = await api(
    `/rest/v1/imported_media?project_id=eq.${p.id}&kind=in.(html,video)&storage_path=not.is.null&select=language,kind,slide_index,storage_path,checksum,width,height,metadata&order=language,slide_index`,
  );
  const pages = rows.filter((r) => r.kind === "html");
  const reels = rows.filter((r) => r.kind === "video" && r.metadata?.preview);
  if (pages.length || reels.length) todo.push({ id, project: p, pages, reels });
}
if (only)
  for (const id of only)
    if (!todo.some((t) => t.id === id)) console.log(`${id}: not an approved HTML post — skipped`);
if (!todo.length) {
  console.log("nothing to render");
  process.exit(0);
}

const browser = todo.some((t) => t.pages.length) ? await (await chromium()).launch() : null;
const context = browser ? await browser.newContext({ deviceScaleFactor: scale }) : null;
let rendered = 0;
try {
  for (const { id, project, pages, reels } of todo) {
    const base = outRoot
      ? join(outRoot, id)
      : (() => {
          const d = postFolder(id);
          return d ? join(d, "final") : join(process.cwd(), "approved", id);
        })();
    const manifestPath = join(base, "approved.json");
    const manifest = {
      id,
      project_id: project.id,
      approved_at: project.source_metadata.review.at,
      pages: pages.map((p) => ({
        language: p.language,
        slide: p.slide_index,
        checksum: p.checksum,
      })),
      reels: reels.map((r) => ({ language: r.language, source_sha256: r.metadata.source_sha256 })),
    };
    if (!force && existsSync(manifestPath)) {
      const old = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (
        JSON.stringify(old.pages) === JSON.stringify(manifest.pages) &&
        JSON.stringify(old.reels ?? []) === JSON.stringify(manifest.reels)
      ) {
        console.log(`${id}: already rendered (${base})`);
        continue;
      }
    }
    const htmls = await Promise.all(
      pages.map(async (p) => (await download("media", p.storage_path)).toString("utf8")),
    );
    const urls = await signMany("brand-assets", [...new Set(htmls.flatMap(tokenPaths))], 1800);
    for (const [k, p] of pages.entries()) {
      const page = await context.newPage();
      await page.setViewportSize({ width: p.width ?? 1080, height: p.height ?? 1350 });
      const failedReq = [];
      page.on("requestfailed", (r) => failedReq.push(r.url().split("?")[0]));
      page.on(
        "response",
        (r) => r.status() >= 400 && failedReq.push(`${r.status()} ${r.url().split("?")[0]}`),
      );
      await page.setContent(resolveTokens(htmls[k], urls), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);
      if (failedReq.length)
        throw new Error(
          `${id} ${p.language} slide ${p.slide_index}: files did not load: ${failedReq.join(", ")}`,
        );
      const dir = join(base, p.language);
      mkdirSync(dir, { recursive: true });
      const target = join(dir, `slide-${String(p.slide_index).padStart(2, "0")}.png`);
      const post = await page.$(".post");
      await (post ? post.screenshot({ path: target }) : page.screenshot({ path: target }));
      await page.close();
      rendered++;
    }
    // Reels: the approved preview was made from reel.html with this checksum; render the full video
    // from the same file, or stop if it changed since.
    for (const r of reels) {
      const reel = join(CONTENT, r.metadata.source);
      if (!existsSync(reel) || sha256(readFileSync(reel)) !== r.metadata.source_sha256)
        throw new Error(
          `${id}: ${r.metadata.source} changed since its preview was approved — publish it again`,
        );
      const dir = join(base, r.language);
      mkdirSync(dir, { recursive: true });
      const out = join(dir, `${id}_${r.language.toUpperCase()}.mp4`);
      const res = spawnSync(
        process.execPath,
        ["studio/render.mjs", r.metadata.source, "--lang", r.language, "--out", out],
        { cwd: CONTENT, stdio: ["ignore", "inherit", "inherit"] },
      );
      if (res.status || !existsSync(out))
        throw new Error(`${id}: the ${r.language} video did not render`);
      rendered++;
    }
    mkdirSync(base, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(
      `${id}: ${pages.length} PNGs${reels.length ? ` + ${reels.length} videos` : ""} → ${base}`,
    );
  }
} finally {
  await browser?.close();
}
console.log(`${rendered} files rendered`);
