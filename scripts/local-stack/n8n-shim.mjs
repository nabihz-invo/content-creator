// Local stand-in for n8n (port 5678) so the local stack runs the pipeline
// end to end. Mirrors n8n/workflows/*: verify HMAC → run-job, log
// notifications, and call /internal/recover periodically.
import { createHmac, timingSafeEqual } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SECRET = process.env.N8N_WEBHOOK_SECRET ?? "local-n8n-secret";
const API = process.env.CC_API_URL ?? "http://127.0.0.1:54321/functions/v1/api";
const PORT = Number(process.env.N8N_SHIM_PORT ?? 5678);
const LOG = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../tmp/local-stack/notifications.log",
);
mkdirSync(dirname(LOG), { recursive: true });

const sign = (ts, body) =>
  "sha256=" + createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");

function verify(headers, raw) {
  const ts = Number(headers["x-cc-timestamp"]);
  const given = String(headers["x-cc-signature"] ?? "");
  const expected = sign(ts, raw);
  return (
    Math.abs(Date.now() / 1000 - ts) <= 300 &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}

async function callApi(path, body) {
  const ts = Math.floor(Date.now() / 1000);
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cc-timestamp": String(ts),
      "x-cc-signature": sign(ts, body),
    },
    body,
  });
  return { status: res.status, body: await res.text() };
}

http
  .createServer((req, res) => {
    const m = req.url?.match(/^\/webhook\/cc\/([a-z-]+)$/);
    if (req.method !== "POST" || !m) return res.writeHead(404).end();
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (!verify(req.headers, raw)) return res.writeHead(401).end("invalid signature");
      res.writeHead(200).end("ok");
      const job = JSON.parse(raw);
      if (m[1] === "notify") {
        appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...job }) + "\n");
        console.log(`notify ${job.event} project=${job.project_id}`);
        return;
      }
      callApi("/internal/run-job", JSON.stringify({ job_id: job.job_id }))
        .then((r) =>
          console.log(`run-job ${m[1]} ${job.job_id} → ${r.status} ${r.body.slice(0, 200)}`),
        )
        .catch((e) => console.error(`run-job ${job.job_id} failed`, e.message));
    });
  })
  .listen(PORT, () => console.log(`n8n shim on :${PORT}`));

setInterval(() => {
  callApi("/internal/recover", "{}").catch((e) => console.error("recover failed", e.message));
}, 30_000);
