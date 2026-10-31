/** What a creative version commits, and the hash that identifies its source tree. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { NOT_SOURCE } from "./workspace.ts";

/** Files that belong to the creative's own source (vendored fonts/libraries are reproducible and not committed). */
export const isCommitted = (path: string) =>
  !NOT_SOURCE(path) &&
  !path.startsWith("fonts/") &&
  !path.startsWith("vendor/") &&
  !path.startsWith(".home/");

/** Order-independent hash of a file tree: sha256 over sorted "path\0sha256(content)" lines. */
export function treeHash(dir: string, files: string[]): string {
  const lines = [...files].sort().map(
    (f) =>
      `${f}\0${createHash("sha256")
        .update(readFileSync(join(dir, f)))
        .digest("hex")}`,
  );
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

/** Every regular file under dir, as POSIX relative paths. */
export function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).split(sep).join("/"));
}
