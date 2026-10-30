// node --test n8n/scripts/ — checks the n8n exports without an n8n instance:
// graph integrity, committed JSON is current, and the Code-node HMAC logic
// interoperates with the Edge Function signer.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { serialize, WORKFLOWS, WORKFLOWS_DIR } from "./build-workflows.mjs";

const require = createRequire(import.meta.url);
const SECRET = "test-secret";

/** Runs an n8n Code node body with the globals n8n provides. */
function runCode(code, { input, env, nodes = {} }) {
  const fn = new Function("require", "$env", "$input", "$", code);
  return fn(require, env, { first: () => ({ json: input }) }, (name) => ({
    first: () => ({ json: nodes[name] }),
  }));
}
const code = (wf, name) => wf.nodes.find((n) => n.name === name).parameters.jsCode;
// Same scheme as supabase/functions/_shared/n8n.ts signBody()
const edgeSign = (ts, body) =>
  "sha256=" + createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");

test("committed workflow JSON is current (run node n8n/scripts/build-workflows.mjs)", () => {
  for (const [file, wf] of Object.entries(WORKFLOWS)) {
    assert.equal(readFileSync(join(WORKFLOWS_DIR, file), "utf8"), serialize(wf), file);
  }
});

test("connections reference existing nodes; no secrets embedded", () => {
  for (const wf of Object.values(WORKFLOWS)) {
    const names = new Set(wf.nodes.map((n) => n.name));
    for (const [from, c] of Object.entries(wf.connections)) {
      assert.ok(names.has(from), from);
      for (const branch of c.main)
        for (const edge of branch) assert.ok(names.has(edge.node), edge.node);
    }
    assert.doesNotMatch(JSON.stringify(wf), /sk-ant-|eyJhbGci|service_role_key/i);
  }
});

test("stage runner verifies Edge Function signatures and re-signs the run-job call", () => {
  const wf = WORKFLOWS["stage-runner.json"];
  const body = {
    job_id: "11111111-1111-1111-1111-111111111111",
    project_id: "p",
    stage: "analysis",
  };
  const ts = Math.floor(Date.now() / 1000);
  const input = {
    body,
    params: { workflow: "analyze" },
    headers: { "x-cc-timestamp": String(ts), "x-cc-signature": edgeSign(ts, JSON.stringify(body)) },
  };
  const [out] = runCode(code(wf, "Verify signature"), {
    input,
    env: { N8N_WEBHOOK_SECRET: SECRET },
  });
  assert.equal(out.json.workflow, "analyze");
  assert.equal(out.json.body, JSON.stringify({ job_id: body.job_id }));
  assert.equal(
    out.json.signature,
    edgeSign(out.json.timestamp, out.json.body),
    "run-job signature matches the Edge verifier's scheme",
  );

  const tampered = { ...input, body: { ...body, job_id: "22222222-2222-2222-2222-222222222222" } };
  assert.throws(
    () =>
      runCode(code(wf, "Verify signature"), {
        input: tampered,
        env: { N8N_WEBHOOK_SECRET: SECRET },
      }),
    /signature/,
  );
  const stale = {
    ...input,
    headers: {
      "x-cc-timestamp": String(ts - 3600),
      "x-cc-signature": edgeSign(ts - 3600, JSON.stringify(body)),
    },
  };
  assert.throws(
    () =>
      runCode(code(wf, "Verify signature"), { input: stale, env: { N8N_WEBHOOK_SECRET: SECRET } }),
    /expired/,
  );
});

test("notification text follows the owner's language and skips unlinked owners", () => {
  const wf = WORKFLOWS["stage-runner.json"];
  const nodes = { "Verify signature": { job: { event: "script_ready" } } };
  const env = { CC_CRM_URL: "https://crm.example/" };
  const [ar] = runCode(code(wf, "Compose message"), {
    input: { telegram_user_id: 42, locale: "ar", title: "شتاء", project_id: "p1" },
    env,
    nodes,
  });
  assert.equal(ar.json.chat_id, "42");
  assert.match(ar.json.text, /النص جاهز للمراجعة/);
  assert.match(ar.json.text, /https:\/\/crm\.example\/projects\/p1$/);
  assert.deepEqual(
    runCode(code(wf, "Compose message"), {
      input: { telegram_user_id: null, locale: "en", title: "x", project_id: "p" },
      env,
      nodes,
    }),
    [],
  );
});

test("recovery signs an empty body the Edge Function accepts", () => {
  const [out] = runCode(code(WORKFLOWS["recovery.json"], "Sign request"), {
    input: {},
    env: { N8N_WEBHOOK_SECRET: SECRET },
  });
  assert.equal(out.json.signature, edgeSign(out.json.timestamp, "{}"));
});
