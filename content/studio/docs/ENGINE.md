# Stacko Motion engine — API reference

Every reel, carousel and story is **one HTML page** built from layers. Every frame is a pure function of time
(`R.seek(t)`), so the renderer can capture any frame exactly. Nothing uses CSS animations, `setTimeout` or
`requestAnimationFrame` — only the engine's tweens and drivers. That is what makes renders frame-exact.

```html
<script src="/assets/map-elements/stacko-map-elements.js"></script>   <!-- needed for s.iso / end card 'truck' -->
<script src="/studio/engine/sm-core.js"></script>
<script src="/studio/engine/sm-components.js"></script>
<script src="/studio/engine/sm-app.js"></script>
```

Paths are absolute from the project root (`/assets/...`, `/studio/...`, `/posts/...`). The renderer serves the project root.

## 0. Two language versions — never both languages in one frame

Every post is rendered **twice from the same page**: an English version and an Arabic version.

```js
s.text(SM.t('Every location. *One map.*', 'كل المواقع. *خريطة وحدة.*'), { y: 380 });   // pick the line for this version
if (SM.ar()) { /* Arabic-only layout tweak */ }
R.badge(SM.t('Prototype · demo data', 'نموذج أوّلي · بيانات تجريبية'));
```

* `SM.lang` is `'en'` or `'ar'` (set by the renderer: `--lang en|ar|all`). `SM.t(en, ar)` returns the right string. `SM.ar()` is true in the Arabic version.
* Text written in Arabic script is detected automatically (RTL, Noto Kufi Arabic). In the Arabic version every left/right-aligned text is **mirrored** (x → width − x, left ↔ right) so layouts read right-to-left; pass `mirror:false` to keep one in place.
* Components follow the version: map chips/POIs/header, chat, ledger, KPIs, poll, captions, journey, notes, storm, checklist, flow, compare labels, lower third, toasts.
* Counters: give an Arabic suffix (`suffix: SM.t(' units', ' قطعة')`) and the counter switches to RTL so the number is read first.
* End cards show the tagline and wordmark in the version's language only (stacko / ستاكو).
* Never use `s.swap()` or `tagline:'both'` in posts — they mix languages (kept only for old pages).
* Outputs: `<ID>_EN.mp4` + `<ID>_AR.mp4`, `slide-01_EN.png` …, `cover_EN.png`, `preview_EN.png`; captions in `caption_EN.txt` and `caption_AR.txt`.

## 0b. Sound

Transitions between scenes are **silent** (no whoosh/swoosh). Don't add `s.sfx('whoosh' …)` on a cut either. Sound comes from music,
voice and small UI sounds inside components (a pop when a chip appears, typing in a chat, a ding on an alert). If one transition
really needs a sound: `R.scene(d, { in: 'zoom-through', trSfx: true })`.

---

## 1. Reel, carousel, story

| Call | Size | Notes |
|---|---|---|
| `const R = SM.reel({ title })` | 1080×1920, 30 fps | Reels, stories (as video), YouTube Shorts |
| `SM.carousel({ title })` | 1080×1350 | Each scene = one slide, exported at its last frame with `--stills` (named by `name`) |
| `SM.reel({ w: 1920, h: 1080 })` | 16:9 | YouTube / presentations |
| `SM.reel({ theme: 'light' })` | | Light defaults for text colour |

**Scenes** run one after another: `const s = R.scene(durationSeconds, { name, bg, in, inOpts, inDur, move, dim, gradient, focus })`

* `bg`: `'night'` (brand gradient) · `'paper'` · `'foam'` · `'abyss'` · any CSS colour/gradient · an image path · a video path
* `move` (camera on the background): see §6 · `dim: .3` darkens · `gradient: true` adds top/bottom readability gradient · `focus: '50% 30%'` object-position
* `in`: transition from the previous scene (§5). `inOpts: { cx, cy }` for iris. `inDur` overrides the length.
* Times inside a scene (`at`) are **scene-local** seconds.

**Overlays (whole reel):** `R.grain(.05)` · `R.vignette(.6)` · `R.letterbox(120)` · `R.progress()` · `R.watermark({ variant:'white', size:72, pos:'tr', op:.7 })` ·
`R.badge('Prototype · demo data', { at, until, theme:'light', pos:'tl' })` (stage label — required whenever a feature is shown) · `R.safe()` (preview-only safe-zone guides; toggle in the player).

**Audio:** `R.audio({ voice:'/assets/audio/voice/D30-26_vo.mp3', voiceAt:.3, music:'/assets/audio/music/MU-01_x.mp3', musicVolume:.18, musicStart:0, duck:true, lufs:-16, sfxVolume:.55 })`
SFX are cued by name and found in `assets/audio/sfx/<name>.mp3`: `s.sfx('pop', at, vol)`. Many components cue their own SFX.
`R.beats(bpm, offset)` returns beat times to cut on.

**Covers & stills:** `R.cover(t)` (the frame used for `--cover`) · `R.still('name', t)`.

## 2. Low-level animation (use for anything custom)

```js
s.anim(el, { x:[-200,0], o:[0,1], s:[.8,1], r:[-6,0], blur:[12,0] }, at, dur, 'outBack');   // [from,to] or just to
s.set(el, { o:0, y:40 });
s.clip(el, 'circle', { cx:50, cy:50, r:150 }); s.anim(el, { cp:[0,1] }, at, .7);           // clip modes: left right up down circle diag diagR split splitH round
s.on(at, until, (p, localT, t) => { /* driver: set anything from progress p (0..1) */ });
s.shake(at, dur, amp) · s.punch(at, amt, dur) · s.glitch(at, dur, amp) · s.flash(at, dur, color)
```

Props: `x y z s sx sy r rx ry skx persp o blur br sat hue cp`. Easing: `linear inQuad outQuad inOutQuad inCubic outCubic inOutCubic inQuart outQuart inOutQuart outExpo inBack outBack outBackSoft outElastic outBounce spring inOutSine`.

**Rule:** never tween an element whose CSS `transform` centres it (e.g. `translate(-50%,-50%)`) — the tween replaces the transform.
Put it in a wrapper (`const [wrap, inner] = SM.wrapAt(parent, x, y, cls, html)`) and tween the wrapper. All built-in components already do this.

Building blocks: `s.layer(x, y)` (an anchor point), `s.fill(css)` (full-frame div), `s.html(html, { x, y, w, in, at, out, outAt })`, `s.enter(el, kind, at, o)`, `s.exit(el, kind, at, o)`.
Enter kinds: `fade pop rise sink drop slide-left slide-right zoom blur flip flipX swing stamp spin tilt3d none`. Exit kinds: `fade rise sink drop blur pop zoom slide-left slide-right none`.

## 3. Text

```js
s.text('Every location. *One map.*', { x, y, w, size:'title', align:'center', fx:'rise', at:.3, out:'rise', outAt:2.4,
        color, hlColor, hl:'color'|'marker'|'underline'|'both', weight, lh, ls, upper, lang:'ar', font:'hand', theme:'light', style:'pill', fit:true });
```

* `*words*` = highlighted (spans several words) · `~words~` = strike-through · `\n` = line break.
* Sizes: `mega 168 · hero 116 · title 86 · sub 58 · body 42 · caption 46 · label 30 · small 30 · number 230` or px. Text auto-shrinks to fit `w` (default stage width − 150).
* `fx`: `rise drop pop blur slide fade wave letters type scramble stamp zoom highlight underline strike none` (wave/letters/type/scramble are Latin-only; Arabic falls back to word animation).
* `out`: `rise drop blur fade pop scatter` (word-level) or any exit kind.
* Arabic: `lang:'ar'` (RTL, Noto Kufi Arabic). Keep Arabic lines short; check with a native speaker.

Helpers: `s.beats(['Same','question.','*Every* day.'], { at, beat:.5, size, y, keepLast, theme, fx })` · `s.swap(enLine, arLine, { at, swapAt, size, y })` ·
`s.counter({ from, to, at, dur, prefix, suffix, decimals, format:'comma'|'time'|'none', size, y })` · `s.marquee(text, { y, rot, bg, color, size, speed })`.

## 4. Components (`sm-components.js`)

| Code | Call | Key options / API |
|---|---|---|
| CP-01 | `s.phone({ x, y, w, tilt:'left'|'right', in, at })` | returns `{ layer, phone, screen }` — put any HTML in `screen` |
| CP-02 | `const c = s.chat({ x, y, w:800, title, sub, group, lang, in, at, out, outAt })` | `c.type(at, text, {cps})` · `c.bot(at, text, {typing})` · `c.msg(at, text, {from:'me'|'bot', name})` · `c.photo(at, src)` · `c.draft(at, {code, line, sku, sub, status})` · `c.approve(at)` · `c.reject(at)` |
| CP-03 | `const p = s.lock({ x, y, w, date, clock })` | `p.notify(at, { app, title, text, time })` |
| CP-04 | `s.notify({ x, y, w, app, title, text, at, outAt })` | iOS-style banner |
| CP-05 | `s.storm({ at, dur, count, messages:[[name, text, 'ar'?]], area:[x0,y0,x1,y1], size, clearAt })` | the "where's the shipment?" flood |
| CP-06 | `s.device({ type:'phone'|'tablet'|'laptop'|'monitor', src, html, w, tilt, scroll:{at,dur,from,to}, in, at })` | real screenshots (SCR) in a frame; `html` for live content |
| CP-07 | `const inv = s.invoice({ x, y, w, items, supplier, in:'drop', at, rot })` | `inv.scan(at, dur)` · `inv.draft(at, { x, y, w, stagger, label, code, route })` — items without SKU get "New item" |
| CP-08 | `s.card({ x, y, w, kicker, title, body, icon, dark, lang, in, at })` | |
| CP-09 | `s.ledger({ x, y, w, rows, at, stagger, highlight, hlAt })` | rows: `[time, who, via, OP, what, where, before→after]` |
| CP-10 | `s.kpis({ x, y, items:[[label, value, alert?]], at, vertical })` | numbers count up |
| CP-11 | `s.callout({ x, y, dx, dy, label, at, outAt, light, color })` | dot + line + label |
| CP-12 | `const sh = s.sheet({ x, y, w, h, file, tabs, scroll:{at,dur,x,y}, rot })` | `sh.collapse(at)` — cells turn into dots |
| CP-13 | `s.notes({ texts, at, stagger, area, size, clearAt })` | sticky notes rain |
| CP-14 | `s.compare({ before, after, beforeLabel, afterLabel, at, dur, from, to })` | image paths or HTML; animated slider |
| CP-15 | `s.checklist({ items, title, x, y, w, at, stagger, dark, card })` | |
| CP-16 | `s.flow({ nodes:[{icon, t, sub}], x, y, gap, at, stagger })` | icons: msg ai user map … (`SM.icons`) |
| CP-17 | `s.journey({ stops:[{t, sub, icon:'sea'|'customs'|'road'|'air', day}], x, y, gap, at, dur, dayX, dayY, vehGap })` | |
| CP-18 | `s.poll({ q, options:[[label, pct]], at, revealAt, quiz, correct, picked, lang, note })` | for stories leave the centre free for the real IG sticker |
| CP-19 | `s.cursor({ points:[{x, y, at, click}] })` | |
| CP-20 | `s.clock({ from:480, to:540, at, dur, size, x, y, marks:[t…] })` | minutes since midnight |
| CP-21 | `s.captions({ elevenlabs: alignmentJson, offset, y, max:4, size, style:'box', lang })` | or `{ words:[{w,s,e}] }` or `{ text, wps }` |
| CP-22 | `s.lowerThird({ name, role, x, y, at, until })` | |
| CP-23 | `s.whiteboard({ lines:[{t, x, y, at, size, color, cps}], arrows:[{d:'M… C…', at, dur, color}] })` | handwriting (Caveat) |
| CP-24 | `const y = s.iso({ x, y, scale, intro:'drop'|'pop'|'rise'|'none', stagger, items:[{key, id, o, x, y, d, at}] })` | ids from the map-element library; `y.drive(key, at, dur, dx, dy)` · `y.pop(key, at)` · `y.hide(key, at)` |
| CP-25 | `s.photos({ srcs, x, y, w, h, at, stagger })` | polaroid drops |
| CP-26 | `s.logoDots({ from:'scatter'|'center'|'rain'|'grid'|'explode', size, x, y, at, dur, variant, wordmark, tagline:'en'|'ar'|'both', cta, endorse })` | the Dot core builds itself |
| CP-27 | `s.logo({ variant, size, x, y, in, at })` · `s.lockup({ layout:'h'|'v'|'ar'|'bi'|'icon'|'mark', variant, size, tagline, endorse })` | LG codes |
| CP-31 | `s.image(src, { x, y, w, h, radius, frame:'card'|'polaroid'|'circle', move, focus, rot, in, at, out })` | photos or video cards |
| CP-32 | `s.bg('/assets/presenters/karim/D30-14.mp4', { offset, rate })` | presenter clip as the scene background (video seeks frame-exactly) |
| CP-33 | `s.dotMorph({ count:480, x, y, steps:[{ at, shape, size, dur }] })` | **signature effect** — brand dots fly together into a word or number (`{text:'41'}`), an icon (`{icon:'truck'}` · box · warehouse · pin · ship · check · phone · alert), the map of Lebanon with the three warehouses glowing (`'lebanon'`), or the Dot core logo (`'logo'`), then break apart (`'explode'`, `'scatter'`, `'rain'`, `'ring'`, `'grid'`). Text auto-fits the width; Arabic works. |

**End cards** are scenes: `R.endcard(type, { in, dur, cta, src, text, word })` — all in the version's language:
`dots` (EC-01, dots fly into the Dot core) · `rain` (EC-02) · `wordmark` (EC-03) · `tagline` (EC-04, alias `bilingual`) · `truck` (EC-05) · `phone` (EC-06) · `photo` (EC-07) ·
`dotword` (EC-10, the key word is built from dots, then regroups into the logo — set `word`) · `dotmap` (EC-11, dots draw Lebanon with the three warehouses, then fly into the logo).

## 5. Transitions (`in:` on the next scene)

`cut fade whip-left whip-right whip-up whip-down push-left push-right push-up push-down zoom-through zoom-out iris round wipe wipe-right split splitH blur stack spin punch flash glitch dots shutter`

## 6. Camera moves (`move:` on `bg` / `s.image`, or `s.camera(el, move, o)`)

`none in out left right up down push pull snap dolly drift handheld rack unrack` — options `s0, s1, amt, drift, amp, b0, b1, from`.

## 7. The live map (`sm-app.js`) — the real Stacko UI, animatable

```js
const m = s.map({ view:'all', intro:'draw'|'drop', lang:'en'|'ar', warehouses:['W1','W2','W3'], units:{W1:7250}, low:{W2:1},
                  fitH:.56, textSpace:.09, fade:true, fadeH:620, followOffset:[0,300], pois:true, whScale:1.25, vehScale });
m.camera(at, { focus:'W2'|'all'|[lat,lon], zoom:2.4, dur:1.3, ease, offset:[x,y] });  m.zoomAll(at)
m.truck({ from:'W1', to:'W2', at, dur, eta:73, qty:40, item:'LED Strip 5m', glow:true, follow:true, followZoom:1.6, followOffset:[0,300], toast:true, toastText, stock:true });
m.ship({ at, dur, eta, follow })   m.plane({ at, dur, eta, follow })
m.units('W2', at, +40)   m.low('W3', at, 3)   m.select('W1', at, true)   m.pulse('W1', at, color)   m.toast(at, 'Logged: 40 × LED Strip 5m')
m.header({ y:250, at:.3 })        // KPI bar: units / in transit / low lines — computed live from the map state
m.screenOf('W2', t)               // screen position of a warehouse at time t (to attach callouts)
```

Warehouses: W1 Beirut 7,250 · W2 Sidon 4,980 · W3 Tripoli 3,120 (demo data). Add more before creating the map:
`SM.PT.W4 = [33.846, 35.902]; SM.WH_NAMES.W4 = { code:'WH-04', en:'Zahle', ar:'زحلة', units:2140 };` then `warehouses:['W1',…,'W4']`.
Positions in phase 1 are ETA-based (no GPS) — say so on screen whenever a vehicle moves.

## 8. Renderer (`studio/render.mjs`)

```bash
node studio/render.mjs <page.html> --preview --lang all     # contact sheets preview_EN.png + preview_AR.png (ALWAYS first)
node studio/render.mjs <page.html> --lang all               # <ID>_EN.mp4 + <ID>_AR.mp4
node studio/render.mjs <page.html> --stills --lang all      # carousel: slide-01_EN.png … slide-07_AR.png
node studio/render.mjs <page.html> --cover --lang all       # cover_EN.png + cover_AR.png
# single version: --lang en | --lang ar.  Without --lang the page renders in English with no suffix.
node studio/render.mjs <page.html> --preview     # contact sheet → preview.png next to the page
node studio/render.mjs <page.html>               # MP4 (H.264, AAC, −16 LUFS) → <ID>.mp4 next to the page
node studio/render.mjs <page.html> --stills      # carousel slides / named stills → <name>.png
node studio/render.mjs <page.html> --cover       # cover.png at R.cover(t)
node studio/render.mjs <page.html> --still 2.4   # one frame
node studio/render.mjs --serve                   # http://localhost:4173/<path> — live player with scrubber, safe zones, loop
options: --out file.mp4 --from 0 --to 5 --fps 30 --crf 19 --scale .5 (fast draft) --no-audio --quality best
```

The page reports errors in the terminal ("Page errors:"). A missing SFX file is only a note; add the file to hear it.

## 9. Tools

* `python3 studio/tools/place_screens.py BG.png --list` then `--fill 1=SCR-01.png 2=SCR-04.png -o final.png` — real screens onto green placeholders (perspective, focus, grain, glare, despill).
* `python3 studio/tools/make_sfx.py [--music]` — regenerates the starter SFX (and a placeholder music bed).
* `node studio/tools/export_logos.mjs` — writes the LG logo files.
