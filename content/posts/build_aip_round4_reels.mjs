// Round 4 Aiphin reels (12 Nov 2026): AIP-10, 13, 15, 16, 18, 20, 22, 24.
// Run from content/: node posts/build_aip_round4_reels.mjs [AIP-10 ...]
// Aiphin kit (aiphin-reel.js helpers), Modern Standard Arabic, no phone number, no comment asks.
// Poses/scenes the plan asked for that don’t exist yet (PR-09..12, SC-03..05) are replaced by existing poses and HTML.
// AIP-15 plays the finished Stacko reels (IDEA-232, D30-12 MP4s, gitignored): render on a PC that has them.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const POSTS = dirname(fileURLToPath(import.meta.url));
const HEAD = (title, note) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<!-- Round 4 (12 Nov 2026), built by posts/build_aip_round4_reels.mjs. ${note} -->
<script src="/assets/map-elements/stacko-map-elements.js"></script>
<script src="/studio/engine/sm-core.js"></script>
<script src="/studio/engine/sm-components.js"></script>
<script src="/studio/engine/sm-app.js"></script>
<script src="/brands/aiphin/reel/aiphin-reel.js"></script>
</head><body><script>
const R = SM.reel({ title: ${JSON.stringify(title)} });
const ar = SM.ar(), T = SM.t;
const SCR = (n) => \`/assets/screens/website-v2/\${ar ? 'ar' : 'en'}-\${n}.png\`;
const DIR = ar ? 'rtl' : 'ltr';
const card = (inner, w = 900) => \`<div dir="\${DIR}" style="width:\${w}px;background:#fff;border-radius:32px;padding:30px 36px;box-shadow:0 26px 70px rgba(3,9,18,.45);font-family:'Readex Pro','Noto Kufi Arabic',sans-serif;color:#0E2440">\${inner}</div>\`;
const shot = (n, w = 940, extra = '') => \`<img src="\${SCR(n)}" style="width:\${w}px;display:block;border-radius:30px;box-shadow:0 40px 100px rgba(0,0,0,.5);\${extra}">\`;
`;
const TAIL = (music, cover) => `
R.grain(.03).vignette(.4).safe();
R.audio({ music: '/assets/audio/music/${music}', musicVolume: .4, lufs: -14, sfxVolume: .5 });
R.cover(${cover});
</script></body></html>
`;

const REELS = {
  "AIP-10": ["2026-12", "who-makes-this-content", "AIP-10 · Who makes this content?",
    "Five steps on a board (HTML, no client names). PR-08 celebrating at the close.", `
const a = R.scene(3, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('This reel went through\\n*5 steps* before you saw it.', 'هذا الفيديو مرّ\\n*بخمس مراحل* قبل أن يصلك.'), { y: 520, size: ar ? 70 : 64, fx: 'rise', at: .1 });
AIP.fin(a, 'PR-03.png', { w: 640, y: 1280, at: .2, mirror: ar });
const steps = [[T('Idea', 'الفكرة'), T('from the monthly plan', 'من الخطة الشهرية')], [T('Script', 'النص'), T('English and Arabic, written natively', 'بالعربية والإنجليزية، مكتوب بأصله')],
  [T('Design', 'التصميم'), T('reels and carousels, on brand', 'فيديوهات ومنشورات بهوية العلامة')], [T('Approval', 'الموافقة'), T('the client approves every piece', 'العميل يوافق على كل قطعة')], [T('Publish', 'النشر'), T('scheduled, then a performance review', 'جدولة، ثم مراجعة للأداء')]];
const b = R.scene(9, { in: 'push-up', bg: AIP.NIGHT, name: 'board' });
AIP.head(b, T('How we make *a month of content.*', 'كيف نصنع *شهرًا من المحتوى.*'), { y: 320, size: ar ? 58 : 52, fx: 'rise', at: .05 });
steps.forEach(([t, s], i) => b.html(card(\`<div style="display:flex;align-items:center;gap:22px"><span style="flex:none;width:64px;height:64px;border-radius:50%;background:#0895A6;color:#fff;display:grid;place-items:center;font:400 30px/1 Audiowide">\${i + 1}</span><div><b style="font-size:38px">\${t}</b><div style="font-size:28px;color:#2C5974;margin-top:4px">\${s}</div></div></div>\`, 900), { x: 540, y: 620 + i * 230, in: 'rise', at: .4 + i * 1.3 }));
const c = R.scene(3.2, { in: 'blur', bg: AIP.NIGHT, name: 'line' });
AIP.head(c, T('Deciding what’s worth posting\\nis the hard part.\\n*We do that part too.*', 'تحديد ما يستحقّ النشر\\nهو الجزء الصعب.\\n*ونحن نتولّاه أيضًا.*'), { y: 560, size: ar ? 62 : 54, fx: 'rise', at: .1 });
AIP.fin(c, 'PR-08.png', { w: 600, y: 1350, at: .3 });
AIP.endcard(R, { dur: 3.2 });`, "Second_Cup_of_Coffee.mp3", 1.8,
    ["Posting isn’t the hard part. Deciding what’s worth posting is.\n\nWe run your calendar end to end: a monthly plan by topic, carousels, reel scripts and captions written natively in Arabic and English, your approval on every piece, then a review of what worked. One voice, all month.",
     "النشر ليس الجزء الصعب، بل تحديد ما يستحقّ النشر.\n\nندير تقويمك بالكامل: خطة شهرية حسب الموضوع، منشورات متعدّدة ونصوص فيديو وتعليقات مكتوبة بالعربية والإنجليزية بأصلها، موافقتك على كل قطعة، ثم مراجعة لما نجح. صوت واحد طوال الشهر."],
    "#SocialMediaMarketing #ContentCreation #Aiphin #ArabicContent #MENA"],

  "AIP-13": ["2026-12", "still-posting-screenshots", "AIP-13 · Still posting screenshots of your app?",
    "PR-11 doesn’t exist: PR-02 pointing. The flat screenshot then the moving Stacko map (engine recreation of the real UI).", `
const a = R.scene(3, { bg: AIP.NIGHT, name: 'flat' });
AIP.head(a, T('Still posting\\n*screenshots of your app?*', 'ما زلت تنشر\\n*لقطات شاشة لتطبيقك؟*'), { y: 400, size: ar ? 70 : 64, fx: 'rise', at: .1 });
a.html(shot('app', 900, 'filter:saturate(.5)'), { x: 540, y: 1100, in: 'fade', at: .2 });
const b = R.scene(5.4, { in: 'zoom-through', name: 'alive' });
const m = b.map({ intro: 'draw', at: 0, fitH: .5 });
m.header({ y: 330, at: .3 }); m.truck({ from: 'W1', to: 'W2', at: .6, dur: 4.4, eta: 35, qty: 40, item: 'LED Strip 5m' }); m.ship({ at: .4, dur: 4.8, eta: 12 * 1440 });
b.fill('background:linear-gradient(180deg,rgba(14,36,64,0) 72%,rgba(14,36,64,.92) 86%)');
AIP.head(b, T('A video shows *what it does.*', 'الفيديو يُظهر *ما يفعله.*'), { y: 1700, size: ar ? 58 : 52, fx: 'rise', at: .8 });
const c = R.scene(4.6, { in: 'push-up', bg: AIP.NIGHT, name: 'what' });
AIP.head(c, T('Product reels, explainers,\\nbrand motion kits,\\n*a month of content.*', 'فيديوهات منتجات وشروحات\\nوحزم حركة للعلامة\\n*وشهر من المحتوى.*'), { y: 480, size: ar ? 60 : 52, fx: 'rise', at: .1 });
AIP.line(c, T('Every one in English and Arabic. No camera crew. No shoot day.', 'كل ذلك بالعربية والإنجليزية. بلا فريق تصوير ولا يوم تصوير.'), { y: 820, at: .8 });
AIP.fin(c, 'PR-02.png', { w: 620, y: 1320, at: .3, mirror: ar });
AIP.endcard(R, { dur: 3.2, line: T('If it’s on a screen, *we can make it move.*', 'إذا كان على الشاشة، *يمكننا أن نجعله يتحرّك.*') });`, "Paperback_Pages.mp3", 1.6,
    ["A screenshot shows what your product looks like. A video shows what it does.\n\nWe turn your real screens into short product reels, explainers and a month of content, in English and Arabic. No camera crew, no shoot day.\n\nIf it’s on a screen, we can make it move.",
     "لقطة الشاشة تُظهر شكل منتجك. أما الفيديو فيُظهر ما يفعله.\n\nنحوّل شاشاتك الحقيقية إلى فيديوهات قصيرة للمنتج وشروحات وشهر كامل من المحتوى، بالعربية والإنجليزية. بلا فريق تصوير ولا يوم تصوير.\n\nإذا كان على الشاشة، يمكننا أن نجعله يتحرّك."],
    "#Aiphin #MotionGraphics #ProductVideo #SaaSMarketing #MENA #Beirut"],

  "AIP-15": ["2026-12", "built-it-made-it-move", "AIP-15 · We built this product. Then we made it move.",
    "Before/after: the still Stacko screen, then the finished Stacko reels we made (IDEA-232, D30-12 MP4s). Render on a PC that has those MP4s.", `
const a = R.scene(3.2, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('We built this product.\\n*Then we made it move.*', 'بنينا هذا المنتج.\\n*ثم جعلناه يتحرّك.*'), { y: 420, size: ar ? 68 : 62, fx: 'rise', at: .1 });
a.html(shot('app', 900), { x: 540, y: 1100, in: 'rise', at: .3 });
const L = ar ? 'AR' : 'EN';
const clips = [['/posts/unscheduled/IDEA-232_see-stacko-in-action/IDEA-232_' + L + '.mp4', 6, T('The live map', 'الخريطة المباشرة')], ['/posts/2026-12/D30-12_container-shenzhen-way/D30-12_' + L + '.mp4', 4, T('An import, leg by leg', 'شحنة مستوردة، مرحلة بمرحلة')], ['/posts/unscheduled/IDEA-232_see-stacko-in-action/IDEA-232_' + L + '.mp4', 22, T('Invoice to draft', 'من الفاتورة إلى المسودة')]];
clips.forEach(([src, off, lab], i) => {
  const s = R.scene(3.4, { in: i ? 'push-left' : 'zoom-through', bg: src, name: 'clip' + (i + 1) });
  s.bg(src, { offset: off });
  s.text(lab, { y: 1700, size: 46, weight: 600, style: 'pill', fx: 'pop', at: .2 });
});
const d = R.scene(3.4, { in: 'blur', bg: AIP.NIGHT, name: 'yours' });
AIP.head(d, T('Same team. Same engine.\\n*Your product next.*', 'الفريق نفسه. المحرّك نفسه.\\n*منتجك هو التالي.*'), { y: 620, size: ar ? 62 : 56, fx: 'rise', at: .1 });
AIP.fin(d, 'PR-02.png', { w: 600, y: 1350, at: .3, mirror: ar });
AIP.endcard(R, { dur: 3.2, line: T('If it’s on a screen, *we can make it move.*', 'إذا كان على الشاشة، *يمكننا أن نجعله يتحرّك.*') });`, "Second_Cup_of_Coffee.mp3", 1.6,
    ["Stacko is a product by Aiphin. We built it, then we made every video for it, from the live map to the logo.\n\nSame team, same engine, your product next.",
     "ستاكو منتج من أيفِن. بنيناه، ثم صنعنا كل فيديوهاته، من الخريطة المباشرة إلى الشعار.\n\nالفريق نفسه، المحرّك نفسه، ومنتجك هو التالي."],
    "#Aiphin #Stacko #MotionGraphics #ProductVideo #BeforeAndAfter #MENA"],

  "AIP-16": ["2026-12", "one-idea-two-languages", "AIP-16 · One idea. 20 seconds. Two languages.",
    "SC-04 (storyboard desk) doesn’t exist: brief card, storyboard frames and the Stacko map in HTML. EN and AR versions shown side by side.", `
const a = R.scene(2.8, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('One idea.\\n20 seconds.\\n*Two languages.*', 'فكرة واحدة.\\n20 ثانية.\\n*لغتان.*'), { y: 760, size: ar ? 84 : 78, fx: 'rise', at: .1 });
const b = R.scene(3.4, { in: 'push-up', bg: AIP.NIGHT, name: 'brief' });
AIP.head(b, T('1. The brief', '1. الموجز'), { y: 360, size: 64, fx: 'rise', at: .05 });
b.html(card(\`<div style="font-size:24px;font-weight:600;color:#0895A6">\${T('BRIEF', 'الموجز')}</div><div style="font-size:34px;margin-top:12px;line-height:1.6"><b>\${T('Goal', 'الهدف')}:</b> \${T('show the live map', 'عرض الخريطة المباشرة')}<br><b>\${T('Audience', 'الجمهور')}:</b> \${T('importers with several warehouses', 'مستوردون لديهم عدة مستودعات')}<br><b>\${T('Where', 'أين')}:</b> Instagram Reels</div>\`), { x: 540, y: 1000, in: 'rise', at: .3 });
const c = R.scene(3.4, { in: 'push-left', bg: AIP.NIGHT, name: 'board' });
AIP.head(c, T('2. The storyboard', '2. اللوحة القصصية'), { y: 360, size: 64, fx: 'rise', at: .05 });
[0, 1, 2, 3].forEach((i) => c.html(\`<div style="width:420px;height:300px;border-radius:22px;border:3px dashed #79C0DE;background:rgba(14,36,64,.6);display:grid;place-items:center;font:400 40px Audiowide;color:#79C0DE">\${i + 1}</div>\`, { x: 300 + (i % 2) * 480, y: 820 + Math.floor(i / 2) * 360, in: 'pop', at: .3 + i * .35 }));
const d = R.scene(4, { in: 'zoom-through', name: 'anim' });
const m = d.map({ intro: 'draw', at: 0, fitH: .5 }); m.header({ y: 330, at: .3 }); m.truck({ from: 'W1', to: 'W2', at: .5, dur: 3.4, eta: 35, qty: 40, item: 'LED Strip 5m' });
d.text(T('3. The animation', '3. التحريك'), { y: 1720, size: 48, weight: 600, style: 'pill', fx: 'pop', at: .2 });
const e = R.scene(4.4, { in: 'push-up', bg: AIP.NIGHT, name: 'two' });
AIP.head(e, T('4. Two finished versions', '4. نسختان جاهزتان'), { y: 360, size: ar ? 60 : 54, fx: 'rise', at: .05 });
e.html(\`<div style="display:flex;gap:30px;direction:ltr">\${['en', 'ar'].map((l) => \`<div style="text-align:center"><img src="/assets/screens/website-v2/\${l}-phone.png" style="width:400px;border-radius:44px;box-shadow:0 30px 80px rgba(0,0,0,.5)"><div style="font:400 36px Audiowide;color:#2EF2EE;margin-top:16px">\${l === 'en' ? 'EN' : 'AR'}</div></div>\`).join('')}</div>\`, { x: 540, y: 1100, in: 'rise', at: .3 });
AIP.endcard(R, { dur: 3.2 });`, "Paperback_Pages.mp3", 1.6,
    ["Every video we make starts with one idea and ends as two finished versions: English and Arabic, each laid out for its own language.\n\nBrief, storyboard, animation, then both versions.",
     "كل فيديو نصنعه يبدأ بفكرة واحدة وينتهي بنسختين جاهزتين: الإنجليزية والعربية، كل منهما مصمّمة للغتها.\n\nالموجز، اللوحة القصصية، التحريك، ثم النسختان."],
    "#Aiphin #BehindTheScenes #MotionDesign #ArabicContent #ProductVideo #MENA"],

  "AIP-18": ["2026-12", "you-have-one-second", "AIP-18 · You have one second.",
    "Owner rule (no comment asks): 'Comment 1, 2 or 3' replaced by the lesson itself: open with the product already moving.", `
const a = R.scene(2.4, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('You have\\n*one second.*', 'لديك\\n*ثانية واحدة.*'), { y: 860, size: ar ? 110 : 100, fx: 'stamp', at: .1 });
const opens = [[T('Opening 1: a slow logo fade', 'البداية 1: شعار يظهر ببطء'), 'logo'], [T('Opening 2: a question on screen', 'البداية 2: سؤال على الشاشة'), 'q'], [T('Opening 3: the product already moving', 'البداية 3: المنتج يتحرّك من أول لحظة'), 'map']];
opens.forEach(([lab, k], i) => {
  const s = R.scene(3, { in: i ? 'push-left' : 'flash', bg: AIP.NIGHT, name: 'open' + (i + 1) });
  s.text(lab, { y: 300, size: 46, weight: 600, style: 'pill', fx: 'pop', at: .05, w: 980 });
  if (k === 'logo') { const L = s.html(\`<div>\${SM.mark('dark', 260)}</div>\`, { x: 540, y: 1000, in: 'fade', at: .3 }); }
  if (k === 'q') AIP.head(s, T('Do you know where\\nyour stock is?', 'هل تعرف أين\\nبضاعتك؟'), { y: 1000, size: 70, fx: 'fade', at: .4 });
  if (k === 'map') { const m = s.map({ intro: 'drop', at: 0, fitH: .45 }); m.truck({ from: 'W1', to: 'W2', at: .1, dur: 2.8, eta: 35, qty: 40, item: 'LED Strip 5m' }); }
});
const c = R.scene(3.4, { in: 'blur', bg: AIP.NIGHT, name: 'lesson' });
AIP.head(c, T('Open with the product\\n*already moving.*', 'ابدأ والمنتج\\n*يتحرّك من أول لحظة.*'), { y: 620, size: ar ? 66 : 60, fx: 'rise', at: .1 });
AIP.fin(c, 'PR-02.png', { w: 600, y: 1350, at: .3, mirror: ar });
AIP.endcard(R, { dur: 3.2 });`, "Second_Cup_of_Coffee.mp3", 1.0,
    ["Three openings, same video. A slow logo fade, a question on screen, or the product already moving.\n\nThe first second decides whether anyone sees the rest. Open with the product doing something.",
     "ثلاث بدايات للفيديو نفسه: شعار يظهر ببطء، سؤال على الشاشة، أو المنتج يتحرّك من أول لحظة.\n\nالثانية الأولى تحدّد إن كان أحد سيشاهد الباقي. ابدأ والمنتج يفعل شيئًا."],
    "#Aiphin #VideoMarketing #Hooks #MotionGraphics #SocialMediaTips #MENA"],

  "AIP-20": ["2027-01", "one-video-two", "AIP-20 · Hi, I’m Aiphin. Why one video should be two.",
    "PR-09/PR-10 and the Aiphin voice don’t exist yet: PR-01 waving and PR-03 thinking, no voice-over. Crowded two-language frame vs two clean versions.", `
const a = R.scene(3, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('Hi, I’m Aiphin.\\n*Why one video should be two.*', 'مرحبًا، أنا أيفِن.\\n*لماذا يجب أن يكون الفيديو فيديوين؟*'), { y: 440, size: ar ? 62 : 56, fx: 'rise', at: .1 });
AIP.fin(a, 'PR-01.png', { w: 660, y: 1300, at: .2, mirror: ar });
const b = R.scene(4.4, { in: 'push-up', bg: AIP.NIGHT, name: 'crowded' });
AIP.head(b, T('Two languages in one frame…', 'لغتان في إطار واحد…'), { y: 320, size: ar ? 60 : 54, fx: 'rise', at: .05 });
b.html(\`<div style="position:relative;width:860px">\${shot('app', 860)}<div style="position:absolute;left:20px;right:20px;bottom:20px;background:rgba(0,0,0,.72);color:#fff;border-radius:14px;padding:12px 18px;font:500 26px/1.35 'Readex Pro','Noto Kufi Arabic'">Every warehouse on one live map.<br><span dir="rtl" style="display:block;text-align:right">كل المستودعات على خريطة مباشرة واحدة.</span></div></div>\`, { x: 540, y: 860, in: 'rise', at: .3 });
AIP.line(b, T('…means two half-read captions.', '…يعني ترجمتين لا يقرؤهما أحد كاملتين.'), { y: 1260, at: 1.2 });
AIP.fin(b, 'PR-03.png', { w: 420, y: 1580, at: 1.4, mirror: ar });
const c = R.scene(4.6, { in: 'push-left', bg: AIP.NIGHT, name: 'clean' });
AIP.head(c, T('Each language gets its own\\nlayout, captions and cover.', 'لكل لغة تصميمها\\nوترجمتها وغلافها.'), { y: 360, size: ar ? 60 : 52, fx: 'rise', at: .05 });
c.html(\`<div style="display:flex;gap:30px;direction:ltr">\${['en', 'ar'].map((l) => \`<div style="text-align:center"><img src="/assets/screens/website-v2/\${l}-phone.png" style="width:400px;border-radius:44px;box-shadow:0 30px 80px rgba(0,0,0,.5)"><div style="font:400 36px Audiowide;color:#2EF2EE;margin-top:16px">\${l === 'en' ? 'EN' : 'AR'}</div></div>\`).join('')}</div>\`, { x: 540, y: 1100, in: 'rise', at: .3 });
AIP.endcard(R, { dur: 3.2 });`, "Paperback_Pages.mp3", 1.6,
    ["Two languages in one frame means two half-read captions.\n\nWe make one video into two finished versions, one English and one Arabic, each laid out for how its readers read.",
     "لغتان في إطار واحد تعني ترجمتين لا يقرؤهما أحد كاملتين.\n\nنحوّل الفيديو الواحد إلى نسختين جاهزتين، إنجليزية وعربية، كل منهما مصمّمة لطريقة قراءة جمهورها."],
    "#Aiphin #ArabicContent #Bilingual #VideoMarketing #MENA #Beirut"],

  "AIP-22": ["2027-01", "logo-before-after", "AIP-22 · Your logo, before and after.",
    "Our own logos only (Stacko's Dot core build, Aiphin end card). Lower third and a transition from the same kit.", `
const a = R.scene(2.4, { bg: '#F4F8FA', name: 'before' });
a.text(T('Before', 'قبل'), { y: 400, size: 64, weight: 600, color: '#2C5974', fx: 'fade', at: .05, theme: 'light' });
a.html(\`<div style="display:flex;align-items:center;gap:24px">\${SM.mark('light', 180)}<div style="font-size:110px">\${ar ? SM.wordmarkAr('light') : SM.wordmark('light')}</div></div>\`, { x: 540, y: 960, in: 'none', at: 0 });
const b = R.scene(4.4, { in: 'dots', bg: AIP.NIGHT, name: 'after' });
b.text(T('After', 'بعد'), { y: 400, size: 64, weight: 600, fx: 'fade', at: .05 });
b.logoDots({ from: 'explode', size: 300, x: 540, y: 960, at: .2, dur: 1.8, wordmark: true, tagline: ar ? 'ar' : 'en' });
const c = R.scene(3.4, { in: 'wipe', bg: AIP.NIGHT, name: 'kit' });
AIP.head(c, T('An entrance, an end card,\\nlower thirds, transitions.', 'ظهور وبطاقة ختام\\nوأشرطة أسماء وانتقالات.'), { y: 520, size: ar ? 60 : 52, fx: 'rise', at: .05 });
c.lowerThird({ name: T('Karim', 'كريم'), role: T('Stacko host', 'مقدّم ستاكو'), x: 80, y: 1300, at: .6, until: 3.2 });
const d = R.scene(3, { in: 'blur', bg: AIP.NIGHT, name: 'reuse' });
AIP.head(d, T('Brand motion kit:\\n*reuse it on every video.*', 'حزمة الحركة للعلامة:\\n*أعد استخدامها في كل فيديو.*'), { y: 860, size: ar ? 62 : 56, fx: 'rise', at: .1 });
AIP.endcard(R, { dur: 3.2 });`, "Second_Cup_of_Coffee.mp3", 4.4,
    ["A logo file sits still. A brand motion kit gives it an entrance, an end card, lower thirds and transitions you reuse on every video.",
     "ملف الشعار ثابت. أما حزمة الحركة للعلامة فتمنحه ظهورًا وبطاقة ختام وأشرطة أسماء وانتقالات تعيد استخدامها في كل فيديو."],
    "#Aiphin #LogoAnimation #BrandKit #MotionDesign #MENA"],

  "AIP-24": ["2027-01", "one-screenshot-sample", "AIP-24 · Send us one screenshot. We’ll show you how it moves.",
    "PR-12 doesn’t exist: PR-04 (phone). A plain Stacko screen turns into a 5-second motion sample. The offer is stated, not a button.", `
const a = R.scene(3, { bg: AIP.NIGHT, name: 'hook' });
AIP.head(a, T('Send us one screenshot.\\n*We’ll show you how it moves.*', 'أرسل لنا لقطة شاشة واحدة،\\n*ونُريك كيف تتحرّك.*'), { y: 440, size: ar ? 60 : 54, fx: 'rise', at: .1 });
AIP.fin(a, 'PR-04.png', { w: 620, y: 1300, at: .2, mirror: ar });
const b = R.scene(2.6, { in: 'push-up', bg: AIP.NIGHT, name: 'still' });
b.text(T('Your screenshot', 'لقطة شاشتك'), { y: 360, size: 50, weight: 600, style: 'pill', fx: 'pop', at: .05 });
b.html(shot('app', 900, 'filter:saturate(.5)'), { x: 540, y: 1000, in: 'rise', at: .2 });
const c = R.scene(5.4, { in: 'zoom-through', name: 'sample' });
const m = c.map({ intro: 'draw', at: 0, fitH: .5 }); m.header({ y: 330, at: .3 }); m.truck({ from: 'W1', to: 'W3', at: .5, dur: 4.6, eta: 95, qty: 24, item: 'Desk Lamp' });
c.text(T('A 5-second sample', 'عيّنة من 5 ثوانٍ'), { y: 1720, size: 48, weight: 600, style: 'pill', fx: 'pop', at: .4 });
const d = R.scene(3.2, { in: 'blur', bg: AIP.NIGHT, name: 'offer' });
AIP.head(d, T('One free 5-second sample\\n*per company.*', 'عيّنة مجانية من 5 ثوانٍ\\n*لكل شركة.*'), { y: 860, size: ar ? 62 : 56, fx: 'rise', at: .1 });
AIP.endcard(R, { dur: 3.2 });`, "Paperback_Pages.mp3", 1.6,
    ["Send us one screenshot of your app, site or dashboard. We’ll send back a free 5-second sample of how it could move.\n\nOne free sample per company.",
     "أرسل لنا لقطة شاشة واحدة من تطبيقك أو موقعك أو لوحة التحكّم، ونرسل لك عيّنة مجانية من 5 ثوانٍ تُظهر كيف يمكن أن تتحرّك.\n\nعيّنة مجانية واحدة لكل شركة."],
    "#Aiphin #MotionGraphics #ProductVideo #FreeSample #MENA"],
};

const only = process.argv.slice(2);
for (const [id, [month, slug, title, note, body, music, cover, caps, tags]] of Object.entries(REELS)) {
  if (only.length && !only.includes(id)) continue;
  const dir = join(POSTS, month, `${id}_${slug}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "reel.html"), HEAD(title, note) + body + TAIL(music, cover));
  writeFileSync(join(dir, "caption_en.txt"), caps[0] + "\n");
  writeFileSync(join(dir, "caption_ar.txt"), caps[1] + "\n");
  writeFileSync(join(dir, "hashtags.txt"), tags + "\n");
  writeFileSync(join(dir, "notes.md"), `# ${id} · round 4 reel\n\nreel.html written by posts/build_aip_round4_reels.mjs (12 Nov 2026), Aiphin kit. Arabic is Modern Standard Arabic and needs a native read.\n\n${note}\n`);
  console.log("wrote", `${month}/${id}_${slug}`);
}
