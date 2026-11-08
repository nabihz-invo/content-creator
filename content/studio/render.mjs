#!/usr/bin/env node
/**
 * Stacko Motion renderer — frame-exact capture of an HTML reel/carousel → MP4 / PNG.
 *
  *   node studio/render.mjs posts/2026-11/NOV-01_see-all-warehouses/reel.html              → <ID>.mp4 next to it
 *   node studio/render.mjs <page.html> --preview            contact sheet (preview.png) — check before rendering video
 *   node studio/render.mjs <page.html> --still 2.4          one frame → still-2.4.png
 *   node studio/render.mjs <page.html> --stills             carousel slides / named stills → slide-01.png …
 *   node studio/render.mjs <page.html> --cover              cover frame (R.cover(t)) → cover.png
 *   node studio/render.mjs --serve                          preview server: open http://localhost:4173/<path>
 *   options: --out file.mp4  --fps 30  --crf 18  --from 0 --to 5  --scale 0.5 (draft)  --no-audio  --quality best
 *   --lang en | ar | all   language version: the page reads SM.lang; every output gets _EN / _AR in its name; 'all' renders both
 *
 * Needs: npm install (playwright + ffmpeg-static), npx playwright install chromium. Uses system ffmpeg if ffmpeg-static is missing.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf('--' + k); if (i < 0) return d; const v = args[i + 1]; return v && !v.startsWith('--') ? v : true; };
const page = args.find(a => !a.startsWith('--') && /\.html?$/i.test(a));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.txt': 'text/plain' };
function serve(port = 0) {
  const srv = http.createServer((req, res) => {
    try {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname); const p = path.join(ROOT, u);
      if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      let f = p; if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found: ' + u); }
      const st = fs.statSync(f), type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
      if (range) { const m = /bytes=(\d*)-(\d*)/.exec(range); const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : st.size - 1; res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1, 'Cache-Control': 'no-store' }); fs.createReadStream(f, { start: a, end: b }).pipe(res); }
      else { res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res); }
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r(srv)));
}
async function ffmpegPath() { try { const m = await import('ffmpeg-static'); if (m.default && fs.existsSync(m.default)) return m.default; } catch (e) { } return 'ffmpeg'; }
const findAudio = (base) => { for (const ext of ['.mp3', '.wav', '.m4a', '.ogg']) { const f = path.join(ROOT, 'assets/audio/sfx', base + ext); if (fs.existsSync(f)) return f; } return null; };
const rootPath = u => u && u.startsWith('/') ? path.join(ROOT, u) : u ? path.resolve(path.dirname(path.join(ROOT, rel)), u) : null;
let rel = '';

async function main() {
  const L = flag('lang');
  if (!flag('serve') && page && (L === 'all' || L === 'both')) { for (const l of ['en', 'ar']) await run(l); return; }
  return run(typeof L === 'string' ? L.toLowerCase() : null);
}
async function run(lang) {
  const SX = lang ? '_' + lang.toUpperCase() : '';
  if (flag('serve')) { const srv = await serve(+flag('port', 4173)); console.log(`Preview server: http://localhost:${srv.address().port}/  (open a reel.html path, e.g. /studio/examples/demo-1-map-comes-alive.html)`); return; }
  if (!page) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 16).join('\n')); process.exit(1); }
  const abs = path.resolve(page); rel = path.relative(ROOT, abs).split(path.sep).join('/');
  if (rel.startsWith('..')) throw new Error('The page must be inside the content folder: ' + ROOT);
  const srv = await serve(); const url = `http://127.0.0.1:${srv.address().port}/${rel}?render=1${lang ? '&lang=' + lang : ''}`; if (lang) console.log(`— ${lang.toUpperCase()} version —`);
  let chromium; try { ({ chromium } = await import('playwright')); } catch (e) { throw new Error('Playwright missing: run "npm install" inside studio/ and "npx playwright install chromium"'); }
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync', '--font-render-hinting=none'] });
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = []; pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForFunction(() => window.SM_READY, null, { timeout: 30000 }).catch(() => { });
  await pg.evaluate(() => window.SM_READY);
  if (errors.length) { console.error('Page errors:\n  ' + errors.join('\n  ')); }
  const meta = await pg.evaluate(() => window.SM_META());
  const scale = +flag('scale', 1); await pg.setViewportSize({ width: meta.w, height: meta.h });
  if (scale !== 1) await pg.evaluate(k => { document.querySelector('.sm-stage').style.transform = `scale(${k})`; }, scale);
  const W = Math.round(meta.w * scale), H = Math.round(meta.h * scale); await pg.setViewportSize({ width: W, height: H });
  const dir = path.dirname(abs), pageName = path.basename(abs, '.html'), base = ['reel', 'index', 'carousel', 'story'].includes(pageName) ? (path.basename(dir).split('_')[0] || 'out') + (pageName === 'reel' || pageName === 'index' ? '' : '-' + pageName) : pageName;
  const shot = async (t, file, type = 'png') => { await pg.evaluate(t => window.SM_SEEK(t), t); return pg.screenshot({ path: file, type, clip: { x: 0, y: 0, width: W, height: H }, ...(type === 'jpeg' ? { quality: 95 } : {}) }); };

  if (flag('still') !== undefined) { const t = +flag('still'); const f = path.join(dir, `still-${t}${SX}.png`); await shot(t, f); console.log('saved', path.relative(ROOT, f)); }
  else if (flag('cover')) { const t = meta.cover ?? Math.min(1.5, meta.duration / 2); const f = path.join(dir, `cover${SX}.png`); await shot(t, f); console.log('saved', path.relative(ROOT, f)); }
  else if (flag('stills')) { const list = meta.stills.length ? meta.stills : [{ name: 'still', t: meta.duration - .05 }]; for (const s of list) { const f = path.join(dir, `${s.name}${SX}.png`); await shot(s.t, f); console.log('saved', path.relative(ROOT, f)); } }
  else if (flag('preview')) {
    const n = Math.min(24, Math.max(8, Math.round(meta.duration / .6))), shots = [];
    for (let i = 0; i < n; i++) { const t = meta.duration * (i + .5) / n; const b = await shot(t, undefined, 'jpeg'); shots.push({ t, d: 'data:image/jpeg;base64,' + b.toString('base64') }); }
    const cols = meta.w > meta.h ? 4 : 6, tw = meta.w > meta.h ? 420 : 240, th = Math.round(tw * meta.h / meta.w);
    const p2 = await browser.newPage({ viewport: { width: cols * (tw + 12) + 12, height: 400 } });
    await p2.setContent(`<body style="margin:0;padding:12px;background:#0B1422;font:13px sans-serif;color:#C9D8E4"><div style="margin-bottom:8px">${meta.title}${lang ? ' · ' + lang.toUpperCase() : ''} · ${meta.duration.toFixed(1)}s · ${meta.w}×${meta.h} · ${meta.sfx.length} sfx cues${meta.audio ? ' · audio: ' + [meta.audio.voice && 'voice', meta.audio.music && 'music'].filter(Boolean).join('+') : ' · no voice/music set'}</div><div style="display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:12px">${shots.map(s => `<div><img src="${s.d}" style="width:${tw}px;height:${th}px;display:block;border-radius:6px"><div style="margin-top:3px">${s.t.toFixed(2)}s</div></div>`).join('')}</div></body>`);
    const f = path.join(dir, `${['reel', 'index', 'carousel', 'story', 'static'].includes(pageName) ? '' : pageName + '-'}preview${SX}.png`); await p2.screenshot({ path: f, fullPage: true }); console.log('saved', path.relative(ROOT, f));
  } else {
    const fps = +flag('fps', meta.fps), from = +flag('from', 0), to = +flag('to', meta.duration), N = Math.max(1, Math.round((to - from) * fps));
    const out = flag('out') ? path.resolve(flag('out')) : path.join(dir, `${base}${SX}.mp4`);
    const ff = await ffmpegPath(), inputs = ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'], filters = [], mixes = []; let ai = 1;
    const A = meta.audio || {};
    if (!flag('no-audio')) {
      const voice = rootPath(A.voice), music = rootPath(A.music);
      if (voice && fs.existsSync(voice)) { inputs.push('-i', voice); const ms = Math.round(((A.voiceAt || 0) - from) * 1000); filters.push(`[${ai}:a]${ms > 0 ? `adelay=${ms}|${ms},` : ms < 0 ? `atrim=start=${-ms / 1000},asetpts=PTS-STARTPTS,` : ''}volume=${A.voiceVolume ?? 1},aresample=48000[v0]`); mixes.push('v'); ai++; }
      if (music && fs.existsSync(music)) { inputs.push('-stream_loop', '-1', '-i', music); const fo = A.fadeOut ?? 1.2; filters.push(`[${ai}:a]atrim=start=${A.musicStart || 0},asetpts=PTS-STARTPTS,atrim=duration=${to - from},volume=${A.musicVolume ?? .18},afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, to - from - fo)}:d=${fo},aresample=48000[m0]`); if (mixes.includes('v') && A.duck !== false) { filters.push('[v0]asplit=2[v][vk]', '[m0][vk]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=350[m]'); } else filters.push('[m0]anull[m]'); mixes.push('m'); ai++; }
      if (mixes.includes('v') && !filters.some(f => f.includes('[v0]asplit'))) filters.push('[v0]anull[v]');
      let k = 0; for (const c of meta.sfx) { if (c.t < from || c.t > to) continue; const f = findAudio(c.name); if (!f) continue; inputs.push('-i', f); const ms = Math.round((c.t - from) * 1000); filters.push(`[${ai}:a]adelay=${ms}|${ms},volume=${(c.vol ?? 1) * (A.sfxVolume ?? .55)},aresample=48000[s${k}]`); mixes.push('s' + k); ai++; k++; }
      const missing = [...new Set(meta.sfx.map(c => c.name).filter(n => !findAudio(n)))]; if (missing.length) console.log('note: no sound file for sfx cues: ' + missing.join(', ') + '  (add assets/audio/sfx/<name>.mp3 to hear them)');
    }
    const outArgs = ['-map', '0:v'];
    if (mixes.length) { filters.push(`${mixes.map(m => `[${m}]`).join('')}amix=inputs=${mixes.length}:normalize=0:dropout_transition=0,loudnorm=I=${A.lufs ?? -16}:TP=-1.5:LRA=11,alimiter=limit=0.95,atrim=duration=${to - from}[aout]`); outArgs.push('-filter_complex', filters.join(';'), '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k'); }
    const best = flag('quality') === 'best';
    outArgs.push('-c:v', 'libx264', '-preset', best ? 'slow' : 'veryfast', '-crf', String(flag('crf', best ? 16 : 19)), '-maxrate', best ? '30M' : '16M', '-bufsize', best ? '60M' : '32M', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', '-t', String(to - from), out);
    const proc = spawn(ff, [...inputs, ...outArgs], { stdio: ['pipe', 'ignore', 'pipe'] }); let ferr = ''; proc.stderr.on('data', d => { ferr += d; if (ferr.length > 20000) ferr = ferr.slice(-20000); });
    const done = new Promise((res, rej) => proc.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg failed:\n' + ferr.slice(-3000)))));
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      const t = from + i / fps; await pg.evaluate(t => window.SM_SEEK(t), t);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: W, height: H } });
      if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
      if (i % fps === 0) process.stdout.write(`\r  frame ${i}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    proc.stdin.end(); await done; console.log(`\nsaved ${path.relative(ROOT, out)}  (${N} frames, ${(to - from).toFixed(2)}s, ${mixes.length ? mixes.length + ' audio tracks' : 'no audio'})`);
  }
  if (errors.length) console.error(`⚠ ${errors.length} page error(s) — see above`);
  await browser.close(); srv.close();
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
