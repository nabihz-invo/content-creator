#!/usr/bin/env node
/**
 * Stacko Studio · export the logo set (LG codes) into assets/brand/logo/
 *   – SVG marks in the four colour versions (pure vector, from the brand master)
 *   – transparent PNG lockups at 2× (rendered by the engine, so fonts and spacing match the videos)
 *
 *   node studio/tools/export_logos.mjs
 *
 * If you already have official logo files, put them in assets/brand/logo/ with the same names and
 * skip this script — the engine itself never needs these files (it draws the logo live).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets/brand/logo');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' };
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><script src="/studio/engine/sm-core.js"></script><script src="/studio/engine/sm-components.js"></script></head><body style="margin:0;background:transparent"></body></html>`;
const srv = http.createServer((q, r) => { if (q.url.startsWith('/__logo.html')) { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return r.end(PAGE); } const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise(res => srv.listen(0, res));
const port = srv.address().port;

const LOCKUPS = [
  ['LG-05_lockup-horizontal-dark', { layout: 'h', variant: 'dark', size: 160 }, 'dark'],
  ['LG-05b_lockup-horizontal-dark-tagline', { layout: 'h', variant: 'dark', size: 160, tagline: 'en' }, 'dark'],
  ['LG-06_lockup-horizontal-light', { layout: 'h', variant: 'light', size: 160 }, 'light'],
  ['LG-06b_lockup-horizontal-light-tagline', { layout: 'h', variant: 'light', size: 160, tagline: 'en' }, 'light'],
  ['LG-07_lockup-stacked-dark', { layout: 'v', variant: 'dark', size: 220 }, 'dark'],
  ['LG-07b_lockup-stacked-light', { layout: 'v', variant: 'light', size: 220 }, 'light'],
  ['LG-08_lockup-arabic-dark', { layout: 'ar', variant: 'dark', size: 160 }, 'dark'],
  ['LG-08b_lockup-arabic-light', { layout: 'ar', variant: 'light', size: 160 }, 'light'],
  ['LG-09_app-icon', { layout: 'icon', variant: 'dark', size: 360 }, 'dark'],
  ['LG-11_lockup-bilingual-dark', { layout: 'bi', variant: 'dark', size: 140 }, 'dark'],
  ['LG-11b_lockup-bilingual-light', { layout: 'bi', variant: 'light', size: 140 }, 'light'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`http://127.0.0.1:${port}/__logo.html`, { waitUntil: 'load' });
await page.evaluate(async () => { SM.injectCSS(); document.body.style.fontFamily = "'Readex Pro',sans-serif"; document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; await document.fonts.ready; await Promise.all(["600 40px 'Readex Pro'", "400 40px 'Readex Pro'", "700 40px 'Noto Kufi Arabic'", "400 40px 'Audiowide'"].map(f => document.fonts.load(f, 'abcستاكو'))); });

// SVG marks (pure vector)
const marks = await page.evaluate(() => ({ dark: SM.mark('dark', 512), light: SM.mark('light', 512), white: SM.mark('white', 512), navy: SM.mark('navy', 512) }));
const names = { dark: 'LG-01_mark-dark', light: 'LG-02_mark-light', white: 'LG-03_mark-white', navy: 'LG-04_mark-navy' };
for (const [k, svg] of Object.entries(marks)) { let s = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'); fs.writeFileSync(path.join(OUT, names[k] + '.svg'), s); console.log('saved', names[k] + '.svg'); }

// PNG lockups (transparent)
for (const [name, o] of LOCKUPS) {
  const box = await page.evaluate(o => {
    document.body.innerHTML = ''; const holder = document.createElement('div'); holder.style.cssText = 'position:absolute;left:0;top:0;padding:40px;display:inline-block'; document.body.appendChild(holder);
    const fake = { R: { w: 0, h: 0, theme: 'dark' }, layer: () => holder, enter() { }, exit() { }, el: holder };
    const r = SM.Scene.prototype.lockup.call(fake, Object.assign({ x: 0, y: 0 }, o));
    r.el.style.position = 'relative'; r.el.style.transform = 'none';
    const b = holder.getBoundingClientRect(); return { x: b.x, y: b.y, width: Math.ceil(b.width), height: Math.ceil(b.height) };
  }, o);
  await page.screenshot({ path: path.join(OUT, name + '.png'), clip: box, omitBackground: true });
  console.log('saved', name + '.png');
}
await browser.close(); srv.close();
