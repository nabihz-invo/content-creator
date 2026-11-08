# Sound Design

Apply only after picture lock.

## Sound map
| Visual event | Sound |
|---|---|
| Text highlight / word emphasis | soft click or tick |
| Scene transition | short whoosh |
| Line drawing / graph climbing | rising tone or light tick per step |
| Painting/illustration reveal | paper slide or soft swell |
| Quote scene | subtle low hit |
| Final beat | soft tail, no abrupt cut |

## Music
- Cinematic, low-energy bed (ambient/piano/pads), no vocals. Use royalty-free or user-owned tracks and record the license.
- Duck music 8-12 dB under speech; raise to a gentle level during silent visual moments.

## Levels (loudness measured: 5 of 5 reference clips at -14.1 to -14.4 LUFS integrated)
- Whole mix: -14 LUFS integrated; true peak below -1 dBTP.
- SFX 6-12 dB under speech; music 18-24 dB under speech.
- Avoid stacking more than 2 SFX at once.

## Process
1. Place SFX per the map on the render timeline.
2. Add music and ducking.
3. Measure loudness (ffmpeg loudnorm or equivalent), adjust, render.
