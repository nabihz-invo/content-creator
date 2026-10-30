import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { claudeCodeGenerator, GeneratorError } from "../src/generators.ts";

/** A fake `claude` CLI: records argv/env/cwd, edits a file, prints a JSON result. */
function stubCli(behavior: "ok" | "error" | "hang") {
  const dir = mkdtempSync(join(tmpdir(), "cc-stub-"));
  const bin = join(dir, "claude");
  writeFileSync(
    bin,
    `#!/usr/bin/env node
const fs = require("fs");
fs.writeFileSync(process.cwd() + "/invocation.json", JSON.stringify({ argv: process.argv.slice(2), env: process.env, cwd: process.cwd() }));
if (${JSON.stringify(behavior)} === "hang") setTimeout(() => {}, 60000);
else if (${JSON.stringify(behavior)} === "error") { console.log(JSON.stringify({ type: "result", subtype: "error_during_execution", is_error: true, result: "boom" })); process.exit(1); }
else { fs.appendFileSync(process.cwd() + "/main.js", "\\n// improved by claude\\n"); console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "Built it.", total_cost_usd: 0.42, num_turns: 7 })); }
`,
  );
  chmodSync(bin, 0o755);
  return bin;
}

const ws = () => {
  const d = mkdtempSync(join(tmpdir(), "cc-gen-ws-"));
  writeFileSync(join(d, "main.js"), "markReady();");
  return d;
};
const cfg = (bin: string, timeoutMs = 10_000) => ({
  bin,
  apiKey: "sk-ant-test",
  model: "claude-opus-5-5",
  effort: "high",
  budgetUsd: 3,
  timeoutMs,
});

test("Claude Code runs headless, locked down, with only its own credentials", async () => {
  process.env.DATABASE_URL = "postgres://secret";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-secret";
  process.env.CREATIVES_REPO_URL = "https://x-access-token:ghp_secret@github.com/o/r.git";
  const dir = ws();
  const r = await claudeCodeGenerator(cfg(stubCli("ok"))).generate({
    dir,
    systemPrompt: "SYSTEM PROMPT",
    revisionNotes: null,
    isRevision: false,
  });
  assert.deepEqual([r.generator, r.costUsd, r.turns], ["claude-code", 0.42, 7]);
  assert.match(readFileSync(join(dir, "main.js"), "utf8"), /improved by claude/);

  const inv = JSON.parse(readFileSync(join(dir, "invocation.json"), "utf8"));
  const arg = (flag: string) => inv.argv[inv.argv.indexOf(flag) + 1];
  assert.equal(inv.cwd, dir);
  assert.equal(arg("--permission-mode"), "dontAsk");
  assert.equal(arg("--allowedTools"), "Read,Write,Edit,MultiEdit,Glob,Grep,Bash(node check.mjs)");
  assert.equal(arg("--disallowedTools"), "WebFetch,WebSearch");
  assert.equal(arg("--append-system-prompt"), "SYSTEM PROMPT");
  assert.equal(arg("--model"), "claude-opus-5-5");
  assert.equal(arg("--max-budget-usd"), "3");
  assert.ok(
    inv.argv.includes("--strict-mcp-config") && inv.argv.includes("--no-session-persistence"),
  );
  assert.match(arg("-p"), /node check\.mjs/);

  assert.equal(inv.env.ANTHROPIC_API_KEY, "sk-ant-test");
  assert.equal(inv.env.HOME, join(dir, ".home"));
  for (const leaked of ["DATABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CREATIVES_REPO_URL"])
    assert.equal(inv.env[leaked], undefined, `${leaked} must not reach Claude Code`);
});

test("revision prompts carry the reviewer's notes and checker findings", async () => {
  const dir = ws();
  await claudeCodeGenerator(cfg(stubCli("ok"))).generate({
    dir,
    systemPrompt: "S",
    revisionNotes: "Bigger headline",
    isRevision: true,
    fixErrors: ["main.js:3 network APIs are not allowed"],
  });
  const inv = JSON.parse(readFileSync(join(dir, "invocation.json"), "utf8"));
  const prompt = inv.argv[inv.argv.indexOf("-p") + 1];
  assert.match(prompt, /<reviewer_notes>\nBigger headline\n<\/reviewer_notes>/);
  assert.match(prompt, /main\.js:3 network APIs are not allowed/);
});

test("failures and timeouts are classified", async () => {
  await assert.rejects(
    claudeCodeGenerator(cfg(stubCli("error"))).generate({
      dir: ws(),
      systemPrompt: "S",
      revisionNotes: null,
      isRevision: false,
    }),
    (e: unknown) => e instanceof GeneratorError && /boom/.test(e.message) && e.retryable,
  );
  await assert.rejects(
    claudeCodeGenerator(cfg(stubCli("hang"), 1500)).generate({
      dir: ws(),
      systemPrompt: "S",
      revisionNotes: null,
      isRevision: false,
    }),
    (e: unknown) => e instanceof GeneratorError && /timed out/.test(e.message) && e.retryable,
  );
});
