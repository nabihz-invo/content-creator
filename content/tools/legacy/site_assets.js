// node site_assets.js <outDir> <en|ar>  -> high-res PNGs of the website's illustrations
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const [out, lang = 'en'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  await page.goto('http://127.0.0.1:8765/');
  await page.evaluate(() => document.fonts.ready);
  if (lang === 'ar') { await page.click('#langBtn'); await page.waitForTimeout(800); }
  // hide the sticky nav so it never overlaps a capture
  await page.addStyleTag({ content: '.nav{display:none!important}' });
  const only = process.argv[4] ? process.argv[4].split(',') : null;
  const hide = await page.addStyleTag({ content: '/* */' });
  // TARGETS env: JSON list of [name, selector] to capture instead of the default set
  const targets = process.env.TARGETS ? JSON.parse(process.env.TARGETS) : [['hero-art', '#heroArt'], ['hero', '#top'], ['app', '#app'], ['phone', '#ask'], ['story-map', '#storyMap']];
  for (const [name, sel] of targets) {
    if (only && !only.includes(name)) continue;
    await hide.evaluate((n, name) => { n.textContent = name === 'app' ? '#ask{visibility:hidden!important}' : ''; }, name);
    const el = await page.$(sel);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    await el.screenshot({ path: path.join(out, `${lang}-${name}.png`) });
    console.log(name, await el.boundingBox());
  }
  await browser.close();
})();
