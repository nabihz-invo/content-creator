import assert from "node:assert/strict";
import { after, test } from "node:test";
import { signPreviewToken } from "@cc/shared";
import { createPreviewServer } from "../src/server.ts";

const P = "11111111-2222-3333-4444-555555555555/creative-v1/";
const files: Record<string, string> = {
  [`${P}index.html`]: "<html><script src='main.js'></script></html>",
  [`${P}main.js`]: "window.__ready = true",
  ["99999999-2222-3333-4444-555555555555/creative-v1/index.html"]: "other project",
};
const server = createPreviewServer({
  secret: "s3cret",
  source: { get: async (p) => (p in files ? new TextEncoder().encode(files[p]) : null) },
  frameAncestors: ["http://crm.test"],
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
after(() => server.close());

const token = (e = Math.floor(Date.now() / 1000) + 600) => signPreviewToken("s3cret", { p: P, e });

test("serves files of the signed creative with a strict CSP and no cookies", async () => {
  const res = await fetch(`${base}/p/${await token()}/index.html`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert.match(res.headers.get("content-security-policy")!, /connect-src 'none'/);
  assert.match(res.headers.get("content-security-policy")!, /frame-ancestors http:\/\/crm\.test/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("set-cookie"), null);
  const js = await fetch(`${base}/p/${await token()}/main.js`);
  assert.equal(js.headers.get("content-type"), "text/javascript; charset=utf-8");
});

test("refuses expired, forged, and out-of-prefix requests", async () => {
  assert.equal((await fetch(`${base}/p/${await token(1)}/index.html`)).status, 403);
  const forged = (
    await signPreviewToken("wrong", { p: P, e: Math.floor(Date.now() / 1000) + 600 })
  ).replace(/^/, "");
  assert.equal((await fetch(`${base}/p/${forged}/index.html`)).status, 403);
  const t = await token();
  for (const path of [
    "..%2F..%2F99999999-2222-3333-4444-555555555555%2Fcreative-v1%2Findex.html",
    "%2e%2e/%2e%2e/etc/passwd",
  ]) {
    const r = await fetch(`${base}/p/${t}/${path}`);
    assert.ok([400, 404].includes(r.status), `${path} → ${r.status}`);
  }
  assert.equal((await fetch(`${base}/p/${t}/payload.exe`)).status, 415);
  assert.equal((await fetch(`${base}/p/${t}/index.html`, { method: "POST" })).status, 405);
});
