#!/usr/bin/env node
/**
 * Brand asset library sync (P5-T09, ADR-0009).
 *
 *   push  kit assets/ → brand-assets bucket + brand_assets rows (+ local mirror)
 *   pull  brand-assets bucket → local mirror (what workers mount as /assets)
 *
 * Usage:
 *   node scripts/brand/sync-kit.mjs push --brand <brand_id> --kit <kit>/assets [--meta meta.json] [--mirror DIR] [--dry-run]
 *   node scripts/brand/sync-kit.mjs pull --brand <brand_id> [--mirror DIR]
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; BRAND_ASSETS_DIR is the default mirror root.
 *
 * Only changed files are uploaded (sha256). A changed file becomes a new version
 * at <brand_id>/<asset_type>/v<version>/<library path>; older versions stay.
 * Raw images (green placeholders) and README files are never synced.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, sep } from "node:path";

const argv = process.argv.slice(2);
const mode = argv[0];
const opt = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
const brand = opt("brand");
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mirrorRoot = opt("mirror", process.env.BRAND_ASSETS_DIR);
const dry = Boolean(opt("dry-run", false));
if (!["push", "pull"].includes(mode) || !brand || !/^[0-9a-f-]{36}$/.test(brand)) {
  console.error(
    "usage: sync-kit.mjs push|pull --brand <brand_id> [--kit DIR] [--meta FILE] [--mirror DIR] [--dry-run]",
  );
  process.exit(2);
}
if (!URL_ || !KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(2);
}

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** Library folder → brand_asset_type. */
export function assetTypeOf(p) {
  if (p.startsWith("brand/fonts/")) return "font";
  if (p.startsWith("brand/logo/")) return "logo";
  if (p.startsWith("backgrounds/final/")) return "background";
  if (p.startsWith("post-images/final/")) return "post_image";
  if (p.startsWith("screens/")) return "screen";
  if (p.startsWith("graphics/")) return "graphic";
  if (p.startsWith("map-elements/")) return "map_elements";
  if (p.startsWith("presenters/")) return "presenter";
  if (p.startsWith("audio/music/")) return "music";
  if (p.startsWith("audio/sfx/")) return "sfx";
  if (p.startsWith("audio/voice/")) return "voice";
  if (p.startsWith("clips/")) return "clip";
  return null;
}

/** Files that never belong in the library. */
export function skipped(p) {
  const base = p.split("/").pop();
  return (
    /(^|\/)raw\//.test(p) ||
    /^readme(\.txt|\.md)?$/i.test(base) ||
    base.startsWith(".") ||
    !MIME[extname(p).toLowerCase()] ||
    /[^A-Za-z0-9_./-]/.test(p)
  );
}

export function catalogCode(p) {
  const m = /^((?:BG|PI|SCR|SIGN|GFX|LG|MU|CLIP|D30)-\d+[a-z]?)/.exec(p.split("/").pop());
  return m ? m[1] : null;
}

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, root, out);
    else out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function currentRows() {
  const rows = await rest(
    `brand_assets?brand_id=eq.${brand}&metadata->>library_path=not.is.null&select=id,asset_type,name,storage_path,checksum,version,metadata&order=version.desc`,
  );
  const cur = new Map();
  for (const r of rows) if (!cur.has(r.metadata.library_path)) cur.set(r.metadata.library_path, r);
  return cur;
}

function mirrorWrite(p, buf) {
  if (!mirrorRoot) return;
  const f = join(mirrorRoot, brand, p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, buf);
}

async function push() {
  const kit = opt("kit");
  if (!kit || !existsSync(kit)) throw new Error("--kit <assets dir> is required");
  const meta = opt("meta") ? JSON.parse(readFileSync(opt("meta"), "utf8")) : {};
  const cur = await currentRows();
  const all = walk(kit).filter((p) => !skipped(p) && assetTypeOf(p));
  const sums = new Map(all.map((p) => [p, sha(readFileSync(join(kit, p)))]));
  const folder = (p) => p.slice(0, p.lastIndexOf("/"));
  const files = all.filter((p) => {
    // Exact duplicates in one folder (BG-03.png / BG-03_final.png): keep the shorter name.
    const dup = all.find(
      (q) =>
        q !== p &&
        folder(q) === folder(p) &&
        sums.get(q) === sums.get(p) &&
        (q.length < p.length || (q.length === p.length && q < p)),
    );
    // A .jfif next to a .png of the same code in final/ is the unplaced original.
    const code = catalogCode(p);
    const jfifTwin =
      /\.jfif$/i.test(p) &&
      /\/final\//.test(p) &&
      code &&
      all.some((q) => folder(q) === folder(p) && catalogCode(q) === code && /\.png$/i.test(q));
    if (dup || jfifTwin)
      console.log(`skip   ${p} (${dup ? `same file as ${dup}` : "original of a placed .png"})`);
    return !dup && !jfifTwin;
  });
  let uploaded = 0,
    same = 0;
  for (const p of files) {
    const buf = readFileSync(join(kit, p));
    const sum = sums.get(p);
    const prev = cur.get(p);
    if (prev && prev.checksum === sum) {
      same++;
      mirrorWrite(p, buf);
      continue;
    }
    const type = assetTypeOf(p);
    const version = prev ? prev.version + 1 : 1;
    const storagePath = `${brand}/${type}/v${version}/${p}`;
    const mime = MIME[extname(p).toLowerCase()];
    console.log(`${prev ? "update" : "new   "} ${p} (${type} v${version}, ${buf.length} bytes)`);
    if (!dry) {
      const r = await fetch(`${URL_}/storage/v1/object/brand-assets/${storagePath}`, {
        method: "POST",
        headers: { ...H, "content-type": mime, "x-upsert": "true" },
        body: buf,
      });
      if (!r.ok) throw new Error(`upload ${storagePath}: ${r.status} ${await r.text()}`);
      await rest("brand_assets", {
        method: "POST",
        headers: { "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          brand_id: brand,
          asset_type: type,
          name: p.split("/").pop(),
          storage_path: storagePath,
          mime_type: mime,
          file_size: buf.length,
          checksum: sum,
          version,
          metadata: { library_path: p, code: catalogCode(p), ...(meta[p] ?? {}) },
        }),
      });
      mirrorWrite(p, buf);
    }
    uploaded++;
  }
  console.log(
    `${dry ? "[dry run] " : ""}${uploaded} uploaded, ${same} unchanged, ${files.length} in the library`,
  );
}

async function pull() {
  if (!mirrorRoot) throw new Error("--mirror or BRAND_ASSETS_DIR is required");
  const cur = await currentRows();
  let got = 0;
  for (const [p, r] of cur) {
    const f = join(mirrorRoot, brand, p);
    if (existsSync(f) && sha(readFileSync(f)) === r.checksum) continue;
    const res = await fetch(`${URL_}/storage/v1/object/brand-assets/${r.storage_path}`, {
      headers: H,
    });
    if (!res.ok) throw new Error(`download ${r.storage_path}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (sha(buf) !== r.checksum) throw new Error(`checksum mismatch for ${r.storage_path}`);
    mirrorWrite(p, buf);
    got++;
  }
  console.log(`${got} downloaded, ${cur.size} files in the mirror ${join(mirrorRoot, brand)}`);
}

await (mode === "push" ? push() : pull());
