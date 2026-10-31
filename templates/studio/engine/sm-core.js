/*! Stacko Motion — core (timeline, scenes, transitions, text effects, camera, overlays, player)
 *  Every frame is a pure function of time: R.seek(t) sets the whole stage, so render.mjs can step
 *  frame by frame and get identical results every time. Load order on a page:
 *    /assets/map-elements/stacko-map-elements.js  →  sm-core.js  →  sm-components.js  →  sm-app.js
 *  Docs: /studio/docs/ENGINE.md
 */
(function (G) {
  'use strict';
  const SM = G.SM = G.SM || {};
  SM.version = '1.1.0';
  SM.assets = '/assets';

  /* ------------------------------------------------------------------ language versions
   * Every post is rendered twice: an English version and an Arabic version — never both languages in one frame.
   * The page reads the version from the URL (?lang=ar, set by `render.mjs --lang ar`) and every string is written
   * once for each language with SM.t('English', 'عربي'). Text in Arabic script is detected automatically. */
  SM.lang = (() => { try { const q = new URLSearchParams(G.location ? G.location.search : '').get('lang'); return (q || 'en').toLowerCase() === 'ar' ? 'ar' : 'en'; } catch (e) { return 'en'; } })();
  SM.isAr = str => /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(String(str || ''));
  SM.t = (en, ar) => (en && typeof en === 'object' && !Array.isArray(en)) ? (en[SM.lang] ?? en.en) : (SM.lang === 'ar' ? (ar ?? en) : en);
  SM.ar = () => SM.lang === 'ar';

  /* ------------------------------------------------------------------ tokens */
  const C = SM.C = {
    abyss: '#0E2440', night: '#1B416B', signal: '#0895A6', glow: '#2EF2EE', ocean: '#2F86B8', dolphin: '#79C0DE',
    deep: '#2C5974', visor: '#C9D8E4', foam: '#EEF6F9', paper: '#F4F8FA', white: '#FFFFFF', ok: '#BCE5E0', low: '#F0AAAA',
    red: '#C2334A', sea: '#DCEBF1', land: '#E7EDF1', ink: '#07162A',
  };
  SM.NIGHT = 'radial-gradient(120% 90% at 30% 35%, #1B416B 0%, #0E2440 62%)';

  /* ------------------------------------------------------------------ math */
  const clamp = SM.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = SM.lerp = (a, b, p) => a + (b - a) * p;
  SM.rng = function (seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const noise = SM.noise = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const E = SM.ease = {
    linear: p => p,
    inQuad: p => p * p, outQuad: p => 1 - (1 - p) * (1 - p), inOutQuad: p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
    inCubic: p => p * p * p, outCubic: p => 1 - Math.pow(1 - p, 3), inOutCubic: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    outQuart: p => 1 - Math.pow(1 - p, 4), inQuart: p => p * p * p * p, inOutQuart: p => p < .5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2,
    outExpo: p => p === 1 ? 1 : 1 - Math.pow(2, -10 * p), inExpo: p => p === 0 ? 0 : Math.pow(2, 10 * p - 10),
    inOutExpo: p => p === 0 ? 0 : p === 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    outBack: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    outBackSoft: p => { const c1 = .9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    inBack: p => { const c1 = 1.70158, c3 = c1 + 1; return c3 * p * p * p - c1 * p * p; },
    outElastic: p => { const c4 = (2 * Math.PI) / 3; return p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * c4) + 1; },
    outBounce: p => { const n1 = 7.5625, d1 = 2.75; if (p < 1 / d1) return n1 * p * p; if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + .75; if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + .9375; return n1 * (p -= 2.625 / d1) * p + .984375; },
    spring: p => 1 - Math.cos(p * Math.PI * 2.4) * Math.exp(-p * 6.5),
    step: p => p < 1 ? 0 : 1,
  };
  const ease = SM.easeFn = e => typeof e === 'function' ? e : (E[e] || E.outCubic);

  /* ------------------------------------------------------------------ DOM helpers */
  const mk = SM.el = function (tag, cls, parent, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  const esc = SM.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f2 = n => Math.round(n * 100) / 100;
  const isImg = s => /\.(png|jpe?g|webp|avif|gif|svg)(\?.*)?$/i.test(s || '');
  const isVid = s => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(s || '');

  /* ------------------------------------------------------------------ logo data (Dot core mark) */
  SM.DOTS = [[18.43,42.86,1.31,"l"],[18.43,49.71,1.38,"l"],[18.43,56.57,1.42,"l"],[18.43,63.43,1.42,"l"],[18.43,70.29,1.38,"l"],[18.43,77.14,1.31,"l"],[18.43,84.0,1.2,"l"],[24.37,32.57,1.31,"t"],[24.37,46.29,1.55,"l"],[24.37,53.14,1.61,"l"],[24.37,60.0,1.64,"l"],[24.37,66.86,1.61,"l"],[24.37,73.71,1.55,"l"],[24.37,80.57,1.44,"l"],[24.37,87.43,1.31,"l"],[30.31,29.14,1.38,"t"],[30.31,36.0,1.55,"t"],[30.31,49.71,1.79,"l"],[30.31,56.57,1.84,"l"],[30.31,63.43,1.84,"l"],[30.31,70.29,1.79,"l"],[30.31,77.14,1.69,"l"],[30.31,84.0,1.55,"l"],[30.31,90.86,1.38,"l"],[36.25,25.71,1.42,"t"],[36.25,32.57,1.61,"t"],[36.25,39.43,1.79,"t"],[36.25,53.14,2.02,"l"],[36.25,60.0,2.06,"l"],[36.25,66.86,2.02,"l"],[36.25,73.71,1.93,"l"],[36.25,80.57,1.79,"l"],[36.25,87.43,1.61,"l"],[36.25,94.29,1.42,"l"],[42.18,22.29,1.42,"t"],[42.18,29.14,1.64,"t"],[42.18,36.0,1.84,"t"],[42.18,42.86,2.02,"t"],[42.18,56.57,2.26,"l"],[42.18,63.43,2.26,"l"],[42.18,70.29,2.17,"l"],[42.18,77.14,2.02,"l"],[42.18,84.0,1.84,"l"],[42.18,90.86,1.64,"l"],[42.18,97.71,1.42,"l"],[48.12,18.86,1.38,"t"],[48.12,25.71,1.61,"t"],[48.12,32.57,1.84,"t"],[48.12,39.43,2.06,"t"],[48.12,46.29,2.26,"t"],[48.12,60.0,2.48,"l"],[48.12,66.86,2.41,"l"],[48.12,73.71,2.26,"l"],[48.12,80.57,2.06,"l"],[48.12,87.43,1.84,"l"],[48.12,94.29,1.61,"l"],[48.12,101.14,1.38,"l"],[54.06,15.43,1.31,"t"],[54.06,22.29,1.55,"t"],[54.06,29.14,1.79,"t"],[54.06,36.0,2.02,"t"],[54.06,42.86,2.26,"t"],[54.06,49.71,2.48,"t"],[54.06,63.43,2.66,"l"],[54.06,70.29,2.48,"l"],[54.06,77.14,2.26,"l"],[54.06,84.0,2.02,"l"],[54.06,90.86,1.79,"l"],[54.06,97.71,1.55,"l"],[54.06,104.57,1.31,"l"],[60.0,12.0,1.2,"t"],[60.0,18.86,1.44,"t"],[60.0,25.71,1.69,"t"],[60.0,32.57,1.93,"t"],[60.0,39.43,2.17,"t"],[60.0,46.29,2.41,"t"],[60.0,53.14,2.66,"t"],[65.94,15.43,1.31,"t"],[65.94,22.29,1.55,"t"],[65.94,29.14,1.79,"t"],[65.94,36.0,2.02,"t"],[65.94,42.86,2.26,"t"],[65.94,49.71,2.48,"t"],[65.94,63.43,2.66,"r"],[65.94,70.29,2.48,"r"],[65.94,77.14,2.26,"r"],[65.94,84.0,2.02,"r"],[65.94,90.86,1.79,"r"],[65.94,97.71,1.55,"r"],[65.94,104.57,1.31,"r"],[71.88,18.86,1.38,"t"],[71.88,25.71,1.61,"t"],[71.88,32.57,1.84,"t"],[71.88,39.43,2.06,"t"],[71.88,46.29,2.26,"t"],[71.88,60.0,2.48,"r"],[71.88,66.86,2.41,"r"],[71.88,73.71,2.26,"r"],[71.88,80.57,2.06,"r"],[71.88,87.43,1.84,"r"],[71.88,94.29,1.61,"r"],[71.88,101.14,1.38,"r"],[77.82,22.29,1.42,"t"],[77.82,29.14,1.64,"t"],[77.82,36.0,1.84,"t"],[77.82,42.86,2.02,"t"],[77.82,56.57,2.26,"r"],[77.82,63.43,2.26,"r"],[77.82,70.29,2.17,"r"],[77.82,77.14,2.02,"r"],[77.82,84.0,1.84,"r"],[77.82,90.86,1.64,"r"],[77.82,97.71,1.42,"r"],[83.75,25.71,1.42,"t"],[83.75,32.57,1.61,"t"],[83.75,39.43,1.79,"t"],[83.75,53.14,2.02,"r"],[83.75,60.0,2.06,"r"],[83.75,66.86,2.02,"r"],[83.75,73.71,1.93,"r"],[83.75,80.57,1.79,"r"],[83.75,87.43,1.61,"r"],[83.75,94.29,1.42,"r"],[89.69,29.14,1.38,"t"],[89.69,36.0,1.55,"t"],[89.69,49.71,1.79,"r"],[89.69,56.57,1.84,"r"],[89.69,63.43,1.84,"r"],[89.69,70.29,1.79,"r"],[89.69,77.14,1.69,"r"],[89.69,84.0,1.55,"r"],[89.69,90.86,1.38,"r"],[95.63,32.57,1.31,"t"],[95.63,46.29,1.55,"r"],[95.63,53.14,1.61,"r"],[95.63,60.0,1.64,"r"],[95.63,66.86,1.61,"r"],[95.63,73.71,1.55,"r"],[95.63,80.57,1.44,"r"],[95.63,87.43,1.31,"r"],[101.57,42.86,1.31,"r"],[101.57,49.71,1.38,"r"],[101.57,56.57,1.42,"r"],[101.57,63.43,1.42,"r"],[101.57,70.29,1.38,"r"],[101.57,77.14,1.31,"r"],[101.57,84.0,1.2,"r"],[60.0,60.0,3.6,"c"]].filter(d => d[3] !== 'c');
  const MARKC = SM.MARKC = {
    dark: { t: '#2EF2EE', l: '#79C0DE', r: '#2F86B8', c: '#FFFFFF', g: .55 },
    light: { t: '#0895A6', l: '#2F86B8', r: '#0E2440', c: '#0895A6', g: .55 },
    white: { t: '#FFFFFF', l: '#FFFFFF', r: '#FFFFFF', c: '#FFFFFF', g: 0 },
    navy: { t: '#0E2440', l: '#0E2440', r: '#0E2440', c: '#0E2440', g: 0 },
  };
  let markUid = 0;
  /** SVG string of the Dot core mark. variant: dark | light | white | navy */
  SM.mark = function (variant = 'dark', size = 120) {
    const k = MARKC[variant] || MARKC.dark, id = 'smg' + (markUid++);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}"><defs><filter id="${id}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter></defs>` +
      (k.g ? `<circle cx="60" cy="60" r="11" fill="${k.c}" opacity="${k.g}" filter="url(#${id})"/>` : '') +
      SM.DOTS.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k[c]}" stroke="${k[c]}" stroke-width=".9"/>`).join('') +
      `<circle cx="60" cy="60" r="3.6" fill="${k.c}"/></svg>`;
  };
  /** HTML wordmark "stacko" with the teal o */
  SM.wordmark = (theme = 'dark') => `<span class="sm-word ${theme}">stack<i>o</i></span>`;
  SM.wordmarkAr = (theme = 'dark') => `<span class="sm-word-ar ${theme}">ستاك<i>و</i></span>`;
  SM.endorse = (theme = 'dark') => `<span class="sm-endorse ${theme}">A product by <b><span>AI</span>PHIN</b></span>`;

  /* ------------------------------------------------------------------ CSS */
  const FONT = (fam, file, w, range) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;font-display:block;src:url(${SM.assets}/brand/fonts/${file}) format('woff2')${range ? ';unicode-range:' + range : ''}}`;
  const LAT = 'U+0000-024F,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2215,U+2713-2715,U+FEFF,U+FFFD';
  const ARA = 'U+0600-06FF,U+0750-077F,U+0870-08FF,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E';
  const CSS = [
    ...[300, 400, 500, 600, 700].map(w => FONT('Readex Pro', `readex-pro-latin-${w}-normal.woff2`, w, LAT)),
    ...[400, 500, 600, 700].map(w => FONT('Readex Pro', `readex-pro-arabic-${w}-normal.woff2`, w, ARA)),
    FONT('Noto Kufi Arabic', 'noto-kufi-arabic-arabic-500-normal.woff2', 500), FONT('Noto Kufi Arabic', 'noto-kufi-arabic-arabic-700-normal.woff2', 700),
    FONT('Audiowide', 'audiowide-latin-400-normal.woff2', 400),
    FONT('Caveat', 'caveat-latin-600-normal.woff2', 600), FONT('Caveat', 'caveat-latin-700-normal.woff2', 700),
    `html,body{margin:0;padding:0;background:#050D18}
#sm-root{position:fixed;inset:0;overflow:hidden;background:#050D18}
body.sm-render #sm-root{position:absolute;left:0;top:0;right:auto;bottom:auto}
.sm-stage{position:absolute;left:0;top:0;overflow:hidden;transform-origin:0 0;font-family:'Readex Pro',system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;contain:strict}
.sm-scenes,.sm-over{position:absolute;inset:0}
.sm-over{pointer-events:none;z-index:1000}
.sm-scene{position:absolute;inset:0;overflow:hidden}
.sm-layer{position:absolute;left:0;top:0;width:0;height:0}
.sm-fill{position:absolute;inset:0}
.sm-bgwrap{position:absolute;inset:0;overflow:hidden}
.sm-bg{position:absolute;inset:0}
.sm-bg>img,.sm-bg>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sm-text{position:absolute;left:0;top:0;width:max-content;font-weight:600;line-height:1.06;letter-spacing:-.028em;overflow-wrap:break-word;white-space:normal}
.sm-text .w{display:inline-block;vertical-align:top;white-space:nowrap}
.sm-text.mask .w{overflow:hidden;padding:0 .04em .14em;margin:0 -.04em -.14em}
.sm-text .wi{display:inline-block;position:relative}
.sm-text .wi.has-mk{z-index:0}
.sm-text .ch{display:inline-block;white-space:pre}
.sm-text .hl{color:var(--hl)}
.sm-text .mk{position:absolute;left:-.1em;right:-.1em;top:.1em;bottom:.02em;background:var(--mk);z-index:-1;border-radius:.1em;transform-origin:0 50%}
.sm-text .ul{position:absolute;left:-.04em;right:-.04em;bottom:-.16em;height:.32em;overflow:visible}
.sm-text .st{position:absolute;left:-.06em;right:-.06em;top:52%;height:.1em;background:var(--st);transform-origin:0 50%;border-radius:.05em}
.sm-text.ar{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;direction:rtl;letter-spacing:0;line-height:1.42}
.sm-text.hand{font-family:'Caveat',cursive;font-weight:700;letter-spacing:0;line-height:1.05}
.sm-text.pill{background:rgba(14,36,64,.92);padding:.22em .5em .3em;border-radius:.38em}
.sm-text.card{background:#fff;color:#0E2440;padding:.3em .55em .38em;border-radius:.34em;box-shadow:0 18px 50px rgba(5,13,24,.28)}
.sm-text.glass{background:rgba(14,36,64,.55);backdrop-filter:blur(14px);padding:.28em .55em .34em;border-radius:.34em;border:1px solid rgba(201,216,228,.25)}
.sm-text.shadow{text-shadow:0 3px 22px rgba(5,13,24,.65),0 1px 3px rgba(5,13,24,.5)}
.sm-text.outline{-webkit-text-stroke:2px currentColor;color:transparent!important}
.sm-text .caret{display:inline-block;width:.06em;height:.9em;margin-left:.04em;vertical-align:-.08em;background:currentColor}
.sm-word-ar{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;line-height:1.2;white-space:nowrap;direction:rtl}.sm-word-ar.dark{color:#fff}.sm-word-ar.light{color:#0E2440}.sm-word-ar i{font-style:normal;color:#2EF2EE}.sm-word-ar.light i{color:#0895A6}
.sm-word{font-family:'Readex Pro',sans-serif;font-weight:600;letter-spacing:-.045em;line-height:.95;white-space:nowrap}
.sm-word.dark{color:#fff}.sm-word.dark i{color:#2EF2EE;font-style:normal}
.sm-word.light{color:#0E2440}.sm-word.light i{color:#0895A6;font-style:normal}
.sm-endorse{font-family:'Readex Pro',sans-serif;font-weight:400;white-space:nowrap}
.sm-endorse b{font-family:'Audiowide',sans-serif;font-weight:400;letter-spacing:.05em;margin-left:.3em;font-size:1.35em}
.sm-endorse.dark{color:#C9D8E4}.sm-endorse.dark b{color:#fff}.sm-endorse.dark b span{color:#2EF2EE}
.sm-endorse.light{color:#2C5974}.sm-endorse.light b{color:#0E2440}.sm-endorse.light b span{color:#0895A6}
.sm-badge{position:absolute;display:flex;align-items:center;gap:12px;font-size:25px;font-weight:600;letter-spacing:.01em;padding:11px 20px 12px 16px;border-radius:999px;background:rgba(14,36,64,.82);color:#fff;border:1px solid rgba(201,216,228,.28);backdrop-filter:blur(8px);white-space:nowrap}
.sm-badge i{width:12px;height:12px;border-radius:50%;background:#2EF2EE;box-shadow:0 0 12px #2EF2EE}
.sm-badge.ar{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;direction:rtl}
.sm-badge.light{background:rgba(255,255,255,.92);color:#0E2440;border-color:#C9D8E4}.sm-badge.light i{background:#0895A6;box-shadow:none}
.sm-img{position:absolute;left:0;top:0;overflow:hidden}
.sm-img>img,.sm-img>video{width:100%;height:100%;object-fit:cover;display:block}
.sm-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 52%,rgba(3,9,18,.55) 100%)}
.sm-grain{position:absolute;inset:-64px;mix-blend-mode:overlay;background-repeat:repeat}
.sm-progress{position:absolute;left:28px;right:28px;top:22px;height:6px;border-radius:3px;background:rgba(255,255,255,.22);overflow:hidden}
.sm-progress i{position:absolute;left:0;top:0;bottom:0;background:#fff;border-radius:3px}
.sm-player{position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;align-items:center;gap:12px;padding:0 16px;background:#0B1422;color:#C9D8E4;font:13px 'Readex Pro',system-ui,sans-serif;z-index:99999;border-top:1px solid #1B2A40}
.sm-player button{background:#14243A;border:1px solid #23395A;color:#fff;border-radius:8px;height:34px;min-width:40px;padding:0 10px;font:600 13px 'Readex Pro',sans-serif;cursor:pointer}
.sm-player input[type=range]{flex:1;accent-color:#2EF2EE}
.sm-player .tm{font-variant-numeric:tabular-nums;min-width:118px;text-align:right}
.sm-safe{position:absolute;inset:0;pointer-events:none;z-index:2000}
.sm-safe div{position:absolute;background:rgba(255,40,80,.18);border:1px dashed rgba(255,80,120,.7)}`,
  ].join('\n');
  function injectCSS() { if (document.getElementById('sm-css')) return; const s = document.createElement('style'); s.id = 'sm-css'; s.textContent = CSS + '\n' + (SM._extraCSS || []).join('\n'); document.head.appendChild(s); }
  SM.injectCSS = injectCSS;
  SM.addCSS = css => { (SM._extraCSS = SM._extraCSS || []).push(css); const s = document.getElementById('sm-css'); if (s) s.textContent += '\n' + css; };

  /* ------------------------------------------------------------------ animatable props */
  const DEF = { x: 0, y: 0, z: 0, s: 1, sx: 1, sy: 1, r: 0, rx: 0, ry: 0, skx: 0, o: 1, blur: 0, br: 1, sat: 1, hue: 0, cp: 1, persp: 0 };
  const PROPS = Object.keys(DEF);
  const ALIAS = { scale: 's', rot: 'r', rotate: 'r', opacity: 'o', alpha: 'o', scaleX: 'sx', scaleY: 'sy', rotX: 'rx', rotY: 'ry', brightness: 'br', saturate: 'sat', clip: 'cp' };
  const al = k => ALIAS[k] || k;
  const TFK = new Set(['x', 'y', 'z', 's', 'sx', 'sy', 'r', 'rx', 'ry', 'skx', 'persp']), FFK = new Set(['blur', 'br', 'sat', 'hue']);
  const mark = (t, k) => { if (TFK.has(k)) t.tf = true; if (FFK.has(k)) t.ff = true; };
  function clipCSS(c, p) {
    p = clamp(p);
    switch (c.mode) {
      case 'left': return `inset(0 ${f2((1 - p) * 100)}% 0 0)`;
      case 'right': return `inset(0 0 0 ${f2((1 - p) * 100)}%)`;
      case 'up': return `inset(${f2((1 - p) * 100)}% 0 0 0)`;
      case 'down': return `inset(0 0 ${f2((1 - p) * 100)}% 0)`;
      case 'circle': return `circle(${f2(p * (c.r || 150))}% at ${c.cx ?? 50}% ${c.cy ?? 50}%)`;
      case 'diag': { const a = p * 220; return `polygon(0 0, ${f2(a)}% 0, ${f2(a - 120)}% 100%, 0 100%)`; }
      case 'diagR': { const a = 100 - p * 220; return `polygon(${f2(a + 120)}% 0, 100% 0, 100% 100%, ${f2(a)}% 100%)`; }
      case 'split': return `inset(0 ${f2((1 - p) * 50)}% 0 ${f2((1 - p) * 50)}%)`;
      case 'splitH': return `inset(${f2((1 - p) * 50)}% 0 ${f2((1 - p) * 50)}% 0)`;
      case 'round': return `inset(${f2((1 - p) * (c.t ?? 50))}% ${f2((1 - p) * (c.side ?? 50))}% ${f2((1 - p) * (c.b ?? 50))}% ${f2((1 - p) * (c.side ?? 50))}% round ${c.round ?? 40}px)`;
      default: return '';
    }
  }

  /* ------------------------------------------------------------------ Reel */
  class Reel {
    constructor(o = {}) {
      this.w = o.w || 1080; this.h = o.h || 1920; this.fps = o.fps || 30; this.theme = o.theme || 'dark';
      this.kind = o.kind || 'reel'; this.title = o.title || document.title || 'reel';
      if (o.lang) SM.lang = o.lang === 'ar' ? 'ar' : 'en'; this.lang = SM.lang;
      this.transitionSfx = !!o.transitionSfx;   // transitions are silent by default (no whoosh between scenes)
      this.render = /[?&]render=1/.test(location.search);
      this.scenes = []; this.cursor = 0; this.drivers = []; this.els = []; this.cues = []; this.fin = []; this.stillsList = []; this.vids = []; this.fits = []; this.stageFx = []; this.audioCfg = null; this.coverT = null;
      this._dur = o.duration || null; this.t = 0;
      injectCSS(); this._dom(o);
      G.SM_REEL = this; G.SM_SEEK = t => this.seekAsync(t); G.SM_META = () => this.meta();
      G.SM_READY = new Promise(res => (this._res = res));
      const go = () => setTimeout(() => this._ready(), 0);
      if (document.readyState === 'complete') go(); else G.addEventListener('load', go);
    }
    _dom(o) {
      if (this.render) document.body.classList.add('sm-render');
      const root = this.root = mk('div', '', document.body); root.id = 'sm-root'; if (this.render) { root.style.width = this.w + 'px'; root.style.height = this.h + 'px'; }
      const st = this.stage = mk('div', 'sm-stage', root); st.style.width = this.w + 'px'; st.style.height = this.h + 'px'; st.style.background = o.bg === 'paper' ? C.paper : (o.bg || SM.NIGHT);
      this.scenesEl = mk('div', 'sm-scenes', st); this.over = mk('div', 'sm-over', st);
      // shared symbol for <use href="#mark"> (app scenes)
      const sym = mk('div', '', document.body); sym.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      sym.innerHTML = `<svg width="0" height="0"><defs><filter id="mkGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter><symbol id="mark" viewBox="0 0 120 120"><circle cx="60" cy="60" r="11" fill="#fff" opacity=".55" filter="url(#mkGlow)"/>${SM.DOTS.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${MARKC.dark[c]}"/>`).join('')}<circle cx="60" cy="60" r="3.6" fill="#fff"/></symbol></defs></svg>`;
      this.driver(0, 1e9, () => this._stageFx());
    }
    get duration() { return this._dur || this.cursor || 1; }
    set duration(v) { this._dur = v; }

    /* --- tracks */
    _tr(e) { if (!e.__sm) { e.__sm = { base: {}, tw: {}, last: '', clip: null }; this.els.push(e); } return e.__sm; }
    set(e, props) { const t = this._tr(e); for (const k in props) { t.base[al(k)] = props[k]; mark(t, al(k)); } return this; }
    clip(e, mode, o = {}) { const t = this._tr(e); t.clip = Object.assign({ mode }, o); if (t.base.cp == null) t.base.cp = 1; return this; }
    anim(e, props, start, dur = .6, ez = 'outCubic') {
      if (!e) return this; const t = this._tr(e), f = ease(ez);
      for (const k0 in props) {
        const k = al(k0), v = props[k0]; let from, to; mark(t, k);
        if (Array.isArray(v)) { from = v[0]; to = v[1]; } else { to = v; const a = t.tw[k]; from = a && a.length ? a[a.length - 1].to : (t.base[k] != null ? t.base[k] : DEF[k]); }
        (t.tw[k] || (t.tw[k] = [])).push({ s: start, d: Math.max(1e-6, dur), from, to, f });
        t.tw[k].sort((a, b) => a.s - b.s);
      }
      return this;
    }
    driver(start, end, fn) { this.drivers.push({ s: start, e: end, fn }); return this; }
    _val(t, k, time) {
      const a = t.tw[k]; if (!a || !a.length) return t.base[k] != null ? t.base[k] : DEF[k];
      let tw = null; for (let i = a.length - 1; i >= 0; i--) if (a[i].s <= time) { tw = a[i]; break; }
      if (!tw) return a[0].from;
      const p = clamp((time - tw.s) / tw.d); return tw.from + (tw.to - tw.from) * tw.f(p);
    }
    _apply(e, time) {
      const t = e.__sm, v = {}; for (const k of PROPS) v[k] = this._val(t, k, time);
      let tr = '';
      if (v.persp) tr += `perspective(${f2(v.persp)}px) `;
      if (v.x || v.y || v.z) tr += `translate3d(${f2(v.x)}px,${f2(v.y)}px,${f2(v.z)}px) `;
      if (v.r) tr += `rotate(${f2(v.r)}deg) `;
      if (v.rx) tr += `rotateX(${f2(v.rx)}deg) `;
      if (v.ry) tr += `rotateY(${f2(v.ry)}deg) `;
      if (v.skx) tr += `skewX(${f2(v.skx)}deg) `;
      const sx = v.s * v.sx, sy = v.s * v.sy; if (Math.abs(sx - 1) > 1e-4 || Math.abs(sy - 1) > 1e-4) tr += `scale(${Math.round(sx * 10000) / 10000},${Math.round(sy * 10000) / 10000})`;
      let fl = ''; if (v.blur > .05) fl += `blur(${f2(v.blur)}px) `; if (Math.abs(v.br - 1) > .005) fl += `brightness(${f2(v.br)}) `; if (Math.abs(v.sat - 1) > .005) fl += `saturate(${f2(v.sat)}) `; if (Math.abs(v.hue) > .5) fl += `hue-rotate(${f2(v.hue)}deg)`;
      const op = Math.round(clamp(v.o) * 1000) / 1000, cp = t.clip ? clipCSS(t.clip, v.cp) : '';
      const key = tr + '|' + fl + '|' + op + '|' + cp;
      if (key !== t.last) { t.last = key; const s = e.style; if (t.tf) s.transform = tr; if (t.ff) s.filter = fl; s.opacity = op >= 1 ? '' : String(op); s.visibility = op <= .001 ? 'hidden' : ''; if (t.clip) s.clipPath = cp; }
    }

    /* --- scenes */
    scene(dur, o = {}) {
      const prev = this.scenes[this.scenes.length - 1];
      const sc = new Scene(this, this.cursor, dur, o, this.scenes.length);
      this.scenes.push(sc);
      if (prev) {
        const tr = o.in || 'cut', fn = TR[tr]; if (!fn) throw new Error('Unknown transition: ' + tr + '. Use one of ' + Object.keys(TR).join(', '));
        const d = tr === 'cut' ? 0 : (o.inDur != null ? o.inDur : (TRD[tr] || .5)), t0 = sc.start - d / 2;
        prev.visEnd = Math.max(prev.visEnd, sc.start + d / 2); sc.visStart = Math.min(sc.visStart, t0);
        this._muteSfx = !(o.trSfx ?? this.transitionSfx); const res = fn(this, prev, sc, t0, d, o.inOpts || {}) || {}; this._muteSfx = false;
        if (res.switchAt != null) { prev.visEnd = res.switchAt; sc.visStart = res.switchAt; }
        if (tr === 'cut') { prev.visEnd = sc.start; sc.visStart = sc.start; }
      }
      this.cursor += dur;
      if (o.bg != null) sc.bg(o.bg, o);
      return sc;
    }
    /** Group of scenes whose start is pulled back so they overlap the previous scene by `overlap` seconds (layered cuts). */
    hold(sec) { this.cursor += sec; return this; }

    /* --- seek */
    seek(time) {
      this.t = time; const last = this.scenes[this.scenes.length - 1];
      for (const s of this.scenes) { const vis = (time >= s.visStart - 1e-6 && time < s.visEnd - 1e-6) || (s === last && time >= s.visStart - 1e-6); const d = vis ? '' : 'none'; if (s.el.style.display !== d) s.el.style.display = d; }
      for (const d of this.drivers) { const p = d.e > d.s ? clamp((time - d.s) / (d.e - d.s)) : (time >= d.s ? 1 : 0); d.fn(p, time - d.s, time); }
      for (const e of this.els) this._apply(e, time);
    }
    async seekAsync(t) { this.seek(t); if (this.vids.length) await Promise.all(this.vids.map(v => v.sync(t))); }

    /* --- stage effects (shake, glitch, punch) composed on the scenes container */
    _stageFx() {
      let x = 0, y = 0, r = 0, s = 1, fl = '';
      for (const fx of this.stageFx) { const o = fx(this.t); if (!o) continue; x += o.x || 0; y += o.y || 0; r += o.r || 0; s *= o.s || 1; if (o.f) fl += o.f + ' '; }
      const tr = (x || y || r || s !== 1) ? `translate(${f2(x)}px,${f2(y)}px) rotate(${f2(r)}deg) scale(${Math.round(s * 1e4) / 1e4})` : '';
      if (this.scenesEl.style.transform !== tr) this.scenesEl.style.transform = tr;
      if (this.scenesEl.style.filter !== fl.trim()) this.scenesEl.style.filter = fl.trim();
    }
    shake(at, dur = .35, amp = 18) { this.stageFx.push(t => { const p = (t - at) / dur; if (p < 0 || p > 1) return null; const k = (1 - p) * amp, n = Math.floor(t * 60); return { x: (noise(n) - .5) * 2 * k, y: (noise(n + 7.1) - .5) * 2 * k, r: (noise(n + 3.3) - .5) * k * .06 }; }); return this; }
    punch(at, amt = .06, dur = .35) { this.stageFx.push(t => { const p = (t - at) / dur; if (p < 0 || p > 1) return null; return { s: 1 + amt * Math.sin(Math.PI * Math.min(1, p * 1.5)) * (1 - p) * 1.6 }; }); return this; }
    glitch(at, dur = .35, amp = 1) {
      this.stageFx.push(t => { const p = (t - at) / dur; if (p < 0 || p > 1) return null; const n = Math.floor(t * 24), k = amp * (1 - Math.abs(p - .5) * 1.2);
        return { x: (noise(n) - .5) * 70 * k, y: (noise(n + 2) - .5) * 14 * k, f: `drop-shadow(${f2(9 * k)}px 0 0 rgba(255,40,90,.75)) drop-shadow(${f2(-9 * k)}px 0 0 rgba(46,242,238,.75))` }; });
      const sl = mk('div', 'sm-fill', this.over); sl.style.background = 'repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 2px,transparent 2px 6px)'; sl.style.mixBlendMode = 'overlay';
      this.set(sl, { o: 0 }); this.anim(sl, { o: [0, 1] }, at, .01).anim(sl, { o: [1, 0] }, at + dur, .01);
      this.sfx('glitch', at); return this;
    }

    /* --- overlays */
    grain(op = .08, rate) {
      if (rate) this._grainRate = rate; const tiles = []; const r = SM.rng(9);
      for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'), d = x.createImageData(192, 192); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); tiles.push(c.toDataURL()); }
      const g = mk('div', 'sm-grain', this.over); g.style.opacity = op;
      // grain refreshes at 10 fps by default (film-like, and far smaller files than per-frame noise)
      let lastK = -1; const gr = this._grainRate || 10; this.driver(0, 1e9, (p, lt, t) => { const f = Math.floor(t * gr), k = f % 4; if (k !== lastK) { lastK = k; g.style.backgroundImage = `url(${tiles[k]})`; g.style.transform = `translate(${(f * 37) % 64}px,${(f * 53) % 64}px)`; } });
      return this;
    }
    vignette(op = 1) { const v = mk('div', 'sm-vignette', this.over); v.style.opacity = op; return this; }
    letterbox(px = 120, color = '#050D18') { ['top', 'bottom'].forEach(side => { const b = mk('div', '', this.over); b.style.cssText = `position:absolute;left:0;right:0;${side}:0;height:${px}px;background:${color}`; }); return this; }
    progress(o = {}) { const b = mk('div', 'sm-progress', this.over), i = mk('i', '', b); if (o.color) i.style.background = o.color; this.driver(0, 1e9, (p, lt, t) => { i.style.width = f2(clamp(t / this.duration) * 100) + '%'; }); return this; }
    watermark(o = {}) {
      const size = o.size || 72, pos = o.pos || 'tr', m = mk('div', '', this.over, SM.mark(o.variant || 'white', size));
      m.style.cssText = `position:absolute;${pos.includes('t') ? 'top' : 'bottom'}:${o.my ?? 120}px;${pos.includes('r') ? 'right' : 'left'}:${o.mx ?? 56}px;opacity:${o.op ?? .7}`;
      if (o.from != null || o.to != null) { this.set(m, { o: 0 }); this.anim(m, { o: [0, o.op ?? .7] }, o.from || 0, .4); if (o.to != null) this.anim(m, { o: 0 }, o.to, .3); }
      return m;
    }
    /** Stage/claim label pill — required whenever a feature is shown. */
    badge(text, o = {}) {
      const b = mk('div', 'sm-badge' + (o.theme === 'light' ? ' light' : '') + (SM.isAr(text) ? ' ar' : ''), this.over, `<i></i>${esc(text)}`);
      const pos = o.pos || 'tl'; b.style[pos.includes('t') ? 'top' : 'bottom'] = (o.my ?? 70) + 'px'; b.style[pos.includes('l') ? 'left' : 'right'] = (o.mx ?? 48) + 'px';
      const a = o.at ?? 0; this.set(b, { o: 0 }); this.anim(b, { o: [0, 1], y: [-14, 0] }, a, .45, 'outQuart'); if (o.until != null) this.anim(b, { o: [1, 0] }, o.until, .3);
      return b;
    }
    safe() { if (this.render) return this; const s = mk('div', 'sm-safe', this.stage); s.innerHTML = '<div style="left:0;right:0;top:0;height:220px"></div><div style="left:0;right:0;bottom:0;height:420px"></div><div style="right:0;top:220px;bottom:420px;width:150px"></div>'; s.style.display = 'none'; this._safeEl = s; return this; }

    /* --- audio, cues, stills */
    audio(o = {}) { this.audioCfg = Object.assign({ musicVolume: .18, voiceVolume: 1, duck: true, voiceAt: 0, fadeOut: 1.2 }, o); return this; }
    sfx(name, t, vol = 1) { if (name && !this._muteSfx) this.cues.push({ name, t: Math.max(0, t), vol }); return this; }
    cover(t) { this.coverT = t; return this; }
    still(name, t) { this.stillsList.push({ name, t }); return this; }
    beats(bpm = 120, offset = 0, count = 64) { const b = []; for (let i = 0; i < count; i++) b.push(offset + i * 60 / bpm); return b; }
    meta() { return { w: this.w, h: this.h, fps: this.fps, duration: this.duration, kind: this.kind, title: this.title, audio: this.audioCfg, sfx: this.cues.slice().sort((a, b) => a.t - b.t), cover: this.coverT, stills: this.stillsList, scenes: this.scenes.map(s => ({ start: s.start, end: s.end, name: s.o.name || '' })) }; }

    /* --- ready */
    async _ready() {
      for (const f of this.fin) f();
      try { await document.fonts.ready; } catch (e) { }
      const fams = ["600 40px 'Readex Pro'", "400 40px 'Readex Pro'", "700 40px 'Noto Kufi Arabic'", "700 40px 'Caveat'", "400 40px 'Audiowide'"];
      try { await Promise.all(fams.map(f => document.fonts.load(f, 'abcستاكو'))); } catch (e) { }
      for (const f of this.fits) { try { f(); } catch (e) { } }
      const imgs = [...document.querySelectorAll('img')]; await Promise.all(imgs.map(i => i.decode ? i.decode().catch(() => { }) : null));
      await Promise.all(this.vids.map(v => v.ready()));
      this.seek(0);
      if (!this.render) this._player();
      this._res(true);
    }
    _player() {
      const W = this.w, H = this.h, st = this.stage;
      const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 64) / H); st.style.transform = `translate(${f2((innerWidth - W * k) / 2)}px,${f2((innerHeight - 56 - H * k) / 2)}px) scale(${k})`; };
      addEventListener('resize', fit); fit();
      const bar = mk('div', 'sm-player', document.body);
      bar.innerHTML = `<button data-a="play">▶</button><button data-a="back">−1f</button><button data-a="fwd">+1f</button><input type="range" min="0" max="${this.duration}" step="${1 / this.fps}" value="0"><span class="tm"></span><button data-a="safe">Safe zones</button><button data-a="loop">Loop on</button>`;
      const rng = bar.querySelector('input'), tm = bar.querySelector('.tm'); let playing = false, loop = true, last = 0, auds = {};
      const cfg = this.audioCfg || {};
      if (cfg.voice) { auds.voice = new Audio(cfg.voice); auds.voice.volume = cfg.voiceVolume ?? 1; }
      if (cfg.music) { auds.music = new Audio(cfg.music); auds.music.volume = Math.min(1, (cfg.musicVolume ?? .18) * 2); }
      const show = t => { this.seek(t); for (const v of this.vids) v.preview(t, playing); rng.value = t; tm.textContent = `${t.toFixed(2)}s / ${this.duration.toFixed(2)}s`; };
      const syncAudio = () => { const t = this.t; for (const k in auds) { const a = auds[k], off = k === 'voice' ? (cfg.voiceAt || 0) : 0; if (playing && t >= off) { a.currentTime = t - off; a.play().catch(() => { }); } else a.pause(); } };
      const play = () => { playing = !playing; bar.querySelector('[data-a=play]').textContent = playing ? '❚❚' : '▶'; last = performance.now(); if (playing && this.t >= this.duration - .01) show(0); syncAudio(); if (playing) requestAnimationFrame(loopFn); };
      const sfxCache = {}; const playSfx = (from, to) => { for (const c of this.cues) if (c.t >= from && c.t < to) { const src = `${SM.assets}/audio/sfx/${c.name}.mp3`; const a = sfxCache[c.name] || (sfxCache[c.name] = new Audio(src)); try { const b = a.cloneNode(); b.volume = Math.min(1, c.vol * .8); b.play().catch(() => { }); } catch (e) { } } };
      const loopFn = now => { if (!playing) return; const dt = (now - last) / 1000; last = now; let t = this.t + dt; playSfx(this.t, t); if (t >= this.duration) { if (loop) { t = 0; show(0); syncAudio(); } else { t = this.duration; playing = false; bar.querySelector('[data-a=play]').textContent = '▶'; syncAudio(); } } show(t); if (playing) requestAnimationFrame(loopFn); };
      bar.addEventListener('click', e => { const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'play') play(); if (a === 'back') show(Math.max(0, this.t - 1 / this.fps)); if (a === 'fwd') show(Math.min(this.duration, this.t + 1 / this.fps));
        if (a === 'safe' && this._safeEl) this._safeEl.style.display = this._safeEl.style.display === 'none' ? '' : 'none';
        if (a === 'loop') { loop = !loop; e.target.textContent = loop ? 'Loop on' : 'Loop off'; } });
      rng.addEventListener('input', () => { if (playing) play(); show(+rng.value); });
      addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); play(); } if (e.code === 'ArrowRight') show(Math.min(this.duration, this.t + 1 / this.fps)); if (e.code === 'ArrowLeft') show(Math.max(0, this.t - 1 / this.fps)); });
      const q = new URLSearchParams(location.search); show(q.has('t') ? +q.get('t') : 0);
    }
  }
  SM.reel = o => new Reel(o);
  SM.carousel = o => new Reel(Object.assign({ w: 1080, h: 1350, kind: 'carousel' }, o));
  SM.Reel = Reel;

  /* ------------------------------------------------------------------ Scene */
  class Scene {
    constructor(R, start, dur, o, i) {
      this.R = R; this.start = start; this.dur = dur; this.end = start + dur; this.visStart = start; this.visEnd = start + dur; this.o = o; this.i = i;
      this.el = mk('div', 'sm-scene', R.scenesEl); this.el.style.zIndex = 10 + i;
      if (o.name) this.el.dataset.name = o.name;
      if (R.kind === 'carousel') R.still(o.name || ('slide-' + String(i + 1).padStart(2, '0')), start + dur - 1 / R.fps);
    }
    T(at) { return this.start + (at || 0); }
    anim(e, props, at, dur, ez) { this.R.anim(e, props, this.T(at), dur, ez); return this; }
    set(e, props) { this.R.set(e, props); return this; }
    clip(e, mode, o) { this.R.clip(e, mode, o); return this; }
    on(at, until, fn) { this.R.driver(this.T(at), this.T(until), fn); return this; }
    sfx(name, at, vol) { this.R.sfx(name, this.T(at), vol); return this; }
    shake(at, dur, amp) { this.R.shake(this.T(at), dur, amp); return this; }
    punch(at, amt, dur) { this.R.punch(this.T(at), amt, dur); return this; }
    glitch(at, dur, amp) { this.R.glitch(this.T(at), dur, amp); return this; }
    flash(at, dur = .25, color = '#fff') { const f = mk('div', 'sm-fill', this.el); f.style.background = color; f.style.zIndex = 900; this.set(f, { o: 0 }); this.anim(f, { o: [0, 1] }, at, dur * .3, 'outQuad').anim(f, { o: [1, 0] }, at + dur * .3, dur * .7, 'inQuad'); return f; }
    /** absolute anchor point (0×0) in stage px; content placed inside is aligned by the caller */
    layer(x, y, parent) { const L = mk('div', 'sm-layer', parent || this.el); L.style.left = x + 'px'; L.style.top = y + 'px'; return L; }
    fill(css, parent) { const f = mk('div', 'sm-fill', parent || this.el); if (css) f.style.cssText += css; return f; }
    html(html, o = {}) { // free HTML block anchored at x,y
      const L = this.layer(o.x ?? this.R.w / 2, o.y ?? this.R.h / 2, o.parent); const b = mk('div', o.cls || '', L, html); b.style.position = 'absolute'; b.style.left = '0'; b.style.top = '0';
      if (o.w) b.style.width = o.w + 'px'; if (o.css) b.style.cssText += o.css;
      b.style.transform = `translate(${o.ax ?? -50}%,${o.ay ?? -50}%)`;
      if (o.in) this.enter(L, o.in, o.at || 0, o); if (o.out) this.exit(L, o.out, o.outAt, o);
      return { layer: L, box: b };
    }
    enter(e, kind = 'fade', at = 0, o = {}) { const f = ENTER[kind]; if (!f) throw new Error('Unknown enter: ' + kind); f(this, e, at, o); return this; }
    exit(e, kind = 'fade', at, o = {}) { if (at == null) at = this.dur - .35; const f = EXIT[kind]; if (!f) throw new Error('Unknown exit: ' + kind); f(this, e, at, o); return this; }

    /** Full-bleed background: image/video path, 'night', 'paper', 'foam', a colour or a CSS gradient. */
    bg(src, o = {}) {
      const R = this.R, wrap = mk('div', 'sm-bgwrap', this.el), b = mk('div', 'sm-bg', wrap);
      if (o.parentFirst !== false && wrap.parentNode.firstChild !== wrap) wrap.parentNode.insertBefore(wrap, wrap.parentNode.firstChild);
      if (isImg(src)) { const img = mk('img', '', b); img.src = src; img.style.objectPosition = o.focus || '50% 50%'; }
      else if (isVid(src)) { this._video(b, src, Object.assign({ fill: true }, o)); }
      else b.style.background = src === 'night' ? SM.NIGHT : src === 'paper' ? C.paper : src === 'foam' ? C.foam : src === 'abyss' ? C.abyss : src;
      if (o.dim) { const d = mk('div', 'sm-fill', wrap); d.style.background = o.dimColor || 'rgba(7,22,42,1)'; d.style.opacity = o.dim; }
      if (o.gradient) { const d = mk('div', 'sm-fill', wrap); d.style.background = o.gradient === true ? 'linear-gradient(180deg,rgba(7,22,42,.55) 0%,rgba(7,22,42,0) 32%,rgba(7,22,42,0) 55%,rgba(7,22,42,.85) 100%)' : o.gradient; }
      if (o.blurBg) this.set(b, { blur: o.blurBg });
      if (o.origin) b.style.transformOrigin = o.origin;
      this.camera(b, o.move || 'none', o, wrap);
      return b;
    }
    /** Camera move on any element over this scene's visible window (incl. transitions). */
    camera(e, move = 'in', o = {}, wrap) {
      const R = this.R; R.fin.push(() => { const a = this.visStart, d = this.visEnd - this.visStart, f = CAM[move]; if (!f) throw new Error('Unknown camera move: ' + move); f(R, e, a, d, o, wrap || e.parentNode); });
      return this;
    }
    _video(parent, src, o = {}) {
      const v = mk('video', '', parent); v.src = src; v.muted = true; v.playsInline = true; v.preload = 'auto'; if (o.fill) { v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'; }
      const R = this.R, start = this.T(o.at || 0), off = o.offset || 0, rate = o.rate || 1;
      const lt = t => Math.max(0, (t - start) * rate + off);
      R.vids.push({
        ready: () => new Promise(res => { if (v.readyState >= 2) return res(); v.addEventListener('loadeddata', () => res(), { once: true }); v.addEventListener('error', () => res(), { once: true }); setTimeout(res, 8000); }),
        sync: t => { const x = Math.min(lt(t), (v.duration || 1e9) - .04); if (Math.abs(v.currentTime - x) < .0005) return Promise.resolve(); return new Promise(res => { const done = () => res(); v.addEventListener('seeked', done, { once: true }); v.currentTime = x; setTimeout(done, 2000); }); },
        preview: (t, playing) => { const x = lt(t); if (!playing) { v.pause(); if (Math.abs(v.currentTime - x) > .02) v.currentTime = x; } else { if (v.paused) v.play().catch(() => { }); if (Math.abs(v.currentTime - x) > .25) v.currentTime = x; } },
      });
      return v;
    }

    /** Positioned image or video card. o: x,y,w,h, radius, shadow, frame ('card'|'polaroid'|'circle'|'none'), in/at/out/outAt, move (camera inside the card) */
    image(src, o = {}) {
      const R = this.R, L = this.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent), box = mk('div', 'sm-img', L);
      const w = o.w || 800, h = o.h || w * .75; box.style.width = w + 'px'; box.style.height = h + 'px';
      box.style.transform = `translate(${o.ax ?? -50}%,${o.ay ?? -50}%)`; box.style.borderRadius = (o.radius ?? 28) + 'px';
      if (o.shadow !== false) box.style.boxShadow = o.shadow || '0 30px 80px rgba(3,9,18,.45)';
      if (o.frame === 'polaroid') { box.style.background = '#fff'; box.style.padding = '18px 18px 70px'; box.style.borderRadius = '6px'; }
      if (o.frame === 'circle') box.style.borderRadius = '50%';
      if (o.border) box.style.border = o.border;
      const inner = mk('div', 'sm-fill', box); inner.style.overflow = 'hidden'; inner.style.borderRadius = 'inherit';
      if (o.frame === 'polaroid') { inner.style.inset = '18px 18px 70px'; inner.style.borderRadius = '2px'; }
      let media; if (isVid(src)) media = this._video(inner, src, Object.assign({ fill: true }, o)); else { media = mk('img', '', inner); media.src = src; media.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'; media.style.objectPosition = o.focus || '50% 50%'; }
      if (o.move) this.camera(media, o.move, o, inner);
      if (o.caption && o.frame === 'polaroid') { const c = mk('div', '', box, esc(o.caption)); c.style.cssText = `position:absolute;left:0;right:0;bottom:14px;text-align:center;font:700 40px Caveat,cursive;color:#0E2440`; }
      if (o.rot) this.set(L, { r: o.rot });
      if (o.in) this.enter(L, o.in, o.at || 0, o); if (o.out) this.exit(L, o.out, o.outAt, o);
      return { layer: L, box, media };
    }

    /* ---------------------------------------------------------------- TEXT */
    /**
     * s.text('Your count *won\'t* match.', { x, y, w, size, align, color, fx, at, stagger, out, outAt, style, lang, hl })
     *  *word* = highlighted word.  \n = line break.  size: hero|title|sub|body|label|caption|number or px.
     *  fx: rise|pop|blur|slide|fade|type|scramble|letters|stamp|highlight|underline|strike|drop|wave|none
     */
    text(str, o = {}) {
      const R = this.R, size = typeof o.size === 'number' ? o.size : (SIZE[o.size || 'title']), dark = (o.theme || R.theme) !== 'light';
      const isAr = o.lang ? o.lang === 'ar' : SM.isAr(str); o = Object.assign({}, o, { lang: isAr ? 'ar' : o.lang });
      // Arabic version reads right-to-left: left-aligned layouts are mirrored automatically (mirror:false to keep one in place)
      let align = o.align || 'center', tx = o.x;
      if ((isAr || SM.lang === 'ar') && o.mirror !== false && align !== 'center') { align = align === 'left' ? 'right' : 'left'; if (tx != null && !o.parent) tx = R.w - tx; }
      const L = this.layer(tx ?? R.w / 2, o.y ?? R.h / 2, o.parent), box = mk('div', 'sm-text', L);
      const va = o.va || 'middle';
      box.style.maxWidth = (o.w || R.w - 150) + 'px'; box.style.fontSize = size + 'px'; box.style.textAlign = align;
      box.style.transform = `translate(${align === 'center' ? -50 : align === 'right' ? -100 : 0}%,${va === 'middle' ? -50 : va === 'bottom' ? -100 : 0}%)`;
      box.style.color = o.color || (dark ? '#fff' : C.abyss);
      if (o.weight) box.style.fontWeight = o.weight; if (o.lh) box.style.lineHeight = o.lh; if (o.ls != null) box.style.letterSpacing = o.ls;
      if (o.lang === 'ar') box.classList.add('ar'); if (o.font === 'hand') box.classList.add('hand');
      if (o.style) o.style.split(' ').forEach(c => box.classList.add(c));
      if (o.upper) { box.style.textTransform = 'uppercase'; box.style.letterSpacing = '.12em'; }
      const hlc = o.hlColor || (dark ? C.glow : C.signal); box.style.setProperty('--hl', hlc); box.style.setProperty('--mk', o.markColor || (dark ? 'rgba(8,149,166,.85)' : 'rgba(46,242,238,.55)')); box.style.setProperty('--st', o.strikeColor || C.red);
      const fx = o.fx || 'rise', chars = ['type', 'scramble', 'letters', 'wave'].includes(fx) && o.lang !== 'ar';
      const words = [], hls = [], cs = []; const lines = String(str).split('\n'); let hlOpen = false, stOpen = false;
      lines.forEach((ln, li) => {
        if (li) mk('br', '', box);
        ln.split(/ +/).filter(Boolean).flatMap(tok => /^[^*~]+\*[^*]+\*[.,!?:;…؟،]*$/.test(tok) ? (() => { const m = tok.match(/^([^*~]+)(\*[^*]+\*[.,!?:;…؟،]*)$/); return [m[1] + '\u2060', m[2]]; })() : [tok]).forEach((tok, wi, arr) => {
          if (wi && !arr[wi - 1].endsWith('\u2060')) box.appendChild(document.createTextNode(' '));
          let word = tok.replace('\u2060', ''), hl = hlOpen, st = stOpen;
          if (/^\*/.test(word)) { word = word.slice(1); hl = true; hlOpen = true; }
          if (/^~/.test(word)) { word = word.slice(1); st = true; stOpen = true; }
          const mc = word.match(/^(.*?)\*([.,!?:;…»"'؟،]*)$/); if (mc && hl) { word = mc[1] + mc[2]; hlOpen = false; }
          const ms = word.match(/^(.*?)~([.,!?:;…؟،]*)$/); if (ms && st) { word = ms[1] + ms[2]; stOpen = false; }
          const w = mk('span', 'w', box), inner = mk('span', 'wi', w);
          if (chars) [...word].forEach(ch => cs.push(mk('span', 'ch', inner, esc(ch)))); else inner.textContent = word;
          if (hl) { const mode = o.hl || (fx === 'highlight' ? 'marker' : fx === 'underline' ? 'underline' : 'color'); if (mode === 'color' || mode === 'both') inner.classList.add('hl'); if (mode === 'marker' || mode === 'both') { inner.classList.add('has-mk'); const k = mk('span', 'mk', inner); inner.insertBefore(k, inner.firstChild); hls.push(k); } if (mode === 'underline') { const u = mk('span', 'ul', inner, `<svg viewBox="0 0 100 12" preserveAspectRatio="none" width="100%" height="100%"><path d="M2 8 C 25 3, 55 11, 98 4" fill="none" stroke="${hlc}" stroke-width="3.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></svg>`); hls.push(u.querySelector('path')); inner.classList.add('hl'); } }
          if (st) { const k = mk('span', 'st', inner); inner.dataset.strike = '1'; hls.push(k); k.dataset.strike = '1'; }
          words.push(inner);
        });
      });
      const T = { layer: L, box, words, chars: cs, marks: hls, size, at: o.at || 0, ar: isAr };
      if (o.fit !== false) R.fits.push(() => { let fs = size, g = 0; while (box.scrollWidth > box.clientWidth + fs * .12 + 2 && fs > 16 && g++ < 60) { fs *= .95; box.style.fontSize = fs + 'px'; } T.size = fs; });
      const f = TFX[fx]; if (!f) throw new Error('Unknown text fx: ' + fx + '. Use: ' + Object.keys(TFX).join(', '));
      T.end = f(this, T, o.at || 0, o);
      if (o.out) TOUT[o.out] ? TOUT[o.out](this, T, o.outAt != null ? o.outAt : this.dur - .4, o) : this.exit(L, o.out, o.outAt, o);
      return T;
    }
    /** Kinetic beats: one word/phrase at a time, big, on the beat. items: ['Three', 'warehouses.', ...] */
    beats(items, o = {}) {
      const at = o.at || 0, beat = o.beat || .38, out = [];
      items.forEach((it, i) => {
        const txt = typeof it === 'string' ? it : it.t, b = typeof it === 'string' ? beat : (it.d || beat), start = at + (o.times ? o.times[i] : i * beat);
        const T = this.text(txt, Object.assign({ size: o.size || 'hero', fx: o.fx || 'stamp', at: start, y: o.y, color: o.color }, typeof it === 'object' ? it : {}));
        const end = o.times ? (o.times[i + 1] ?? start + b) : start + b;
        if (!(o.keepLast && i === items.length - 1)) this.set(T.layer, {}), this.R.anim(T.layer, { o: [1, 0] }, this.T(end - .001), .001, 'linear');
        if (o.sfx !== false) this.sfx(o.sfx || 'tick', start, .6);
        out.push(T);
      });
      return out;
    }
    /** English line that morphs into Arabic (or any two lines) */
    swap(a, b, o = {}) {
      const at = o.at || 0, sw = o.swapAt ?? at + 1.6;
      const A = this.text(a, Object.assign({}, o, { fx: o.fxA || 'blur', at }));
      this.R.anim(A.layer, { o: [1, 0], blur: [0, 14], y: [0, -20] }, this.T(sw), .45, 'inQuad');
      const B = this.text(b, Object.assign({}, o, { lang: o.langB || 'ar', fx: 'blur', at: sw + .25, size: o.sizeB || o.size }));
      return [A, B];
    }
    /** Counter: number counting from→to. o: x,y,size,prefix,suffix,decimals,dur,format('comma'|'none'|'time') */
    counter(o = {}) {
      const T = this.text(fmtNum(o.from || 0, o), Object.assign({ size: 'number', fx: o.fx || 'fade' }, o, { lang: undefined }));
      const span = T.words[0]; T.box.style.fontVariantNumeric = 'tabular-nums';
      T.box.innerHTML = ''; if (SM.isAr((o.prefix || '') + (o.suffix || ''))) { T.box.style.direction = 'rtl'; T.box.style.fontFamily = "'Noto Kufi Arabic','Readex Pro',sans-serif"; }
      const pre = mk('span', '', T.box, esc(o.prefix || '')), num = mk('span', 'hl', T.box), suf = mk('span', '', T.box, esc(o.suffix || ''));
      if (o.hl !== false) num.style.color = o.numColor || 'var(--hl)';
      const from = o.from || 0, to = o.to ?? 100, d = o.dur || 1.4, f = ease(o.ease || 'outExpo'), ct = o.countAt ?? (o.at || 0) + .1;
      let last = ''; this.on(ct, ct + d, p => { const v = from + (to - from) * f(p), s = fmtNum(v, o); if (s !== last) { num.textContent = s; last = s; } });
      if (o.sfx !== false) for (let i = 0; i < 6; i++) this.sfx('tick', ct + i * d / 8, .35);
      return T;
    }
    /** Scrolling text band */
    marquee(str, o = {}) {
      const R = this.R, band = mk('div', '', this.el); const y = o.y ?? R.h / 2, h = o.h || 120;
      band.style.cssText = `position:absolute;left:-10%;width:120%;top:${y - h / 2}px;height:${h}px;background:${o.bg || C.signal};color:${o.color || '#fff'};display:flex;align-items:center;overflow:hidden;white-space:nowrap;font-weight:600;font-size:${o.size || 64}px;letter-spacing:-.02em`;
      if (o.rot) band.style.transform = `rotate(${o.rot}deg)`;
      const inner = mk('div', '', band, (`<span style="padding:0 .6em">${esc(str)}</span><span style="opacity:.5">●</span>`).repeat(o.repeat || 10)); inner.style.display = 'flex'; inner.style.alignItems = 'center';
      const sp = o.speed || 220; this.on(0, this.dur + 1, (p, lt) => { inner.style.transform = `translateX(${f2(-((lt * sp) % 2000))}px)`; });
      return band;
    }
  }
  SM.Scene = Scene;
  const SIZE = SM.SIZE = { mega: 168, hero: 116, title: 86, sub: 58, body: 42, label: 30, caption: 46, number: 230, small: 30 };
  function fmtNum(v, o) { const d = o.decimals || 0; if (o.format === 'time') { const m = Math.max(0, Math.round(v)), h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m}m`; } const n = d ? v.toFixed(d) : String(Math.round(v)); return o.format === 'none' ? n : n.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  SM.fmtNum = fmtNum;

  /* ------------------------------------------------------------------ enter / exit */
  const ENTER = SM.ENTER = {
    none: () => { },
    fade: (s, e, at, o) => s.anim(e, { o: [0, 1] }, at, o.d || .5, 'outCubic'),
    pop: (s, e, at, o) => s.anim(e, { o: [0, 1], s: [o.from ?? .5, 1] }, at, o.d || .55, 'outBack'),
    rise: (s, e, at, o) => s.anim(e, { o: [0, 1], y: [o.dist || 90, 0] }, at, o.d || .7, 'outQuart'),
    sink: (s, e, at, o) => s.anim(e, { o: [0, 1], y: [-(o.dist || 90), 0] }, at, o.d || .7, 'outQuart'),
    drop: (s, e, at, o) => { s.anim(e, { o: [0, 1] }, at, .15).anim(e, { y: [-(o.dist || 700), 0] }, at, o.d || .9, 'outBounce'); s.sfx('thud', at + (o.d || .9) * .36, .5); },
    'slide-left': (s, e, at, o) => s.anim(e, { o: [0, 1], x: [o.dist || 420, 0] }, at, o.d || .7, 'outQuart'),
    'slide-right': (s, e, at, o) => s.anim(e, { o: [0, 1], x: [-(o.dist || 420), 0] }, at, o.d || .7, 'outQuart'),
    zoom: (s, e, at, o) => s.anim(e, { o: [0, 1], s: [o.from ?? 1.7, 1] }, at, o.d || .6, 'outExpo'),
    blur: (s, e, at, o) => s.anim(e, { o: [0, 1], blur: [22, 0], s: [1.08, 1] }, at, o.d || .7, 'outCubic'),
    flip: (s, e, at, o) => s.anim(e, { o: [0, 1], ry: [o.from ?? 88, 0], persp: [1400, 1400] }, at, o.d || .8, 'outBack'),
    flipX: (s, e, at, o) => s.anim(e, { o: [0, 1], rx: [o.from ?? -88, 0], persp: [1400, 1400] }, at, o.d || .8, 'outBack'),
    swing: (s, e, at, o) => s.anim(e, { o: [0, 1], r: [o.from ?? -9, 0], y: [60, 0] }, at, o.d || .9, 'outElastic'),
    stamp: (s, e, at, o) => { s.anim(e, { o: [0, 1], s: [o.from ?? 2.6, 1] }, at, o.d || .32, 'outExpo'); s.shake(at + (o.d || .32) * .8, .3, o.amp ?? 16); s.sfx('thud', at + .1); },
    spin: (s, e, at, o) => s.anim(e, { o: [0, 1], r: [o.from ?? -180, 0], s: [.3, 1] }, at, o.d || .8, 'outBack'),
    tilt3d: (s, e, at, o) => s.anim(e, { o: [0, 1], rx: [32, 8], ry: [-28, -12], y: [140, 0], persp: [1800, 1800] }, at, o.d || 1.1, 'outQuart'),
  };
  const EXIT = SM.EXIT = {
    none: () => { },
    fade: (s, e, at, o) => s.anim(e, { o: 0 }, at, o.dOut || .35, 'inQuad'),
    rise: (s, e, at, o) => s.anim(e, { o: 0, y: -(o.dist || 80) }, at, o.dOut || .4, 'inCubic'),
    sink: (s, e, at, o) => s.anim(e, { o: 0, y: (o.dist || 80) }, at, o.dOut || .4, 'inCubic'),
    drop: (s, e, at, o) => s.anim(e, { y: s.R.h * 1.2, r: 8 }, at, o.dOut || .6, 'inBack'),
    blur: (s, e, at, o) => s.anim(e, { o: 0, blur: 22, s: 1.1 }, at, o.dOut || .4, 'inQuad'),
    pop: (s, e, at, o) => s.anim(e, { o: 0, s: .4 }, at, o.dOut || .35, 'inBack'),
    zoom: (s, e, at, o) => s.anim(e, { o: 0, s: 2.2 }, at, o.dOut || .4, 'inQuad'),
    'slide-left': (s, e, at, o) => s.anim(e, { x: -s.R.w * 1.1 }, at, o.dOut || .5, 'inQuart'),
    'slide-right': (s, e, at, o) => s.anim(e, { x: s.R.w * 1.1 }, at, o.dOut || .5, 'inQuart'),
  };

  /* ------------------------------------------------------------------ text effects */
  const each = (arr, fn) => arr.forEach(fn);
  const TFX = SM.TFX = {
    none: () => 0,
    fade: (s, T, at, o) => { s.anim(T.layer, { o: [0, 1] }, at, o.d || .5); return at + .5; },
    rise: (s, T, at, o) => { T.box.classList.add('mask'); const st = o.stagger ?? .065, dy = T.size * (T.ar ? 1.75 : 1.25); each(T.words, (w, i) => s.anim(w, { y: [dy, 0] }, at + i * st, o.d || .75, 'outQuart')); return at + T.words.length * st + .7; },
    drop: (s, T, at, o) => { T.box.classList.add('mask'); const st = o.stagger ?? .065, dy = T.size * (T.ar ? 1.75 : 1.25); each(T.words, (w, i) => s.anim(w, { y: [-dy, 0] }, at + i * st, o.d || .75, 'outQuart')); return at + T.words.length * st + .7; },
    pop: (s, T, at, o) => { const st = o.stagger ?? .075; each(T.words, (w, i) => { s.anim(w, { o: [0, 1], s: [.35, 1], y: [T.size * .25, 0] }, at + i * st, o.d || .55, 'outBack'); }); if (o.sfx !== false) each(T.words, (w, i) => i < 8 && s.sfx('pop', at + i * st, .35)); return at + T.words.length * st + .55; },
    blur: (s, T, at, o) => { const st = o.stagger ?? .06; each(T.words, (w, i) => s.anim(w, { o: [0, 1], blur: [T.size * .22, 0], y: [T.size * .3, 0] }, at + i * st, o.d || .8, 'outCubic')); return at + T.words.length * st + .8; },
    slide: (s, T, at, o) => { const st = o.stagger ?? .05; each(T.words, (w, i) => s.anim(w, { o: [0, 1], x: [-T.size * .7, 0] }, at + i * st, o.d || .6, 'outQuart')); return at + T.words.length * st + .6; },
    wave: (s, T, at, o) => { const st = o.stagger ?? .03; each(T.chars, (c, i) => s.anim(c, { o: [0, 1], y: [T.size * .5, 0], r: [12, 0] }, at + i * st, .6, 'outBack')); return at + T.chars.length * st + .6; },
    letters: (s, T, at, o) => { const st = o.stagger ?? .028; s.set(T.layer, { persp: 900 }); each(T.chars, (c, i) => s.anim(c, { o: [0, 1], rx: [-95, 0], y: [T.size * .2, 0] }, at + i * st, o.d || .7, 'outBack')); return at + T.chars.length * st + .7; },
    type: (s, T, at, o) => {
      const n = T.chars.length, cps = o.cps || 24, d = n / cps; const caret = mk('span', 'caret', T.box); s.set(caret, { o: 0 });
      s.on(at, at + d, p => { const k = Math.floor(p * n + 1e-6); for (let i = 0; i < n; i++) { const v = i < k ? '' : 'hidden'; if (T.chars[i].style.visibility !== v) T.chars[i].style.visibility = v; } });
      s.on(at, at + d + (o.caretHold ?? 1.2), (p, lt) => { caret.style.opacity = lt < 0 ? 0 : (lt < d ? 1 : (Math.floor((lt - d) * 2.2) % 2 ? 0 : 1)); if (p >= 1 && !o.keepCaret) caret.style.opacity = 0; });
      if (o.sfx !== false) s.sfx('typing', at, .5);
      return at + d;
    },
    scramble: (s, T, at, o) => {
      const n = T.chars.length, d = o.d || Math.max(.6, n * .045), fin = T.chars.map(c => c.textContent), CH = o.charset || 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*';
      s.on(at, at + d, (p, lt, t) => { const fr = Math.floor(t * 30); for (let i = 0; i < n; i++) { if (fin[i] === ' ') continue; const rev = (i / n) * .7 + .3; const v = p >= rev ? fin[i] : (p <= 0 ? '' : CH[Math.floor(noise(fr * 31 + i * 7) * CH.length)]); if (T.chars[i].textContent !== v) T.chars[i].textContent = v; } });
      s.anim(T.layer, { o: [0, 1] }, at, .05); if (o.sfx !== false) s.sfx('glitch', at, .4); return at + d;
    },
    stamp: (s, T, at, o) => { ENTER.stamp(s, T.layer, at, o); return at + .4; },
    zoom: (s, T, at, o) => { ENTER.zoom(s, T.layer, at, o); return at + .6; },
    highlight: (s, T, at, o) => { TFX[o.base || 'rise'](s, T, at, Object.assign({}, o, { stagger: o.stagger })); const m0 = at + (o.markAt ?? (T.words.length * .065 + .35)); each(T.marks, (m, i) => { s.set(m, { sx: 0 }); s.anim(m, { sx: [0, 1] }, m0 + i * .18, .5, 'inOutCubic'); }); if (T.marks.length) s.sfx('swoosh', m0, .5); return m0 + .6; },
    underline: (s, T, at, o) => { const e = TFX[o.base || 'rise'](s, T, at, o); const m0 = at + (o.markAt ?? (T.words.length * .065 + .3)); each(T.marks, (pth, i) => s.on(m0 + i * .2, m0 + i * .2 + .55, p => pth.setAttribute('stroke-dashoffset', String(1 - E.inOutCubic(p))))); return Math.max(e, m0 + .6); },
    strike: (s, T, at, o) => { const e = TFX[o.base || 'rise'](s, T, at, o); const m0 = at + (o.markAt ?? .9); each(T.marks.filter(m => m.dataset.strike), (m, i) => { s.set(m, { sx: 0 }); s.anim(m, { sx: [0, 1] }, m0 + i * .15, .35, 'inOutQuad'); }); s.sfx('swoosh', m0, .5); return m0 + .4; },
  };
  const TOUT = SM.TOUT = {
    rise: (s, T, at, o) => { const st = .03, dy = T.size * (T.ar ? 1.8 : 1.3); each(T.words, (w, i) => s.anim(w, { y: -dy }, at + i * st, .45, 'inCubic')); T.box.classList.add('mask'); },
    drop: (s, T, at, o) => { const dy = T.size * (T.ar ? 1.8 : 1.3); each(T.words, (w, i) => s.anim(w, { y: dy }, at + i * .03, .45, 'inCubic')); T.box.classList.add('mask'); },
    blur: (s, T, at) => s.anim(T.layer, { o: 0, blur: 18 }, at, .4, 'inQuad'),
    fade: (s, T, at) => s.anim(T.layer, { o: 0 }, at, .35),
    pop: (s, T, at) => each(T.words, (w, i) => s.anim(w, { o: 0, s: .3 }, at + i * .03, .3, 'inBack')),
    scatter: (s, T, at) => each(T.words, (w, i) => s.anim(w, { o: 0, y: (noise(i) - .5) * 400, x: (noise(i + 9) - .5) * 600, r: (noise(i + 4) - .5) * 90 }, at, .55, 'inQuad')),
  };

  /* ------------------------------------------------------------------ transitions */
  const TRD = SM.TRD = { fade: .5, 'whip-left': .42, 'whip-right': .42, 'whip-up': .42, 'whip-down': .42, 'push-left': .6, 'push-right': .6, 'push-up': .6, 'push-down': .6, 'zoom-through': .6, 'zoom-out': .6, iris: .75, wipe: .65, 'wipe-right': .65, split: .6, splitH: .6, dots: .95, flash: .3, glitch: .38, blur: .6, stack: .7, spin: .65, shutter: .75, punch: .25, round: .7 };
  const whip = (dx, dy) => (R, A, B, t, d) => { R.anim(A.el, { x: [0, -dx * R.w * 1.05], y: [0, -dy * R.h * 1.05], blur: [0, 28] }, t, d, 'inOutQuart'); R.anim(B.el, { x: [dx * R.w * 1.05, 0], y: [dy * R.h * 1.05, 0], blur: [28, 0] }, t, d, 'inOutQuart'); R.sfx('whoosh', t); };
  const push = (dx, dy) => (R, A, B, t, d) => { R.anim(A.el, { x: [0, -dx * R.w], y: [0, -dy * R.h] }, t, d, 'inOutCubic'); R.anim(B.el, { x: [dx * R.w, 0], y: [dy * R.h, 0] }, t, d, 'inOutCubic'); R.sfx('swoosh', t, .6); };
  const TR = SM.TR = {
    cut: () => { },
    fade: (R, A, B, t, d) => { R.anim(B.el, { o: [0, 1] }, t, d, 'inOutQuad'); },
    'whip-left': whip(1, 0), 'whip-right': whip(-1, 0), 'whip-up': whip(0, 1), 'whip-down': whip(0, -1),
    'push-left': push(1, 0), 'push-right': push(-1, 0), 'push-up': push(0, 1), 'push-down': push(0, -1),
    'zoom-through': (R, A, B, t, d) => { A.el.style.zIndex = +B.el.style.zIndex + 1; R.anim(A.el, { s: [1, 2.6], o: [1, 0], blur: [0, 16] }, t, d, 'inQuart'); R.anim(B.el, { s: [.72, 1] }, t, d * 1.1, 'outQuart'); R.sfx('whoosh', t); },
    'zoom-out': (R, A, B, t, d) => { R.anim(A.el, { s: [1, .6], o: [1, 0] }, t, d, 'inCubic'); R.anim(B.el, { s: [1.5, 1], o: [0, 1] }, t, d, 'outCubic'); R.sfx('whoosh', t, .7); },
    iris: (R, A, B, t, d, o) => { R.clip(B.el, 'circle', { cx: o.cx ?? 50, cy: o.cy ?? 50, r: 160 }); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutCubic'); R.sfx('swoosh', t, .6); },
    round: (R, A, B, t, d, o) => { R.clip(B.el, 'round', { round: 60 }); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutCubic'); R.anim(A.el, { s: [1, .92], br: [1, .5] }, t, d, 'inOutCubic'); R.sfx('swoosh', t, .6); },
    wipe: (R, A, B, t, d) => { R.clip(B.el, 'diag'); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutCubic'); R.sfx('swoosh', t, .6); },
    'wipe-right': (R, A, B, t, d) => { R.clip(B.el, 'diagR'); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutCubic'); R.sfx('swoosh', t, .6); },
    split: (R, A, B, t, d) => { R.clip(B.el, 'split'); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutQuart'); R.sfx('swoosh', t, .6); },
    splitH: (R, A, B, t, d) => { R.clip(B.el, 'splitH'); R.anim(B.el, { cp: [0, 1] }, t, d, 'inOutQuart'); R.sfx('swoosh', t, .6); },
    blur: (R, A, B, t, d) => { A.el.style.zIndex = +B.el.style.zIndex + 1; R.anim(A.el, { blur: [0, 26], o: [1, 0] }, t, d, 'inQuad'); R.anim(B.el, { blur: [26, 0] }, t, d, 'outQuad'); },
    stack: (R, A, B, t, d) => { R.anim(B.el, { y: [R.h, 0] }, t, d, 'outQuart'); B.el.style.boxShadow = '0 -40px 90px rgba(0,0,0,.45)'; R.anim(A.el, { s: [1, .9], br: [1, .5] }, t, d, 'outQuart'); R.sfx('swoosh', t, .6); },
    spin: (R, A, B, t, d) => { A.el.style.zIndex = +B.el.style.zIndex + 1; R.anim(A.el, { r: [0, -16], s: [1, 1.8], o: [1, 0] }, t, d, 'inQuart'); R.anim(B.el, { r: [16, 0], s: [.6, 1] }, t, d * 1.15, 'outQuart'); R.sfx('whoosh', t); },
    punch: (R, A, B, t, d) => { R.anim(B.el, { s: [1.18, 1] }, t + d / 2, .45, 'outExpo'); R.sfx('thud', t + d / 2, .6); return { switchAt: t + d / 2 }; },
    flash: (R, A, B, t, d) => { const f = mk('div', 'sm-fill', R.over); f.style.background = '#fff'; R.set(f, { o: 0 }); R.anim(f, { o: [0, 1] }, t, d / 2, 'inQuad').anim(f, { o: [1, 0] }, t + d / 2, d / 2 + .15, 'outQuad'); R.sfx('flash', t); return { switchAt: t + d / 2 }; },
    glitch: (R, A, B, t, d) => { R.glitch(t, d, 1); return { switchAt: t + d / 2 }; },
    dots: (R, A, B, t, d, o) => {
      const sp = o.spacing || 96, cols = Math.ceil(R.w / sp) + 1, rows = Math.ceil(R.h / sp) + 1, NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', R.w); svg.setAttribute('height', R.h); svg.style.cssText = 'position:absolute;inset:0;z-index:5'; R.over.appendChild(svg);
      const cs = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x * sp + (y % 2 ? sp / 2 : 0)); c.setAttribute('cy', y * sp * .9); c.setAttribute('r', 0); const k = noise(x * 13 + y * 7); c.setAttribute('fill', k > .9 ? C.glow : k > .78 ? C.ocean : (o.color || C.abyss)); svg.appendChild(c); cs.push({ c, k: (x / cols + y / rows) / 2 }); }
      const R0 = sp * .78;
      R.driver(t, t + d, p => { for (const q of cs) { const a = clamp((p * 2 - q.k * .8) / .6), b = clamp(((p - .5) * 2 - q.k * .8) / .6); const r = p < .5 ? E.outCubic(a) * R0 : (1 - E.inCubic(b)) * R0; q.c.setAttribute('r', f2(p <= 0 || p >= 1 ? 0 : r)); } });
      R.sfx('swoosh', t, .7); return { switchAt: t + d / 2 };
    },
    shutter: (R, A, B, t, d, o) => {
      const n = o.bars || 7, bars = [];
      for (let i = 0; i < n; i++) { const b = mk('div', '', R.over); b.style.cssText = `position:absolute;left:0;right:0;top:${(i * 100 / n)}%;height:${100 / n + .2}%;background:${i % 3 === 1 ? C.signal : C.abyss};transform-origin:${i % 2 ? '100%' : '0'} 50%`; R.set(b, { sx: 0 }); R.anim(b, { sx: [0, 1] }, t + i * d * .04, d * .4, 'inOutCubic').anim(b, { sx: [1, 0] }, t + d * .52 + i * d * .04, d * .4, 'inOutCubic'); b.style.zIndex = 5; bars.push(b); }
      R.sfx('swoosh', t, .6); return { switchAt: t + d / 2 };
    },
  };

  /* ------------------------------------------------------------------ camera moves */
  const CAM = SM.CAM = {
    none: () => { },
    in: (R, e, a, d, o) => { R.anim(e, { s: [o.s0 || 1.03, o.s1 || 1.16], x: [0, (o.drift ?? -1) * 14] }, a, d, 'linear'); },
    out: (R, e, a, d, o) => { R.anim(e, { s: [o.s0 || 1.18, o.s1 || 1.03], x: [(o.drift ?? 1) * 14, 0] }, a, d, 'linear'); },
    left: (R, e, a, d, o) => { const k = o.amt || .045; R.set(e, { s: 1 + k * 2.6 }); R.anim(e, { x: [R.w * k, -R.w * k] }, a, d, 'inOutSine' in E ? 'inOutSine' : 'linear'); },
    right: (R, e, a, d, o) => { const k = o.amt || .045; R.set(e, { s: 1 + k * 2.6 }); R.anim(e, { x: [-R.w * k, R.w * k] }, a, d, 'linear'); },
    up: (R, e, a, d, o) => { const k = o.amt || .03; R.set(e, { s: 1 + k * 3 }); R.anim(e, { y: [R.h * k, -R.h * k] }, a, d, 'linear'); },
    down: (R, e, a, d, o) => { const k = o.amt || .03; R.set(e, { s: 1 + k * 3 }); R.anim(e, { y: [-R.h * k, R.h * k] }, a, d, 'linear'); },
    push: (R, e, a, d, o) => { R.anim(e, { s: [1, o.s1 || 1.35] }, a, d, 'inQuad'); },
    pull: (R, e, a, d, o) => { R.anim(e, { s: [o.s0 || 1.35, 1] }, a, d, 'outQuad'); },
    snap: (R, e, a, d, o) => { R.anim(e, { s: [1.5, 1.05] }, a, Math.min(.7, d), 'outExpo'); R.anim(e, { s: [1.05, 1.1] }, a + .7, Math.max(.1, d - .7), 'linear'); },
    dolly: (R, e, a, d, o) => { R.anim(e, { s: [1, 1.22], y: [0, -30] }, a, d, 'inOutQuad'); },
    drift: (R, e, a, d, o) => { R.set(e, { s: 1.08 }); R.anim(e, { x: [-12, 12], y: [8, -8] }, a, d, 'linear'); },
    handheld: (R, e, a, d, o, wrap) => { R.set(e, { s: 1.07 }); const amp = o.amp || 9; R.driver(a, a + d, (p, lt, t) => { const n = t * .9; wrap.style.transform = `translate(${f2((Math.sin(n * 1.7) + Math.sin(n * 2.9 + 1)) * amp * .5)}px,${f2((Math.sin(n * 1.3 + 2) + Math.sin(n * 3.1)) * amp * .5)}px) rotate(${f2(Math.sin(n * 1.1) * .25)}deg)`; }); },
    rack: (R, e, a, d, o) => { R.anim(e, { blur: [o.b0 ?? 14, o.b1 ?? 0], s: [1.06, 1.1] }, a, Math.min(1.2, d), 'inOutCubic'); },
    unrack: (R, e, a, d, o) => { R.anim(e, { blur: [0, o.b1 ?? 12] }, a + (o.from ?? 1), .8, 'inOutCubic'); },
  };
  E.inOutSine = p => -(Math.cos(Math.PI * p) - 1) / 2;
})(typeof window !== 'undefined' ? window : globalThis);
