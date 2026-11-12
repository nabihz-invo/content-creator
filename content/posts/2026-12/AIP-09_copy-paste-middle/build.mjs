// AIP-09 "The copy-paste middle": 6 slides x EN/AR, Night theme (run from content/)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { page, T, FLOW_CSS, flow, check } from "../../../brands/aiphin/post/page.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "source");
mkdirSync(SRC, { recursive: true });
const N = 6;
const CSS = `${FLOW_CSS}
.flow{top:200px}
.sys{width:250px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.sys .t{background:#EEF6F9;padding:14px 18px;font:600 26px/1 'Readex Pro';color:#2C5974}
.sys .b{padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.sys .b i{display:block;height:12px;border-radius:6px;background:#C9D8E4}
.tag{display:inline-block;padding:14px 24px;border-radius:30px;background:rgba(121,192,222,.16);border:2px solid rgba(121,192,222,.45);font:600 28px/1 'Readex Pro';color:#fff}`;
const out = (f, h) => writeFileSync(join(SRC, f), h);
const sys = (name) => `<div class="sys"><div class="t">${name}</div><div class="b"><i style="width:80%"></i><i style="width:60%"></i><i style="width:70%"></i></div></div>`;
// a simple person icon
const person = (c = "#79C0DE", s = 120) => `<svg width="${s}" height="${s}" viewBox="0 0 120 120"><circle cx="60" cy="40" r="22" fill="${c}"/><path d="M18 112c4-28 22-42 42-42s38 14 42 42z" fill="${c}"/></svg>`;

for (const l of ["en", "ar"]) {
  const s = l === "ar" ? "-AR" : "";
  const ar = l === "ar";
  const P = (n, body) => page({ id: "AIP-09", lang: l, n, N, body, css: CSS, theme: "night" });
  const NAMES = [T(l, "CRM", "CRM"), T(l, "ERP", "ERP"), T(l, "Finance", "المالية")];

  // 1 · cover: SC-02 (never mirrored), labels on the three screens
  const lab = (t, x, y) => `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);padding:12px 22px;border-radius:14px;background:rgba(14,36,64,.88);border:2px solid rgba(46,242,238,.6);font:600 30px/1 'Readex Pro';color:#fff">${t}</div>`;
  out(`AIP-09-1${s}.html`, P(1, `
<img src="/brands/aiphin/assets/post-images/final/SC-02.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" alt="">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,22,42,.92) 0%,rgba(7,22,42,.55) 30%,rgba(7,22,42,0) 46%,rgba(7,22,42,0) 80%,rgba(7,22,42,.7) 100%)"></div>
${lab(NAMES[0], 170, 660)}${lab(NAMES[1], 740, 640)}${lab(NAMES[2], 990, 680)}
<h1 class="h1 xl" style="top:180px;font-size:${ar ? 76 : 84}px">${T(l, "There's a person<br><em>between your systems.</em>", "هناك شخص عالق<br><em>بين أنظمتك.</em>")}</h1>`));

  // 2 · two sides, nobody trusts the numbers
  out(`AIP-09-2${s}.html`, P(2, `
${flow(T(l, "Sales lives in spreadsheets. <em>Delivery lives in the ERP.</em>", "المبيعات في جداول Excel. <em>والتسليم في نظام ERP.</em>"), T(l, "And neither side trusts the other's numbers.", "ولا أحد من الطرفين يثق بأرقام الآخر."))}
<div style="position:absolute;left:64px;right:64px;top:720px;display:flex;justify-content:space-between;align-items:center">
  ${sys(T(l, "Sales sheet", "جدول المبيعات"))}
  <div style="display:flex;flex-direction:column;align-items:center;gap:14px">${person()}<div style="font:600 26px 'Readex Pro';color:var(--visor)">${T(l, "the middle", "الوسيط")}</div></div>
  ${sys(NAMES[1])}
</div>
<div style="position:absolute;left:0;right:0;top:1060px;text-align:center"><span class="tag">${T(l, "Orders: 128 vs 121", "الطلبات: 128 مقابل 121")}</span></div>`));

  // 3 · what gets retyped
  const items = ar ? ["الطلب", "عرض السعر", "الفاتورة", "تحديث الحالة"] : ["The order", "The quote", "The invoice", "The status update"];
  out(`AIP-09-3${s}.html`, P(3, `
${flow(T(l, "What gets <em>retyped.</em>", "ما الذي يُعاد <em>كتابته.</em>"), T(l, "Every day, by hand, from one screen into another.", "كل يوم، يدويًا، من شاشة إلى أخرى."))}
<div style="position:absolute;left:64px;right:64px;top:600px;display:flex;flex-direction:column;gap:22px">
  ${items.map((t, i) => `<div style="display:flex;align-items:center;gap:22px;padding:28px 34px;border-radius:26px;background:rgba(14,36,64,.78);border:2px solid rgba(121,192,222,.35)">
    <span style="font:400 44px/1 'Audiowide';color:var(--dolphin);width:70px">0${i + 1}</span>
    <span style="font:600 38px/1.2 'Readex Pro'">${t}</span>
    <span style="margin-inline-start:auto;font:400 26px 'Readex Pro';color:var(--visor)">${(ar ? ["من CRM إلى ERP", "من CRM إلى Excel", "من ERP إلى المالية", "من ERP إلى CRM"] : ["CRM → ERP", "CRM → Excel", "ERP → Finance", "ERP → CRM"])[i]}</span></div>`).join("")}
</div>`));

  // 4 · what it costs
  out(`AIP-09-4${s}.html`, P(4, `
${flow(T(l, "What it <em>costs.</em>", "ما <em>كلفته.</em>"), T(l, "Hours every week, and errors nobody sees until the month closes.", "ساعات كل أسبوع، وأخطاء لا يراها أحد حتى إقفال الشهر."))}
<div style="position:absolute;left:64px;right:64px;top:620px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px">
  ${Array.from({ length: 4 }, (_, w) => `<div style="border-radius:22px;background:rgba(14,36,64,.78);border:2px solid rgba(121,192,222,.3);padding:20px">
    <div style="font:600 24px 'Readex Pro';color:var(--visor);margin-bottom:16px">${T(l, `Week ${w + 1}`, `الأسبوع ${w + 1}`)}</div>
    ${Array.from({ length: 5 }, (_, d) => `<div style="height:26px;border-radius:8px;margin-bottom:10px;background:${(d + w) % 3 === 0 ? "#79C0DE" : "rgba(121,192,222,.18)"}"></div>`).join("")}</div>`).join("")}
</div>
<div class="card" style="left:64px;right:64px;top:1000px;display:flex;align-items:center;gap:26px;border-color:rgba(46,242,238,.6)">
  <div style="flex:none;width:70px;height:70px;border-radius:50%;background:#2EF2EE;color:#0E2440;font:700 44px/70px 'Readex Pro';text-align:center">!</div>
  <div style="font:400 32px/1.4 'Readex Pro'">${T(l, "Month end: the totals don't match. Someone starts checking, line by line.", "نهاية الشهر: المجاميع لا تتطابق. ويبدأ أحدهم بالتدقيق، سطرًا سطرًا.")}</div>
</div>`));

  // 5 · the fix
  out(`AIP-09-5${s}.html`, P(5, `
${flow(T(l, "The fix: systems <em>that talk.</em>", "الحل: أنظمة <em>تتحدث مع بعضها.</em>"), T(l, "CRM, ERP and finance in sync, with quote, invoice and approval flows.", "CRM وERP والمالية متزامنة، مع مسارات لعروض الأسعار والفواتير والموافقات."))}
<svg viewBox="0 0 952 300" style="position:absolute;left:64px;top:640px;width:952px;height:300px">
  <path d="M190 150 H762" stroke="#2EF2EE" stroke-width="5" stroke-dasharray="14 10" style="filter:drop-shadow(0 0 6px #2EF2EE)"/>
</svg>
<div style="position:absolute;left:64px;right:64px;top:680px;display:flex;justify-content:space-between">${NAMES.map(sys).join("")}</div>
<div style="position:absolute;left:0;right:0;top:1010px;text-align:center">
  <div style="font:400 120px/1 'Audiowide';color:#fff;direction:ltr">4.2 <span style="font-size:52px">${T(l, "hrs", "")}</span></div>
  <div style="font:400 32px/1.5 'Readex Pro';color:var(--visor);margin-top:10px">${T(l, "saved per employee each week", "ساعة يوفّرها كل موظف أسبوعيًا")}</div>
</div>`));

  // 6 · close
  out(`AIP-09-6${s}.html`, P(6, `
${flow(T(l, "Take the person out of <em>the copy-paste middle.</em>", "أخرِج الموظف من<br><em>دوامة النسخ واللصق.</em>"), T(l, "So they go back to the work only a person can do.", "ليعود إلى العمل الذي لا يقوم به إلا إنسان."), 190)}
<div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center">${person("#2EF2EE", 220)}</div>
<div style="position:absolute;left:64px;right:64px;top:930px;display:grid;grid-template-columns:1fr 1fr;gap:22px 40px">
  ${(ar ? ["مزامنة CRM وERP والمالية", "مسارات عروض الأسعار والفواتير", "ربط بلا إعادة إدخال", "توثيق كامل يبقى لك"] : ["CRM, ERP and finance sync", "Quote, invoice and approval flows", "No more re-typing", "Fully documented, yours to keep"]).map((t) => check(t)).join("")}
</div>`));
}
console.log("AIP-09 pages written");
