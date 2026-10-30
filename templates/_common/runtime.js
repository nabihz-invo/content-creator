// Shared runtime for creative templates (ADR-0007). No network, no globals
// besides window.__SPEC (input) and window.__ready / window.__render (output).

export const spec = window.__SPEC;
if (!spec) throw new Error("spec.js did not define window.__SPEC");

/** Query parameter (e.g. ?slide=2, ?t=4.5). */
export function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Applies size, direction, language, colors, and fonts to the document. */
export function applyDocument() {
  const root = document.documentElement;
  root.lang = spec.language === "en" ? "en" : "ar";
  root.dir = spec.direction;
  const c = spec.colors;
  const vars = {
    "--w": `${spec.width}px`,
    "--h": `${spec.height}px`,
    "--bg": c.background,
    "--surface": c.surface,
    "--text": c.text,
    "--muted": c.muted,
    "--accent": c.accent,
    "--font-heading": fontStack(spec.brand.fonts.heading),
    "--font-body": fontStack(spec.brand.fonts.body),
    "--unit": `${Math.min(spec.width, spec.height) / 100}px`,
    "--on-accent": onColor(c.accent),
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  document.body.dataset.style = spec.style;
  document.body.dataset.mode = spec.color_mode;
  document.body.dataset.format = spec.format;
}

function luminance(hex) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Black or white, whichever reads better on the given color (WCAG contrast). */
export function onColor(hex) {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#111111" : "#ffffff";
}

/** Bundled fonts only: brand fonts we don't have fall back to Inter / IBM Plex Sans Arabic. */
export function fontStack(name) {
  const bundled = ["Inter", "Tajawal", "IBM Plex Sans Arabic"];
  const first = bundled.includes(name) ? `"${name}", ` : "";
  return `${first}"Inter", "IBM Plex Sans Arabic", "Tajawal", sans-serif`;
}

export async function fontsReady() {
  await document.fonts.ready;
  // Make sure every bundled face we use is actually loaded before capture.
  await Promise.all(
    ["400 16px Inter", "700 16px Inter", "700 16px 'IBM Plex Sans Arabic'", "700 16px Tajawal"].map(
      (f) => document.fonts.load(f, "Aa أب").catch(() => []),
    ),
  );
}

export function markReady() {
  window.__ready = true;
  document.body.dataset.ready = "true";
}

/** Seeded PRNG (mulberry32) — templates must never use Math.random. */
export function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const ease = {
  linear: (x) => x,
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  easeOutExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  easeInOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

/** Shrinks an element's font size until its text fits its box (never below min px). */
export function fitText(el, { max, min = 18 } = {}) {
  let size = max ?? parseFloat(getComputedStyle(el).fontSize);
  el.style.fontSize = `${size}px`;
  while (
    size > min &&
    (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
  ) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
  return size;
}

/** Direction of a string from its first strong character. */
export function textDirection(s) {
  const m = /[\p{L}]/u.exec(s ?? "");
  return m && /[֐-ࣿ]/.test(m[0]) ? "rtl" : "ltr";
}
