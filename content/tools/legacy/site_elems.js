// node site_elems.js <outDir> <selector=name> ...  -> high-res PNG of single elements of the local website (served on :8765)
// HIDE="css selector" hides overlapping elements first (e.g. the Ask Stacko phone over the map)
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const [out, ...pairs] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (process.env.HIDE) await page.addStyleTag({ content: `${process.env.HIDE}{visibility:hidden!important}` });
  for (const p of pairs) {
    const [sel, name] = p.split('=');
    const el = await page.$(sel);
    if (!el) { console.log('missing', sel); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    await el.screenshot({ path: path.join(out, name + '.png') });
    console.log(name);
  }
  await browser.close();
})();
