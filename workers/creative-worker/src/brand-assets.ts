/**
 * Brand asset library on local disk (ADR-0009). `BRAND_ASSETS_DIR/<brand_id>/`
 * mirrors the brand's `brand-assets` bucket (backgrounds/, post-images/,
 * screens/, graphics/, brand/, map-elements/, audio/, presenters/, clips/) and
 * is filled by `scripts/brand/sync-kit.mjs`. Creatives reference files as
 * `/assets/<path>`; they are mounted read-only into workspaces, never committed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export function brandAssetsDir(brandId: string): string {
  const root = process.env.BRAND_ASSETS_DIR;
  if (!root)
    throw new Error("BRAND_ASSETS_DIR is not set (local mirror of the brand asset library)");
  const dir = join(root, brandId);
  if (!existsSync(dir)) throw new Error(`no asset library for brand ${brandId} in ${root}`);
  return dir;
}

export function listTree(dir: string, root = dir, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) listTree(p, root, out);
    else out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}

const ASSET_REF = /\/assets\/([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)/g;

/** Asset paths (relative to the library) that the creative's own files reference. */
export function referencedAssets(ws: string, ownFiles: string[]): Set<string> {
  const refs = new Set<string>();
  for (const f of ownFiles) {
    if (!/\.(html|m?js|css|json)$/.test(f)) continue;
    for (const m of readFileSync(join(ws, f), "utf8").matchAll(ASSET_REF)) {
      const p = m[1]!;
      if (!p.split("/").includes("..")) refs.add(p);
    }
  }
  return refs;
}

/** Library files every studio page needs whether or not it names them. */
export function alwaysNeeded(library: string[], sfxAllow: string[]): string[] {
  return library.filter(
    (p) =>
      p.startsWith("brand/fonts/") ||
      p === "map-elements/stacko-map-elements.js" ||
      sfxAllow.some((n) => new RegExp(`^audio/sfx/${n}\\.(mp3|wav|m4a|ogg)$`).test(p)),
  );
}
