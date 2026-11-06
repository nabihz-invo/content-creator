# Motion craft — viral-motion-editor, adapted to Stacko and this engine

`studio/docs/motion/` holds the **viral-motion-editor** playbook (hooks, pacing, scene library, measured
style packs, Arabic rules). Use it for every reel and story. This page says how it maps onto the studio
engine and which rules win when the two disagree.

## What wins

| The playbook says | Here |
|---|---|
| Build in Remotion | Build the page with this engine (`ENGINE.md`); renders stay frame-exact through `R.seek(t)`. |
| Whoosh on scene transitions | **Transitions are silent.** Sound = music, voice, UI sounds inside components (`ENGINE.md` §0b). |
| Inter + Playfair Italic, any palette | Stacko brand only: Readex Pro / Noto Kufi Arabic; accent word = highlight (`*word*`, Glow on dark, Signal on light) or `font:'hand'` (Caveat) for one word. Palette 60/30/10 = Abyss or Paper base / Ocean–Dolphin / Glow–Signal accent. |
| Stock B-roll, paintings, illustrations | Only files in `assets/` (BG backgrounds, PI photos, real screens SCR, map elements, presenters). No AI-made people, never an invented product UI. Missing visual → a brand scene (dots, iso, map, 3D) and say so. |
| Talking-head A-roll | Most posts have no speaker. Use the no-speaker packs: **kinetic typography** (T2 word-per-cut, T4 editorial), **motion-graphics reel** (M2 clean explainer, M4 logo sting, M5 dark SaaS promo, M6 morph). With a presenter clip (`s.bg('/assets/presenters/…')`) use **speaker-overlay-edit**. |
| −14 LUFS | Same: `R.audio({ lufs: -14 })` unless the brief says otherwise. |

## Rules to apply on every piece (from the playbook)

1. **Hook:** the strongest line first; text on screen by 0.3 s, readable by 1.5 s; a designed visual by 3 s. Never open on a logo.
2. **One focal point per scene, max two objects.** One accent hue per video. Contrast only the highlighted element.
3. **Change something at least every 3–4 s** (cut, new scene type, or caption emphasis). No two scenes of the same type back to back; at least 3 scene types per 30 s.
4. **Pick a pacing mode up front** and write it in your summary:
   - *cut-driven*: scenes 1.3–2.8 s, hard or whip cuts;
   - *morph-driven*: few cuts, elements turn into each other (`s.dotMorph`, 3D, a shape that becomes the next scene), with still holds (20–30 % of frames).
5. **Pattern interrupt at 40–60 %** of the runtime: a new scene type, an invert/flash frame, or a one-time cut flurry (0.2–0.4 s).
6. **Captions/keywords:** ≤ 5 words per line; one key word 3–5× the support words; key word in the accent; snappy entrances (70–130 ms) for words, 300–500 ms for designed scenes.
7. **Text enters with type-on or blur-to-sharp**; pop is for single key words only.
8. **Every insert is a literal visual of its line** (a truck for "transfer", the ledger for "history", a counter for a number).
9. **End on a text-centric line or the end card**, held 2–3 s.
10. **Arabic:** never letter-spacing, never letter-by-letter animation (word or line only), line height ≥ 1.35; mirror layouts, keep numeric axes left-to-right and say so.

## Playbook scene → engine call

| Playbook scene | Engine |
|---|---|
| Kinetic key word / word-per-cut (T1, T2) | `s.beats([...], { beat, size, fx })`, `s.text('*KEY*', { size:'mega', fx:'pop' })` per short scene, accelerating scene lengths |
| UI type-on with cursor (M1, M5) | `s.text(…, { fx:'type' })`, `s.chat(…).type()`, `s.cursor({ points })` |
| Blur-to-sharp headline | `s.text(…, { fx:'blur' })` |
| Pill chips + curved connector (M6) | `s.flow({ nodes })` or `s.journey` |
| Leader-line icons, lists of 3 | `s.checklist`, `s.callout` per icon, `s.card` with `icon` |
| Progress ring / counter / graph (S10) | `s.counter`, `s.kpis`, `s.clock`, a 3D or SVG chart via `s.on` |
| Orbit / particle morph (M6) | `s.dotMorph({ steps })`, `three()` (§10) |
| Logo reveal sting (M4) | `R.endcard('dots' | 'dotword' | 'rain')`, `s.logoDots` |
| Phone / product demo (M5, M7) | `s.phone`, `s.device({ src:'/assets/screens/SCR-…' })`, `m.truck`, `s.chat`, `s.invoice` |
| Line + text (S4, S5) | `s.journey`, `s.whiteboard({ arrows })`, an SVG path drawn with `s.on` |
| Quote / takeaway (S6) | text-centric scene with quotation marks, held 2–3 s |
| Invert / flash / glitch transition | `in:'flash' | 'glitch' | 'iris' | 'zoom-through' | 'dots'` (silent), `s.flash`, `s.glitch`, `s.punch` |
| Two-tier captions on a presenter | `s.captions({ elevenlabs, style:'box' })` |

## In your summary

State the style pack and sub-style you used (e.g. "motion-graphics-reel M5, cut-driven"), the hook line,
where the pattern interrupt is, and any playbook rule you broke on purpose and why.
