/**
 * Renders a studio page locally, through the same workspace, checks and renderer as the pipeline,
 * without the database or storage: a smoke test of the machine and a quick look at a page.
 *
 *   node --experimental-strip-types src/local.ts <page.html> --out <dir>
 *        [--format video|carousel|static] [--lang en|ar|en,ar] [--brand <brand_id>] [--crf 18]
 *
 * The page's folder is copied next to it (its own scripts, images). Needs BRAND_ASSETS_DIR, FFMPEG_PATH
 * (or ffmpeg on PATH) and Playwright (NODE_PATH).
 */
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { DEFAULT_STUDIO_SFX, type ContentSpec } from "@cc/shared";
import { assembleWorkspace, refreshTrusted } from "@cc/creative-worker/workspace";
import { validateWorkspace } from "@cc/creative-worker/check";
import { renderStudio } from "./studio-render.ts";

const argv = process.argv.slice(2);
const opt = (k: string, d?: string) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? d : argv[i + 1];
};
const page = argv[0] && !argv[0].startsWith("--") ? resolve(argv[0]) : null;
const out = opt("out");
if (!page || !out) {
  console.error(
    "usage: local.ts <page.html> --out <dir> [--format video|carousel|static] [--lang en,ar] [--brand <id>]",
  );
  process.exit(2);
}
const format = (opt("format", "video") as ContentSpec["format"]) ?? "video";
const SIZE = { video: [1080, 1920], carousel: [1080, 1350], static: [1080, 1350] } as const;
const [width, height] = SIZE[format];
const spec = {
  format,
  width,
  height,
  studio: {
    engine: "studio-1",
    brand_id: opt("brand", "e3aa1ed2-b5f8-4d5f-a1eb-f8c402b646ca")!,
    languages: opt("lang", "en,ar")!.split(",") as ("en" | "ar")[],
    sfx_allow: DEFAULT_STUDIO_SFX,
  },
} as unknown as ContentSpec;

const ws = mkdtempSync(join(tmpdir(), "studio-local-"));
try {
  assembleWorkspace(ws, spec);
  // The page's folder: its own files, with the page as index.html.
  for (const name of readdirSync(dirname(page)))
    if (name !== basename(page) && join(dirname(page), name) !== resolve(out))
      cpSync(join(dirname(page), name), join(ws, name), { recursive: true });
  cpSync(page, join(ws, "index.html"));
  refreshTrusted(ws, spec, "referenced");
  const check = validateWorkspace(ws, { format });
  if (!check.ok) {
    for (const e of check.errors)
      console.error(`${e.file}${e.line ? `:${e.line}` : ""} [${e.rule}] ${e.message}`);
    process.exit(1);
  }
  const t0 = Date.now();
  const r = await renderStudio(ws, spec, {
    timeoutMs: 120_000,
    ffmpeg: process.env.FFMPEG_PATH || "ffmpeg",
    crf: Number(opt("crf", "18")),
    onProgress: (d, n) => process.stdout.write(`\r  ${Math.round((d / n) * 100)}%`),
  });
  process.stdout.write("\n");
  for (const n of r.notes) console.log(`note: ${n}`);
  if (r.blockedRequests.length) console.error(`blocked network: ${r.blockedRequests.join(", ")}`);
  if (r.errors.length) {
    console.error(`page errors:\n  ${r.errors.join("\n  ")}`);
    process.exitCode = 1;
  }
  mkdirSync(out, { recursive: true });
  for (const f of r.files) {
    const file = join(out, `${f.name}.${f.kind}`);
    writeFileSync(file, f.data);
    console.log(
      `${file}  ${(f.data.length / 1e6).toFixed(1)} MB${f.durationS ? `  ${f.durationS.toFixed(1)} s` : ""}`,
    );
  }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
} finally {
  rmSync(ws, { recursive: true, force: true });
}
