/**
 * HTML posts (P5-T25): shared helpers for publish-html.mjs and render-approved.mjs.
 *
 * A post page (content/posts/<month>/<ID>_<slug>/source/<page>.html) uses root paths into the content
 * kit (/assets/…, /studio/…). bundlePage() turns it into one self-contained HTML file:
 *   - <link rel="stylesheet" href="/…"> and <script src="/…"> are inlined (CSS url()s made absolute);
 *   - every other /assets/… or /studio/… reference (images, fonts, backgrounds, audio) becomes a token
 *     @@asset:<brand-assets path>@@ pointing at one shared copy of that file in storage.
 * The CRM and the local renderer swap the tokens for signed URLs (resolveTokens).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CONTENT = join(REPO, "content");
export const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (node --env-file=workers/.env …)",
  );
  process.exit(2);
}
export const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export const TOKEN = /@@asset:([^@\s"'()<>]+)@@/g;
export const PAGE_MIME = "text/html";

export const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".txt": "text/plain",
  ".css": "text/css",
  ".js": "text/javascript",
};

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// Retries network errors and 429/5xx with backoff (uploads use x-upsert, so a retry is safe).
export async function send(url, init, tries = 6) {
  for (let n = 1; ; n++) {
    try {
      const r = await fetch(url, init);
      if ((r.status === 429 || r.status >= 500) && n < tries) {
        await r.text();
        throw new Error(`HTTP ${r.status}`);
      }
      return r;
    } catch (e) {
      if (n >= tries) throw e;
      await new Promise((ok) => setTimeout(ok, Math.min(20000, 1500 * 2 ** (n - 1))));
    }
  }
}

export async function api(path, init = {}) {
  const r = await send(`${URL_}${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

export const rpc = (fn, args) =>
  api(`/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });

export async function upload(bucket, path, buf, contentType) {
  const r = await send(`${URL_}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { ...H, "content-type": contentType, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) throw new Error(`upload ${bucket}/${path}: ${r.status} ${await r.text()}`);
}

export async function download(bucket, path) {
  const r = await send(`${URL_}/storage/v1/object/${bucket}/${path}`, { headers: H });
  if (!r.ok) throw new Error(`download ${bucket}/${path}: ${r.status} ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Signed URLs for many paths of one bucket: { path: url }. */
export async function signMany(bucket, paths, expiresIn = 3600) {
  const out = {};
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const res = await api(`/storage/v1/object/sign/${bucket}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresIn, paths: batch }),
    });
    for (const r of res) {
      if (!r.signedURL) throw new Error(`cannot sign ${bucket}/${r.path}: ${r.error ?? "missing"}`);
      out[r.path] = `${URL_}/storage/v1${r.signedURL}`;
    }
  }
  return out;
}

/** Swaps @@asset:…@@ tokens for URLs. Throws if a token has no URL. */
export function resolveTokens(html, urls) {
  return html.replace(TOKEN, (_, p) => {
    const u = urls[p];
    if (!u) throw new Error(`no URL for asset ${p}`);
    return u;
  });
}

export const tokenPaths = (html) => [...new Set([...html.matchAll(TOKEN)].map((m) => m[1]))];

/** Removes the files queued by deleted / replaced rows (same job as the API's purgeStorage). */
export async function purgeQueue() {
  let removed = 0;
  for (;;) {
    const rows = await rpc("claim_storage_deletions", { p_limit: 500 });
    if (!rows?.length) break;
    const done = [];
    const failed = {};
    for (const bucket of new Set(rows.map((r) => r.bucket))) {
      const items = rows.filter((r) => r.bucket === bucket);
      const r = await send(`${URL_}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers: { ...H, "content-type": "application/json" },
        body: JSON.stringify({ prefixes: items.map((i) => i.path) }),
      });
      if (r.ok) done.push(...items.map((i) => i.id));
      else for (const i of items) failed[i.id] = `${r.status} ${await r.text()}`;
    }
    await rpc("finish_storage_deletions", { p_done: done, p_failed: failed });
    removed += done.length;
    if (Object.keys(failed).length) {
      console.error(
        `  storage: ${Object.keys(failed).length} files could not be removed (retried later)`,
      );
      break;
    }
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Post folders and pages
// ---------------------------------------------------------------------------
export function postFolder(id, root = join(CONTENT, "posts")) {
  for (const month of readdirSync(root)) {
    const m = join(root, month);
    if (!statSync(m).isDirectory()) continue;
    for (const name of readdirSync(m))
      if (name.startsWith(`${id}_`) && statSync(join(m, name)).isDirectory()) return join(m, name);
  }
  return null;
}

/**
 * The pages of a post: source/<ID>[-AR][-NN].html (also <ID>-NN-AR.html). One page per language is
 * slide 1; carousels are numbered. Returns [{ file, language, slide }] sorted.
 */
export function postPages(id, dir) {
  const src = join(dir, "source");
  if (!existsSync(src)) return [];
  const pages = [];
  for (const f of readdirSync(src).filter((f) => f.endsWith(".html"))) {
    const name = basename(f, ".html");
    if (!name.startsWith(id)) continue;
    const rest = name.slice(id.length);
    if (rest && !rest.startsWith("-")) continue;
    const parts = rest.split("-").filter(Boolean);
    const language = parts.some((p) => p.toUpperCase() === "AR") ? "ar" : "en";
    const nums = parts.filter((p) => /^\d+$/.test(p));
    const others = parts.filter((p) => p.toUpperCase() !== "AR" && !/^\d+$/.test(p));
    if (others.length || nums.length > 1) continue; // e.g. drafts, variants
    pages.push({ file: join(src, f), language, slide: nums.length ? Number(nums[0]) : 1 });
  }
  pages.sort((a, b) => a.language.localeCompare(b.language) || a.slide - b.slide);
  const seen = new Set();
  for (const p of pages) {
    const k = `${p.language}|${p.slide}`;
    if (seen.has(k)) throw new Error(`${id}: two pages for ${p.language} slide ${p.slide}`);
    seen.add(k);
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Bundling
// ---------------------------------------------------------------------------
const ROOT_REF = /(?<=["'(\s=,])\/(?:assets|studio)\/[A-Za-z0-9._~%\-/@+]+/g;

const local = (rootPath) => join(CONTENT, decodeURIComponent(rootPath).replace(/^\/+/, ""));

function readRoot(rootPath, missing) {
  const f = local(rootPath);
  if (!existsSync(f) || !statSync(f).isFile()) {
    missing.add(rootPath);
    return null;
  }
  return readFileSync(f);
}

/** CSS with every url() made a root path (relative ones resolve against the stylesheet). */
function absoluteCss(css, cssRootPath) {
  const base = posix.dirname(cssRootPath);
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(data:|https?:|#|@@asset:)/.test(u) || u.startsWith("/")) return m;
    return `url(${q}${posix.normalize(posix.join(base, u))}${q})`;
  });
}

/** Page size from the template's `html,body{width:…px;height:…px}` (default 1080×1350). */
export function pageSize(html) {
  const m = /html\s*,\s*body\s*\{\s*width:\s*(\d+)px;\s*height:\s*(\d+)px/.exec(html);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1080, height: 1350 };
}

const CSP =
  "default-src 'none'; img-src https: data: blob:; font-src https: data:; media-src https: data: blob:; " +
  "style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'";

/**
 * Inlines the page's stylesheets and scripts and replaces every remaining kit reference by a token.
 * resolveAsset(rootPath, buf) must return the brand-assets storage path of that file.
 * Returns { html, assets: [storage paths], files: [{ rootPath, buf }] }.
 */
export async function bundlePage(file, resolveAsset) {
  const missing = new Set();
  let html = readFileSync(file, "utf8");
  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = /href=["'](\/[^"']+)["']/i.exec(tag)?.[1];
    if (!href) return tag;
    const buf = readRoot(href, missing);
    return buf
      ? `<style>/* ${href.slice(1)} */\n${absoluteCss(buf.toString("utf8"), href)}\n</style>`
      : tag;
  });
  html = html.replace(
    /<script\b([^>]*)\bsrc=["'](\/[^"']+)["']([^>]*)><\/script>/gi,
    (tag, a, src, b) => {
      const buf = readRoot(src, missing);
      return buf
        ? `<script${a}${b}>/* ${src.slice(1)} */\n${buf.toString("utf8").replace(/<\/script/gi, "<\\/script")}\n</script>`
        : tag;
    },
  );
  const refs = [...new Set(html.match(ROOT_REF) ?? [])];
  const map = {};
  for (const ref of refs) {
    const buf = readRoot(ref, missing);
    if (buf) map[ref] = await resolveAsset(ref, buf);
  }
  if (missing.size) throw new Error(`missing files: ${[...missing].join(", ")}`);
  html = html.replace(ROOT_REF, (ref) => `@@asset:${map[ref]}@@`);
  html = html.replace(
    /<head>/i,
    `<head><meta http-equiv="Content-Security-Policy" content="${CSP}">`,
  );
  return { html, assets: [...new Set(Object.values(map))], size: pageSize(html) };
}

export const mimeOf = (p) => MIME[extname(p).toLowerCase()] ?? "application/octet-stream";

/** Chromium from the content kit's studio install (playwright is not a root dependency). */
export async function chromium() {
  const { createRequire } = await import("node:module");
  const req = createRequire(join(CONTENT, "studio", "package.json"));
  return req("playwright").chromium;
}
