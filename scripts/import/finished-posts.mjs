#!/usr/bin/env node
/**
 * Finished posts → imported content projects (P5-T15).
 *
 *   node scripts/import/finished-posts.mjs --from <folder> [--only EDU-69,NOV-10] [--actor EMAIL]
 *        [--video-lang en] [--with-documents] [--dry-run]
 *
 * <folder> holds one folder per post, named by its plan ID (EDU-69, NOV-10, …), at the top level or
 * under posts/, carousels/, videos/ or stories/. Each post folder:
 *
 *   en/slide-01.png …        one PNG per slide (or png-en/); a single image is a post
 *   ar/slide-01.png …        (or png-ar/; ar-needs-native-review/ is flagged for review)
 *   en/video.mp4, en/cover.png   a reel (an .mp4 / cover.png at the top is --video-lang, default en)
 *   caption_en.txt, caption_ar.txt, caption.txt, hashtags.txt   stored as text, not as files
 *   links.txt                lines "en https://…", "ar https://…" or "both https://…"
 *   *.pdf                    only with --with-documents
 *
 * Storage rules: a version that already has a live link is recorded with the link only (nothing is
 * uploaded); everything else goes to media/<project>/imported/<language>/; an unchanged file is never
 * uploaded twice; HTML, JSON, voice takes and logs stay in the folder. If saving fails, the files
 * uploaded by this run are removed again.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; FFMPEG_PATH (optional, for video durations).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
const from = opt("from");
const only = typeof opt("only") === "string" ? opt("only").split(",") : null;
const actorEmail = opt("actor", "nabihzanaty@gmail.com");
const videoLang = opt("video-lang", "en");
const withDocs = Boolean(opt("with-documents", false));
// Which kinds to upload (videos are most of the size; import them when they are about to be posted).
const kinds = typeof opt("kinds") === "string" ? opt("kinds").split(",") : null;
const dry = Boolean(opt("dry-run", false));
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!from || !existsSync(from)) {
  console.error(
    "usage: finished-posts.mjs --from <folder> [--only IDS] [--actor EMAIL] [--video-lang en|ar] [--with-documents] [--dry-run]",
  );
  process.exit(2);
}
if (!URL_ || !KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(2);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
// Retries network errors and 429/5xx with backoff; uploads use x-upsert, so a retry is safe.
async function send(url, init, tries = 8) {
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
      console.error(`    retry ${n}/${tries - 1} (${e.cause?.code ?? e.message})`);
      await new Promise((ok) => setTimeout(ok, Math.min(30000, 2000 * 2 ** (n - 1))));
    }
  }
}
async function api(path, init = {}) {
  const r = await send(`${URL_}${path}`, { ...init, headers: { ...H, ...(init.headers ?? {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}
const rpc = (fn, args) =>
  api(`/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });

// ---------------------------------------------------------------------------
// Reading a post folder
// ---------------------------------------------------------------------------
const LANG_DIRS = {
  en: "en",
  "png-en": "en",
  ar: "ar",
  "png-ar": "ar",
  "ar-needs-native-review": "ar",
};
// cover.png, cover_ar.png, cover_15s_ar.png
const COVER = /^cover([_-][a-z0-9]+)*\.(png|jpe?g)$/i;
const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

export function pngSize(buf) {
  return buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG"
    ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
    : {};
}

/** Width and height from a JPEG's SOF marker (baseline or progressive). */
export function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return {};
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return {};
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return {};
}

function videoInfo(file) {
  const ff = process.env.FFMPEG_PATH;
  if (!ff) return {};
  const err = spawnSync(ff, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr ?? "";
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
  const s = /Video:.*?, (\d{2,5})x(\d{2,5})/.exec(err);
  return {
    ...(d ? { duration: Math.round((+d[1] * 3600 + +d[2] * 60 + +d[3]) * 1000) / 1000 } : {}),
    ...(s ? { width: +s[1], height: +s[2] } : {}),
  };
}

function fileItem(path, language, kind, slideIndex, metadata = {}) {
  const buf = readFileSync(path);
  const ext = extname(path).toLowerCase();
  return {
    path,
    language,
    kind,
    slide_index: slideIndex,
    file_name: basename(path),
    mime_type: MIME[ext],
    file_size: buf.length,
    checksum: createHash("sha256").update(buf).digest("hex"),
    ...(ext === ".png" ? pngSize(buf) : ext === ".jpg" || ext === ".jpeg" ? jpegSize(buf) : ext === ".mp4" ? videoInfo(path) : {}),
    metadata,
  };
}

const readText = (dir, name) =>
  existsSync(join(dir, name)) ? readFileSync(join(dir, name), "utf8").trim() : undefined;

/** Files, captions and links found in one post folder. */
export function readPost(dir, contentType) {
  const items = [];
  const notes = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const lang = LANG_DIRS[name];
    if (lang && statSync(p).isDirectory()) {
      const review = name.includes("needs-native-review") ? { needs_native_review: true } : {};
      const files = readdirSync(p).sort();
      // slide-NN for posts and carousels, frame-NN for stories
      const slides = files.filter((f) => /^(slide|frame)-\d+\.(png|jpe?g)$/i.test(f));
      const single = slides.length === 1 && contentType !== "carousel";
      for (const f of slides) {
        const n = Number(/\d+/.exec(f)[0]);
        items.push(
          fileItem(
            join(p, f),
            lang,
            single ? "image" : "carousel_slide",
            single ? null : n,
            review,
          ),
        );
      }
      for (const f of files.filter((f) => /\.mp4$/i.test(f)))
        items.push(fileItem(join(p, f), lang, "video", null, review));
      for (const f of files.filter((f) => COVER.test(f)))
        items.push(fileItem(join(p, f), lang, "cover", null));
      for (const f of files.filter(
        (f) => !/^(slide|frame)-\d+\.|\.mp4$/i.test(f) && !COVER.test(f),
      ))
        notes.push(`left out ${name}/${f}`);
    } else if (/\.mp4$/i.test(name)) {
      const l = /_AR\.mp4$/i.test(name) ? "ar" : /_EN\.mp4$/i.test(name) ? "en" : videoLang;
      items.push(fileItem(p, l, "video", null));
    } else if (COVER.test(name)) {
      items.push(
        fileItem(
          p,
          /_ar\./i.test(name) ? "ar" : /_en\./i.test(name) ? "en" : videoLang,
          "cover",
          null,
        ),
      );
    } else if (/\.pdf$/i.test(name)) {
      const l = /-ar\.pdf$/i.test(name) ? "ar" : /-en\.pdf$/i.test(name) ? "en" : null;
      if (withDocs) items.push(fileItem(p, l, "document", null));
      else notes.push(`left out ${name} (use --with-documents to upload)`);
    }
  }
  // One document per language slot: keep the first.
  const seen = new Set();
  const unique = items.filter((i) => {
    const k = `${i.language}|${i.kind}|${i.slide_index ?? 0}`;
    if (seen.has(k)) {
      notes.push(`duplicate ${i.kind} for ${i.language ?? "all"}: ${i.file_name} skipped`);
      return false;
    }
    seen.add(k);
    return true;
  });

  const captions = {};
  for (const l of ["en", "ar"]) {
    const t = readText(dir, `caption_${l}.txt`);
    if (t) captions[l] = t;
  }
  const general = readText(dir, "caption.txt");
  if (general) captions.default = general;
  const hashtags = readText(dir, "hashtags.txt");

  const links = {};
  for (const line of (readText(dir, "links.txt") ?? "").split(/\r?\n/)) {
    const m = /^\s*(en|ar|both)\s+(https:\/\/\S+)\s*$/i.exec(line);
    if (m) links[m[1].toLowerCase()] = m[2];
    else if (line.trim()) notes.push(`links.txt: cannot read "${line.trim()}"`);
  }
  return { items: unique, captions, hashtags, links, notes };
}

function postFolders(id) {
  return ["", "posts", "carousels", "videos", "stories"]
    .map((sub) => join(from, sub, id))
    .filter((d) => existsSync(d) && statSync(d).isDirectory());
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------
const liveFor = (meta, links, lang) =>
  links[lang ?? "both"] ??
  links.both ??
  meta.published_links?.[lang ?? "both"]?.url ??
  meta.published_links?.both?.url ??
  (meta.published_links ? undefined : meta.published?.url) ??
  (lang === null
    ? (Object.values(links)[0] ?? Object.values(meta.published_links ?? {})[0]?.url)
    : undefined);

async function actorId() {
  for (let page = 1; page < 50; page++) {
    const r = await api(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const u = (r.users ?? []).find(
      (x) => x.email?.toLowerCase() === String(actorEmail).toLowerCase(),
    );
    if (u) return u.id;
    if (!r.users?.length) break;
  }
  throw new Error(`no user ${actorEmail}`);
}

const projects = await api(
  "/rest/v1/content_projects?source_metadata->>origin=eq.content_plan_import&select=id,title,status,content_type,workspace_id,source_metadata",
);
const byPlan = new Map();
for (const p of projects) {
  const id = p.source_metadata?.plan_id;
  if (id) byPlan.set(id, [...(byPlan.get(id) ?? []), p]);
}

const ids = new Set(
  ["", "posts", "carousels", "videos", "stories"].flatMap((sub) =>
    existsSync(join(from, sub))
      ? // EDU-22, NOV-S1, D30-16 (plan IDs may carry digits after the first letter)
        readdirSync(join(from, sub)).filter((n) => /^[A-Z][A-Z0-9]{1,4}-[A-Z]?\d+[a-z]?$/.test(n))
      : [],
  ),
);
let actor = null;
const totals = {
  posts: 0,
  uploaded: 0,
  uploadedBytes: 0,
  linkOnly: 0,
  unchanged: 0,
  skipped: 0,
  byKind: {},
};

for (const id of [...ids].sort()) {
  if (only && !only.includes(id)) continue;
  const matches = byPlan.get(id) ?? [];
  if (matches.length !== 1) {
    console.log(
      `${id}: ${matches.length ? "more than one project has this plan ID" : "no imported project"} — skipped`,
    );
    totals.skipped++;
    continue;
  }
  const project = matches[0];
  const post = { items: [], captions: {}, hashtags: undefined, links: {}, notes: [] };
  for (const dir of postFolders(id)) {
    const r = readPost(dir, project.content_type);
    const have = new Set(post.items.map((i) => `${i.language}|${i.kind}|${i.slide_index ?? 0}`));
    post.items.push(
      ...r.items.filter((i) => !have.has(`${i.language}|${i.kind}|${i.slide_index ?? 0}`)),
    );
    Object.assign(post.captions, r.captions);
    post.hashtags ??= r.hashtags;
    Object.assign(post.links, r.links);
    post.notes.push(...r.notes);
  }
  if (!post.items.length && !Object.keys(post.links).length) {
    console.log(`${id}: no finished files — skipped`);
    totals.skipped++;
    continue;
  }
  totals.posts++;

  const existing = await api(
    `/rest/v1/imported_media?project_id=eq.${project.id}&select=language,kind,slide_index,checksum`,
  ).catch((e) => {
    // A dry run may come before the P5-T15 migration is applied.
    if (dry && /PGRST205/.test(e.message)) return [];
    throw e;
  });
  const same = new Set(
    existing.map((e) => `${e.language}|${e.kind}|${e.slide_index ?? 0}|${e.checksum}`),
  );
  const meta = project.source_metadata ?? {};
  const plan = post.items
    .filter((i) => !kinds || kinds.includes(i.kind))
    .map((i) => {
      const live = liveFor(meta, post.links, i.language);
      const unchanged = same.has(`${i.language}|${i.kind}|${i.slide_index ?? 0}|${i.checksum}`);
      return { ...i, action: unchanged ? "unchanged" : live ? "link only" : "upload" };
    });
  const langs = [...new Set(plan.map((i) => i.language ?? "all"))].join("+");
  const up = plan.filter((i) => i.action === "upload");
  console.log(
    `${id} → ${project.title} [${project.status}] ${langs}: ${up.length} to upload (${(up.reduce((s, i) => s + i.file_size, 0) / 1e6).toFixed(1)} MB), ` +
      `${plan.filter((i) => i.action === "link only").length} link only, ${plan.filter((i) => i.action === "unchanged").length} unchanged` +
      (Object.keys(post.links).length ? `; links: ${Object.keys(post.links).join(", ")}` : ""),
  );
  for (const n of post.notes) console.log(`    ${n}`);
  totals.uploaded += up.length;
  totals.uploadedBytes += up.reduce((s, i) => s + i.file_size, 0);
  for (const i of up) {
    const k = (totals.byKind[i.kind] ??= { files: 0, bytes: 0 });
    k.files++;
    k.bytes += i.file_size;
  }
  totals.linkOnly += plan.filter((i) => i.action === "link only").length;
  totals.unchanged += plan.filter((i) => i.action === "unchanged").length;
  if (dry) continue;

  // 1. Live links first, so versions that are already live are never uploaded.
  for (const [lang, url] of Object.entries(post.links)) {
    actor ??= await actorId();
    await rpc("mark_imported_published", {
      p_actor_id: actor,
      p_project_id: project.id,
      p_published_url: url,
      p_language: lang,
    });
  }
  // 2. Upload what is not live yet.
  const uploaded = [];
  try {
    for (const i of up) {
      i.storage_path = `${project.id}/imported/${i.language ?? "x"}/${i.checksum.slice(0, 8)}-${i.file_name}`;
      const r = await send(`${URL_}/storage/v1/object/media/${i.storage_path}`, {
        method: "POST",
        headers: { ...H, "content-type": i.mime_type, "x-upsert": "true" },
        body: readFileSync(i.path),
      });
      if (!r.ok) throw new Error(`upload ${i.storage_path}: ${r.status} ${await r.text()}`);
      uploaded.push(i.storage_path);
    }
    // 3. Register every file (unchanged ones are no-ops in the database).
    const items = plan
      .filter((i) => i.action !== "unchanged")
      .map(({ path: _p, action: _a, ...i }) => ({ ...i, storage_path: i.storage_path ?? null }));
    const finished = {
      ...(Object.keys(post.captions).length ? { captions: post.captions } : {}),
      ...(post.hashtags ? { hashtags: post.hashtags } : {}),
      source: id,
    };
    const r = await rpc("save_imported_media", {
      p_project_id: project.id,
      p_items: items,
      p_finished: finished,
    });
    console.log(`    saved: ${r.new} new, ${r.replaced} replaced, ${r.link_only} link only`);
  } catch (e) {
    // Nothing may stay in storage without a row pointing at it.
    if (uploaded.length)
      await api("/storage/v1/object/media", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefixes: uploaded }),
      }).catch(() =>
        console.error(
          `    could not remove ${uploaded.length} uploaded files; remove them by hand`,
        ),
      );
    throw e;
  }
}

console.log(
  `${dry ? "[dry run] " : ""}${totals.posts} posts: ${totals.uploaded} files to upload (${(totals.uploadedBytes / 1e6).toFixed(1)} MB), ` +
    `${totals.linkOnly} link only, ${totals.unchanged} unchanged; ${totals.skipped} folders skipped`,
);
for (const [k, v] of Object.entries(totals.byKind))
  console.log(
    `  ${k.padEnd(15)} ${String(v.files).padStart(4)} files  ${(v.bytes / 1e6).toFixed(1).padStart(7)} MB`,
  );
