/**
 * Copies the parts of @cc/shared that Edge Functions need into
 * supabase/functions/_shared/vendor/ (Supabase bundles only files under
 * supabase/functions). Run after changing src/ or schemas/: pnpm sync:edge
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const SHARED_ROOT = join(here, "..");
export const VENDOR_ROOT = join(here, "../../../supabase/functions/_shared/vendor");
export const VENDORED = ["src", "schemas"];

export function syncEdge() {
  rmSync(VENDOR_ROOT, { recursive: true, force: true });
  for (const rel of VENDORED) {
    const dest = join(VENDOR_ROOT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(SHARED_ROOT, rel), dest, { recursive: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncEdge();
  console.log(`synced ${VENDORED.join(", ")} → ${VENDOR_ROOT}`);
}
