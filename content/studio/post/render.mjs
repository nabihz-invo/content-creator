// Render static post HTML files to PNG (1080x1350 unless the .post element says otherwise).
// Usage (from the content/ folder):
//   node studio/post/render.mjs posts/<month>/<ID>_<slug>/source/<ID>.html [more.html ...] [--out DIR|file.png] [--scale 1|2]
// Default --out: the post's preview/ folder (posts/<month>/<ID>_<slug>/preview/<name>.png).
// Final files go to en/slide-01.png, ar/slide-01.png … : pass --out <post>/en/slide-01.png for a single file.
// Pages are served over HTTP from the content/ root, so root paths like /assets/brand/brand.css work.
import { chromium } from 'playwright';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };

const args = process.argv.slice(2);
const files = []; let out = null; let scale = 1;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--scale') scale = Number(args[++i]);
  else files.push(args[i]);
}
if (!files.length) { console.error('Usage: node studio/post/render.mjs <file.html> [...] [--out DIR|file.png] [--scale 1|2]'); process.exit(1); }
if (out && out.endsWith('.png') && files.length > 1) { console.error('--out <file.png> takes exactly one page'); process.exit(1); }

const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const p = path.join(ROOT, u);
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('not found: ' + u); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: scale });
const missing = [];
page.on('response', r => { if (r.status() >= 400) missing.push(r.url().replace(base, '')); });
for (const f of files) {
  const abs = path.resolve(f);
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  if (rel.startsWith('..')) throw new Error('The page must be inside ' + ROOT);
  missing.length = 0;
  await page.goto(`${base}/${rel}#render`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const postDir = path.basename(path.dirname(abs)) === 'source' ? path.dirname(path.dirname(abs)) : path.dirname(abs);
  const target = out && out.endsWith('.png') ? path.resolve(out) : path.join(out ? path.resolve(out) : path.join(postDir, 'preview'), path.basename(f, '.html') + '.png');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const post = await page.$('.post');
  await (post ? post.screenshot({ path: target }) : page.screenshot({ path: target }));
  console.log('rendered', path.relative(ROOT, target).split(path.sep).join('/'), missing.length ? '  MISSING: ' + missing.join(', ') : '');
}
await browser.close();
srv.close();
