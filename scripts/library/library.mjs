#!/usr/bin/env node
/**
 * Visual library for agents (P5-T21): backgrounds (BG-xx), graphics (GFX-xx) and post images (PI-xx)
 * kept in the CRM (Visual library page) — prompt, where/when to use, status and files.
 *
 *   node --env-file=workers/.env scripts/library/library.mjs list [--kind background|graphic|post_image]
 *        [--status approved,ready] [--usable] [--json]
 *   node --env-file=workers/.env scripts/library/library.mjs show BG-10 [--json]
 *   node --env-file=workers/.env scripts/library/library.mjs get BG-10 [--raw] --out DIR
 *   node --env-file=workers/.env scripts/library/library.mjs upload BG-10 FILE [--raw]
 *   node --env-file=workers/.env scripts/library/library.mjs status BG-10 approved
 *
 * --usable = approved or ready (the only entries a post may use). `get` downloads the entry's
 * files (final by default). `upload` stores a file for an entry (a new final replaces the old one;
 * `to_generate` becomes `generated`) — e.g. after place_screens.py on a raw upload. Options:
 * --brand <name or id> (default Stacko). Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const argv = process.argv.slice(2);
const [cmd, ...pos] = argv.filter(
  (a, i) => !a.startsWith("--") && !argv[i - 1]?.match(/^--(kind|status|out|brand)$/),
);
const opt = (k) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? undefined : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true;
};
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (use --env-file=workers/.env)",
  );
  process.exit(2);
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
};

async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw new Error(`${r.status}: ${data?.message ?? text}`);
  return data;
}

async function brandId() {
  const b = typeof opt("brand") === "string" ? opt("brand") : "Stacko";
  if (/^[0-9a-f-]{36}$/.test(b)) return b;
  const rows = await rest(
    `brands?select=id&name=eq.${encodeURIComponent(b)}&order=created_at&limit=1`,
  );
  if (!rows.length) throw new Error(`brand ${b} not found`);
  return rows[0].id;
}

async function entries(brand, code) {
  let q = `library_items?brand_id=eq.${brand}&select=*`;
  if (code) q += `&code=eq.${code}`;
  if (opt("kind")) q += `&kind=eq.${opt("kind")}`;
  const statuses = opt("usable") ? "approved,ready" : opt("status");
  if (typeof statuses === "string") q += `&status=in.(${statuses})`;
  const items = await rest(q);
  const files = await rest(
    `brand_assets?brand_id=eq.${brand}&asset_type=in.(background,graphic,post_image)&select=id,name,storage_path,mime_type,file_size,version,metadata`,
  );
  const num = (c) => c.replace(/\d+/, (n) => n.padStart(4, "0"));
  return items
    .sort((a, b) => num(a.code).localeCompare(num(b.code)))
    .map((i) => ({
      ...i,
      files: files
        .filter((f) => f.metadata?.code === i.code)
        .map((f) => ({
          ...f,
          variant: f.metadata?.variant ?? "final",
          library_path: f.metadata?.library_path,
        })),
    }));
}

function libraryPath(e, variant, file) {
  const ext = extname(file).slice(1).toLowerCase() || "png";
  if (e.kind === "graphic") {
    const rest_ = basename(file, extname(file))
      .replace(new RegExp(`^${e.code}[_-]?`, "i"), "")
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `graphics/${variant === "raw" ? "raw/" : ""}${e.code}${rest_ ? `_${rest_}` : ""}.${ext}`;
  }
  return `${e.kind === "background" ? "backgrounds" : "post-images"}/${variant}/${e.code}.${ext}`;
}

const brand = await brandId();
const FIELDS = [
  ["Where to use", "use_for"],
  ["When to use", "when_to_use"],
  ["Fits posts", "fits_posts"],
  ["Green placeholders", "placeholders"],
  ["Story", "story"],
  ["Text space", "text_space"],
  ["On-image text", "on_image_text"],
  ["Generate from", "reference"],
  ["Notes", "notes"],
  ["Prompt", "prompt"],
  ["Negative prompt", "negative_prompt"],
];

if (cmd === "list") {
  const list = await entries(brand);
  if (opt("json")) console.log(JSON.stringify(list, null, 2));
  else
    for (const e of list)
      console.log(
        `${e.code.padEnd(7)} ${e.status.padEnd(11)} ${(e.aspect ?? "").padEnd(10)} ${e.files.length}f  ${e.title}${e.use_for ? `  — ${e.use_for}` : ""}`,
      );
} else if (cmd === "show" && pos[0]) {
  const [e] = await entries(brand, pos[0].toUpperCase());
  if (!e) throw new Error(`${pos[0]} not found`);
  if (opt("json")) console.log(JSON.stringify(e, null, 2));
  else {
    console.log(
      `${e.code} · ${e.title}\n${e.kind} · ${e.status} · ${e.collection ?? ""} · ${e.aspect ?? ""}${e.pillar ? ` · ${e.pillar}` : ""}`,
    );
    for (const [label, k] of FIELDS)
      if (e[k]) console.log(`\n${label}:\n  ${String(e[k]).replace(/\n/g, "\n  ")}`);
    console.log(`\nFiles (${e.files.length}):`);
    for (const f of e.files)
      console.log(`  ${f.variant.padEnd(5)} /assets/${f.library_path}  (${f.file_size} bytes)`);
  }
} else if (cmd === "get" && pos[0] && typeof opt("out") === "string") {
  const [e] = await entries(brand, pos[0].toUpperCase());
  if (!e) throw new Error(`${pos[0]} not found`);
  const want = opt("raw") ? "raw" : "final";
  const files = e.files.filter((f) => f.variant === want);
  if (!files.length) throw new Error(`${e.code} has no ${want} file`);
  mkdirSync(opt("out"), { recursive: true });
  for (const f of files) {
    const r = await fetch(`${URL_}/storage/v1/object/brand-assets/${f.storage_path}`, {
      headers: H,
    });
    if (!r.ok) throw new Error(`download ${f.storage_path}: ${r.status}`);
    const out = join(opt("out"), f.library_path.split("/").pop());
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log(`saved ${out}`);
  }
} else if (cmd === "upload" && pos[0] && pos[1]) {
  const [e] = await entries(brand, pos[0].toUpperCase());
  if (!e) throw new Error(`${pos[0]} not found`);
  const variant = opt("raw") ? "raw" : "final";
  const buf = readFileSync(pos[1]);
  const path = libraryPath(e, variant, pos[1]);
  const version = 1 + Math.max(0, ...e.files.map((f) => f.version));
  const storagePath = `${brand}/${e.kind}/v${version}/${path}`;
  const mime = MIME[extname(pos[1]).toLowerCase()] ?? "application/octet-stream";
  const up = await fetch(`${URL_}/storage/v1/object/brand-assets/${storagePath}`, {
    method: "POST",
    headers: { ...H, "content-type": mime },
    body: buf,
  });
  if (!up.ok) throw new Error(`upload: ${up.status} ${await up.text()}`);
  await rest("rpc/attach_library_file", {
    method: "POST",
    body: JSON.stringify({
      p_item_id: e.id,
      p_variant: variant,
      p_library_path: path,
      p_storage_path: storagePath,
      p_mime_type: mime,
      p_file_size: buf.length,
      p_checksum: createHash("sha256").update(buf).digest("hex"),
    }),
  });
  console.log(`${e.code}: ${variant} → /assets/${path}`);
} else if (cmd === "status" && pos[0] && pos[1]) {
  const rows = await rest(`library_items?brand_id=eq.${brand}&code=eq.${pos[0].toUpperCase()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: pos[1] }),
  });
  if (!rows.length) throw new Error(`${pos[0]} not found`);
  console.log(`${rows[0].code}: ${rows[0].status}`);
} else {
  console.error(
    "usage: library.mjs list [--kind K] [--status S,S | --usable] [--json] | show CODE [--json] | get CODE [--raw] --out DIR | upload CODE FILE [--raw] | status CODE STATUS",
  );
  process.exitCode = 2;
}
