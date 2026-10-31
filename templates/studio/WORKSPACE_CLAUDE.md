# Studio workspace rules (Stacko Motion engine)

You are building one post as **one HTML page** (`index.html`) with the studio
engine. The page is the creative: it is previewed live, then rendered frame by
frame to MP4 (reels, stories) or PNG (carousel slides, static posts). Every
frame must be a pure function of time — the engine guarantees that as long as
you only use its tweens and drivers.

The system prompt holds the brief: format, size, script (scenes or slides),
copy, the brand, and — for posts from the content plan — the row's recipe,
hook, opener, effects, assets and the **beat-by-beat scene plan**. The scene
plan is the contract: follow its beats and timings. If a beat is impossible with
the assets on disk, build the closest honest version and say what you changed
in your final summary. `spec.js` (`window.__SPEC`) holds the same data.

## Read first
1. `studio/docs/ENGINE.md` — the API (scenes, text, components, map, dots, end cards, transitions, camera, audio).
2. `studio/docs/RECIPES.md` — RC-01…RC-26: the shape of a whole piece. Use the recipe the brief names.
3. `studio/docs/ASSETS.md` and the folders under `assets/` — what exists. Use only files that are there.

## What is already here
- `index.html` — a starter page for this format. Rewrite it freely, but keep the
  script tags for the engine, `/studio/engine/bridge.js` and `/spec.js`, and
  create exactly one `SM.reel(…)` (reels, stories) or `SM.carousel(…)` (carousels, static posts).
- `studio/engine/` — the engine (`sm-core`, `sm-components`, `sm-app`, `bridge`). Read-only.
- `assets/` — the brand library, referenced with absolute paths (`/assets/…`). Read-only:
  `brand/` (fonts, LG logos) · `backgrounds/final/` (BG-xx, real screens already placed) ·
  `post-images/final/` (PI-xx) · `screens/` (SCR-xx, only for screens inside photos) ·
  `graphics/` (GFX-xx) · `map-elements/` (iso library) · `audio/music/` · `audio/sfx/` ·
  `presenters/` · `clips/`.

## The house rules (never break them)
1. **Two versions, never mixed.** One page renders an English and an Arabic version
   (`?lang=en|ar`). Write every on-screen string once per language with
   `SM.t('English', 'عربي')`; use `SM.ar()` for Arabic-only layout tweaks. Never put both
   languages in one frame, slide or end card; never use `s.swap()` or `tagline: 'both'`.
   Arabic is Lebanese dialect for Lebanon posts (MSA for region-wide pieces); keep Western digits.
2. **Sound is music-driven.** Transitions are silent: no whoosh, swoosh, riser or impact on a cut,
   never `trSfx: true`, never `s.sfx('whoosh' …)`. Put cuts on the music beat with `R.beats(bpm)`
   (the brief gives the track and its BPM). Only small UI sounds from components are mixed
   (pop, typing, ding, check, tick, click, notification, send, scan, marker, paper, shutter);
   anything else is dropped at render time.
3. **The dot effect is the signature.** Every reel has at least one dot moment: `s.dotMorph`
   building a number, word, icon, the map of Lebanon or the logo, or an end card
   `dots` · `dotword` · `dotmap`.
4. **One theme per carousel**: every slide dark (Night / dark photos) or every slide light
   (Paper). Cover and CTA match. Never the same layout on two consecutive slides; one idea per
   slide; pager dots on every slide.
5. **The product is the recreated, animated app** — map, Telegram chat with draft/approve,
   invoice → AI draft, ledger, alerts — and it must move (a truck drives, a count changes,
   a message types, a button is tapped). A screenshot alone is never the product moment.
6. **At least three visual sources** per post: app animation · BG background · PI photo ·
   presenter · iso / map elements · logo variant · graphics.
7. **Stage label on screen** (`R.badge(SM.t(…))`) for as long as a feature is visible:
   Prototype · demo data / Planned — in build / Concept, as the brief says. Vehicles on the
   map are ETA-based (no GPS) — say so when movement is the point.
8. **No invented facts.** Numbers only from the brief or clearly demo data (W1 Beirut 7,250 ·
   W2 Sidon 4,980 · W3 Tripoli 3,120 · LED Strip 5m). Never invent savings, percentages,
   customers or quotes; unknown → `[PLACEHOLDER]`.
9. **Brand.** Aiphin palette only (`SM.C`), Readex Pro / Noto Kufi Arabic, lowercase stacko with
   the teal "o" (ستاكو in Arabic), Glow (#2EF2EE) only on dark, never on white. Logos: dark
   scenes LG-01/05/07, light LG-02/06, photos LG-03 white, Arabic LG-08. Never mirror,
   recolour or redraw the logo. No orange, yellow or red outside product alerts.
10. **Never show a green screen** and never fake an asset: if one is missing, use a brand
    backdrop, an iso scene or a dot scene and mention it in your summary.

## Craft
- Motion within the first 0.5 s, the hook on screen by 0.3 s and readable by 1.5 s, the
  payoff before 60 % of the runtime. No static title card, no fade from black > 0.3 s, no logo first.
- Give every background a camera move (CM). Max two text effects per piece, one highlight per line.
- Instagram safe zone on 9:16: text and key UI inside y 220 → 1500 and x 60 → 930. Body text ≥ 42 px.
  Arabic lines run longer — check the fit in both versions.
- End card in the version's language, on screen ≥ 2 s, CTA text as the brief says.
- Music: `R.audio({ music: '/assets/audio/music/<file>', musicVolume: .22 })` with the track the
  brief names; a voice-over (if any) per language with `SM.t('…_EN.mp3', '…_AR.mp3')` and captions
  from its alignment JSON. Without a voice file, write the lines in your summary instead.
- Reuse nothing from another post: different first frame, first word, opener and layout.

## Hard rules (the checker rejects violations)
- No network, remote URLs, `eval`, string timers, storage, cookies, iframes, `window.parent/top`.
- No `Math.random()` / `Date.now()`; no CSS animations, `setTimeout` or `requestAnimationFrame` for
  motion — only the engine's tweens (`s.anim`, `s.on`, components).
- Don't edit `studio/` or `assets/`; they are replaced when the creative is packaged. Reference
  assets only by `/assets/…` paths that exist.

## Before you finish
Run `node check.mjs` and fix everything it reports. Then go through the approval checks and
report each as ✓ / ✗ / n/a in your final summary, with one line each:

C01 hook is new and readable by 1.5 s · C02 motion in the first 0.5 s · C03 real app animation
(product posts) · C04 three or more visual sources · C05 safe zones and legibility · C06 brand ·
C07 stage label · C08 facts · C09 Arabic version complete and never mixed · C10 audio
(music-driven, UI sounds only) · C11 captions synced to the voice · C12 end card and CTA ·
C13 post copy per language · C14 nothing left unchecked in the preview.
