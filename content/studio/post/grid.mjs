// Crop part of an image, zoom it and draw a pixel grid on top, so you can read exact coordinates
// (e.g. the 4 corners of a phone screen, or where baked text sits in an AI image).
// Usage: node studio/post/grid.mjs <image> <x> <y> <w> <h> [--zoom 2] [--step 20] [--out grid.png]
// Grid lines are every --step SOURCE pixels; every 5th line is darker. Labels show source coordinates.
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const a = process.argv.slice(2);
const opt = { zoom: 2, step: 20, out: 'grid.png' };
const pos = [];
for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { opt[a[i].slice(2)] = a[++i]; } else pos.push(a[i]); }
const [img, x, y, w, h] = [pos[0], ...pos.slice(1).map(Number)];
const z = Number(opt.zoom), st = Number(opt.step);
if (!img || [x, y, w, h].some(Number.isNaN)) { console.error('Usage: node studio/post/grid.mjs <image> <x> <y> <w> <h> [--zoom 2] [--step 20]'); process.exit(1); }

let lines = '';
for (let gx = Math.ceil(x / st) * st; gx <= x + w; gx += st)
  lines += `<div style="position:absolute;left:${(gx - x) * z}px;top:0;bottom:0;border-left:1px solid ${gx % (st * 5) ? 'rgba(255,90,90,.5)' : 'red'}"><span>${gx % (st * 5) ? '' : gx}</span></div>`;
for (let gy = Math.ceil(y / st) * st; gy <= y + h; gy += st)
  lines += `<div style="position:absolute;top:${(gy - y) * z}px;left:0;right:0;border-top:1px solid ${gy % (st * 5) ? 'rgba(255,90,90,.5)' : 'red'}"><span>${gy % (st * 5) ? '' : gy}</span></div>`;
const html = `<html><body style="margin:0"><div style="position:relative;width:${w * z}px;height:${h * z}px;overflow:hidden">
<img src="${pathToFileURL(path.resolve(img)).href}" style="position:absolute;left:${-x * z}px;top:${-y * z}px;transform-origin:0 0;transform:scale(${z})">
${lines}</div><style>span{position:absolute;font:bold 12px sans-serif;color:red;background:#fff;padding:0 2px;left:2px;top:2px}</style></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w * z, height: h * z } });
await page.setContent(html); await page.waitForTimeout(300);
await page.screenshot({ path: opt.out });
await browser.close();
console.log('grid written to', opt.out);
