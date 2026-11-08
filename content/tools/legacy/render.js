// node render.js shots <html> <outDir> [selector] [prefix]
// node render.js video <html> <out.mp4> <seconds> [fps]   (page must expose window.seek(t) and #stage)
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

(async () => {
  const [mode, html, out, a, b] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: EDGE });
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  const [file, query] = html.split('?');
  // v2 pages load fonts from content/_brand/fonts; skip the slow Google Fonts @import there
  if (process.env.LOCAL_FONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file:///' + path.resolve(file).replace(/\\/g, '/') + (query ? '?' + query : ''), { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  // wait until every <video> has data, so seek(t) can decode frames
  await page.evaluate(() => Promise.all([...document.querySelectorAll('video')].map(v =>
    v.readyState >= 2 ? 0 : new Promise(r => v.addEventListener('loadeddata', r, { once: true })))));
  await page.waitForTimeout(600);
  if (mode === 'shots') {
    fs.mkdirSync(out, { recursive: true });
    const els = await page.$$(a || '.slide');
    for (let i = 0; i < els.length; i++) {
      const f = path.join(out, `${b || 'slide'}-${String(i + 1).padStart(2, '0')}.png`);
      await els[i].screenshot({ path: f, timeout: 15000 }).catch(async () => {
        // element never settles (e.g. a bidi reflow loop): clip the page at its box instead
        const r = await els[i].evaluate(e => { const b = e.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height }; });
        await page.screenshot({ path: f, clip: r, fullPage: true });
      });
      console.log(f);
    }
  } else if (mode === 'layers') {
    // full PNG, background-only PNG, and text boxes (data-edit) as JSON for the PPTX builder
    const el = await page.$(a || '#post');
    fs.mkdirSync(out, { recursive: true });
    await el.screenshot({ path: path.join(out, 'post.png') });
    const boxes = await page.evaluate(sel => {
      const root = document.querySelector(sel).getBoundingClientRect();
      return [...document.querySelectorAll(sel + ' [data-edit]')].map(n => {
        const r = n.getBoundingClientRect(), cs = getComputedStyle(n);
        const runs = [];
        n.childNodes.forEach(c => {
          const t = c.textContent;
          if (!t) return;
          runs.push({ text: t, color: c.nodeType === 1 ? getComputedStyle(c).color : cs.color });
        });
        return { x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height, size: parseFloat(cs.fontSize),
          weight: cs.fontWeight, lineHeight: cs.lineHeight, spacing: cs.letterSpacing, upper: cs.textTransform === 'uppercase',
          color: cs.color, border: cs.borderTopStyle, borderColor: cs.borderTopColor, radius: parseFloat(cs.borderTopLeftRadius) || 0,
          bg: cs.backgroundColor, rtl: cs.direction === 'rtl', font: cs.fontFamily.split(',')[0].replace(/['"]/g, ''), runs };
      });
    }, a || '#post');
    fs.writeFileSync(path.join(out, 'text-boxes.json'), JSON.stringify(boxes, null, 1));
    await page.evaluate(() => document.body.classList.add('notext'));
    await el.screenshot({ path: path.join(out, 'background.png') });
    console.log(boxes.length, 'text boxes');
  } else if (mode === 'stills') {
    // node render.js stills <html> <outDir> 2,6.5,12
    fs.mkdirSync(out, { recursive: true });
    const stage = await page.$('#stage');
    for (const t of a.split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), t);
      await stage.screenshot({ path: path.join(out, `t${t}.png`) });
    }
  } else if (mode === 'video') {
    const secs = parseFloat(a), fps = parseInt(b || '30');
    const stage = await page.$('#stage');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.round(secs * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.seek(t), i / fps);
      // fixed page region (no element-stability wait), retried once on a transient timeout
      const clip = await stage.boundingBox();
      let buf;
      try { buf = await page.screenshot({ type: 'png', clip, timeout: 60000 }); }
      catch (e) { await page.waitForTimeout(500); buf = await page.screenshot({ type: 'png', clip, timeout: 60000 }); }
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`frame ${i}/${n}`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('wrote', out);
  }
  await browser.close();
})();
