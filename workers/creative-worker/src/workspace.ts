/**
 * Assembles a creative workspace (ADR-0007 §2): starter template, shared
 * runtime, bundled fonts, vendored Three.js (video), spec.js, rules, checker.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type ContentSpec, specScript } from "@cc/shared";

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
];

/** Files that are tooling or vendored; they are not committed as the creative's own source. */
export const NOT_SOURCE = (path: string) => path === "CLAUDE.md" || path === "check.mjs";

export function assembleWorkspace(
  dir: string,
  spec: ContentSpec,
  opts: { previousDir?: string | null } = {},
) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (opts.previousDir && existsSync(opts.previousDir)) {
    // Revisions start from the previous version's files.
    cpSync(opts.previousDir, dir, { recursive: true });
  } else {
    cpSync(join(TEMPLATES_DIR, TEMPLATE_FOR[spec.format]), dir, { recursive: true });
  }
  // Shared runtime, fonts and vendored code are refreshed every time so they can't drift.
  mkdirSync(join(dir, "lib"), { recursive: true });
  for (const f of ["runtime.js", "base.css", "styles.css"])
    cpSync(join(TEMPLATES_DIR, "_common", f), join(dir, "lib", f));
  addVendoredFiles(dir, spec);
  writeFileSync(join(dir, "spec.js"), specScript(spec));
  writeFileSync(
    join(dir, "CLAUDE.md"),
    readFileSync(join(TEMPLATES_DIR, "WORKSPACE_CLAUDE.md"), "utf8"),
  );
  cpSync(join(here, "check.mjs"), join(dir, "check.mjs"));
}

/**
 * Fonts and vendored libraries come from pinned packages and are not committed;
 * a checkout of a committed version gets them back from here (render worker).
 */
export function addVendoredFiles(dir: string, spec: Pick<ContentSpec, "format">) {
  mkdirSync(join(dir, "fonts"), { recursive: true });
  for (const [from, to] of FONTS) cpSync(require.resolve(from), join(dir, "fonts", to));
  if (spec.format === "video") {
    const threeDir = join(dirname(require.resolve("three")), ".."); // three/build/three.cjs → package root
    mkdirSync(join(dir, "vendor/addons"), { recursive: true });
    cpSync(join(threeDir, "build/three.module.js"), join(dir, "vendor/three.module.js"));
    cpSync(join(threeDir, "build/three.core.js"), join(dir, "vendor/three.core.js"));
    for (const a of THREE_ADDONS) {
      mkdirSync(dirname(join(dir, "vendor/addons", a)), { recursive: true });
      cpSync(join(threeDir, "examples/jsm", a), join(dir, "vendor/addons", a));
    }
  }
}
