import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { git } from "../src/exec.ts";
import { ensureLocalRepo, gitSourceStore } from "../src/source-store.ts";

test("versions are committed under projects/<id>/v<n>, concurrently, and checked out by SHA", async () => {
  const root = mkdtempSync(join(tmpdir(), "cc-git-"));
  const url = `file://${join(root, "creatives.git")}`;
  await ensureLocalRepo(url, root);
  const store = gitSourceStore(url);
  const src = (marker: string) => {
    const d = mkdtempSync(join(root, "src-"));
    mkdirSync(join(d, "lib"));
    writeFileSync(join(d, "index.html"), `<h1>${marker}</h1>`);
    writeFileSync(join(d, "lib/runtime.js"), "export {}");
    return d;
  };
  const a = src("A1");
  const b = src("B1");
  // Two projects pushing at the same time: one rebases and retries.
  const [ca, cb] = await Promise.all([
    store.commitVersion({
      workDir: root,
      files: ["index.html", "lib/runtime.js"],
      sourceDir: a,
      projectId: "pa",
      version: 1,
      message: "project pa creative v1",
    }),
    store.commitVersion({
      workDir: root,
      files: ["index.html"],
      sourceDir: b,
      projectId: "pb",
      version: 1,
      message: "project pb creative v1",
    }),
  ]);
  assert.match(ca.sha, /^[0-9a-f]{40}$/);
  assert.equal(ca.path, "projects/pa/v1");
  assert.notEqual(ca.sha, cb.sha);

  const log = await git(
    ["--git-dir", join(root, "creatives.git"), "log", "--format=%s", "main"],
    root,
  );
  assert.match(log, /project pa creative v1/);
  assert.match(log, /project pb creative v1/);

  const dest = join(root, "checkout");
  await store.checkout({ workDir: root, sha: ca.sha, path: ca.path, dest });
  assert.equal(readFileSync(join(dest, "index.html"), "utf8"), "<h1>A1</h1>");
  assert.equal(readFileSync(join(dest, "lib/runtime.js"), "utf8"), "export {}");
});
