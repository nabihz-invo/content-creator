// AIP-04 "Nobody wakes up wanting AI": static 4:5, EN + AR -> source/AIP-04[-AR].html (run from content/)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const SRC = join(dirname(fileURLToPath(import.meta.url)), "source");
const L = { en: "/brands/aiphin/assets/brand/logo/wordmark/aiphin-wordmark-reversed.svg", ar: "/brands/aiphin/assets/brand/logo/arabic/wordmark/aiphin-ar-wordmark-reversed.svg" };
const C = {
  en: { h: "Nobody wakes up<br>wanting <em>AI.</em>", s: "They want the WhatsApp answered, the quote out before lunch, and the stock number to be right.", f: "One team. Every expert." },
  ar: { h: "لا أحد يستيقظ صباحًا<br>وهو يريد <em>ذكاءً اصطناعيًا.</em>", s: "يريد أن تُجاب رسالة WhatsApp، وأن يخرج عرض السعر قبل الغداء، وأن يكون رقم المخزون صحيحًا.", f: "فريق واحد. كل الخبرات." },
};
for (const l of ["en", "ar"]) {
  const ar = l === "ar";
  writeFileSync(join(SRC, `AIP-04${ar ? "-AR" : ""}.html`), `<!doctype html>
<html lang="${l}"${ar ? ' dir="rtl"' : ""}>
<head><meta charset="utf-8"><title>AIP-04 · Nobody wakes up wanting AI${ar ? " (AR)" : ""}</title>
<link rel="stylesheet" href="/brands/aiphin/assets/brand/brand.css">
<link rel="stylesheet" href="/brands/aiphin/post/aiphin-post.css">
<style>
.post.night{background:#0F253D}.post.night::before{display:none}
.bg{position:absolute;width:760px;bottom:70px;${ar ? "left:-40px;transform:scaleX(-1);" : "right:-40px;"}-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 62%,transparent 100%)}
.h1{top:200px;font-size:${ar ? 74 : 88}px}
.sub{top:${ar ? 470 : 440}px;right:${ar ? 64 : 300}px;left:${ar ? 300 : 64}px;font-size:${ar ? 36 : 34}px}
</style></head>
<body><div class="post night"${ar ? ' dir="rtl"' : ""}>
<img class="bg" src="/brands/aiphin/assets/post-images/final/PR-05.jpg" alt="">
<h1 class="h1">${C[l].h}</h1>
<p class="sub">${C[l].s}</p>
<div class="top"><img src="${L[l]}" alt="AIPHIN"></div>
<div class="foot"><div>${C[l].f}</div><div class="site">aiphin.me</div></div>
</div></body></html>
`);
}
console.log("AIP-04 written");
