/** Minimal static file server for a workspace (thumbnails, template tests). Localhost only. */
import { createReadStream, statSync } from "node:fs";
import http from "node:http";
import { extname, join, normalize, sep } from "node:path";

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

export function contentType(path: string) {
  return TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
}

export async function serveDir(root: string): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const file = normalize(join(root, path === "/" ? "index.html" : path));
    if (!file.startsWith(normalize(root) + sep) && file !== normalize(root))
      return res.writeHead(403).end();
    const st = statSync(file, { throwIfNoEntry: false });
    if (!st?.isFile()) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" });
    createReadStream(file).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}
