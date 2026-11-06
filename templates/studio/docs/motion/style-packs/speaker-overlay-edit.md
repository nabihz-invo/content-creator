# Style Pack: Speaker + Concept Inserts (batch 3, 2 speaker clips)

Both clips are editor portfolio showcases: a small "Raw" panel beside a larger "Edit" panel inside a branded frame. All numbers below come from the Edit panel only. Do NOT copy the showcase frame, labels or editors' handles into client work.
Measured = computed. Observed = read from frames by eye. Speech was NOT transcribed (the transcription model could not be downloaded in this environment); on-screen text only is known.

## Measured (Edit panel)
| | Clip A (neuroscience talk) | Clip B (podcast, "mindset") |
|---|---|---|
| Length | 14.3 s | 20.7 s |
| Scene changes | 6 (avg 2.0 s, min 0.3, max 5.1) | 7 (avg 2.6 s, min 1.1, max 6.1) |
| Still frames | 29% | 21% |
| Loudness | -14.1 LUFS | -14.2 LUFS |
| Palette | pastel blue #ADCBDE (50%), off-white #E5F1FA, dark footage #0F1017 | desaturated grays #C9C4C7 / #E5E2E6 (58%), dark footage #23181A, mauve #665354 |
Loudness now: 12 of 14 clips across batches at -14.x.

## Structure (observed)
- A-roll and concept inserts alternate every 1-3 s. Estimated 55% (A) to 70% (B) of runtime is a designed insert, with 1-2 s A-roll "breathing" shots between them.
- Each insert illustrates one phrase literally. Clip A: list of three icons (Visual Processing, Movement, Language and Social connection) appearing one at a time, each full-screen for about 1 s, then "What's the THIRD element" back on the speaker. Clip B: brain with hands, thinker statue with a laptop, brain cracking and fusing.
- Insert background differs strongly from the footage: clip B uses black-and-white imagery on light gray against colorful footage (pink shirt, purple shelves). Contrast comes from removing color.

## Caption style on A-roll (observed)
- Two-tier line: small support words in white sans (about 1/2.5 of the key word height) plus one big heavy-weight key word ("30 minutes", "YOU PUT IN", "EVERY DAY", "FIRE", "THIRD").
- Position: lower-middle of the speaker (chest/mic area), not the bottom edge. Key word uses a blur-in to sharp on entry.
- Emphasis color in clip A: bright blue on the key word (THIRD); clip B keeps everything white.
- Dark gradient at the bottom of the frame to keep white text readable.
- Punch-in: edit is cropped tighter than the raw (face larger), and the crop changes at cuts.

## Insert design (observed)
- Clip A: pastel blue vertical gradient, thin outline brain drawings at the edges as texture, one large icon + short bold gray label in the center, flat vector person holding a phone with a social card; circle-wipe transition from the speaker into the first icon.
- Clip B: high-contrast monochrome stock-style imagery (brain, hands, thinker statue with laptop, desk figure), serif italic accent words in ink black ("Formation", "Skill Sets", "Together", "Wire"), bold sans for the main phrase ("the more you do something the more it gets HARDWIRED" with a dotted drop line), blurred dissolve between inserts, cracks drawing across the brain as line animation.

## Rules extracted for the engine
1. Alternate: A-roll (1-2 s) / insert (1.5-4 s). Never two inserts with the same layout back to back.
2. Make each insert visually opposite to the footage: desaturate or use a flat pastel when the footage is colorful/dark.
3. Lists of 3: show one icon + label per beat (about 1 s each), then return to the speaker for the payoff question.
4. Caption = small support words + one heavy key word; blur-in the key word; place at chest height, not at the screen bottom.
5. Emphasis color is optional; when used, one hue only (blue in clip A).
6. Tighten the crop (punch-in) on A-roll between inserts so the speaker never looks static.
7. Use blur dissolves or circle wipes between very different backgrounds, not hard cuts.
8. Serif italic for the one conceptual word per insert; sans for everything else.

## Planning mapping (from on-screen text)
| Spoken idea | Insert used |
|---|---|
| Naming components ("human brain", "visual processing", "movement") | icon + label cards |
| Everyday behavior ("identity", "every day") | flat vector person with phone |
| Habit/repetition ("the more you do something") | figure at desk, then thinker statue |
| Idiom ("neurons that fire together wire together") | brain with crack-and-fuse lines, "Wire Together" in serif italic |
| Number/time ("in this 30 minutes") | key-word caption only (no insert) |

## Still unmeasured
Font names, px sizes, easing, SFX/music, and speech-to-scene timing (no transcript). Next: send raw clips with their finished edit so I can compare words to inserts.
