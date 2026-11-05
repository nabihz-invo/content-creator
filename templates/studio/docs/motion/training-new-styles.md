# Training a New Style Pack

Goal: add a new file in `references/style-packs/<name>.md` plus a library of measured animations.

## Inputs
- 10-20 reference videos (uploaded MP4 preferred), plus screenshots of favorite scenes and an optional Figma board organized by scene type.

## Procedure
1. **Transcribe** each video (word-level) and extract frames (e.g. 10 fps; denser around animations).
2. **Detect scenes** (cut detection) and tag each: scene type, what the speaker said, time offset.
3. **Measure per animated scene**: duration, easing (sample motion from frames), element positions as % of frame, font sizes, hex colors (palette extraction), texture opacity, text count per scene, intro/outro animation.
4. **Cluster** into scene types; keep the best 3-5 examples per type with keyframe sheets.
5. **Derive rules**: placement logic, scene-to-speech mapping (what scene appears for which kind of sentence), pacing (average scene length, cuts per 10 s), hook pattern, sound map.
6. **Write the style pack** with measured numbers; replace every `[TBD-measure]` it touches.
7. **Test** on one raw clip, compare against the references side by side, refine.

## Output files
- `style-packs/<name>.md`
- `style-packs/<name>/library/<scene-type>/` keyframe sheets and short notes
- Updated scene-library variants if the style adds new scene types.

## Honesty rule
Report which values were measured and which were estimated. Never claim frame-level analysis from links or page text alone.
