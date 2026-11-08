// v2 builder for content/<ID>/copy.json (Stacko_Content_Plan_Review_v2.xlsx, route A / F / G / L).
//   node build2.js <itemDir> [--no-render]
// Writes index-en.html, index-ar.html, en/slide-NN.png, ar-needs-native-review/slide-NN.png,
// caption_en.txt, caption_ar.txt, hashtags.txt (and subtitles.srt when copy.json has "srt").
// copy.json: { id, size: "portrait"|"square"|"story", standalone?, slides: [ {type, theme?, art?, icon?, num?,
//   img?: {name, src?: "site"|"app", h?, w?}, bg?, concept?, numbered?, mark?, en: {...}, ar: {...}} ],
//   caption: {en, ar}, hashtags, srt? }
// Text fields: eyebrow, title, lead, body (string|[...]), items [...], myth, reality, rows [[...]], quote, who,
// micro, source, button. Write *word* to highlight.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { esc, ART, ICONS } = require('./art.js');
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>');
const TOOLS = __dirname;

const L = {
  en: { wm: 'stack<i>o</i>', wmClass: 'wm', swipe: 'Swipe →', count: (i, n) => `${i} / ${n}`, cta: 'Book a meeting', concept: 'Concept',
    demo: 'Illustration · demo data', app: 'App view · demo data', source: 'Source', myth: 'Myth', reality: 'Reality' },
  ar: { wm: 'ستاك<i>و</i>', wmClass: 'wm-ar', swipe: 'اسحب ←', count: (i, n) => `${i} من ${n}`, cta: 'احجز اجتماعاً', concept: 'مفهوم',
    demo: 'رسم توضيحي · بيانات تجريبية', app: 'واجهة التطبيق · بيانات تجريبية', source: 'المصدر', myth: 'الخرافة', reality: 'الواقع' },
};
const OUT = { en: 'en', ar: 'ar-needs-native-review' };
const arr = v => v == null ? [] : Array.isArray(v) ? v : [v];
const imgSrc = (img, lang) => `../_brand/${img.src === 'app' ? 'app' : 'site-v2'}/${lang}-${img.name}.png`;

function slide(s, lang, i, n, item) {
  const t = L[lang], c = s[lang] || {};
  const type = s.type || 'text';
  const theme = s.theme || (type === 'cover' || type === 'cta' ? 'dark' : 'light');
  const story = item.size === 'story', solo = item.standalone || n === 1;
  const cls = `slide ${theme === 'foam' ? 'light foam' : theme}${story ? ' story' : item.size === 'square' ? ' sq' : ''}`;
  const pill = s.concept ? `<span class="pill">${t.concept}</span>` : '';
  const top = `<div class="top"><div class="brand"><img src="../_brand/stacko-mark.svg" alt=""><span class="${t.wmClass}">${t.wm}</span></div>${story || solo ? '' : `<span class="count">${t.count(i, n)}</span>`}</div>`;
  const eyebrow = c.eyebrow ? `<span class="eyebrow">${esc(c.eyebrow)}</span>` : '';
  const title = (tag) => c.title ? `<${tag}>${rich(c.title)}</${tag}>` : '';
  const lead = c.lead ? `<p class="lead">${rich(c.lead)}</p>` : '';
  const body = arr(c.body).length ? `<div class="txt">${arr(c.body).map(p => `<p>${rich(p)}</p>`).join('')}</div>` : '';
  const items = arr(c.items).length ? `<ul class="list">${c.items.map((it, k) => `<li><span class="tick${s.mark === '✗' ? ' x' : ''}">${s.numbered ? k + 1 + (s.start || 0) : (s.mark || '✓')}</span><span>${rich(it)}</span></li>`).join('')}</ul>` : '';
  const iconEl = s.icon ? `<div class="icon">${ICONS[s.icon] || ICONS.check}</div>` : '';
  const numEl = c.num || s.num ? `<div class="num">${esc(c.num || s.num)}</div>` : '';
  let visual = '';
  if (s.art) visual = `<div class="vis"><div class="art"><svg viewBox="0 0 900 380" aria-hidden="true">${ART[s.art](lang, c.labels)}</svg></div>${pill}</div>`;
  else if (s.img) visual = `<div class="shot" style="height:${s.img.h || 520}px${s.img.w ? `;width:${s.img.w}px` : ''}"><img src="${imgSrc(s.img, lang)}" alt="">${pill}</div>`;
  const tag = s.img ? `<span class="tagnote">${s.img.src === 'app' ? t.app : t.demo}</span>` : (s.art && s.concept ? '' : '');
  const notes = [c.micro ? `<span class="micro">${rich(c.micro)}</span>` : '', c.source ? `<span class="source">${t.source}: ${esc(c.source)}</span>` : '', tag,
    !visual && s.concept ? `<span class="tagnote">${t.concept}</span>` : ''].filter(Boolean).join('');
  const foot = `<div class="foot"><div class="notes">${notes}</div>${i === n || story || solo ? '' : `<span class="swipe">${t.swipe}</span>`}</div>`;
  let inner;
  if (type === 'cover') {
    const ambient = ['cubes', 'network', 'fog'].includes(s.art);
    const bg = s.bg ? `<div class="bg-art"><img src="../_brand/site-v2/${lang}-${s.bg}.png" alt=""></div>` : s.art && ambient ? `<svg class="cover-art" viewBox="0 0 900 700" aria-hidden="true">${ART[s.art](lang, c.labels)}</svg>` : '';
    inner = `${bg}<div class="body top-aligned">${eyebrow}${title('h1')}${lead}${body}${items}${s.img || (s.art && !ambient) ? visual : ''}</div>`;
    if (s.bg && s.concept) inner += `<span class="pill" style="top:auto;bottom:150px">${t.concept}</span>`;
  } else if (type === 'cta') {
    const bg = `<div class="bg-art${s.faded ? ' faded' : ''}"><img src="../_brand/site-v2/${lang}-${s.bg || 'hero-island'}.png" alt=""></div>`;
    inner = `${bg}<div class="body top-aligned">${eyebrow}${title('h1')}${lead}${body}${items}<span class="cta">${esc(c.button || t.cta)}</span>${c.micro ? `<p class="ctamicro">${rich(c.micro)}</p>` : ''}</div>`;
    const ctaNotes = [c.source ? `<span class="source">${t.source}: ${esc(c.source)}</span>` : '', `<span class="tagnote">${s.concept ? t.concept + ' · ' : ''}${t.demo}</span>`].join('');
    return `<section class="${cls}"><div class="dots"></div>${top}${inner}<div class="foot"><div class="notes">${ctaNotes}</div></div></section>`;
  } else if (type === 'myth') {
    inner = `<div class="body">${eyebrow}${title('h2')}<div class="cards"><div class="m"><b>${c.mythLabel || t.myth}</b><p>${rich(c.myth)}</p></div><div class="r"><b>${c.realityLabel || t.reality}</b><p>${rich(c.reality)}</p></div></div></div>`;
  } else if (type === 'compare') {
    inner = `<div class="body">${eyebrow}${title('h2')}<div class="cmp">${c.rows.map(r => `<div class="row">${r.map(x => `<span>${rich(x)}</span>`).join('')}</div>`).join('')}</div>${body}</div>`;
  } else if (type === 'chatlog') {
    // stylised group chat: c.group, c.msgs = [[time, text, me?], ...]
    inner = `<div class="body">${eyebrow}<div class="chat"><div class="chat-h"><span class="av"></span><b>${esc(c.group)}</b></div>${c.msgs.map(m => `<div class="msg${m[2] ? ' me' : ''}"><p>${esc(m[1])}</p><time>${esc(m[0])}</time></div>`).join('')}</div>${title('h2')}${lead}</div>`;
  } else if (type === 'files') {
    // stylised folder listing: c.folder, c.files; s.hot = index of the highlighted file
    inner = `<div class="body">${eyebrow}<div class="folder"><div class="folder-h">${esc(c.folder)}</div>${c.files.map((f, k) => `<div class="file${k === s.hot ? ' hot' : ''}"><span class="xl">X</span><span>${esc(f)}</span></div>`).join('')}</div>${title('h2')}${lead}</div>`;
  } else if (type === 'email') {
    // stylised email / document: c.to?, c.subject, c.lines = [paragraph, ...], c.list = [...] after line index c.listAt
    const lines = c.lines.map((l, k) => `<p>${rich(l)}</p>${c.list && k === c.listAt ? `<ol>${c.list.map(x => `<li>${rich(x)}</li>`).join('')}</ol>` : ''}`).join('');
    inner = `<div class="body">${eyebrow}<div class="mail"><div class="mail-h">${c.to ? `<span>${lang === 'ar' ? 'إلى' : 'To'}: <b>${esc(c.to)}</b></span>` : ''}<span>${lang === 'ar' ? 'الموضوع' : 'Subject'}: <b>${esc(c.subject)}</b></span></div>${lines}</div>${title('h2')}${lead}</div>`;
  } else if (type === 'quad') {
    // four blocks: c.quads = [[label, line, line...], ...]
    inner = `<div class="body top-aligned">${eyebrow}${title('h1')}${lead}<div class="quad">${c.quads.map(q => `<div><b>${esc(q[0])}</b>${q.slice(1).map(x => `<p>${rich(x)}</p>`).join('')}</div>`).join('')}</div>${s.cta ? `<span class="cta">${esc(c.button || t.cta)}</span>` : ''}</div>`;
  } else if (type === 'quote') {
    inner = `<div class="body">${eyebrow}<p class="quote">${rich(c.quote)}</p>${c.who ? `<p class="txt" style="margin-top:30px"><span style="font-size:30px;font-weight:600">${esc(c.who)}</span></p>` : ''}${body}</div>`;
  } else {
    const solo = !c.lead && !arr(c.body).length && !arr(c.items).length && !visual ? ' solo' : '';
    inner = `<div class="body${solo}">${numEl || iconEl ? `<div class="mark">${iconEl}${numEl}</div>` : ''}${eyebrow}${title(type === 'big' ? 'h1' : 'h2')}${lead}${body}${items}${visual}</div>`;
  }
  return `<section class="${cls}"><div class="dots"></div>${top}${inner}${foot}</section>`;
}

// shrink text inside any slide whose content overflows (exact sheet copy can run long)
const FIT = `<script>document.fonts.ready.then(()=>{document.querySelectorAll('.slide').forEach(s=>{const b=s.querySelector('.body');if(!b)return;let k=1;const els=[...b.querySelectorAll('h1,h2,.lead,.txt p,.list li,.cards p,.cmp span,.quote,.mail p,.mail li,.quad p,.msg p,.file')];const base=els.map(e=>parseFloat(getComputedStyle(e).fontSize));while(b.scrollHeight>b.clientHeight+2&&k>.55){k-=.03;els.forEach((e,i)=>e.style.fontSize=base[i]*k+'px');}if(b.scrollHeight>b.clientHeight+2)s.setAttribute('data-overflow','1');});document.body.setAttribute('data-fit','1');});</script>`;

function page(item, lang) {
  const n = item.slides.length;
  return `<!doctype html>
<html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>
<head>
<meta charset="utf-8">
<title>${esc(item.id)} · ${lang.toUpperCase()}${lang === 'ar' ? ' (needs native review)' : ''}</title>
<link rel="stylesheet" href="../_brand/stacko.css">
<link rel="stylesheet" href="../_brand/fonts/fonts.css">
<link rel="stylesheet" href="../_brand/templates-v2.css">
</head>
<body>
<!-- Generated from copy.json by build2.js. Each <section> is one frame. -->
${item.slides.map((s, k) => slide(s, lang, k + 1, n, item)).join('\n')}
${FIT}
</body>
</html>
`;
}

const dir = path.resolve(process.argv[2]);
const item = JSON.parse(fs.readFileSync(path.join(dir, 'copy.json'), 'utf8'));
fs.writeFileSync(path.join(dir, 'caption_en.txt'), item.caption.en.trim() + '\n');
fs.writeFileSync(path.join(dir, 'caption_ar.txt'), item.caption.ar.trim() + '\n');
fs.writeFileSync(path.join(dir, 'hashtags.txt'), (item.hashtags || '#Stacko').trim() + '\n');
if (item.srt) fs.writeFileSync(path.join(dir, 'subtitles.srt'), item.srt);
for (const [f, txt] of Object.entries(item.extra || {})) fs.writeFileSync(path.join(dir, f), txt);
for (const lang of ['en', 'ar']) {
  const f = path.join(dir, `index-${lang}.html`);
  fs.writeFileSync(f, page(item, lang));
  if (process.argv.includes('--no-render')) continue;
  const out = path.join(dir, OUT[lang]);
  fs.rmSync(out, { recursive: true, force: true });
  execFileSync('node', [path.join(TOOLS, 'render.js'), 'shots', f, out, '.slide', item.size === 'story' ? 'frame' : 'slide'], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, LOCAL_FONTS: '1' } });
}
console.log(item.id, 'built');
