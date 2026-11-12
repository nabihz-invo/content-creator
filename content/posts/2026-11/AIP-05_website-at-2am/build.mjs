// AIP-05 "What your website does at 2am": 6 slides x EN/AR -> source/AIP-05-N[-AR].html (run from content/)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "source");
mkdirSync(SRC, { recursive: true });
const N = 6;
const LOGO = {
  en: "/brands/aiphin/assets/brand/logo/wordmark/aiphin-wordmark-reversed.svg",
  ar: "/brands/aiphin/assets/brand/logo/arabic/wordmark/aiphin-ar-wordmark-reversed.svg",
};
const T = (l, en, ar) => (l === "ar" ? ar : en);

const page = (l, n, body, css = "") => `<!doctype html>
<html lang="${l}"${l === "ar" ? ' dir="rtl"' : ""}>
<head><meta charset="utf-8"><title>AIP-05 · ${l === "ar" ? "AR " : ""}slide ${n}</title>
<link rel="stylesheet" href="/brands/aiphin/assets/brand/brand.css">
<link rel="stylesheet" href="/brands/aiphin/post/aiphin-post.css">
<style>
.clock{position:absolute;top:180px;left:64px;font:400 96px/1 'Audiowide',sans-serif;color:var(--dolphin);direction:ltr}
.post[dir=rtl] .clock{left:auto;right:64px}
.flow{position:absolute;left:64px;right:64px;top:300px}
.flow .h1,.flow .sub{position:static}
.flow .h1{font-size:62px}
.post[dir=rtl] .flow .h1{font-size:58px}
.flow .sub{margin-top:18px}
.win{background:#fff;border-radius:26px;overflow:hidden;color:#0E2440;box-shadow:0 40px 90px rgba(0,0,0,.45)}
.win .nav{display:flex;align-items:center;gap:14px;padding:18px 24px;border-bottom:1px solid #C9D8E4}
.win .nav i{display:block;height:12px;border-radius:6px;background:#C9D8E4}
.bub{padding:18px 22px;border-radius:24px;font:400 28px/1.4 'Readex Pro',sans-serif;max-width:80%}
.bub.them{background:#EEF6F9;color:#0E2440;align-self:flex-start}
.bub.us{background:#2F86B8;color:#fff;align-self:flex-end}
${css}</style></head>
<body><div class="post night"${l === "ar" ? ' dir="rtl"' : ""}>
${body}
<div class="top"><img src="${LOGO[l]}" alt="AIPHIN"></div>
${
  n < N
    ? `<div class="bar"><div class="dots">${Array.from({ length: N }, (_, i) => `<i${i === n - 1 ? ' class="on"' : ""}></i>`).join("")}</div><div>${l === "ar" ? "<b>اسحب</b> ←" : "<b>Swipe</b> →"}</div></div>`
    : `<div class="foot"><div>${l === "ar" ? "فريق واحد. كل الخبرات." : "One team. Every expert."}</div><div class="site">aiphin.me</div></div>`
}
</div></body></html>
`;

// a generic small-business website (bars, no real brand), optionally with the chat widget open
const site = (l, { w = 640, h = 500, chat = true, rtlBars = false } = {}) => {
  const dir = rtlBars ? "rtl" : l === "ar" ? "rtl" : "ltr";
  return `<div class="win" style="width:${w}px;height:${h}px;position:relative;direction:${dir}">
  <div class="nav"><div style="width:44px;height:44px;border-radius:12px;background:#0895A6"></div><i style="width:110px"></i><i style="width:70px;margin-inline-start:auto"></i><i style="width:70px"></i><i style="width:70px"></i></div>
  <div style="padding:34px 28px">
    <div style="height:26px;width:70%;border-radius:8px;background:#0E2440;margin-bottom:16px"></div>
    <div style="height:26px;width:52%;border-radius:8px;background:#0E2440;margin-bottom:26px"></div>
    <div style="height:14px;width:80%;border-radius:7px;background:#C9D8E4;margin-bottom:12px"></div>
    <div style="height:14px;width:64%;border-radius:7px;background:#C9D8E4;margin-bottom:30px"></div>
    <div style="height:48px;width:170px;border-radius:24px;background:#2F86B8"></div>
    <div style="display:flex;gap:16px;margin-top:34px">${[0, 1, 2].map(() => `<div style="flex:1;height:${Math.round(h * 0.2)}px;border-radius:16px;background:#EEF6F9"></div>`).join("")}</div>
  </div>
  ${
    chat
      ? `<div style="position:absolute;bottom:20px;${dir === "rtl" ? "left" : "right"}:20px;width:${Math.round(w * 0.52)}px;background:#fff;border-radius:22px;box-shadow:0 12px 40px rgba(14,36,64,.3);overflow:hidden">
    <div style="background:#0E2440;color:#fff;padding:14px 18px;font:600 20px/1.2 'Readex Pro',sans-serif;display:flex;gap:10px;align-items:center"><span style="width:12px;height:12px;border-radius:50%;background:#2EF2EE"></span>${T(l, "Assistant · online", "المساعد · متصل")}</div>
    <div style="padding:14px 16px;font:400 18px/1.4 'Readex Pro',sans-serif;color:#0E2440">${T(l, "Hi! How can I help you tonight?", "أهلًا! كيف يمكنني مساعدتك الليلة؟")}</div></div>`
      : ""
  }
</div>`;
};

const out = (name, html) => writeFileSync(join(SRC, name), html);

for (const l of ["en", "ar"]) {
  const s = l === "ar" ? "-AR" : "";
  const ar = l === "ar";

  // 1 · cover: SC-01 with the site on the laptop screen (screen-map.mjs: 640x500 → laptop quad)
  out(
    `AIP-05-1${s}.html`,
    page(
      l,
      1,
      `<img src="/brands/aiphin/assets/post-images/final/SC-01.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" alt="">
<div style="position:absolute;left:0;top:0;width:640px;height:500px;transform-origin:0 0;transform:matrix3d(0.556817,0.145569,0,0.000226,0.091572,0.486001,0,-0.000022,0,0,1,0,257.5837,859.0027,0,1);filter:brightness(.96)">${site(l)}</div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,22,42,.85) 0%,rgba(7,22,42,.2) 38%,transparent 55%)"></div>
<h1 class="h1 xl" style="top:180px;font-size:${ar ? 76 : 88}px">${T(l, "It's 2am.<br><em>Is your website working?</em>", "الساعة الثانية فجرًا.<br><em>هل موقعك يعمل؟</em>")}</h1>`,
    ),
  );

  // 2 · 02:00 a visitor asks, the assistant answers
  out(
    `AIP-05-2${s}.html`,
    page(
      l,
      2,
      `<div class="clock">02:00</div>
<div class="flow"><h1 class="h1">${T(l, "A visitor asks a question.", "زائر يطرح سؤالًا.")}</h1><p class="sub">${T(l, "The assistant built into the page answers right away.", "المساعد المدمج في الصفحة يجيب فورًا.")}</p></div>
<div class="card light" style="left:120px;right:120px;top:560px;height:600px;padding:0;overflow:hidden;display:flex;flex-direction:column">
  <div style="background:#0E2440;color:#fff;padding:24px 30px;font:600 28px/1.2 'Readex Pro',sans-serif;display:flex;gap:14px;align-items:center"><span style="width:16px;height:16px;border-radius:50%;background:#2EF2EE"></span>${T(l, "Assistant · online", "المساعد · متصل")}</div>
  <div style="flex:1;padding:30px;display:flex;flex-direction:column;gap:20px;justify-content:flex-end">
    <div class="bub them">${T(l, "Do you install on weekends?", "هل تقومون بالتركيب في عطلة نهاية الأسبوع؟")}</div>
    <div class="bub us">${T(l, "Yes, on Saturdays from 9 to 2. Shall I book a visit for you?", "نعم، أيام السبت من 9 حتى 2. هل أحجز لك موعد زيارة؟")}</div>
  </div>
</div>`,
    ),
  );

  // 3 · 02:03 lead captured → CRM
  out(
    `AIP-05-3${s}.html`,
    page(
      l,
      3,
      `<div class="clock">02:03</div>
<div class="flow"><h1 class="h1">${T(l, "They book. <em>You sleep.</em>", "الزائر يحجز. <em>وأنت نائم.</em>")}</h1><p class="sub">${T(l, "The request goes straight into your CRM, with the chat attached.", "الطلب يصل مباشرة إلى نظام الـ CRM، ومعه المحادثة.")}</p></div>
<div class="card light" style="${ar ? "right" : "left"}:64px;top:560px;width:520px;padding:28px;display:flex;flex-direction:column;gap:16px">
  <div class="bub them" style="font-size:26px">${T(l, "Yes please, Saturday morning.", "نعم من فضلك، صباح السبت.")}</div>
  <div class="bub us" style="font-size:26px">${T(l, "Booked for Saturday at 10:00. What name should I put?", "تم الحجز يوم السبت الساعة 10:00. بأي اسم أسجّل الموعد؟")}</div>
  <div class="bub them" style="font-size:26px">${T(l, "Rami.", "رامي.")}</div>
</div>
<svg viewBox="0 0 80 40" style="position:absolute;top:990px;${ar ? "right" : "left"}:592px;width:80px;height:40px;${ar ? "transform:scaleX(-1)" : ""}"><path d="M4 20 H66 M50 6 L70 20 L50 34" fill="none" stroke="#79C0DE" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
<div class="card" style="${ar ? "left" : "right"}:64px;top:870px;width:340px;padding:26px 28px;border-color:rgba(46,242,238,.7)">
  <div style="font:600 22px/1.2 'Readex Pro';color:var(--dolphin);margin-bottom:14px">${T(l, "New lead · CRM", "عميل جديد · CRM")}</div>
  <div style="font:600 32px/1.3 'Readex Pro';margin-bottom:10px">${T(l, "Rami", "رامي")}</div>
  <div style="font:400 24px/1.5 'Readex Pro';color:var(--visor)">${T(l, "Site visit · Sat 10:00<br>Source: website chat<br>Created 02:03", "زيارة ميدانية · السبت 10:00<br>المصدر: دردشة الموقع<br>أُنشئ الساعة 02:03")}</div>
</div>`,
    ),
  );

  // 4 · 02:05 the other language, same site
  out(
    `AIP-05-4${s}.html`,
    page(
      l,
      4,
      `<div class="clock">02:05</div>
<div class="flow"><h1 class="h1">${T(l, "The next visitor <em>reads Arabic.</em>", "الزائر التالي <em>يقرأ بالإنجليزية.</em>")}</h1><p class="sub">${T(l, "Same site, same assistant, built right-to-left from day one.", "الموقع نفسه، والمساعد نفسه، بالاتجاهين منذ اليوم الأول.")}</p></div>
<div style="position:absolute;left:64px;right:64px;top:600px;display:flex;gap:30px;justify-content:center;align-items:center;direction:ltr">
  <div style="text-align:center"><div style="transform:scale(.66);transform-origin:top left;width:422px;height:330px">${site(l, { chat: false, rtlBars: false })}</div><div style="margin-top:26px;font:600 28px 'Readex Pro';color:var(--visor)">LTR</div></div>
  <div style="font:400 56px 'Audiowide';color:var(--dolphin);margin-top:-60px">⇄</div>
  <div style="text-align:center"><div style="transform:scale(.66);transform-origin:top left;width:422px;height:330px">${site(l, { chat: false, rtlBars: true })}</div><div style="margin-top:26px;font:600 28px 'Readex Pro';color:var(--visor)">RTL</div></div>
</div>
<div style="position:absolute;left:0;right:0;top:1070px;display:flex;justify-content:center"><div style="display:flex;border-radius:40px;border:2px solid rgba(121,192,222,.5);overflow:hidden;font:600 30px/1 'Readex Pro';direction:ltr"><span style="padding:18px 34px;${ar ? "" : "background:#2F86B8"}">EN</span><span style="padding:18px 34px;${ar ? "background:#2F86B8" : ""}">AR</span></div></div>`,
    ),
  );

  // 5 · 09:00 the team sees where it came from
  const hours = [2, 1, 1, 0, 0, 1, 2, 3, 5, 6, 4, 3];
  out(
    `AIP-05-5${s}.html`,
    page(
      l,
      5,
      `<div class="clock">09:00</div>
<div class="flow"><h1 class="h1">${T(l, "Your team sees <em>where it came from.</em>", "فريقك يرى <em>من أين جاء العميل.</em>")}</h1><p class="sub">${T(l, "Analytics and conversion tracking are part of the build.", "التحليلات وتتبّع التحويلات جزء من الموقع منذ البداية.")}</p></div>
<div class="card light" style="left:64px;right:64px;top:560px;padding:34px 40px">
  ${[
    [T(l, "Found the site", "وصل إلى الموقع"), T(l, "Google search", "بحث Google")],
    [T(l, "Page", "الصفحة"), T(l, "Installation services", "خدمات التركيب")],
    [T(l, "Chat started", "بدأت المحادثة"), "02:01"],
    [T(l, "Result", "النتيجة"), T(l, "Site visit booked", "حُجزت زيارة ميدانية")],
  ]
    .map(([k, v], i) => `<div style="display:flex;justify-content:space-between;padding:20px 0;${i ? "border-top:1px solid #C9D8E4;" : ""}font:400 30px/1.3 'Readex Pro'"><span style="color:#2C5974">${k}</span><span style="font-weight:600${i === 3 ? ";color:#0895A6" : ""}">${v}</span></div>`)
    .join("")}
</div>
<div style="position:absolute;left:64px;right:64px;top:1000px">
  <div style="font:600 24px 'Readex Pro';color:var(--visor);margin-bottom:16px">${T(l, "Leads by hour, last 30 days (example)", "العملاء حسب الساعة، آخر 30 يومًا (مثال)")}</div>
  <div style="display:flex;align-items:flex-end;gap:14px;height:120px;direction:ltr">${hours.map((v, i) => `<div style="flex:1;height:${18 + v * 17}px;border-radius:8px 8px 0 0;background:${i < 3 ? "#2EF2EE" : "rgba(121,192,222,.45)"}"></div>`).join("")}</div>
  <div style="display:flex;justify-content:space-between;font:400 22px 'Readex Pro';color:var(--visor);margin-top:10px;direction:ltr"><span>00:00</span><span>06:00</span><span>12:00</span></div>
</div>`,
    ),
  );

  // 6 · what we build
  const inc = ar
    ? ["مواقع تعريفية وصفحات هبوط سريعة", "مساعد ذكي والتقاط العملاء مدمجان", "بالعربية والإنجليزية، جاهز للاتجاهين", "تحليلات وتتبّع التحويلات"]
    : ["Fast marketing sites and landing pages", "Built-in AI assistant and lead capture", "Arabic and English, RTL-ready", "Analytics and conversion tracking"];
  out(
    `AIP-05-6${s}.html`,
    page(
      l,
      6,
      `<h1 class="h1" style="top:190px;font-size:${ar ? 62 : 68}px">${T(l, "A website that <em>works after hours.</em>", "موقع <em>يعمل بعد الدوام.</em>")}</h1>
<div style="position:absolute;left:0;right:0;top:${ar ? 470 : 480}px;display:flex;justify-content:center">${site(l, { w: 760, h: 440 })}</div>
<div style="position:absolute;left:64px;right:64px;top:990px;display:grid;grid-template-columns:1fr 1fr;gap:22px 40px">
  ${inc.map((t) => `<div style="display:flex;gap:16px;align-items:center;font:400 29px/1.35 'Readex Pro'"><span style="flex:none;width:34px;height:34px;border-radius:50%;background:#79C0DE;color:#0E2440;font:700 22px/34px 'Readex Pro';text-align:center">✓</span>${t}</div>`).join("")}
</div>`,
    ),
  );
}
console.log("AIP-05 pages written");
