import {
  applyDocument,
  fitText,
  fontsReady,
  markReady,
  spec,
  textDirection,
} from "./lib/runtime.js";

applyDocument();

const bind = (name, text) => {
  const el = document.querySelector(`[data-bind="${name}"]`);
  el.textContent = text ?? "";
  el.dir = textDirection(text);
  return el;
};

bind("brand", spec.brand.name);
const headline = bind("headline", spec.post?.headline ?? spec.copy.hook);
const body = bind("body", spec.post?.body ?? spec.copy.key_message);
bind("cta", spec.copy.cta);

const decor = document.querySelector(".decor");
for (let i = 0; i < 3; i++)
  decor.append(Object.assign(document.createElement("div"), { className: "shape" }));

await fontsReady();
fitText(headline, { min: 28 });
fitText(body, { min: 22 });
markReady();
