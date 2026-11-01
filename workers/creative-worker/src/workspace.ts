/**
 * Assembles a creative workspace (ADR-0007 §2): starter template, shared
 * runtime, bundled fonts, vendored Three.js (video), spec.js, rules, checker.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type ContentSpec, specScript } from "@cc/shared";
import { alwaysNeeded, brandAssetsDir, listTree, referencedAssets } from "./brand-assets.ts";
import { isCommitted } from "./tree.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATES_DIR = join(here, "../../../templates");
const require = createRequire(import.meta.url);

const TEMPLATE_FOR: Record<ContentSpec["format"], string> = {
  static: "static-post",
  carousel: "carousel",
  video: "motion",
};

const FONTS: [string, string][] = [
  ["@fontsource/inter/files/inter-latin-400-normal.woff2", "inter-400.woff2"],
  ["@fontsource/inter/files/inter-latin-700-normal.woff2", "inter-700.woff2"],
  ["@fontsource/inter/files/inter-latin-800-normal.woff2", "inter-800.woff2"],
  [
    "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff2",
    "plex-arabic-400.woff2",
  ],
  [
    "@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2",
    "plex-arabic-700.woff2",
  ],
  ["@fontsource/tajawal/files/tajawal-arabic-400-normal.woff2", "tajawal-400.woff2"],
  ["@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2", "tajawal-700.woff2"],
  ["@fontsource/tajawal/files/tajawal-arabic-800-normal.woff2", "tajawal-800.woff2"],
];

const THREE_ADDONS = [
  "postprocessing/EffectComposer.js",
  "postprocessing/RenderPass.js",
  "postprocessing/ShaderPass.js",
  "postprocessing/UnrealBloomPass.js",
  "postprocessing/OutputPass.js",
  "postprocessing/Pass.js",
  "postprocessing/MaskPass.js",
  "shaders/CopyShader.js",
  "shaders/LuminosityHighPassShader.js",
  "shaders/OutputShader.js",
  "geometries/RoundedBoxGeometry.js",
  "loaders/GLTFLoader.js",
  "loaders/SVGLoader.js",
  "utils/BufferGeometryUtils.js",
  "utils/SkeletonUtils.js",
  "environments/RoomEnvironment.js",
];

/** Copies Three.js and its addons into `<dir>/three.module.js`, `<dir>/addons/…`. */
function copyThree(dir: string) {
  const threeDir = join(dirname(require.resolve("three")), ".."); // three/build/three.cjs → package root
  mkdirSync(join(dir, "addons"), { recursive: true });
  cpSync(join(threeDir, "build/three.module.js"), join(dir, "three.module.js"));
  cpSync(join(threeDir, "build/three.core.js"), join(dir, "three.core.js"));
  for (const a of THREE_ADDONS) {
    mkdirSync(dirname(join(dir, "addons", a)), { recursive: true });
    cpSync(join(threeDir, "examples/jsm", a), join(dir, "addons", a));
  }
}

/** Files that are tooling or vendored; they are not committed as the creative's own source. */
export const NOT_SOURCE = (path: string) => path === "CLAUDE.md" || path === "check.mjs";

/** Studio engine pages (ADR-0009): one starter page per format. */
const STUDIO_PAGE_FOR: Record<ContentSpec["format"], string> = {
  static: "carousel.html",
  carousel: "carousel.html",
  video: "reel.html",
};
export const STUDIO_DIR = join(TEMPLATES_DIR, "studio");

type SpecLike = Pick<ContentSpec, "format"> & { studio?: ContentSpec["studio"] };

export function assembleWorkspace(
  dir: string,
  spec: ContentSpec,
  opts: { previousDir?: string | null } = {},
) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const studio = Boolean(spec.studio);
  if (opts.previousDir && existsSync(opts.previousDir)) {
    // Revisions start from the previous version's files.
    cpSync(opts.previousDir, dir, { recursive: true });
  } else if (studio) {
    cpSync(join(STUDIO_DIR, "pages", STUDIO_PAGE_FOR[spec.format]), join(dir, "index.html"));
  } else {
    cpSync(join(TEMPLATES_DIR, TEMPLATE_FOR[spec.format]), dir, { recursive: true });
  }
  if (!studio) {
    // Shared runtime, fonts and vendored code are refreshed every time so they can't drift.
    mkdirSync(join(dir, "lib"), { recursive: true });
    for (const f of ["runtime.js", "base.css", "styles.css"])
      cpSync(join(TEMPLATES_DIR, "_common", f), join(dir, "lib", f));
  }
  addVendoredFiles(dir, spec, { assets: "all" });
  writeFileSync(join(dir, "spec.js"), specScript(spec));
  writeFileSync(
    join(dir, "CLAUDE.md"),
    readFileSync(
      studio ? join(STUDIO_DIR, "WORKSPACE_CLAUDE.md") : join(TEMPLATES_DIR, "WORKSPACE_CLAUDE.md"),
      "utf8",
    ),
  );
  cpSync(join(here, "check.mjs"), join(dir, "check.mjs"));
}

/** Directories the worker owns inside a workspace; refreshed after generation, never committed. */
export function trustedDirs(spec: SpecLike): string[] {
  if (spec.studio) return ["studio", "assets"];
  return ["lib", "fonts", ...(spec.format === "video" ? ["vendor"] : [])];
}

/** Puts the trusted runtime back over whatever the generator did to it. */
export function refreshTrusted(
  dir: string,
  spec: ContentSpec,
  assets: "all" | "referenced" = "referenced",
) {
  for (const sub of trustedDirs(spec)) rmSync(join(dir, sub), { recursive: true, force: true });
  if (!spec.studio) {
    mkdirSync(join(dir, "lib"), { recursive: true });
    for (const f of ["runtime.js", "base.css", "styles.css"])
      cpSync(join(TEMPLATES_DIR, "_common", f), join(dir, "lib", f));
  }
  addVendoredFiles(dir, spec, { assets });
}

/**
 * Studio pages get the engine under studio/ and the brand asset library under
 * assets/ — all of it while the creative is written, only what the page uses
 * (plus fonts, map elements, allowed UI sounds) for previews and renders.
 */
function addStudioFiles(dir: string, spec: SpecLike, mode: "all" | "referenced") {
  const studio = spec.studio!;
  mkdirSync(join(dir, "studio"), { recursive: true });
  cpSync(join(STUDIO_DIR, "engine"), join(dir, "studio", "engine"), { recursive: true });
  cpSync(join(STUDIO_DIR, "docs"), join(dir, "studio", "docs"), { recursive: true });
  const lib = brandAssetsDir(studio.brand_id);
  const all = listTree(lib);
  const own = mode === "all" ? [] : listTree(dir).filter((p) => isCommitted(p));
  // 3D (engine/sm-three.js) for every format, but a preview or render only carries the ~1.5 MB
  // of Three.js when the page uses it (previews are uploaded whole).
  if (mode === "all" || usesThree(dir, own)) copyThree(join(dir, "studio", "vendor"));
  let pick: string[];
  if (mode === "all") pick = all;
  else {
    const refs = referencedAssets(dir, own);
    const missing = [...refs].filter((p) => !all.includes(p));
    if (missing.length)
      throw new Error(
        `the page uses assets the brand library does not have: ${missing.join(", ")}`,
      );
    pick = [...new Set([...refs, ...alwaysNeeded(all, studio.sfx_allow)])];
  }
  for (const p of pick) {
    mkdirSync(dirname(join(dir, "assets", p)), { recursive: true });
    cpSync(join(lib, p), join(dir, "assets", p));
  }
}

const usesThree = (dir: string, own: string[]) =>
  own
    .filter((p) => /\.(html|js|mjs)$/.test(p))
    .some((p) => /sm-three\.js|studio\/vendor\//.test(readFileSync(join(dir, p), "utf8")));

/**
 * Fonts and vendored libraries come from pinned packages and are not committed;
 * a checkout of a committed version gets them back from here (render worker).
 */
export function addVendoredFiles(
  dir: string,
  spec: SpecLike,
  opts: { assets: "all" | "referenced" } = { assets: "referenced" },
) {
  if (spec.studio) return addStudioFiles(dir, spec, opts.assets);
  mkdirSync(join(dir, "fonts"), { recursive: true });
  for (const [from, to] of FONTS) cpSync(require.resolve(from), join(dir, "fonts", to));
  if (spec.format === "video") copyThree(join(dir, "vendor"));
}
