// Round 4 Aiphin statics and carousels (12 Nov 2026): AIP-11, 14, 17, 19, 21, 23.
// Run from content/: node posts/build_aip_round4.mjs [AIP-11 ...]
// Aiphin kit only (brands/aiphin): Night theme, Audiowide / Noto Kufi, Modern Standard Arabic, no phone number.
// Product visuals are real Stacko screens (assets/screens/website-v2), Aiphin's own product. New poses/scenes the plan
// asked for (SC-03/04/05, PR-09..12) don't exist yet, so existing poses or HTML illustrations are used instead.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { page, FLOW_CSS, flow, check } from "../brands/aiphin/post/page.mjs";

const POSTS = dirname(fileURLToPath(import.meta.url));
const T = (l, en, ar) => (l === "ar" ? ar : en);
const IMG = (c) => `/brands/aiphin/assets/post-images/final/${c}`;
const SCR = (l, n) => `/assets/screens/website-v2/${l}-${n}.png`;
const LS = ["en", "ar"];

function post(id, folder, slides, caps, note, tags) {
  const dir = join(POSTS, folder);
  const src = join(dir, "source");
  mkdirSync(src, { recursive: true });
  for (const l of LS) {
    const list = slides(l);
    list.forEach((sd, i) => {
      const N = list.length;
      const name = `${id}${l === "ar" ? "-AR" : ""}${N > 1 ? "-" + String(i + 1).padStart(2, "0") : ""}`;
      writeFileSync(join(src, name + ".html"), page({ id, lang: l, n: i + 1, N, body: sd.body, css: FLOW_CSS + BASE + (sd.css || ""), theme: sd.theme || "night" }));
    });
  }
  writeFileSync(join(dir, "caption_en.txt"), caps[0] + "\n");
  writeFileSync(join(dir, "caption_ar.txt"), caps[1] + "\n");
  writeFileSync(join(dir, "hashtags.txt"), tags + "\n");
  writeFileSync(join(dir, "notes.md"), `# ${id} · round 4\n\nBuilt by posts/build_aip_round4.mjs (12 Nov 2026), Aiphin kit. HTML only; Arabic is Modern Standard Arabic and needs a native read.\n\n${note}\n`);
  console.log("wrote", folder);
}

const BASE = `
.ill{position:absolute;left:64px;right:64px}
.shot{display:block;width:100%;border-radius:22px;box-shadow:0 30px 70px rgba(0,0,0,.45)}
.stat{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.stat .card{position:static;padding:30px 30px 26px}
.stat b{display:block;font:400 76px/1 'Audiowide',sans-serif;color:var(--glow);direction:ltr;text-align:start}
.stat span{display:block;font:400 28px/1.35 var(--font-body);color:var(--visor);margin-top:12px}
.list{display:flex;flex-direction:column;gap:22px}
.steps{display:flex;flex-direction:column;gap:18px}
.step{display:flex;align-items:center;gap:24px;background:rgba(14,36,64,.72);border:2px solid rgba(121,192,222,.35);border-radius:24px;padding:22px 28px;font:400 32px/1.3 var(--font-body)}
.step i{font-style:normal;flex:none;width:64px;height:64px;border-radius:50%;background:var(--signal);display:grid;place-items:center;font:400 30px/1 'Audiowide',sans-serif}
.phonef{width:420px;height:760px;border-radius:56px;background:#08172B;padding:14px;box-shadow:0 50px 120px rgba(0,0,0,.5),0 0 0 3px rgba(121,192,222,.35);overflow:hidden}
.phonef .scr{width:100%;height:100%;border-radius:44px;overflow:hidden;background:#EEF6F9;position:relative}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.cal div{aspect-ratio:1;border-radius:12px;background:rgba(14,36,64,.72);border:1px solid rgba(121,192,222,.25);font:400 18px/1 var(--font-body);color:var(--visor);padding:8px;position:relative}
.cal div.p{background:#2F86B8;color:#fff}.cal div.r{background:var(--signal);color:#fff}
.cal div.p::after,.cal div.r::after{content:attr(data-t);position:absolute;left:8px;bottom:8px;font-size:15px;font-weight:600}
.post[dir=rtl] .cal div.p::after,.post[dir=rtl] .cal div.r::after{left:auto;right:8px}
`;
const finImg = (code, css) => `<img class="fin halo" src="${IMG(code)}" alt="" style="${css}">`;

// ---------------------------------------------------------------- AIP-11
function aip11() {
  post("AIP-11", "2026-12/AIP-11_aiphin-in-numbers", (l) => [{
    body: `${flow(T(l, "What one team<br><em>can do.</em>", "ما يمكن لفريق واحد<br><em>أن يحقّقه.</em>"), T(l, "Strategy, build and support under one contract.", "الاستراتيجية والتنفيذ والدعم ضمن عقد واحد."), 190)}
      ${finImg("PR-08.png", `width:430px;top:470px;${l === "ar" ? "left:20px" : "right:20px"}`)}
      <div class="ill stat" style="top:440px;${l === "ar" ? "left:470px" : "right:470px"};grid-template-columns:1fr;gap:16px">
        ${[["40+", T(l, "automation and platform projects delivered", "مشروع أتمتة ومنصّات منجَز")], [T(l, "4.2 hrs", "4.2"), T(l, "saved per employee each week", "ساعات موفّرة لكل موظف أسبوعيًا")],
           ["68%", T(l, "of routine tickets answered without a human", "من الطلبات الروتينية يُجاب عنها دون تدخّل بشري")], [T(l, "6 weeks", "6"), T(l, "typically, from diagnosis to first live workflow", "أسابيع عادةً من التشخيص إلى أول سير عمل فعّال")]]
          .map(([n, t]) => `<div class="card"><b>${n}</b><span>${t}</span></div>`).join("")}
      </div>`,
    css: `.stat .card{padding:22px 26px 20px}.stat b{font-size:62px}.stat span{font-size:25px;margin-top:8px}`,
  }], ["40+ automation and platform projects delivered.\n4.2 hours saved per employee each week.\n68% of routine tickets answered without a human.\n6 weeks, typically, from diagnosis to first live workflow.\n\nOne team: strategy, build and support under one contract.",
       "أكثر من 40 مشروع أتمتة ومنصّات منجَزة.\n4.2 ساعات موفّرة لكل موظف أسبوعيًا.\n68% من الطلبات الروتينية يُجاب عنها دون تدخّل بشري.\n6 أسابيع عادةً من التشخيص إلى أول سير عمل فعّال.\n\nفريق واحد: الاستراتيجية والتنفيذ والدعم ضمن عقد واحد."],
    "The four approved proof points from the aiphin-brand skill only. PR-08 (celebrating) is the pose the plan asked for.", "#Aiphin #Results #Automation #AIagency #MENA");
}

// ---------------------------------------------------------------- AIP-14
function aip14() {
  post("AIP-14", "2026-12/AIP-14_screenshots-dont-sell", (l) => {
    const h = (en, ar, s_en, s_ar) => flow(T(l, en, ar), T(l, s_en, s_ar), 190);
    const shot = (n, css = "") => `<img class="shot" src="${SCR(l, n)}" alt="" style="${css}">`;
    return [
      { body: `${h("5 reasons screenshots<br><em>don't sell your software.</em>", "5 أسباب تجعل لقطات الشاشة<br><em>لا تبيع برنامجك.</em>", "Your product works. The screenshot of it doesn't.", "منتجك يعمل. لكن لقطة الشاشة لا تُظهر ذلك.")}
          <div class="ill" style="top:600px;display:flex;justify-content:center"><div class="phonef"><div class="scr">${shot("app", "border-radius:0;box-shadow:none;margin-top:120px;filter:saturate(.6)")}<div style="position:absolute;left:0;right:0;top:0;height:110px;background:#fff;border-bottom:1px solid #E1EAF0"></div></div></div></div>
          ${finImg("PR-03.png", `width:330px;top:780px;${l === "ar" ? "right:20px;transform:scaleX(-1)" : "left:20px"}`)}` },
      { body: `${h("1. No story.", "1. لا توجد قصة.", "A screenshot shows a screen, not a before and an after.", "اللقطة تُظهر شاشة، لا تُظهر ما قبل وما بعد.")}<div class="ill" style="top:560px">${shot("app")}</div>` },
      { body: `${h("2. No focus.", "2. لا يوجد تركيز.", "Forty things on one screen. The eye doesn't know where to look.", "أربعون عنصرًا على شاشة واحدة، والعين لا تعرف أين تنظر.")}<div class="ill" style="top:560px;position:absolute">${shot("app")}
          ${[[18, 22], [62, 30], [40, 58], [80, 70], [25, 80], [70, 12]].map(([x, y]) => `<span style="position:absolute;left:${x}%;top:${y}%;width:46px;height:46px;border-radius:50%;background:rgba(46,242,238,.25);border:3px solid var(--glow);font:400 26px/40px 'Audiowide';text-align:center;color:#fff">?</span>`).join("")}</div>` },
      { body: `${h("3. Nothing moves.", "3. لا شيء يتحرّك.", "So nothing stops the scroll.", "لذلك لا شيء يوقف التمرير.")}<div class="ill list" style="top:560px">${["app", "ledger", "invoice"].map((n) => `<div style="opacity:.55">${shot(n, "height:190px;object-fit:cover")}</div>`).join("")}</div>` },
      { body: `${h("4. Unreadable on a phone.", "4. غير مقروءة على الهاتف.", "A wide dashboard shrunk to a phone's width.", "لوحة تحكّم عريضة مصغّرة إلى عرض الهاتف.")}
          <div class="ill" style="top:560px;display:flex;justify-content:center"><div class="phonef" style="height:640px"><div class="scr" style="display:flex;align-items:center;background:#0E2440">${shot("app", "border-radius:0;box-shadow:none")}</div></div></div>` },
      { body: `${h("5. Same as every competitor.", "5. مثل كل المنافسين.", "If it's on a screen, we can make it move.", "إذا كان على الشاشة، يمكننا أن نجعله يتحرّك.")}
          <div class="ill" style="top:560px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${["app", "chart", "ledger", "sheet"].map((n) => shot(n, "height:250px;object-fit:cover;filter:grayscale(.8) blur(1px);opacity:.7")).join("")}</div>
          <div class="card light" style="left:64px;right:64px;top:1130px;padding:22px 30px;font:400 30px/1.35 var(--font-body)">${T(l, "We turn your real screens into short product reels, in English and Arabic.", "نحوّل شاشاتك الحقيقية إلى فيديوهات قصيرة لمنتجك، بالعربية والإنجليزية.")}</div>` },
    ];
  }, ["Your product works. The screenshot of it doesn't.\n\nNo story, no focus, nothing that moves, too small on a phone, and it looks like every competitor's post.\n\nIf it's on a screen, we can make it move.",
      "منتجك يعمل. لكن لقطة الشاشة لا تُظهر ذلك.\n\nلا قصة، لا تركيز، لا حركة، صغيرة جدًا على الهاتف، وتشبه منشورات كل المنافسين.\n\nإذا كان على الشاشة، يمكننا أن نجعله يتحرّك."],
    "SC-05 (hand scrolling a feed) doesn't exist yet: the cover uses an HTML phone feed and PR-03 (thinking). Example screens are Stacko's (our own product). 'Save this' line kept out of the visuals.", "#Aiphin #SaaSMarketing #ProductMarketing #MotionGraphics #SocialMedia #MENA");
}

// ---------------------------------------------------------------- AIP-17
function aip17() {
  post("AIP-17", "2026-12/AIP-17_inside-product-motion-reel", (l) => {
    const h = (en, ar, s_en, s_ar, top = 190) => flow(T(l, en, ar), s_en ? T(l, s_en, s_ar) : "", top);
    return [
      { body: `${h("What's inside<br><em>a product motion reel.</em>", "ماذا يتضمّن<br><em>فيديو المنتج المتحرّك؟</em>", "One reel, made from your real screens.", "فيديو واحد، مصنوع من شاشاتك الحقيقية.")}
          <div class="ill" style="top:560px;${l === "ar" ? "left:64px;right:auto" : "right:64px;left:auto"};width:420px"><div class="phonef" style="height:700px"><div class="scr"><img src="${SCR(l, "phone")}" style="width:100%;display:block"></div></div></div>
          ${finImg("PR-02.png", `width:520px;top:640px;${l === "ar" ? "right:10px;transform:scaleX(-1)" : "left:10px"}`)}` },
      { body: `${h("You get:", "ستحصل على:")}<div class="ill list" style="top:420px">${[T(l, "One 15 to 30 second reel from your real screens", "فيديو واحد مدته 15 إلى 30 ثانية من شاشاتك الحقيقية"), T(l, "Captions burned in", "ترجمة مدمجة في الفيديو"), T(l, "A cover for your grid", "غلاف لصفحتك"), T(l, "An English and an Arabic version", "نسخة إنجليزية ونسخة عربية")].map((x) => check(x)).join("")}</div>
          <div class="ill" style="top:860px">${`<img class="shot" src="${SCR(l, "app")}" alt="" style="height:300px;object-fit:cover">`}</div>` },
      { body: `${h("The 4 steps.", "الخطوات الأربع.")}<div class="ill steps" style="top:420px">${[T(l, "Brief: goal, audience, where it's posted", "الموجز: الهدف والجمهور ومكان النشر"), T(l, "Storyboard: every scene on paper", "اللوحة القصصية: كل مشهد على الورق"), T(l, "Animation from your real screens", "التحريك من شاشاتك الحقيقية"), T(l, "Two versions: English and Arabic", "نسختان: الإنجليزية والعربية")].map((x, i) => `<div class="step"><i>${i + 1}</i>${x}</div>`).join("")}</div>` },
      { body: `${h("What we need<br><em>from you.</em>", "ما نحتاجه<br><em>منك.</em>")}<div class="ill list" style="top:520px">${[T(l, "Your screens, or a login to a demo", "شاشاتك، أو دخول إلى نسخة تجريبية"), T(l, "Your logo", "شعارك"), T(l, "One goal for the reel", "هدف واحد للفيديو")].map((x) => check(x)).join("")}</div>
          ${finImg("PR-04.png", `width:420px;top:820px;${l === "ar" ? "left:40px" : "right:40px"}`)}` },
      { body: `${h("Ready in<br><em>5 working days.</em>", "جاهز خلال<br><em>5 أيام عمل.</em>")}<div class="ill steps" style="top:520px">${[[T(l, "Day 2", "اليوم 2"), T(l, "Storyboard to approve", "اللوحة القصصية للموافقة")], [T(l, "Day 4", "اليوم 4"), T(l, "First cut", "النسخة الأولى")], [T(l, "Day 5", "اليوم 5"), T(l, "Final English and Arabic, after one review round", "النسختان النهائيتان بعد جولة مراجعة واحدة")]].map(([d, x]) => `<div class="step"><i style="width:auto;padding:0 18px;border-radius:32px;font-size:24px">${d}</i>${x}</div>`).join("")}</div>` },
      { body: `${h("Your product,<br><em>moving.</em>", "منتجك،<br><em>يتحرّك.</em>", "We need your screens, your logo and one goal. We handle the rest.", "نحتاج شاشاتك وشعارك وهدفًا واحدًا. ونتولّى الباقي.")}
          ${finImg("PR-02.png", `width:560px;top:600px;${l === "ar" ? "left:260px;transform:scaleX(-1)" : "left:260px"}`)}` },
    ];
  }, ["One reel, made from your real screens. Captions, a cover, and a separate English and Arabic version.\n\nWe need your screens, your logo and one goal. We handle the rest.\n\nReady in 5 working days.",
      "فيديو واحد مصنوع من شاشاتك الحقيقية، مع ترجمة وغلاف ونسخة إنجليزية وأخرى عربية.\n\nنحتاج شاشاتك وشعارك وهدفًا واحدًا، ونتولّى الباقي.\n\nجاهز خلال 5 أيام عمل."],
    "Package facts from the plan row (5 working days, one review round); price stays in chat. PR-02 (pointing) and PR-04 (phone).", "#Aiphin #ProductVideo #MotionGraphics #SaaSMarketing #MENA");
}

// ---------------------------------------------------------------- AIP-19
function aip19() {
  post("AIP-19", "2026-12/AIP-19_myth-film-crew", (l) => [{
    body: `${flow(T(l, "Myth: you need<br><em>a film crew.</em>", "خرافة: تحتاج إلى<br><em>فريق تصوير.</em>"), "", 190)}
      <div class="card" style="left:64px;right:64px;top:440px;height:300px;display:flex;align-items:center;gap:34px;opacity:.75">
        <svg viewBox="0 0 48 48" style="width:130px;height:130px;flex:none;stroke:#C9D8E4;fill:none;stroke-width:2"><rect x="5" y="14" width="26" height="22" rx="3"/><path d="M31 21l11-6v18l-11-6M8 8l32 32" stroke="#E5484D" stroke-width="3"/></svg>
        <div><div class="kicker" style="position:static;color:#E5484D">${T(l, "Myth", "خرافة")}</div><div style="font:400 34px/1.4 var(--font-body);margin-top:10px">${T(l, "Lights, a camera, a set and a shoot day.", "إضاءة وكاميرا وموقع تصوير ويوم كامل.")}</div></div></div>
      <div class="card light" style="left:64px;right:64px;top:780px;padding:26px">
        <div class="kicker" style="position:static;color:var(--signal)">${T(l, "Fact", "حقيقة")}</div>
        <div style="font:600 34px/1.35 var(--font-body);margin:10px 0 18px">${T(l, "If it's on a screen, we animate it from your real screens. No shoot day.", "إذا كان على الشاشة، نحرّكه من شاشاتك الحقيقية. بلا يوم تصوير.")}</div>
        <img src="${SCR(l, "app")}" style="display:block;width:100%;height:250px;object-fit:cover;object-position:50% 20%;border-radius:16px">
      </div>`,
  }], ["You don't need lights, a camera and a shoot day to show your product.\n\nIf it's on a screen, we animate it from your real screens.",
       "لا تحتاج إلى إضاءة وكاميرا ويوم تصوير لتعرض منتجك.\n\nإذا كان على الشاشة، نحرّكه من شاشاتك الحقيقية."],
    "SC-03 (empty film set) doesn't exist yet: the myth half is an HTML card with a crossed-out camera. The fact half shows a real Stacko screen.", "#Aiphin #MythVsFact #ProductVideo #MotionGraphics #MENA");
}

// ---------------------------------------------------------------- AIP-21
function aip21() {
  post("AIP-21", "2027-01/AIP-21_5-things-we-animate", (l) => {
    const h = (en, ar, s_en, s_ar) => flow(T(l, en, ar), s_en ? T(l, s_en, s_ar) : "", 190);
    const shot = (n) => `<div class="ill" style="top:520px"><img class="shot" src="${SCR(l, n)}" alt=""></div>`;
    return [
      { body: `${h("5 things we can animate<br><em>from your screens.</em>", "5 أشياء نحرّكها<br><em>من شاشاتك.</em>", "Every example here is from Stacko, our own product.", "كل مثال هنا من ستاكو، منتجنا الخاص.")}
          <div class="ill" style="top:600px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">${["app", "story-map", "phone", "invoice", "ledger", "chart"].map((n) => `<img src="${SCR(l, n)}" style="width:100%;height:220px;object-fit:cover;border-radius:16px">`).join("")}</div>` },
      { body: `${h("1. Dashboards.", "1. لوحات التحكّم.", "Numbers that count up, cards that open.", "أرقام تتصاعد وبطاقات تنفتح.")}${shot("app")}` },
      { body: `${h("2. Maps.", "2. الخرائط.", "Trucks on routes, ships on the water.", "شاحنات على الطرق وسفن في البحر.")}${shot("story-map")}` },
      { body: `${h("3. Chats.", "3. المحادثات.", "A message types, a reply arrives.", "رسالة تُكتب ورد يصل.")}<div class="ill" style="top:520px;display:flex;justify-content:center"><img src="${SCR(l, "phone")}" style="height:640px;border-radius:44px;box-shadow:0 30px 70px rgba(0,0,0,.45)"></div>` },
      { body: `${h("4. Invoices and documents.", "4. الفواتير والمستندات.", "A paper invoice becomes a clean draft.", "فاتورة ورقية تتحوّل إلى مسودة مرتّبة.")}${shot("invoice")}` },
      { body: `${h("5. Logos.", "5. الشعارات.", "If it's on a screen, we can make it move.", "إذا كان على الشاشة، يمكننا أن نجعله يتحرّك.")}
          <div class="ill" style="top:560px;display:flex;align-items:center;justify-content:center;gap:30px;height:420px"><img src="/assets/brand/logo/mark-dark.svg" style="width:260px"><div style="font:600 150px/1 'Readex Pro';color:#fff;direction:ltr">stack<span style="color:#2EF2EE">o</span></div></div>` },
    ];
  }, ["Dashboards, maps, chats, invoices and logos: if it's on a screen, we can make it move.\n\nEvery frame here is from Stacko, our own product.",
      "لوحات التحكّم والخرائط والمحادثات والفواتير والشعارات: إذا كان على الشاشة، يمكننا أن نجعله يتحرّك.\n\nكل لقطة هنا من ستاكو، منتجنا الخاص."],
    "Stills are the real Stacko website screens (website-v2), not frames of the reels. 'Telegram' replaced by 'chats'. 'Link in bio' CTA removed.", "#Aiphin #MotionGraphics #ProductVideo #UIAnimation #MENA");
}

// ---------------------------------------------------------------- AIP-23
function aip23() {
  post("AIP-23", "2027-01/AIP-23_month-of-content", (l) => {
    const h = (en, ar, s_en, s_ar, top = 190) => flow(T(l, en, ar), s_en ? T(l, s_en, s_ar) : "", top);
    const days = Array.from({ length: 28 }, (_, i) => i + 1);
    const reels = [4, 11, 18, 25], posts = [2, 6, 9, 13, 16, 20, 23, 27];
    const cal = `<div class="cal">${days.map((d) => `<div class="${reels.includes(d) ? "r" : posts.includes(d) ? "p" : ""}" data-t="${reels.includes(d) ? T(l, "Reel", "فيديو") : posts.includes(d) ? T(l, "Post", "منشور") : ""}">${d}</div>`).join("")}</div>`;
    return [
      { body: `${h("A month of content,<br><em>planned and made.</em>", "شهر كامل من المحتوى،<br><em>مخطّط ومُنفَّذ.</em>", "A steady feed without hiring a team.", "محتوى منتظم دون توظيف فريق.")}
          <div class="ill" style="top:560px;${l === "ar" ? "left:330px" : "right:330px"}">${cal}</div>${finImg("PR-02.png", `width:380px;top:720px;${l === "ar" ? "left:0;transform:scaleX(-1)" : "right:0"}`)}` },
      { body: `${h("1. We plan<br><em>the month.</em>", "1. نخطّط<br><em>للشهر.</em>", "Ideas by topic, dated, in one plan.", "أفكار حسب الموضوع ومؤرّخة في خطة واحدة.")}<div class="ill" style="top:580px">${cal}</div>` },
      { body: `${h("2. You approve<br><em>each piece.</em>", "2. توافق على<br><em>كل قطعة.</em>")}<div class="ill list" style="top:520px">${[T(l, "Reel · Week 1 · Approved", "فيديو · الأسبوع 1 · موافق عليه"), T(l, "Carousel · Week 1 · Approved", "منشور متعدّد · الأسبوع 1 · موافق عليه"), T(l, "Post · Week 2 · One change requested", "منشور · الأسبوع 2 · طلب تعديل واحد")].map((x) => check(x)).join("")}</div>` },
      { body: `${h("3. We produce<br><em>every post.</em>", "3. ننتج<br><em>كل منشور.</em>", "Reels, carousels and posts, in English and Arabic.", "فيديوهات ومنشورات متعدّدة ومنشورات، بالإنجليزية والعربية.")}${finImg("PR-07.png", `width:640px;top:560px;left:220px;${l === "ar" ? "transform:scaleX(-1)" : ""}`)}` },
      { body: `${h("What's in<br><em>a month.</em>", "ماذا يتضمّن<br><em>الشهر.</em>")}<div class="ill stat" style="top:520px">${[["1", T(l, "content plan", "خطة محتوى")], ["4", T(l, "reels", "فيديوهات")], ["8", T(l, "posts and carousels", "منشورات ومنشورات متعدّدة")], ["EN + AR", T(l, "captions, one review round", "تعليقات، وجولة مراجعة واحدة")]].map(([n, t]) => `<div class="card"><b>${n}</b><span>${t}</span></div>`).join("")}</div>` },
      { body: `${h("4. You post.", "4. أنت تنشر.", "We plan the month, you approve it, we make every post.", "نخطّط للشهر، توافق عليه، وننتج كل منشور.")}${finImg("PR-08.png", `width:560px;top:560px;left:260px`)}` },
    ];
  }, ["A steady feed without hiring a team. Every month: a content plan, 4 reels and 8 posts and carousels, in English and Arabic.\n\nWe plan the month, you approve it, we make every post, you post.",
      "محتوى منتظم دون توظيف فريق. كل شهر: خطة محتوى، 4 فيديوهات و8 منشورات ومنشورات متعدّدة، بالإنجليزية والعربية.\n\nنخطّط للشهر، توافق عليه، ننتج كل منشور، وأنت تنشر."],
    "Monthly pack facts from the plan row (plan, 4 reels, 8 posts/carousels, EN + AR, one review round); price stays in chat. HTML calendar, PR-02 / PR-07 / PR-08.", "#Aiphin #ContentPlan #SocialMediaManagement #ArabicContent #MENA");
}

const FNS = { "AIP-11": aip11, "AIP-14": aip14, "AIP-17": aip17, "AIP-19": aip19, "AIP-21": aip21, "AIP-23": aip23 };
const only = process.argv.slice(2);
for (const [id, fn] of Object.entries(FNS)) if (!only.length || only.includes(id)) fn();
