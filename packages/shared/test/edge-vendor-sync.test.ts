import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { SHARED_ROOT, VENDORED, VENDOR_ROOT } from "../scripts/sync-edge.ts";

function files(path: string): string[] {
  return statSync(path).isDirectory()
    ? readdirSync(path).flatMap((f) => files(join(path, f)))
    : [path];
}

describe("edge function vendor copy", () => {
  it("is identical to packages/shared (run `pnpm sync:edge`)", () => {
    for (const rel of VENDORED) {
      for (const src of files(join(SHARED_ROOT, rel))) {
        const r = relative(SHARED_ROOT, src);
        expect(readFileSync(join(VENDOR_ROOT, r), "utf8"), r).toBe(readFileSync(src, "utf8"));
      }
    }
  });
});
