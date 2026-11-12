// Builds AIP-02 "5 signs you've outgrown your CRM": 7 slides x EN/AR -> source/AIP-02-NN[-AR].html
// Run from content/: node posts/2026-11/AIP-02_outgrown-your-crm/build.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const SRC = join(DIR, "source");
mkdirSync(SRC, { recursive: true });
const N = 7;
const LOGO = {
  en: "/brands/aiphin/assets/brand/logo/wordmark/aiphin-wordmark-reversed.svg",
  ar: "/brands/aiphin/assets/brand/logo/arabic/wordmark/aiphin-ar-wordmark-reversed.svg",
};

const page = (lang, n, body, css = "") => `<!doctype html>
<html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8">
<title>AIP-02 · ${lang === "ar" ? "AR " : ""}slide ${n}</title>
<link rel="stylesheet" href="/brands/aiphin/assets/brand/brand.css">
<link rel="stylesheet" href="/brands/aiphin/post/aiphin-post.css">
<style>${css}</style>
</head>
<body>
<div class="post night"${lang === "ar" ? ' dir="rtl"' : ""}>
${body}
<div class="top"><img src="${LOGO[lang]}" alt="AIPHIN"></div>
${
  n < N
    ? `<div class="bar"><div class="dots">${Array.from({ length: N }, (_, i) => `<i${i === n - 1 ? ' class="on"' : ""}></i>`).join("")}</div><div>${lang === "ar" ? "<b>اسحب</b> ←" : "<b>Swipe</b> →"}</div></div>`
    : `<div class="foot"><div>${lang === "ar" ? "فريق واحد. كل الخبرات." : "One team. Every expert."}</div><div class="site">aiphin.me</div></div>`
}
</div>
</body>
</html>
`;

const T = (en, ar) => ({ en, ar });

// shared styles for the sign slides
const SIGN_CSS = `
.numrow{position:absolute;top:170px;left:64px;right:64px;display:flex;align-items:center;gap:30px}
.numrow .kicker{position:static}
.h1{top:330px;font-size:62px}
.post[dir=rtl] .h1{font-size:58px;top:320px}
.sub{top:560px}
.post[dir=rtl] .sub{top:570px}
.ill{position:absolute;left:64px;right:64px;top:720px;height:500px}
`;

const signs = [
  {
    title: T("Sales lives in a spreadsheet <em>the CRM never sees.</em>", "المبيعات تعيش في جدول<br><em>لا يراه الـ CRM.</em>"),
    sub: T("The team updates Excel. The system stays empty.", "الفريق يحدّث ملف Excel، والنظام يبقى فارغًا."),
    ill: (l) => `
      <div class="card light" style="${l === "ar" ? "right" : "left"}:0;top:20px;width:600px;height:440px;padding:0;overflow:hidden">
        <div style="background:#EEF6F9;padding:18px 26px;font:600 24px/1 var(--font-body);color:#2C5974" class="ltr">pipeline_FINAL_v7.xlsx</div>
        <table style="border-collapse:collapse;width:100%;font:400 22px/1 var(--font-body);color:#0E2440;text-align:start">
          ${(l === "ar" ? ["العميل|المرحلة|القيمة", "موزّع أ|عرض سعر|12,400", "مشروع ب|مناقصة|48,000", "متجر ج|معاودة اتصال|3,150", "فندق د|موافقة|21,700", "عيادة هـ|؟؟|—"] : ["Client|Stage|Value", "Distributor A|Quote|12,400", "Project B|Tender|48,000", "Shop C|Call back|3,150", "Hotel D|Approval|21,700", "Clinic E|??|—"])
            .map((r, i) => `<tr>${r.split("|").map((c) => `<td style="border:1px solid #C9D8E4;padding:16px 18px;${i ? "" : "font-weight:600;background:#F7FAFC"}">${c}</td>`).join("")}</tr>`)
            .join("")}
        </table>
      </div>
      <div class="card" style="${l === "ar" ? "left" : "right"}:0;top:120px;width:330px;height:260px;text-align:center">
        <div style="font:600 24px/1.2 var(--font-body);color:var(--dolphin)">${l === "ar" ? "الصفقات في الـ CRM" : "Deals in the CRM"}</div>
        <div style="font:400 130px/1.2 'Audiowide';color:#fff">0</div>
      </div>`,
  },
  {
    title: T("Quotes and approvals happen <em>in WhatsApp.</em>", "عروض الأسعار والموافقات<br><em>تتم على WhatsApp.</em>"),
    sub: T("The decision lives in someone's phone, not in the system.", "القرار موجود في هاتف أحدهم، لا في النظام."),
    ill: (l) => {
      const L = l === "ar";
      const b = (txt, me, top) => `<div style="position:absolute;top:${top}px;${me !== L ? "right" : "left"}:${me ? 40 : 0}px;max-width:640px;padding:24px 30px;border-radius:26px;font:400 32px/1.4 var(--font-body);${me ? "background:#2F86B8;color:#fff" : "background:#fff;color:#0E2440"}">${txt}</div>`;
      return `<div style="position:absolute;inset:0 60px">
        ${b(L ? "ممكن توافق على خصم 12% لهذا العميل؟" : "Can you approve a 12% discount for this client?", false, 10)}
        ${b(L ? "موافق ✓" : "Approved ✓", true, 150)}
        ${b(L ? "ومن يحدّث العرض في النظام؟" : "And who updates the quote in the system?", false, 270)}
        <div style="position:absolute;top:410px;${L ? "left" : "right"}:40px;font:400 26px/1 var(--font-body);color:var(--dolphin)">${L ? "لا أحد." : "Nobody."}</div>
      </div>`;
    },
  },
  {
    title: T("You pay for 40 features <em>and use 4.</em>", "تدفع ثمن 40 ميزة <em>وتستخدم 4.</em>"),
    sub: T("The rest just make every screen slower for the team.", "والباقي يجعل كل شاشة أبطأ وأصعب على الفريق."),
    ill: () => {
      const on = new Set([3, 12, 21, 30]);
      return `<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:20px;padding:20px 30px">${Array.from({ length: 40 }, (_, i) => `<div style="aspect-ratio:1;border-radius:18px;${on.has(i) ? "background:#2EF2EE;box-shadow:0 0 30px rgba(46,242,238,.5)" : "border:2px solid rgba(121,192,222,.3)"}"></div>`).join("")}</div>`;
    },
  },
  {
    title: T("Nobody trusts the numbers <em>on Monday.</em>", "لا أحد يثق بالأرقام <em>يوم الإثنين.</em>"),
    sub: T("Sales has one pipeline total. Finance has another.", "المبيعات لديها رقم، والمالية لديها رقم آخر."),
    ill: (l) => {
      const c = (label, val, side) => `<div class="card" style="${side}:0;top:60px;width:440px;height:300px;text-align:center;padding-top:50px">
        <div style="font:600 30px/1.2 var(--font-body);color:var(--dolphin)">${label}</div>
        <div class="ltr" style="font:400 92px/1.6 'Audiowide';color:#fff">${val}</div></div>`;
      return `${c(l === "ar" ? "رقم المبيعات" : "Sales says", "$1.24M", l === "ar" ? "right" : "left")}
        ${c(l === "ar" ? "رقم المالية" : "Finance says", "$0.86M", l === "ar" ? "left" : "right")}
        <div style="position:absolute;left:50%;top:150px;transform:translateX(-50%);width:110px;height:110px;border-radius:50%;background:#79C0DE;color:#0E2440;font:400 64px/110px 'Audiowide';text-align:center">?</div>`;
    },
  },
  {
    title: T("Every new step needs <em>a workaround.</em>", "كل خطوة جديدة تحتاج<br><em>إلى حلّ التفافي.</em>"),
    sub: T("Export, fix it in Excel, import it back. Every week.", "تصدير، تعديل في Excel، ثم إعادة إدخال. كل أسبوع."),
    ill: (l) => {
      const L = l === "ar";
      const steps = L ? ["تصدير", "تعديل في Excel", "إعادة إدخال"] : ["Export", "Fix in Excel", "Import back"];
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:60px 0 0">
        ${steps.map((s, i) => `<div class="card" style="position:relative;width:280px;height:180px;display:flex;align-items:center;justify-content:center;text-align:center;font:600 34px/1.3 var(--font-body)">${s}</div>${i < 2 ? `<div style="font:400 50px 'Audiowide';color:var(--dolphin)">${L ? "←" : "→"}</div>` : ""}`).join("")}
      </div>
      <svg viewBox="0 0 952 200" style="position:absolute;left:0;top:250px;width:952px;height:200px"><path d="M${L ? 812 : 812} 20 C ${L ? "812 170, 140 170, 140 20" : "812 170, 140 170, 140 20"}" fill="none" stroke="#2EF2EE" stroke-width="4" stroke-dasharray="14 12"/><path d="M${L ? 812 : 140} 20 l-16 26 l32 0 z" fill="#2EF2EE"/></svg>
      <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font:400 28px var(--font-body);color:var(--dolphin)">${L ? "وتتكرر كل أسبوع" : "and again next week"}</div>`;
    },
  },
];

const out = (name, html) => writeFileSync(join(SRC, name), html);

for (const l of ["en", "ar"]) {
  const sfx = l === "ar" ? "-AR" : "";
  const L = l === "ar";

  // 1 · cover
  out(
    `AIP-02-1${sfx}.html`,
    page(
      l,
      1,
      `<h1 class="h1 xl" style="top:190px;${L ? "font-size:76px" : ""}">${L ? "نظام الـ CRM لا يجب<br>أن يغيّر <em>طريقة بيعك.</em>" : "Your CRM shouldn't change <em>how you sell.</em>"}</h1>
<p class="sub" style="top:${L ? 530 : 560}px;font-size:40px;color:#fff">${L ? "خمس علامات أنك تجاوزته." : "5 signs you've outgrown it."}</p>
<img class="fin halo${L ? " mirror" : ""}" src="/brands/aiphin/assets/post-images/final/PR-03.png" style="width:690px;bottom:90px;${L ? "left:-20px" : "right:-20px"}" alt="">`,
      `.post::after{content:"";position:absolute;width:760px;height:760px;border-radius:50%;bottom:60px;${L ? "left:-60px" : "right:-60px"};background:radial-gradient(circle,rgba(46,242,238,.16),transparent 65%)}`,
    ),
  );

  // 2..6 · the five signs
  signs.forEach((s, i) => {
    out(
      `AIP-02-${i + 2}${sfx}.html`,
      page(
        l,
        i + 2,
        `<div class="numrow"><div class="num">0${i + 1}</div><div class="kicker">${L ? `العلامة ${i + 1} من 5` : `Sign ${i + 1} of 5`}</div></div>
<h1 class="h1">${s.title[l]}</h1>
<p class="sub">${s.sub[l]}</p>
<div class="ill">${s.ill(l)}</div>`,
        SIGN_CSS,
      ),
    );
  });

  // 7 · the fix
  const cols = L
    ? [["عميل جديد", ["موزّع، 14 صنفًا", "متجر، زيارة ميدانية"]], ["عرض سعر", ["مشروع، المرحلة الثانية"]], ["موافقة", ["مناقصة، خصم 8%"]], ["تمّ", ["فندق، عقد سنوي"]]]
    : [["New lead", ["Distributor · 14 items", "Shop · site visit"]], ["Quote sent", ["Project · phase 2"]], ["Approval", ["Tender · 8% discount"]], ["Won", ["Hotel · annual contract"]]];
  const inc = L
    ? ["مراحل وعروض أسعار وموافقات", "صلاحيات حسب الدور وسجل تدقيق", "محادثات WhatsApp والبريد في مكانها", "ننقل بياناتك من Excel أو HubSpot"]
    : ["Pipelines, quotes and approvals", "Role-based access and audit trail", "WhatsApp and email threads in place", "Migration from spreadsheets or HubSpot"];
  out(
    `AIP-02-7${sfx}.html`,
    page(
      l,
      7,
      `<h1 class="h1" style="top:180px">${L ? "نظام CRM مبني حول<br><em>طريقة بيعك.</em>" : "A CRM built around <em>your pipeline.</em>"}</h1>
<p class="sub" style="top:${L ? 400 : 380}px">${L ? "مراحلك، عروضك، موافقاتك ومحادثاتك في مكان واحد." : "Your stages, quotes, approvals and conversations in one place."}</p>
<div class="card light" style="left:64px;right:64px;top:500px;height:400px;padding:26px;display:flex;gap:18px">
  ${cols
    .map(
      ([h, cards], i) => `<div style="flex:1;background:#EEF6F9;border-radius:18px;padding:18px">
    <div style="font:600 22px/1.2 var(--font-body);color:${i === 3 ? "#0895A6" : "#2C5974"};margin-bottom:16px">${h}</div>
    ${cards.map((c) => `<div style="background:#fff;border:1px solid #C9D8E4;border-radius:14px;padding:16px;margin-bottom:12px;font:400 22px/1.35 var(--font-body);color:#0E2440;${i === 3 ? "border-color:#0895A6" : ""}">${c}<div style="margin-top:12px;height:8px;width:${50 + ((i * 17) % 40)}%;border-radius:4px;background:${i === 3 ? "#0895A6" : "#79C0DE"}"></div></div>`).join("")}
  </div>`,
    )
    .join("")}
</div>
<div style="position:absolute;left:64px;right:64px;top:950px;display:grid;grid-template-columns:1fr 1fr;gap:22px 40px">
  ${inc.map((t) => `<div style="display:flex;gap:16px;align-items:center;font:400 30px/1.35 var(--font-body)"><span style="flex:none;width:34px;height:34px;border-radius:50%;background:#79C0DE;color:#0E2440;font:700 22px/34px var(--font-body);text-align:center">✓</span>${t}</div>`).join("")}
</div>`,
    ),
  );
}
console.log("AIP-02 pages written to", SRC);
