// node site_shots.js <outDir> [en|ar] [width] [height]  -> one PNG per <section> of the local website
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SITE = 'c:/nabih/projects/AIphin/Stacko/website/index.html';

(async () => {
  const [out, lang = 'en', w = '1440', h = '900'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(() => document.fonts.ready);
  if (lang === 'ar') { await page.click('#langBtn'); await page.waitForTimeout(800); }
  const secs = await page.$$('section:not([hidden])');
  for (const s of secs) {
    const id = (await s.getAttribute('id')) || (await s.getAttribute('class')).split(' ')[0];
    await s.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    await s.screenshot({ path: path.join(out, `${lang}-${id}.png`) });
    console.log(id);
  }
  await browser.close();
})();
