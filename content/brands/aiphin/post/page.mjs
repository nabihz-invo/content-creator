// Shared page shell for Aiphin static posts and carousels (1080x1350).
// page({ id, lang, n, N, body, css, theme }) -> HTML string. theme: night | foam | ocean.
const LOGO = {
  dark: {
    en: "/brands/aiphin/assets/brand/logo/wordmark/aiphin-wordmark-reversed.svg",
    ar: "/brands/aiphin/assets/brand/logo/arabic/wordmark/aiphin-ar-wordmark-reversed.svg",
  },
  light: {
    en: "/brands/aiphin/assets/brand/logo/wordmark/aiphin-wordmark-primary.svg",
    ar: "/brands/aiphin/assets/brand/logo/arabic/wordmark/aiphin-ar-wordmark-primary.svg",
  },
};

export const T = (l, en, ar) => (l === "ar" ? ar : en);

export function page({ id, lang: l, n = 1, N = 1, body, css = "", theme = "night" }) {
  const ar = l === "ar";
  const logo = LOGO[theme === "foam" ? "light" : "dark"][l];
  const end = n >= N;
  return `<!doctype html>
<html lang="${l}"${ar ? ' dir="rtl"' : ""}>
<head><meta charset="utf-8"><title>${id} · ${ar ? "AR " : ""}${N > 1 ? `slide ${n}` : "post"}</title>
<link rel="stylesheet" href="/brands/aiphin/assets/brand/brand.css">
<link rel="stylesheet" href="/brands/aiphin/post/aiphin-post.css">
<style>${css}</style></head>
<body><div class="post ${theme}"${ar ? ' dir="rtl"' : ""}>
${body}
<div class="top"><img src="${logo}" alt="AIPHIN"></div>
${
  !end
    ? `<div class="bar"><div class="dots">${Array.from({ length: N }, (_, i) => `<i${i === n - 1 ? ' class="on"' : ""}></i>`).join("")}</div><div>${ar ? "<b>اسحب</b> ←" : "<b>Swipe</b> →"}</div></div>`
    : `<div class="foot"><div>${ar ? "فريق واحد. كل الخبرات." : "One team. Every expert."}</div><div class="site">aiphin.me</div></div>`
}
</div></body></html>
`;
}

// heading + support line that flow together (no overlap when the heading wraps)
export const FLOW_CSS = `.flow{position:absolute;left:64px;right:64px;top:300px}
.flow .h1,.flow .sub{position:static}
.flow .h1{font-size:62px}
.post[dir=rtl] .flow .h1{font-size:58px}
.flow .sub{margin-top:18px}`;
export const flow = (h, s, top) => `<div class="flow"${top ? ` style="top:${top}px"` : ""}><h1 class="h1">${h}</h1>${s ? `<p class="sub">${s}</p>` : ""}</div>`;
export const check = (t, bg = "#79C0DE") =>
  `<div style="display:flex;gap:16px;align-items:center;font:400 29px/1.35 'Readex Pro'"><span style="flex:none;width:34px;height:34px;border-radius:50%;background:${bg};color:#0E2440;font:700 22px/34px 'Readex Pro';text-align:center">✓</span>${t}</div>`;
