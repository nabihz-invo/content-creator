# Recipes (RC-01 … RC-25)

A recipe is the shape of a whole piece. The workbook gives every post one recipe, and the Content sheet flags a
recipe that repeats within 4 posts. Each recipe below lists its beats, its signature move and a code sketch.
Timings are for a 12–20 s reel; stretch or cut beats, never add a static title card.

Rules that apply to all of them:
* Two versions from one page: English and Arabic, never both in one frame (`SM.t(en, ar)`, `--lang all`).
* Transitions are silent — no whoosh between scenes.
* Use the **dot effect** (CP-33 `s.dotMorph`, EC-10 `dotword`, EC-11 `dotmap`, EC-01 `dots`) as the brand signature: at least one dot moment per reel (opener, a number, a transition beat or the end card).
* Motion in the first 0.5 s, hook readable by 1.5 s, payoff before 60 % of the runtime.
* At least 3 visual sources (app animation · PI photo · BG background · presenter · iso/map elements · logo variant · graphics).
* Product posts: at least 2 app animations (AN). A screenshot alone never counts.
* `R.badge(stage label)` whenever a feature is on screen. Captions whenever there is a voice.
* Text inside the safe zone: y 220 → 1500, x 60 → 930 on 1080×1920.

---

### RC-01 · Map comes alive
Beats: map draws (0–2.5) → hook over the top fade → camera to a warehouse → a vehicle moves and numbers change → end card.
Signature: the numbers on the chips change at the exact moment the truck leaves / arrives.
```js
const s = R.scene(11, { name: 'map' }); const m = s.map({ intro: 'draw' });
s.text('40 boxes left Beirut.', { y: 330, size: 84, fx: 'rise', at: .3, color: SM.C.abyss, out: 'rise', outAt: 3 });
m.header({ y: 250, at: 3.2 });
m.truck({ from: 'W1', to: 'W2', at: 3.4, dur: 4.5, eta: 73, qty: 40, item: 'LED Strip 5m', follow: true, followZoom: 1.6, followOffset: [0, 280] });
R.badge('Prototype · demo data', { at: .4, theme: 'light' });
```

### RC-02 · Message → movement
Beats: phone rises with a Telegram chat → message types → bot drafts → thumb approves → the map reacts (truck / ledger / toast).
Signature: the approve tap and the truck departure land on the same beat.
```js
const c = s.chat({ y: 1330, w: 800, in: 'rise', at: .2, out: 'sink', outAt: 5.6 });
c.type(.6, 'sent 40 LED strips from Beirut to Sidon', { cps: 26 }); c.bot(2.4, 'Draft ready.'); c.draft(3.1); c.approve(4.1);
m.truck({ from: 'W1', to: 'W2', at: 4.15, dur: 3, qty: 40, item: 'LED Strip 5m' });
```

### RC-03 · Split: two sides / before–after
Beats: split opens (two photos or photo vs app) → each half states its side → the halves merge into the answer.
```js
const a = R.scene(4, { name: 'split' });
a.image('/assets/post-images/final/PI-18.png', { x: 540, y: 520, w: 1080, h: 900, radius: 0, move: 'left' });
a.image('/assets/post-images/final/PI-21.png', { x: 540, y: 1400, w: 1080, h: 900, radius: 0, move: 'right' });
const b = R.scene(8, { in: 'splitH' }); // the map with both chips changing
```

### RC-04 · Storm → calm
Beats: storm of bubbles with buzz (0–2.5) → stamp the hook → glitch → calm map with header and one clean answer.
Use max once a month.
```js
a.storm({ at: .05, dur: 2.4, count: 15 }); a.text('Sound familiar?', { y: 960, size: 96, fx: 'stamp', at: 2.35, style: 'pill' });
const c = R.scene(6, { in: 'iris', inOpts: { cx: 50, cy: 40 } });
```

### RC-05 · Zoom-through worlds
Beats: an object on screen ≥ 1 s (container, phone, cell) → camera pushes into it → `zoom-through` → we land in the next world.
```js
const a = R.scene(2.2, { bg: '/assets/post-images/final/PI-25.png', move: 'push' });
const b = R.scene(3, { in: 'zoom-through', bg: 'night' }); // iso cartons tumble in
```

### RC-06 · Number story
Beats: one or two counters roll (the hook) → the contradiction → the cause revealed (ledger line / alert) → the fix.
Real or clearly demo numbers only.
```js
s.counter({ from: 0, to: 41, y: 520, suffix: ' in the system', size: 150 }); s.counter({ from: 0, to: 38, y: 900, suffix: ' on the shelf', size: 150, at: .4 });
```

### RC-07 · Presenter + app overlay
Beats: presenter mid-sentence → app opens in a rounded window beside/over them (`round`) while the background unracks → back to presenter → sign-off.
Presenter ≤ 60 % of the runtime; captions always on.
```js
const CLIP = '/assets/presenters/karim/D30-14.mp4';
const a = R.scene(2.5, { bg: CLIP, move: 'in' });                       // presenter full screen
a.captions({ text: 'Our trucks move on the map without GPS.', at: .1, wps: 3.2, y: 1380 });
a.lowerThird({ name: 'Karim', role: 'Stacko', at: .4, until: 2.3 });
const b = R.scene(7, { in: 'round' });                                     // the map takes over…
const m = b.map({ view: 'all' }); m.truck({ from: 'W1', to: 'W2', at: .5, dur: 5, follow: true, followZoom: 1.5 });
b.image(CLIP, { x: 840, y: 1330, w: 300, h: 300, frame: 'circle', offset: 2.5, in: 'pop', at: .2 }); // …while he keeps talking in a PiP circle (offset = time already played)
```

### RC-08 · Two-person skit
Beats: A (problem, 3 s) → whip → B (fix, 3 s) → the fix happens on screen (inset app) → A's punchline → end card.
Write the punchline first. Lebanese dialogue + EN captions.

### RC-09 · Isometric yard build
Beats: yard pieces drop/pop in (0–3) → label chip → second/third yard (whip) → pull out into the map.
```js
s.iso({ x: 560, y: 900, scale: 4, intro: 'drop', items: [ { id: 'ground', o: { k: 'concrete' }, x: -20, y: -20, d: -99 },
  { id: 'warehouse', o: { size: 'm', doors: 3, open: 1 }, x: 0, y: -10 }, { id: 'racking', o: { fill: .6 }, x: 70, y: 40 },
  { id: 'forklift', x: 40, y: 62 }, { id: 'people', o: { vest: true }, x: 22, y: 70 } ] });
```

### RC-10 · Journey leg by leg
Beats: journey line draws, vehicle changes per leg (sea → customs → road), day counter → arrives on the map with "+600 arriving".
State "positions are estimated from the ETA".
```js
s.journey({ x: 170, y: 560, gap: 290, at: .6, dur: 4.2, dayX: 600, dayY: -150 });
```

### RC-11 · Document → data
Beats: document drops → scan line → structured draft builds row by row → flags on unknown items → a person confirms.
```js
const inv = a.invoice({ y: 820, w: 880, in: 'drop', at: .2, rot: -2 }); inv.scan(1.9, 1.5); inv.draft(3.35, { y: 930 });
a.callout({ x: 640, y: 1330, dx: -120, dy: 170, label: 'New items flagged', at: 4.7 });
```

### RC-12 · Kinetic beats
Beats: words on the beat (`R.beats(bpm)`), punch cuts, a marquee band, 1–2 photo flashes, then calm.
```js
const B = R.beats(120, .1); s.beats(['Column AZ.', 'Row 4,812.', 'Merged cells.'], { times: B.slice(0, 3), size: 130, keepLast: true });
```

### RC-13 · Photo story
Beats: 3–5 PI photos with different camera moves (handheld, push, pan), whip transitions, one overlay per photo, then the product answer.
Never the same photo twice in a month; never the same move twice in a row.

### RC-14 · Steps / flow explainer
Beats: numbered steps build one by one (`s.flow` / `s.checklist` / cards); the last step is the payoff. Max 5 steps per reel.

### RC-15 · Myth vs fact / this or that
Beats: myth card → flip → fact card → why (one line) → what to do.
```js
s.card({ y: 600, kicker: 'Myth', title: '“The system is wrong.”', in: 'flip', at: .2 });
```

### RC-16 · Quiz / poll / vote
Story frames with a question, animated options and a clear centre band for the Instagram sticker (added in the app).
Results posts use `s.poll({ revealAt })` with real results only.

### RC-17 · Clock: a day / a deadline
Beats: a clock runs; each time-stamp is a mini scene (chat, map, alert); the last time-stamp is the payoff.
```js
s.clock({ from: 8 * 60 + 57, to: 9 * 60, at: 0, dur: 9, y: 300, size: 150 });
```

### RC-18 · Spreadsheet → map
Beats: messy sheet scrolls (fictional data) → highlight / strike → `sh.collapse(at)` turns cells into dots → dots become the map.

### RC-19 · Phone POV
Beats: phone fills ≥ 60 % of the height: call / lock screen / chat / alert → the answer appears on the phone → phone end card.

### RC-20 · Whiteboard explainer
Beats: handwriting draws (Caveat), arrows draw, red X marks the problem, one clean line for the fix. BG-14 or PI-39 behind.

### RC-21 · Office b-roll story
Beats: BG-final backgrounds (real screens placed) with slow dolly / rack focus, lower thirds, one app moment on the screen inside the shot.

### RC-22 · Brand moment
Beats: dots rain → assemble into the Dot core → routes light → wordmark → tagline EN → AR. Max once a month.

### RC-23 · Screen tour with callouts
Beats: device frame or full map → cursor moves and clicks → numbered callouts (max 5, ≥ 1.5 s each) → recap.

### RC-24 · Seamless loop
Start mid-action, end on the exact first frame (same camera, same positions). No end card. Check by looping in the player.

### RC-25 · Grid → one
Beats: 2×2 grid pops in (one problem per cell, each with its own mini animation and label) → grid collapses (`zoom-out`) into one map.
Build each cell as a clipped layer: `const cell = s.fill('left:0;top:0;width:540px;height:960px;overflow:hidden')` and pass `parent: cell` to components.

### RC-26 · Dot morph story
Beats: dots scatter → build the hook number or word (0–1.5) → break and rebuild into an icon that tells the problem (truck, box, alert) →
rebuild into the map of Lebanon with the three warehouses glowing → fly into the Dot core logo. Text sits above, one line per shape.
Signature: every shape is made of the same dots — "every dot is a unit of stock".
```js
s.dotMorph({ count: 520, y: 900, steps: [
  { at: 0, shape: 'scatter' }, { at: .1, shape: { text: '41', size: 520 } },
  { at: 1.7, shape: { icon: 'truck', size: 560 } }, { at: 3.3, shape: 'lebanon', size: 980 }, { at: 5.3, shape: 'logo', size: 440 } ] });
s.text(SM.t('41 in the system. *Where are they?*', '٤١ عالسيستم. *وين هنّي؟*'), { y: 330, size: 72, fx: 'rise', at: .3, out: 'blur', outAt: 1.6 });
```
See `studio/examples/dots-demo.html` and `dots-endcard.html` (render with `--lang all`).
