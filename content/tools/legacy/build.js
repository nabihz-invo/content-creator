// Builds Stacko social items from <itemDir>/copy.json, then renders them.
//   node build.js carousel <itemDir>   -> index-en.html, index-ar.html, png-en/, png-ar/
//   node build.js stories  <itemDir>   -> index-en.html, index-ar.html, png-en/, png-ar/ (1080x1920 frames)
//   node build.js post     <itemDir>   -> post.html, <ID>_<lang>_<theme>.png + .pptx
// copy.json: { id, title, en: {...}, ar: {...} }. Slide fields are text; art/img keys live on the en side
// and are reused for ar by index. Write *word* to highlight a word in a headline.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const TOOLS = __dirname;

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const L = {
  en: { wm: 'stack<i>o</i>', wmClass: 'wm', swipe: 'Swipe →', count: (i, n) => `${i} / ${n}`, cta: 'Book a meeting', demo: 'Illustration · demo data', app: 'App view · demo data' },
  ar: { wm: 'ستاك<i>و</i>', wmClass: 'wm-ar', swipe: 'اسحب ←', count: (i, n) => `${i} من ${n}`, cta: 'احجز اجتماعاً', demo: 'رسم توضيحي · بيانات تجريبية', app: 'واجهة التطبيق · بيانات تجريبية' },
};

// ---------- illustration library (inline SVG, 900x380 art box) ----------
const CUBE = (x, y, s = 1, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M0 -84 L60 -50 L0 -16 L-60 -50Z" fill="#79C0DE"/><path d="M-60 -50 L0 -16 L0 34 L-60 0Z" fill="#2F86B8"/><path d="M60 -50 L0 -16 L0 34 L60 0Z" fill="#0895A6"/></g>`;
const F = (lang) => lang === 'ar' ? 'Noto Kufi Arabic' : 'Readex Pro';
const ART = {
  cubes: () => `<g fill="none" stroke="rgba(121,192,222,.35)" stroke-width="2" stroke-dasharray="6 10"><path d="M210 470 L420 330"/><path d="M420 330 L700 430"/><path d="M420 330 L560 170"/></g>${CUBE(210, 470)}${CUBE(420, 330)}${CUBE(700, 430)}${CUBE(560, 170)}`,
  network: () => `<path d="M150 300 L450 170 L750 290 L450 360Z" fill="none" stroke="#2EF2EE" stroke-width="5" stroke-linecap="round"/>${CUBE(150, 320, 1.1)}${CUBE(450, 190, 1.1)}${CUBE(750, 310, 1.1)}${CUBE(450, 380, 1.1)}<g transform="translate(450 70)"><path d="M0 44 C-24 16 -30 5 -30 -10 A30 30 0 0 1 30 -10 C30 5 24 16 0 44Z" fill="#2EF2EE"/><circle cy="-10" r="11" fill="#0E2440"/></g>`,
  fog: () => `<defs><filter id="fg"><feGaussianBlur stdDeviation="7"/></filter></defs><g filter="url(#fg)" opacity=".55">${CUBE(140, 260)}${CUBE(400, 150)}${CUBE(620, 290)}${CUBE(800, 140)}</g><g transform="translate(450 180)"><circle r="78" fill="none" stroke="#0E2440" stroke-width="10"/><path d="M55 55 L120 120" stroke="#0E2440" stroke-width="14" stroke-linecap="round"/></g>`,
  transfer: (l, t = []) => `${CUBE(150, 240, 1.4)}${CUBE(750, 240, 1.4)}${t[3] === 'ok' ? '<path d="M250 200 C380 110 520 110 650 200" fill="none" stroke="#0895A6" stroke-width="6" stroke-linecap="round"/><circle cx="450" cy="134" r="40" fill="#0895A6"/><path d="M432 135 L446 149 L470 122" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M250 200 C380 110 520 110 650 200" fill="none" stroke="#0895A6" stroke-width="4" stroke-dasharray="10 12" stroke-linecap="round"/><circle cx="450" cy="134" r="40" fill="#fff" stroke="#C2334A" stroke-width="3"/><text x="450" y="152" text-anchor="middle" font-family="Readex Pro" font-weight="700" font-size="50" fill="#C2334A">?</text>'}<g font-family="${F(l)}" font-size="26" font-weight="600" fill="#4F6E86" text-anchor="middle"><text x="${l === 'ar' ? 750 : 150}" y="335">${esc(t[0] || '')}</text><text x="${l === 'ar' ? 150 : 750}" y="335">${esc(t[1] || '')}</text><text x="450" y="230">${esc(t[2] || '')}</text></g>`,
  sheets: (l, t = []) => [0, 1, 2].map(i => `<g transform="translate(${i * 320} ${[40, 0, 60][i]})"><rect width="250" height="270" rx="22" fill="#fff" stroke="#C9D8E4" stroke-width="2"/><text x="${l === 'ar' ? 222 : 28}" y="50" ${l === 'ar' ? 'text-anchor="start" direction="rtl"' : ''} font-family="${F(l)}" font-size="22" font-weight="600" fill="#4F6E86">${esc(t[i] || '')}</text><g fill="#EEF6F9"><rect x="28" y="80" width="194" height="22" rx="6"/><rect x="28" y="120" width="150" height="22" rx="6"/><rect x="28" y="160" width="194" height="22" rx="6"/><rect x="28" y="200" width="120" height="22" rx="6"/></g></g>`).join('') + `<g fill="none" stroke="#0895A6" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"><path d="M250 180 C285 150 290 150 320 140"/><path d="M570 150 C600 170 610 190 640 200"/></g>`,
  chat: (l, t = []) => {
    const rtl = l === 'ar', a = rtl ? 'start' : 'start', d = rtl ? 'direction="rtl"' : '';
    const b = (x, y, w, txt, me) => `<rect x="${x}" y="${y}" width="${w}" height="84" rx="30" fill="${me ? '#BCE5E0' : '#fff'}" ${me ? '' : 'stroke="#C9D8E4" stroke-width="2"'}/><text x="${rtl ? x + w - 32 : x + 32}" y="${y + 54}" text-anchor="${a}" ${d} font-family="${F(l)}" font-size="30" font-weight="500" fill="#0E2440">${esc(txt)}</text>`;
    return b(0, 20, 600, t[0] || '', 0) + b(300, 135, 440, t[1] || '', 1) + b(0, 250, 660, t[2] || '', 0);
  },
  mismatch: (l, t = []) => {
    const rtl = l === 'ar', x = rtl ? 328 : 32, d = rtl ? 'direction="rtl"' : '';
    const card = (tx, label, num, red) => `<g transform="translate(${tx} 30)"><rect width="360" height="300" rx="24" fill="#fff" stroke="#C9D8E4" stroke-width="2"/><text x="${x}" y="58" ${d} font-family="${F(l)}" font-size="24" font-weight="600" fill="#4F6E86">${esc(label)}</text><text x="${x}" y="130" ${d} font-family="${F(l)}" font-size="26" fill="#0E2440">${esc(t[2] || '')}</text><text x="${x}" y="245" ${d} font-family="Readex Pro" font-size="${String(num).length > 4 ? 58 : 96}" font-weight="700" fill="${red ? '#C2334A' : '#0E2440'}">${esc(num)}</text></g>`;
    return card(40, t[0] || '', t[3] || 42, 0) + card(500, t[1] || '', t[4] || 38, 1) + `<text x="450" y="200" text-anchor="middle" font-family="Readex Pro" font-size="64" font-weight="700" fill="#C2334A">≠</text>`;
  },
  clock: () => `<g transform="translate(450 190)"><circle r="150" fill="#fff" stroke="#C9D8E4" stroke-width="4"/><circle r="150" fill="none" stroke="#0895A6" stroke-width="12" stroke-dasharray="700 943" transform="rotate(-90)" stroke-linecap="round"/><path d="M0 0 L0 -95" stroke="#0E2440" stroke-width="12" stroke-linecap="round"/><path d="M0 0 L70 30" stroke="#0E2440" stroke-width="10" stroke-linecap="round"/><circle r="12" fill="#0E2440"/></g>`,
  clipboard: () => `<g transform="translate(330 10)"><rect width="240" height="330" rx="26" fill="#fff" stroke="#C9D8E4" stroke-width="3"/><rect x="70" y="-14" width="100" height="40" rx="12" fill="#0895A6"/>${[0, 1, 2, 3, 4].map(i => `<rect x="34" y="${70 + i * 52}" width="30" height="30" rx="8" fill="${i < 3 ? '#0895A6' : '#EEF6F9'}"/><rect x="82" y="${78 + i * 52}" width="${120 - (i % 2) * 30}" height="14" rx="6" fill="#E3ECF2"/>`).join('')}</g>`,
  roles: () => `${[[150, 'M'], [330, 'W'], [510, 'P'], [690, 'R']].map(([x, c], i) => `<g transform="translate(${x} 170)"><circle r="70" fill="${i === 0 ? '#0E2440' : '#fff'}" stroke="#C9D8E4" stroke-width="3"/><circle cy="-14" r="22" fill="${i === 0 ? '#2EF2EE' : '#79C0DE'}"/><path d="M-36 40 C-30 10 30 10 36 40" fill="${i === 0 ? '#2EF2EE' : '#79C0DE'}"/></g>`).join('')}<path d="M220 170 H260 M400 170 H440 M580 170 H620" stroke="#0895A6" stroke-width="4" stroke-dasharray="6 8"/>`,
  shield: () => `<g transform="translate(450 190)"><path d="M0 -160 L130 -110 V10 C130 90 70 140 0 170 C-70 140 -130 90 -130 10 V-110Z" fill="#fff" stroke="#0895A6" stroke-width="8"/><path d="M-50 10 L-12 48 L60 -30" fill="none" stroke="#0895A6" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  calendar: () => `<g transform="translate(250 20)"><rect width="400" height="320" rx="28" fill="#fff" stroke="#C9D8E4" stroke-width="3"/><rect width="400" height="70" rx="28" fill="#0E2440"/><rect y="40" width="400" height="30" fill="#0E2440"/>${Array.from({ length: 15 }, (_, i) => `<rect x="${30 + (i % 5) * 72}" y="${100 + Math.floor(i / 5) * 70}" width="52" height="48" rx="10" fill="${i === 12 ? '#2EF2EE' : '#EEF6F9'}"/>`).join('')}</g>`,
  boxes: () => `${CUBE(300, 300, 1.2)}${CUBE(420, 300, 1.2)}${CUBE(360, 230, 1.2)}${CUBE(600, 310, 1.0, .9)}<path d="M640 120 l40 -40 l40 40" fill="none" stroke="#C2334A" stroke-width="8" stroke-linecap="round"/><path d="M680 80 V200" stroke="#C2334A" stroke-width="8" stroke-linecap="round"/>`,
};
const art = (key, lang, labels) => `<div class="art"><svg viewBox="0 0 900 380" aria-hidden="true">${ART[key](lang, labels)}</svg></div>`;
const shot = (img, lang, h = 560, w) => `<div class="shot" style="height:${h}px${w ? `;width:${w}px` : ''}"><img src="../../_brand/site/${lang}-${img}.png" alt=""></div>`;

// post point icons (40x40, stroke colour is swapped for the dark theme by the template)
const ic = d => `<svg viewBox="0 0 40 40" fill="none" stroke="#0895A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  warehouse: ic('<path d="M6 17 L20 8 L34 17 V33 H6Z"/><path d="M14 33 V23 H26 V33"/>'),
  map: ic('<path d="M4 10 L14 6 L26 10 L36 6 V30 L26 34 L14 30 L4 34Z"/><path d="M14 6 V30 M26 10 V34"/>'),
  search: ic('<circle cx="18" cy="18" r="11"/><path d="M26 26 L35 35"/><path d="M13 18 H23 M18 13 V23"/>'),
  truck: ic('<rect x="3" y="11" width="20" height="15" rx="2"/><path d="M23 16 h7 l6 6 v4 h-13"/><circle cx="10" cy="29" r="3"/><circle cx="29" cy="29" r="3"/>'),
  invoice: ic('<path d="M9 4 H25 L32 11 V36 H9Z"/><path d="M25 4 V11 H32"/><path d="M14 19 H27 M14 25 H27 M14 31 H22"/>'),
  shield: ic('<path d="M20 4 L33 9 V19 C33 27 27 33 20 36 C13 33 7 27 7 19 V9Z"/><path d="M14 20 L18 24 L26 15"/>'),
  users: ic('<circle cx="15" cy="14" r="5"/><path d="M5 32 C6 24 24 24 25 32"/><circle cx="28" cy="13" r="4"/><path d="M27 21 C32 21 35 25 35 30"/>'),
  clock: ic('<circle cx="20" cy="20" r="15"/><path d="M20 11 V20 L26 24"/>'),
  chart: ic('<path d="M5 34 H35"/><path d="M9 28 L16 20 L22 24 L33 11"/><path d="M27 11 H33 V17"/>'),
  check: ic('<circle cx="20" cy="20" r="15"/><path d="M13 20 L18 25 L27 15"/>'),
  bell: ic('<path d="M10 28 V18 C10 12 14 8 20 8 C26 8 30 12 30 18 V28 L33 31 H7Z"/><path d="M17 34 C18 36 22 36 23 34"/>'),
  link: ic('<path d="M17 23 L23 17"/><path d="M14 18 L10 22 C7 25 7 30 10 33 C13 36 18 36 21 33 L25 29"/><path d="M26 22 L30 18 C33 15 33 10 30 7 C27 4 22 4 19 7 L15 11"/>'),
  phone: ic('<rect x="11" y="4" width="18" height="32" rx="4"/><path d="M18 31 H22"/>'),
  list: ic('<path d="M14 11 H34 M14 20 H34 M14 29 H34"/><circle cx="7" cy="11" r="1.5"/><circle cx="7" cy="20" r="1.5"/><circle cx="7" cy="29" r="1.5"/>'),
};

// ---------- slide renderers ----------
function slide(s, base, lang, i, n, isStory, solo) {
  const t = L[lang], dark = (s.theme || base.theme || 'light') === 'dark';
  const cls = `slide ${dark ? 'dark' : 'light'}${isStory ? ' story' : ''}`;
  const mark = `../../_brand/mark-on-${dark ? 'dark' : 'light'}.svg`;
  const top = `<div class="top"><div class="brand"><img src="${mark}" alt=""><span class="${t.wmClass}">${t.wm}</span></div>${isStory || solo ? '' : `<span class="count">${t.count(i, n)}</span>`}</div>`;
  const last = i === n;
  const footL = s.foot ? esc(s.foot) : (base.img || base.bgimg ? `<span class="tagnote">${base.img === 'app' || base.img === 'phone' ? t.app : t.demo}</span>` : '');
  const foot = `<div class="foot"><span>${footL}</span>${last || isStory || solo ? '' : `<span class="swipe">${t.swipe}</span>`}</div>`;
  const eyebrow = s.eyebrow ? `<span class="eyebrow">${esc(s.eyebrow)}</span>` : '';
  const visual = base.art ? art(base.art, lang, s.labels) : base.img ? shot(base.img, lang, base.h || (isStory ? 760 : 560), base.w) : '';
  const type = base.type;
  let inner = '';
  if (type === 'cover') {
    const bg = base.bgimg ? `<div class="bg-art"><img src="../../_brand/site/${lang}-${base.bgimg}.png" alt=""></div>` : base.art ? `<svg class="cover-art" viewBox="0 0 900 700" aria-hidden="true">${ART[base.art](lang, s.labels)}</svg>` : '';
    inner = `${bg}<div class="body top-aligned">${eyebrow}<h1>${rich(s.title)}</h1>${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}${base.img ? shot(base.img, lang, base.h || 520, base.w) : ''}</div>`;
  } else if (type === 'point') {
    inner = `<div class="body">${base.num ? `<div class="num">${base.num}</div>` : ''}${eyebrow}<h2>${rich(s.title)}</h2>${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}${visual}</div>`;
  } else if (type === 'list') {
    inner = `<div class="body">${eyebrow}<h2 style="margin-top:${eyebrow ? 26 : 0}px">${rich(s.title)}</h2><ul class="list">${s.items.map((it, k) => `<li><span class="tick${base.mark === '✗' ? ' x' : ''}">${base.numbered ? k + 1 + (base.start || 0) : (base.mark || '✓')}</span><span>${rich(it)}</span></li>`).join('')}</ul></div>`;
  } else if (type === 'myth') {
    inner = `<div class="body">${eyebrow}${s.title ? `<h2>${rich(s.title)}</h2>` : ''}<div class="mr"><div class="m"><b>${lang === 'ar' ? 'الخرافة' : 'Myth'}</b><p>${rich(s.myth)}</p></div><div class="r"><b>${lang === 'ar' ? 'الواقع' : 'Reality'}</b><p>${rich(s.reality)}</p></div></div></div>`;
  } else if (type === 'poll' || type === 'question') {
    inner = `<div class="body">${eyebrow}<h1>${rich(s.title)}</h1>${s.options ? `<div class="opts">${s.options.map(o => `<span>${esc(o)}</span>`).join('')}</div>` : ''}${type === 'question' ? `<div class="ask">${esc(s.prompt || (lang === 'ar' ? 'اكتب جوابك هنا' : 'Type your answer here'))}</div>` : ''}</div>`;
  } else if (type === 'chatlog') {
    // stylised group chat: s.group = name, s.msgs = [[time, text, me?], ...]
    inner = `<div class="body">${eyebrow}<div class="chat"><div class="chat-h"><span class="av"></span><b>${esc(s.group)}</b></div>${s.msgs.map(m => `<div class="msg${m[2] ? ' me' : ''}"><p>${esc(m[1])}</p><time>${esc(m[0])}</time></div>`).join('')}</div>${s.title ? `<h2 style="margin-top:44px">${rich(s.title)}</h2>` : ''}${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}</div>`;
  } else if (type === 'files') {
    // stylised folder listing: s.folder, s.files = [name, ...]; the last one is highlighted
    inner = `<div class="body">${eyebrow}<div class="folder"><div class="folder-h">📁 ${esc(s.folder)}</div>${s.files.map((f, k, all) => `<div class="file${k === all.length - 1 ? ' hot' : ''}"><span class="xl">X</span><span>${esc(f)}</span></div>`).join('')}</div>${s.title ? `<h2 style="margin-top:44px">${rich(s.title)}</h2>` : ''}${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}</div>`;
  } else if (type === 'email') {
    // stylised email: s.to, s.subject, s.lines = [paragraph, ...]
    inner = `<div class="body">${eyebrow}${s.title ? `<h2 style="margin:${eyebrow ? 26 : 0}px 0 40px">${rich(s.title)}</h2>` : ''}<div class="mail"><div class="mail-h"><span>${lang === 'ar' ? 'إلى' : 'To'}: <b>${esc(s.to)}</b></span><span>${lang === 'ar' ? 'الموضوع' : 'Subject'}: <b>${esc(s.subject)}</b></span></div>${s.lines.map(l => `<p>${rich(l)}</p>`).join('')}</div></div>`;
  } else if (type === 'term') {
    inner = `<div class="body">${eyebrow}<h1 style="margin-top:26px">${rich(s.title)}</h1><p class="sub" style="font-size:40px;color:inherit;opacity:.9">${rich(s.sub)}</p><div class="why"><b>${lang === 'ar' ? 'لماذا يهم' : 'Why it matters'}</b><p>${rich(s.why)}</p></div></div>`;
  } else if (type === 'cta') {
    const bg = `<div class="bg-art"><img src="../../_brand/site/${lang}-${base.bgimg || 'hero-island'}.png" alt=""></div>`;
    inner = `${bg}<div class="body top-aligned">${eyebrow}<h1>${rich(s.title)}</h1>${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}<span class="cta">${esc(s.button || t.cta)}</span></div>`;
    return `<section class="${cls}"><div class="dots"></div>${top}${inner}<div class="foot"><span class="tagnote">${t.demo}</span></div></section>`;
  } else { // statement
    inner = `<div class="body">${eyebrow}<h2 style="margin-top:${eyebrow ? 26 : 0}px">${rich(s.title)}</h2>${s.sub ? `<p class="sub">${rich(s.sub)}</p>` : ''}${visual}</div>`;
  }
  return `<section class="${cls}"><div class="dots"></div>${top}${inner}${foot}</section>`;
}

function page(item, lang, isStory) {
  const slides = item[lang].slides, base = item.en.slides;
  const html = slides.map((s, k) => slide(s, base[k], lang, k + 1, slides.length, isStory, item.standalone)).join('\n');
  return `<!doctype html>
<html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>
<head>
<meta charset="utf-8">
<title>${esc(item.id)} · ${esc(item[lang].title || item.title)}</title>
<link rel="stylesheet" href="../../_brand/stacko.css">
<link rel="stylesheet" href="../../_brand/templates.css">
<style>/* SVG text runs right-to-left here, so text-anchor="start" means the right edge */</style>
</head>
<body>
<!-- Generated from copy.json. Edit the text here, or edit copy.json and rebuild. Each <section> is one frame. -->
${html}
</body>
</html>
`;
}

function render(htmlFile, outDir, prefix) {
  fs.rmSync(outDir, { recursive: true, force: true });
  execFileSync('node', [path.join(TOOLS, 'render.js'), 'shots', htmlFile, outDir, '.slide', prefix], { stdio: 'inherit' });
}

const [mode, dirArg] = process.argv.slice(2);
const dir = path.resolve(dirArg);
const item = JSON.parse(fs.readFileSync(path.join(dir, 'copy.json'), 'utf8'));

// caption.txt: post copy for both languages, plus notes for whoever publishes
const KIND = { carousel: 'Carousel', stories: 'Stories', post: 'Static post' }[mode];
const files = { carousel: 'png-en/ and png-ar/ (1080x1350, post in order)', stories: 'png-en/ and png-ar/ (1080x1920 frames, post in order)', post: `${item.id}_<lang>_<theme>.png (1080x1350) and matching .pptx for Canva` }[mode];
fs.writeFileSync(path.join(dir, 'caption.txt'), [
  `${item.id} · ${KIND} · ${item.date || ''}`.trim(), `Title: ${item.title}`, `Files: ${files}`, '',
  'CAPTION · EN', item.caption.en, '', item.tags?.en || '#Stacko #InventoryManagement #WarehouseManagement', '',
  'CAPTION · AR', item.caption.ar, '', item.tags?.ar || '#ستاكو #إدارة_المخزون #المستودعات #Stacko',
  ...(item.notes ? ['', 'NOTES', ...item.notes.map(n => `- ${n}`)] : []), ''].join('\n'));

if (mode === 'carousel' || mode === 'stories') {
  const story = mode === 'stories';
  for (const lang of ['en', 'ar']) {
    const f = path.join(dir, `index-${lang}.html`);
    fs.writeFileSync(f, page(item, lang, story));
    render(f, path.join(dir, `png-${lang}`), story ? 'frame' : 'slide');
  }
} else if (mode === 'post') {
  const tpl = fs.readFileSync(path.join(TOOLS, 'post-template.html'), 'utf8');
  const icons = (item.icons || ['warehouse', 'map', 'search']).map(k => ICONS[k] || ICONS.check);
  const T = {};
  for (const lang of ['en', 'ar']) {
    const c = item[lang];
    T[lang] = { wm: L[lang].wm, eyebrow: esc(c.eyebrow), h1: rich(c.h1), p1: esc(c.points[0]), p2: esc(c.points[1]), p3: esc(c.points[2]), cta: L[lang].cta,
      note: { dark: (item.art?.dark || 'hero-island').includes('hero') ? L[lang].demo : L[lang].app, light: L[lang].app } };
  }
  const html = tpl.replace('__ID__', esc(item.id)).replace('__TITLE__', esc(item.title))
    .replace('__IC1__', icons[0]).replace('__IC2__', icons[1]).replace('__IC3__', icons[2])
    .replace('__T__', JSON.stringify(T)).replace('__ART__', JSON.stringify(item.art || { dark: 'hero-island', light: 'app' }))
    .replace('__PHONE__', JSON.stringify(!!item.phone));
  const f = path.join(dir, 'post.html');
  fs.writeFileSync(f, html);
  const tmp = path.join(require('os').tmpdir(), 'stacko-layers');
  for (const lang of ['en', 'ar']) for (const theme of ['dark', 'light']) {
    const out = path.join(tmp, `${item.id}-${lang}-${theme}`);
    execFileSync('node', [path.join(TOOLS, 'render.js'), 'layers', `${f}?lang=${lang}&theme=${theme}`, out], { stdio: 'inherit' });
    fs.copyFileSync(path.join(out, 'post.png'), path.join(dir, `${item.id}_${lang}_${theme}.png`));
    execFileSync('python', ['-I', path.join(TOOLS, 'pptx_build.py'), out, path.join(dir, `${item.id}_${lang}_${theme}.pptx`)], { stdio: 'inherit' });
  }
}
