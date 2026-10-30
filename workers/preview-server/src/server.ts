/**
 * Preview origin (ADR-0007 §6). Serves creative preview bundles from the
 * private `previews` bucket on a separate origin:
 *   GET /p/<token>/<path inside the creative>
 * The token (signed by the API) names one creative version's prefix and
 * expires quickly. Responses carry a strict CSP, never set cookies, and are
 * framable only by the CRM.
 */
import http from "node:http";
import { extname, posix } from "node:path";
import { previewCsp, verifyPreviewToken } from "@cc/shared";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

export interface ObjectSource {
  get(path: string): Promise<Uint8Array | null>;
}

/** Reads objects from Supabase Storage with the service role (server-side only). */
export function storageSource(supabaseUrl: string, serviceKey: string): ObjectSource {
  return {
    async get(path) {
      const res = await fetch(
        `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/previews/${path.split("/").map(encodeURIComponent).join("/")}`,
        {
          headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        },
      );
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`storage ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
  };
}

export function createPreviewServer(opts: {
  secret: string;
  source: ObjectSource;
  frameAncestors: string[];
}) {
  const csp = previewCsp(opts.frameAncestors);
  const security = {
    "content-security-policy": csp,
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "cross-origin-opener-policy": "same-origin",
    "permissions-policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-read=(), clipboard-write=()",
  };
  const deny = (res: http.ServerResponse, code: number, msg: string) =>
    res.writeHead(code, { ...security, "content-type": "text/plain" }).end(msg);

  return http.createServer(async (req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD")
        return deny(res, 405, "method not allowed");
      const url = new URL(req.url ?? "/", "http://preview");
      if (url.pathname === "/health")
        return res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      const m = url.pathname.match(/^\/p\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\/(.*)$/);
      if (!m) return deny(res, 404, "not found");
      const claims = await verifyPreviewToken(opts.secret, m[1]!);
      if (!claims) return deny(res, 403, "expired or invalid preview link");
      // Normalize and keep the request inside the token's prefix.
      const rel = posix.normalize(decodeURIComponent(m[2] || "index.html")).replace(/^\/+/, "");
      if (!rel || rel.startsWith("..") || rel.includes("\0")) return deny(res, 400, "bad path");
      const type = TYPES[extname(rel).toLowerCase()];
      if (!type) return deny(res, 415, "unsupported file type");
      const body = await opts.source.get(`${claims.p}${rel}`);
      if (!body) return deny(res, 404, "not found");
      res.writeHead(200, {
        ...security,
        "content-type": type,
        "content-length": String(body.byteLength),
        "cache-control": "private, max-age=300",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (err) {
      console.error("preview error", err);
      deny(res, 502, "preview unavailable");
    }
  });
}
