import {
  applyDocument,
  fitText,
  fontsReady,
  markReady,
  param,
  spec,
  textDirection,
} from "./lib/runtime.js";

applyDocument();

// ?slide=N (1-based) selects the slide; the renderer captures each one separately.
const total = spec.slides.length;
const n = Math.min(Math.max(parseInt(param("slide") ?? "1", 10) || 1, 1), total);
const slide = spec.slides[n - 1];
document.body.dataset.role = slide.role;
document.body.dataset.slide = String(n);

const bind = (name, text) => {
  const el = document.querySelector(`[data-bind="${name}"]`);
  el.textContent = text ?? "";
  el.dir = textDirection(text);
  return el;
};

bind("brand", spec.brand.name);
const counter = document.querySelector('[data-bind="counter"]');
counter.textContent = `${n} / ${total}`;
counter.dir = "ltr"; // numbers read left to right even in Arabic layouts
bind("number", String(n - 1).padStart(2, "0"));
const headline = bind("headline", slide.headline);
const body = bind("body", slide.text);
bind("cta", spec.copy.cta);
// The arrow points the way the reader swipes: left for Arabic, right for English.
bind("swipe", slide.role === "cta" ? "" : spec.direction === "rtl" ? "←" : "→");

const dots = document.querySelector('[data-bind="dots"]');
for (let i = 1; i <= total; i++)
  dots.append(Object.assign(document.createElement("span"), { className: i === n ? "on" : "" }));

const decor = document.querySelector(".decor");
for (let i = 0; i < 2; i++)
  decor.append(Object.assign(document.createElement("div"), { className: "shape" }));

await fontsReady();
fitText(headline, { min: 32 });
fitText(body, { min: 22 });
markReady();
