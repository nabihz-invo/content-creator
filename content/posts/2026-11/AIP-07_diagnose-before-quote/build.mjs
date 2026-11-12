// AIP-07 "How we work: diagnose before we quote": 6 slides x EN/AR, light (Foam) theme (run from content/)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { page, T, FLOW_CSS, flow } from "../../../brands/aiphin/post/page.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "source");
mkdirSync(SRC, { recursive: true });
const N = 6;
const CSS = `${FLOW_CSS}
.flow{top:340px}
.step{position:absolute;top:180px;left:64px;display:flex;align-items:center;gap:26px}
.post[dir=rtl] .step{left:auto;right:64px}
.step b{font:400 110px/1 'Audiowide',sans-serif;color:var(--ocean)}
.step span{font:600 28px/1.3 'Readex Pro';letter-spacing:.12em;text-transform:uppercase;color:var(--signal)}
.post[dir=rtl] .step span{letter-spacing:0;font-size:30px}
.wc{position:absolute;left:64px;right:64px;background:#fff;border:2px solid var(--visor);border-radius:30px;padding:34px 38px;box-shadow:0 24px 60px rgba(14,36,64,.10)}
.chip{display:inline-block;padding:10px 20px;border-radius:24px;background:var(--foam);color:var(--signal);font:600 22px/1 'Readex Pro'}`;

const out = (f, h) => writeFileSync(join(SRC, f), h);
const node = (t, hot) => `<div style="padding:18px 22px;border-radius:18px;font:600 24px/1.3 'Readex Pro';text-align:center;${hot ? "background:#0E2440;color:#fff" : "background:#EEF6F9;color:#0E2440"}">${t}</div>`;

for (const l of ["en", "ar"]) {
  const s = l === "ar" ? "-AR" : "";
  const ar = l === "ar";
  const P = (n, body) => page({ id: "AIP-07", lang: l, n, N, body, css: CSS, theme: "foam" });
  const stepHead = (k, name) => `<div class="step"><b>0${k}</b><span>${T(l, `Step ${k} of 4`, `الخطوة ${k} من 4`)}<br>${name}</span></div>`;

  // 1 · cover
  out(`AIP-07-1${s}.html`, P(1, `
<h1 class="h1 xl" style="top:190px;font-size:${ar ? 80 : 90}px">${T(l, "We don't quote<br><em>before we diagnose.</em>", "لا نقدّم عرض سعر<br><em>قبل أن نشخّص.</em>")}</h1>
<p class="sub" style="top:${ar ? 520 : 500}px;font-size:38px">${T(l, "How we work, in four steps.", "طريقة عملنا، في أربع خطوات.")}</p>
<img class="fin${ar ? " mirror" : ""}" src="/brands/aiphin/assets/post-images/final/PR-02.png" style="width:700px;bottom:80px;${ar ? "left:-30px" : "right:-30px"}" alt="">`));

  // 2 · diagnose
  out(`AIP-07-2${s}.html`, P(2, `${stepHead(1, T(l, "Diagnose", "التشخيص"))}
${flow(T(l, "We sit with <em>the work.</em>", "نجلس مع <em>فريق العمل.</em>"), T(l, "We shadow the people doing the task and count the steps, the tools and the waiting.", "نرافق من يقوم بالمهمة، ونعدّ الخطوات والأدوات وأوقات الانتظار."))}
<div class="wc" style="top:700px">
  <div style="display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;align-items:center;gap:10px">
    ${node(T(l, "Order arrives", "يصل الطلب"))}<div style="text-align:center;color:#79C0DE;font:400 34px 'Audiowide'">${ar ? "←" : "→"}</div>${node(T(l, "Retyped into ERP", "يُعاد إدخاله في ERP"))}<div style="text-align:center;color:#79C0DE;font:400 34px 'Audiowide'">${ar ? "←" : "→"}</div>${node(T(l, "Waits for approval", "ينتظر الموافقة"), true)}
  </div>
  <div style="display:flex;gap:16px;margin-top:40px;flex-wrap:wrap">
    <span class="chip">${T(l, "7 steps", "7 خطوات")}</span><span class="chip">${T(l, "4 tools", "4 أدوات")}</span><span class="chip">${T(l, "2 days waiting", "يومان من الانتظار")}</span>
  </div>
  <div style="margin-top:34px;font:400 26px/1.5 'Readex Pro';color:#2C5974">${T(l, "Example of what a process map shows.", "مثال على ما تكشفه خريطة العمليات.")}</div>
</div>`));

  // 3 · quantify
  const rows = ar
    ? [["إعادة كتابة الطلبات", 92], ["عروض الأسعار اليدوية", 74], ["التقرير الأسبوعي", 55], ["الردّ على الأسئلة المتكررة", 38]]
    : [["Re-typed orders", 92], ["Manual quotes", 74], ["Weekly report", 55], ["Repeated questions", 38]];
  out(`AIP-07-3${s}.html`, P(3, `${stepHead(2, T(l, "Quantify", "القياس"))}
${flow(T(l, "A monthly cost <em>on each bottleneck.</em>", "كلفة شهرية <em>لكل عائق.</em>"), T(l, "So numbers settle the priorities, not opinions.", "فتحسم الأرقامُ الأولويات، لا الآراء."))}
<div class="wc" style="top:700px">
  <div style="font:600 24px 'Readex Pro';color:#2C5974;margin-bottom:22px">${T(l, "Ranked by monthly cost (example)", "مرتّبة حسب الكلفة الشهرية (مثال)")}</div>
  ${rows.map(([t, w], i) => `<div style="margin-bottom:22px"><div style="font:600 28px/1.3 'Readex Pro';color:#0E2440;margin-bottom:10px">${i + 1}. ${t}</div><div style="height:22px;border-radius:11px;background:#EEF6F9"><div style="height:100%;width:${w}%;border-radius:11px;background:${i ? "#79C0DE" : "#0895A6"}"></div></div></div>`).join("")}
</div>`));

  // 4 · design
  const opts = ar ? [["ربط نظامين", false], ["مساعد ذكي", false], ["حذف خطوة", true]] : [["An integration", false], ["A bot", false], ["Delete a step", true]];
  out(`AIP-07-4${s}.html`, P(4, `${stepHead(3, T(l, "Design", "التصميم"))}
${flow(T(l, "The smallest fix <em>that works.</em>", "أصغر حلّ <em>يؤدي الغرض.</em>"), T(l, "Sometimes it's an integration or a bot. Sometimes it's deleting a step.", "أحيانًا يكون ربط أنظمة أو مساعدًا ذكيًا. وأحيانًا يكون حذف خطوة.")) }
<div style="position:absolute;left:64px;right:64px;top:720px;display:flex;gap:24px">
  ${opts.map(([t, on]) => `<div style="flex:1;height:330px;border-radius:30px;background:#fff;border:${on ? "4px solid #0895A6" : "2px solid #C9D8E4"};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;box-shadow:0 24px 60px rgba(14,36,64,.10)">
    <div style="width:74px;height:74px;border-radius:50%;${on ? "background:#0895A6;color:#fff" : "background:#EEF6F9;color:#79C0DE"};font:700 38px/74px 'Readex Pro';text-align:center">${on ? "✓" : ""}</div>
    <div style="font:600 32px/1.3 'Readex Pro';color:#0E2440;text-align:center;padding:0 16px">${t}</div></div>`).join("")}
</div>
<p class="sub" style="top:1100px;text-align:center">${T(l, "If automation isn't the answer, we say so.", "وإن لم تكن الأتمتة هي الحل، نقولها بصراحة.")}</p>`));

  // 5 · prove
  out(`AIP-07-5${s}.html`, P(5, `${stepHead(4, T(l, "Prove", "الإثبات"))}
${flow(T(l, "One real workflow, <em>live.</em>", "مسار عمل حقيقي <em>يعمل فعلًا.</em>"), T(l, "Before anyone signs off on a bigger programme, so you judge output, not a Gantt chart.", "قبل الموافقة على أي مشروع أكبر، لتحكم على النتيجة لا على جدول زمني."))}
<div class="wc" style="top:720px;text-align:center;padding:60px 40px">
  <div style="font:400 160px/1 'Audiowide',sans-serif;color:#0E2440">6 <span style="font-size:70px">${T(l, "weeks", "")}</span></div>
  ${ar ? `<div style="font:700 60px/1.4 'Noto Kufi Arabic';color:#0E2440">أسابيع</div>` : ""}
  <div style="font:400 32px/1.5 'Readex Pro';color:#2C5974;margin-top:20px">${T(l, "typical time from diagnosis to first live workflow", "المدة المعتادة من التشخيص حتى أول مسار عمل يعمل فعلًا")}</div>
</div>`));

  // 6 · the timeline + yours to keep
  const tl = ar
    ? [["الأسبوع <span class=\"ltr\">1–2</span>", "التشخيص: تقرير مكتوب وخريطة للعمليات"], ["الأسبوع <span class=\"ltr\">3–6</span>", "أول مسار عمل يعمل فعلًا"], ["الأسبوع <span class=\"ltr\">7–14</span>", "استكمال الأنظمة والتدريب"], ["بعد ذلك", "تشغيل وتحسين ومراجعة شهرية"]]
    : [["Week 1–2", "Diagnostic: written report and process map"], ["Week 3–6", "First workflow live"], ["Week 7–14", "Roll out the rest, train the team"], ["Ongoing", "Run, improve, monthly review"]];
  out(`AIP-07-6${s}.html`, P(6, `
${flow(T(l, "The written diagnostic is <em>yours to keep.</em>", "التقرير التشخيصي المكتوب<br><em>يبقى لك.</em>"), T(l, "Whatever you decide.", "مهما كان قرارك."), 190)}
<div class="wc" style="top:540px;padding:20px 40px">
  ${tl.map(([w, t], i) => `<div style="display:flex;gap:28px;align-items:center;padding:28px 0;${i ? "border-top:1px solid #C9D8E4" : ""}">
    <div style="flex:none;width:200px;font:600 26px/1.3 'Readex Pro';color:${i === 0 ? "#0895A6" : "#2C5974"}">${w}</div>
    <div style="font:400 30px/1.4 'Readex Pro';color:#0E2440">${t}</div></div>`).join("")}
</div>
<p class="sub" style="top:1130px">${T(l, "First step: the business diagnostic.", "الخطوة الأولى: التشخيص التجاري.")}</p>`));
}
console.log("AIP-07 pages written");
