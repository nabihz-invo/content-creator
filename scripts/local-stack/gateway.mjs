// Minimal stand-in for Supabase's Kong gateway on :54321.
//   /auth/v1/*                → GoTrue      :9999
//   /rest/v1/*                → PostgREST   :3000
//   /storage/v1/*             → Storage API :5000
//   /functions/v1/api/*       → Deno `api`  :8000  (path keeps the /api prefix)
//   /functions/v1/telegram-webhook → Deno :8001
import http from "node:http";

const PORT = Number(process.env.GATEWAY_PORT ?? 54321);
const routes = [
  { prefix: "/auth/v1", target: "http://127.0.0.1:9999", strip: true },
  { prefix: "/rest/v1", target: "http://127.0.0.1:3000", strip: true },
  { prefix: "/storage/v1", target: "http://127.0.0.1:5000", strip: true },
  {
    prefix: "/functions/v1/telegram-webhook",
    target: "http://127.0.0.1:8001",
    strip: false,
    rewrite: "/telegram-webhook",
  },
  { prefix: "/functions/v1", target: "http://127.0.0.1:8000", strip: true },
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key, prefer, range, x-upsert, accept-profile, content-profile, x-supabase-api-version",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
  "access-control-expose-headers": "content-range, x-total-count",
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS).end();
      return;
    }
    const route = routes.find((r) => url.pathname.startsWith(r.prefix));
    if (!route) {
      res.writeHead(404, CORS).end("no route");
      return;
    }
    const path =
      route.rewrite ??
      (route.strip ? url.pathname.slice(route.prefix.length) || "/" : url.pathname);
    const target = new URL(path + url.search, route.target);
    const headers = { ...req.headers, host: target.host };
    // Storage API and PostgREST read the role from the JWT; the apikey header alone (anon) is the fallback.
    if (!headers.authorization && headers.apikey)
      headers.authorization = `Bearer ${headers.apikey}`;
    const upstream = http.request(target, { method: req.method, headers }, (up) => {
      const out = { ...up.headers };
      for (const k of Object.keys(out)) if (k.startsWith("access-control-")) delete out[k];
      res.writeHead(up.statusCode ?? 502, { ...out, ...CORS });
      up.pipe(res);
    });
    upstream.on("error", (err) => {
      res.writeHead(502, CORS).end(`upstream error: ${err.message}`);
    });
    req.pipe(upstream);
  })
  .listen(PORT, () => console.log(`gateway on :${PORT}`));
