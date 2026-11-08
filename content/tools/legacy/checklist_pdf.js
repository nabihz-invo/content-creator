// node checklist_pdf.js <checklist.json> <outDir>  -> checklist-en.pdf, checklist-ar.pdf
const fs = require('fs'), path = require('path'), { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BRAND = 'C:/nabih/projects/AIphin/Stacko/content/_brand';
const [, , src, out] = process.argv;
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
const svg = fs.readFileSync(path.join(BRAND, 'mark-on-light.svg'), 'utf8');

const T = {
  en: {
    eyebrow: 'Free checklist', title: 'The stock <em>audit checklist.</em>',
    intro: '25 questions across 5 areas. Answer each one honestly for your setup today: Yes, Partly or No.',
    cols: ['Yes', 'Partly', 'No'], how: 'How to read your answers',
    steps: ['Count the “No” answers in each area.', 'The area with the most “No” answers is where problems are most likely hiding.', 'Start there. “Partly” answers are next.'],
    ctaT: 'Want a second opinion on your answers?', ctaS: 'Book a meeting with our team. We\'ll walk through it with you.',
    tag: 'Your stock, always in sight.', wm: '<span class="wm">stack<i>o</i></span>'
  },
  ar: {
    eyebrow: 'قائمة مجانية', title: 'قائمة <em>تدقيق المخزون.</em>',
    intro: '25 سؤالاً في 5 محاور. أجب عن كل سؤال بصراحة عن وضعك اليوم: نعم، جزئياً، أو لا.',
    cols: ['نعم', 'جزئياً', 'لا'], how: 'كيف تقرأ إجاباتك',
    steps: ['احسب إجابات «لا» في كل محور.', 'المحور الذي فيه أكثر إجابات «لا» هو المكان الأرجح لوجود المشاكل.', 'ابدأ منه، ثم انتقل إلى إجابات «جزئياً».'],
    ctaT: 'تريد رأياً ثانياً في إجاباتك؟', ctaS: 'احجز اجتماعاً مع فريقنا ونراجعها معك.',
    tag: 'مخزونك دايماً قدّام عينك', wm: '<span class="wm-ar">ستاكو</span>'
  }
};

function html(lang) {
  const t = T[lang], areas = data[lang], rtl = lang === 'ar';
  let n = 0;
  const blocks = Object.entries(areas).map(([area, qs], ai) => `
    <section class="area"><h2><span class="num">0${ai + 1}</span>${area}</h2>
      <table><thead><tr><th></th>${t.cols.map(c => `<th class="c">${c}</th>`).join('')}</tr></thead><tbody>
      ${qs.map(q => `<tr><td class="q"><b>${++n}.</b> ${q}</td>${t.cols.map(() => '<td class="c"><i class="box"></i></td>').join('')}</tr>`).join('')}
      </tbody></table></section>`).join('');
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///${BRAND}/stacko.css"><style>
@page{size:A4;margin:14mm 14mm 16mm}
body{background:#fff;color:var(--abyss);font-size:10.5pt;margin:0}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid var(--glow);padding-bottom:8px}
.brand{display:flex;align-items:center;gap:8px;font-size:18pt}.brand svg{width:26px;height:26px}
.tag{color:var(--ink2);font-size:9pt}
.eyebrow,html[lang=ar] .eyebrow{font-size:8.5pt;margin-top:16px}
h1{font-size:24pt;margin:4px 0 6px;letter-spacing:-.02em;line-height:1.1}h1 em{font-style:normal;color:var(--signal)}
.intro{color:var(--ink2);margin:0 0 10px}
.area{break-inside:avoid;margin-top:12px}
h2{font-size:13pt;margin:0 0 4px;display:flex;align-items:center;gap:8px}
.num{background:var(--abyss);color:var(--glow);border-radius:6px;padding:2px 7px;font-size:10pt}
table{width:100%;border-collapse:collapse}
th{font-size:8pt;color:var(--ink2);font-weight:600;padding:2px 0}
td{border-top:1px solid #dbe6ee;padding:6px 0;vertical-align:middle}
td.q{padding-${rtl ? 'left' : 'right'}:10px}td.q b{color:var(--signal)}
.c{width:46px;text-align:center}
.box{display:inline-block;width:13px;height:13px;border:1.5px solid var(--ocean);border-radius:3px}
.how{break-inside:avoid;margin-top:16px;background:var(--paper);border-radius:10px;padding:12px 16px}
.how h3{margin:0 0 6px;font-size:12pt}.how ol{margin:0;padding-${rtl ? 'right' : 'left'}:18px}.how li{margin:3px 0}
.cta{break-inside:avoid;margin-top:12px;background:var(--abyss);color:#fff;border-radius:10px;padding:14px 16px}
.cta b{display:block;font-size:13pt;color:var(--glow)}.cta span{color:var(--dolphin)}
</style></head><body>
<header><div class="brand">${svg}${t.wm}</div><div class="tag">${t.tag}</div></header>
<div class="eyebrow">${t.eyebrow}</div><h1>${t.title}</h1><p class="intro">${t.intro}</p>
${blocks}
<div class="how"><h3>${t.how}</h3><ol>${t.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
<div class="cta"><b>${t.ctaT}</b><span>${t.ctaS}</span></div>
</body></html>`;
}

(async () => {
  const b = await chromium.launch({ executablePath: EDGE });
  const p = await b.newPage();
  for (const lang of ['en', 'ar']) {
    const f = path.join(require('os').tmpdir(), `checklist-${lang}.html`);
    fs.writeFileSync(f, html(lang));
    await p.goto('file:///' + f.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 60000 });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(out, `checklist-${lang}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('wrote', lang);
  }
  await b.close();
})();
