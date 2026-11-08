// node site_clip.js <out.mp4> <selector> <seconds> [lang] [scrollTarget] [vw] [vh] [dpr]
// Records a website element frame by frame with virtual time, so CSS animations and rAF advance exactly 1/30s per frame.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const [out, sel, secs, lang = 'en', scrollSel, vw = '1440', vh = '900', dpr = '2'] = process.argv.slice(2);
  const fps = 30, n = Math.round(+secs * fps);
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: +dpr });
  const dbg = m => process.env.DBG && console.log('[dbg]', m);
  dbg('launched');
  await page.goto('http://127.0.0.1:8765/');
  dbg('loaded');
  await page.evaluate(() => document.fonts.ready);
  if (lang === 'ar') { await page.click('#langBtn'); await page.waitForTimeout(800); }
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}.nav{display:none!important}' + (process.env.HIDE ? process.env.HIDE + '{visibility:hidden!important}' : '') });
  // scroll so the element's top sits at the top of the viewport; SCROLL_TOTAL=auto scrolls through its whole height
  let autoTotal = 0;
  if (scrollSel) autoTotal = await page.evaluate(sel => { const e = document.querySelector(sel); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + (+(window.__off || 0))); return e.offsetHeight - innerHeight; }, scrollSel);
  dbg('scrolled ' + autoTotal);
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  const vp = page.viewportSize();
  const box = sel === 'viewport' ? { x: 0, y: 0, width: vp.width, height: vp.height } : await (await page.$(sel)).boundingBox();
  const scrollTotal = process.env.SCROLL_TOTAL === 'auto' ? autoTotal : +(process.env.SCROLL_TOTAL || 0);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  for (let i = 0; i < n; i++) {
    await new Promise(res => {
      cdp.once('Emulation.virtualTimeBudgetExpired', res);
      cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: 1000 / fps });
    });
    dbg('advanced ' + i);
    if (scrollTotal) await cdp.send('Runtime.evaluate', { expression: `window.scrollBy(0, ${scrollTotal / n})` });
    // CDP clips are in page coordinates, so add the current scroll offset to the viewport box
    const sy = (await cdp.send('Runtime.evaluate', { expression: 'scrollY', returnByValue: true })).result.value;
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { ...box, y: box.y + sy, scale: +dpr }, captureBeyondViewport: false });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (+process.env.LOGN || 60) === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('wrote', out, box);
})();
