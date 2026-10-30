# Creative workspace rules

You are building one social media creative in this directory. The system
prompt contains the creative brief (format, size, style, scenes or slides,
copy, colors). `spec.js` defines `window.__SPEC` with the same data — read
copy, colors, timing, and scenes from it rather than hard-coding them.

## What is already here
- `index.html`, `main.js`, `styles.css` — a working starter for this format.
  Improve it freely: it is a starting point, not a constraint.
- `lib/runtime.js` — `spec`, `applyDocument()`, `fontsReady()`, `markReady()`,
  `prng(seed)` (seeded randomness), `ease`, `clamp`, `fitText()`, `textDirection()`.
- `lib/base.css`, `lib/styles.css` — fonts and shared styles.
- `fonts/` — bundled Inter, IBM Plex Sans Arabic, Tajawal. Use only these.
- `vendor/` (video only) — Three.js and addons, loaded through the import map
  in `index.html` (`import * as THREE from "three"`, `three/addons/...`).

## Hard rules (the checker rejects violations)
- No network: no `fetch`, XHR, WebSocket, remote URLs, CDNs, or remote fonts.
  Everything must be in this directory.
- No `eval`, `new Function`, string timers, storage, cookies, iframes, or
  access to `window.parent` / `window.top`.
- No `Math.random()` or `Date.now()`: use `prng()` and the time parameter.
- Keep `spec.js` and call `markReady()` (or set `window.__ready = true`) after
  fonts and the first frame are rendered.
- Video: every visual state must be a pure function of `t`; expose
  `window.__render = { duration, fps, width, height, seek(t) }`. `?t=4.2`
  renders a still; `?still=1` disables the live loop.
- Carousel: `?slide=N` (1-based) renders slide N at full size.
- Do not modify `lib/`, `fonts/`, or `vendor/` — they are replaced when the
  creative is packaged. Put your code in the root files or new files.
- Arabic text: right-to-left (`dir="rtl"` / `ctx.direction = "rtl"`), never
  letter-spaced, with enough line height for diacritics.

## Before you finish
Run `node check.mjs` and fix everything it reports. Keep text inside a 6%
safe margin and readable on a phone.
