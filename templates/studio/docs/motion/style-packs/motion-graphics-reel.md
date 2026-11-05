# Style Pack: Motion Graphics Reel (batch 2, 7 reference videos)

Measured = computed from frames/audio. Observed = read from contact sheets by eye. Not analyzed: audio content, exact fonts, easing curves, px sizes.

## Cross-video facts (measured)
- Formats: 5 clips 720x1280 (9:16), 1 clip 716x1274, 1 clip 720x900 (4:5). Support 9:16 by default, 4:5 on request.
- Length: 8.4 to 31.8 s (median about 22 s). Short pieces are logo/intro reveals.
- Loudness: 5 of 7 at -14.1 to -14.4 LUFS; the two shortest (9.3 s logo reveal, 8.4 s intro) at -16.2 and -15.2. Combined with batch 1, 10 of 12 sit at -14.x. Keep -14 LUFS; allow quieter only for sub-10 s logo stings.
- Two pacing modes (measured by cut count):
  - Cut-driven: 1.35, 1.54, 1.77, 2.7, 2.8 s average scene length (clips 3, 4, 1, 5, 7).
  - Morph-driven: 0 to 2 hard cuts in 26-32 s (clips 2 and 6). Elements transform into each other instead of cutting; this is why they feel "premium".
- Still frames: 13-33% of frames are near-static in morph-driven clips (holds between bursts). Do not keep everything moving.
- One accent hue per reel on a black or white base. Measured accents: yellow #FAD846, green #17AF08, electric blue #0834E3 / #405E95, orange #E78040, purple #635082.

## Sub-styles found

### M1. Gradient agency promo with pill UI  [clip 1, 24.9 s]
- Palette: gold gradient (#FAD846 to #F7E8A8, cream #FCF8E5) alternating with black #0B0805; background flips light to dark to light.
- Observed: pill search bar that types words with a blinking cursor ("Websites|"), rounded UI cards (stat card 21% to 27% with a mini chart), horizontal motion-blur wipes (rapid cuts every 0.2 s from 13.9 to 14.6 s), photo/website screenshots flying through, magnifier icon, key word set in italic serif ("guesswork.", "Nothing runs in isolation").
- Text builds by type-on, not pop.

### M2. Clean white + green explainer  [clip 2, 26.4 s, morph-driven]
- Palette: white #FEFEFE (92%), green #17AF08 accent (2%), soft mint tint.
- Observed: one continuous timeline, no hard cuts; gauge dial with needle, 10-second progress ring ("10 is a second"), corner-bracket frames around a person icon row, hexagon icons with thin leader lines and labels building one by one, green filled pills versus outlined pills staggered in, italic serif accent on the key word ("every second", "Aren't louder."), final line ends with a green orbit-stroke underline.
- Text appears with blur-to-sharp and inline type-on.

### M3. Talking-head podcast + graphic overlays  [clip 3, 23.0 s]  (closest to our main use case)
- Palette: dark teal/charcoal footage (#212022, #404B51), warm gold/amber accent, light gray (#D5D4D2) and orange-copper scenes for inserts.
- 16 cuts in 23 s (average 1.35 s); designed inserts alternate with the speaker every 2-3 s.
- Observed techniques:
  - Tiny captions (very small, centered on the speaker's chest); italic serif for the emphasized word that scales up for punch ("literally", "read").
  - Timeline insert: circular speaker avatar on a gray field with a year scrubber (2020 to 2024).
  - Stock/cinematic shot (city tower with halftone texture) with a metal label tag ("MY BUSINESS") and a revenue counter; tower rises through clouds with flying cash, ends with a warm gold flash transition.
  - Hand-drawn curved arrow from a word to the lower third ("The podcast Guy"), lower third in serif + red subline.
  - Framed photo cards with tape labels on a dark grid board; pixel-style 3D text ("GO HOME AT 05 PM") on light gray; product/book cover on an orange gradient with corner-bracket frame.
- Rule: every insert is a literal visual of the spoken phrase.

### M4. Logo reveal sting  [clip 4, 9.3 s]
- Palette: royal blue #0834E3 and white #FCFCFC (about 45% each).
- White/blue strobe flips every 0.4 s in the first 1.7 s (a hard-cut rhythm of four flips), then a dot grows into a circle wipe, logo letters assemble one by one, tagline in small caps, ends on a small icon plus long hold. 58% of frames are still. Loudness lower (-16.2 LUFS).

### M5. Dark SaaS app promo  [clip 5, 21.7 s]
- Palette: near-black #010104 (50%), navy #0D1C41 (34%), blue #405E95, white text; green #00F42C only for the success state.
- Observed: type-on headlines with blinking cursor ("Everything starts with a plan"), floating glass icon grid, UI cards sliding in with depth blur, animated hand cursor clicking buttons, swipe-to-pay slider turning into a green check, orbit rings ("AI Powered"), glowing arc as a persistent bottom element, persistent small logo watermark bottom-right, gradient text (white to blue) for the key phrase.
- Average scene 2.7 s; each scene = one headline + one UI demo.

### M6. Particle/orbit morph reel  [clip 6, 31.8 s, morph-driven]
- Palette: black (80%) with warm gold/orange glow #E78040; one light cream scene (#F2E4D8) from 15.8 to 20.7 s.
- Observed: a persistent one-line title at the top across scenes; a spark expands into orbit rings, rings turn into a particle circle that morphs into a flower shape, then a star, a glossy gradient card ("Details") with a 3D flip, a baseline line with concentric arcs and glowing dots, an infinity-loop path; the light scene shows dark pill chips ("Dream it", "Build it", "Ship it") connected by an orange curved line.
- Small caption under each visual with one italic serif accent word.

### M7. Perspective phone intro  [clip 7, 8.4 s, 4:5]
- Palette: black #050307 (45%), light gray #F2F0F3 (32%), purple #2A213B / #635082.
- Observed: 3D phone pushes in with a notification; light scene with slot-machine text roll ("Meet your / Creative Designer / Director / Partner" rolling vertically); dark purple end card with brand name. About 3 s per scene.

## New scene types for the engine (add to scene-library)
- **UI type-on:** pill input or headline typed with a blinking cursor; use for search, query, "list of things" moments.
- **Cursor click demo:** animated hand cursor clicks a button, state change (green check).
- **Pill chips + curved connector:** sequence (Dream it, Build it, Ship it) with a thin curved line moving between chips.
- **Leader-line icons:** icons in hexagons/circles with thin lines and labels, built one by one.
- **Progress ring / gauge:** numbers and time ("10 seconds").
- **Slot-machine text roll:** vertical roll to swap a word (Designer, Director, Partner).
- **Orbit/ring morph:** one element transforms into the next instead of a cut.
- **Tag-label callout:** small metal/tape label on a photo or footage.
- **Hand-drawn arrow:** from a spoken word to a lower-third.
- **Timeline scrubber:** years under an avatar.

## Rules extracted for the engine
1. One accent hue per video on black or white; swap the base (light/dark) between scenes for rhythm.
2. Choose a pacing mode up front: cut-driven (scenes 1.3-2.8 s) or morph-driven (few cuts, elements transform, still holds).
3. Text enters with type-on or blur-to-sharp; pop-ins are reserved for single key words.
4. One italic serif accent word per line, rest in a clean sans.
5. Every insert is a literal visual of the spoken phrase (tower for "business", book cover for "read").
6. Small persistent elements (watermark, title strip, bottom arc) tie scenes together.
7. Tiny captions plus large inserts: captions can be very small when the visual carries the message.
8. Use hard-cut strobe or motion-blur wipe flurries (0.2-0.4 s) once per video as an energy burst.
9. Use a warm flash or invert frame as a transition between very different scenes.

## Still unmeasured
Easing curves, exact fonts, px sizes, SFX/music placement and content, and spoken-text-to-scene mapping for clips other than 3 (no transcripts yet).
