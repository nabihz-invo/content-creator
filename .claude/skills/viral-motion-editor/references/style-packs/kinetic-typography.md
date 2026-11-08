# Style Pack: Kinetic Typography (batch 1, 5 reference videos)

Measured from 5 uploaded clips (all 720x1280, 30 fps, 6.5-32.9 s). "Measured" = computed from frames/audio. "Observed" = read from contact sheets by eye, not computed. Not analyzed: audio content (no transcript), exact font names, easing curves.

## Cross-video facts (measured)
- Loudness: integrated -14.1 to -14.4 LUFS in all 5. Use -14 LUFS as the target.
- Length: 6.5 / 8.2 / 9.5 / 12.4 / 32.9 s. Short-form sweet spot for this style is under 13 s; the 33 s clip is a showreel.
- Hard cuts: 3-6 scene switches per 8-12 s clip (about one every 1.5-2.5 s) in the designed clips; word-per-cut clips run much faster (see T2).
- Every clip changes its palette or background between scenes; none holds one look for more than ~5 s except the showreel.

## Five sub-styles found

### T1. Speaker + gold keyword (A-roll caption style)  [clip 1]
- Measured palette: near-black warm background (#19120E / #3A291F), speaker skin/wood mids, gold #E9A81F (about 6% of pixels, used only for the key word), white for support words.
- Pattern: one key word per beat in huge bold uppercase condensed sans, gold, with one small lowercase white sans support word nearby ("here's / HOW YOU", "can / AI", "you / DON'T / need").
- Key word sits behind or around the speaker (depth layering: text behind the subject, using a subject matte); support word sits at a corner of the key word.
- Key word events (measured): start every 0.7-1.2 s, on-screen 0.6-0.9 s each, longest hold 2.7 s for the final phrase; pop-in rise 70-130 ms (2-4 frames).
- Jump cuts / punch-in scale changes between segments about every 2.3 s (cuts at 2.1, 4.6, 6.1, 8.3, 9.3, 11.4 s).
- Numbers/prices ($500) get the same gold treatment.

### T2. Word-per-cut typographic (black/white flips)  [clip 2]
- Measured palette: #F4F4F4 (58%) and #040404 (41%) only. Text inverts with the background.
- One word per cut. Cut interval accelerates: 0.73 s at the start to 0.27 s at the end (first-half avg 0.55 s, last-half avg 0.29 s). Use this accelerating rhythm for build-up lists.
- Scale varies per word: small word above a huge word ("we / don't", "just / edit"), then uniform mid-size for the list section (create, motion, art, impact, visuals, energy, precision, rhythm, vibes, graphics, transitions, ideas, feelings).
- Tight-tracked geometric sans, lowercase. Fine film-grain/dust added in the second half. One glitch/ink distortion frame as a transition accent.
- Best for: manifesto, list, brand-intro opener. Needs no footage.

### T3. Speaker cutout + UI/3D object scenes  [clip 3]
- Measured palette: navy #0D162B (55%), olive green #9CA95F / #5E633A, accent blue #2D6AB6; red-black scene also present. Each scene has its own palette, linked by consistent type.
- Observed: speaker cut out over a blue gradient shape with rounded UI chips and a circular reveal line; text arrives with focus pull (blur to sharp, about 0.3-0.5 s); keyword in bold with gradient fill, support words in thin white.
- Scene switches at 2.1, 3.4, 5.2-5.6 and 6.1 s. A grayscale/invert flash frame is used as a transition.
- 3D macro object (moss sphere) with floating rounded callout cards that stagger in; arrow icon in a rounded square that rotates to signal "falling/decline".
- Best for: product/startup explainers with ideas that map to objects.

### T4. Editorial cut-out collage  [clip 4]
- Measured palette: cream #FAE3C9 (64%), near-black #1F1814 (22%), orange #EE7D1E accent, warm gray #B39F8A.
- Observed: photographic cutout (statue, hourglass, puzzle pieces) on a flat color; orange block/pill behind or under the keyword; headline in bold sans with an orange highlight bar; tiny paragraph "microtext" blocks and thin technical lines/dots as texture; text partly behind the object; one giant cropped word at the bottom as a background element.
- Scene switches at 2.0, 3.3 and 4.7 s (about 1.6 s each); dark scene (hourglass) used as the contrast beat between two cream scenes.
- Best for: educational/business hooks where each phrase has a physical metaphor.

### T5. Abstract UI motion showreel  [clip 5, 32.9 s]
- Measured palette: black 74%, white 23%, gradients of blue #0E23E7 / cyan #26B9E6 / purple; flips to a white background at ~14.5 s and back at ~22.4 s.
- Observed: thin hairline curves with small white dots as anchors; pill/chip UI labels with a sparkle icon that squash-and-stretch along the path; blurred color orbs merging into a logo end card; small bottom caption line stays constant across scenes (title/description label).
- 39% of frames are near-static: the motion comes in bursts with holds, not constant movement.
- Best for: brand reels and intros; not for talking-head content.

## Rules extracted for the engine
1. One key word per beat; key word 3-5x the size of the support word; support word lowercase, key word uppercase or heavy weight.
2. Spend the accent color only on the key word (about 6-10% of pixels).
3. Switch background/palette at every scene change; keep the typeface constant.
4. Rhythm: accelerate cut intervals toward a payoff (0.7 s to 0.3 s), then end on a longer hold (about 2-3 s).
5. Use depth: put key text behind the subject when a matte is available; otherwise overlay.
6. Entrances 70-130 ms for captions (snappy); 300-500 ms for designed scenes (focus pull, slide).
7. Scenes are 1.5-2.5 s in designed clips; hold the final line longest.
8. Add microtext/hairlines/grain as texture so flat backgrounds do not look empty.

## Still unmeasured (needs more clips or manual notes)
Font names, easing curves, text sizes in px for each tier, SFX type and placement, music, and how scenes map to speech content (clips 2-5 have audio but I did not transcribe it).
