# Planning, Pacing and QA

## Plan document template
Two columns: script (left, with timecodes) and scene card (right). Per segment:

| Time | Script line | Scene type | Why (one line) | Assets needed | Alt option |
|---|---|---|---|---|---|

Plus a header block: language, style pack, palette (60/30/10 hex), fonts, total duration, hook line.

## Planning rules
- Pattern: announce on the face, describe with a scene.
- Alternate: A-roll -> designed scene -> A-roll -> designed scene; avoid three designed scenes in a row.
- Match the scene to the logic of the sentence (object, two objects, progression, number, person, quote).
- End on a text-centric (quote) or a strong A-roll beat.

## Hook rules (first 3 seconds)
- Open with the strongest line of the clip, even if it must be moved up (ask the user).
- Show a designed visual or text hook within 3-5 s; do not start with logos or intros.
- First caption on screen by 0.3 s.
- If the first line is slow, cut into the first complete claim.

## Retention pacing
- A visual change at least every 3-4 s (cut, scene change, or caption emphasis).
- Alternate intensity: heavy scene followed by lighter A-roll.
- Mid-video pattern interrupt around 40-60% of the duration (new scene type, zoom, or sound accent).
- Keep short clips under 60 s unless content demands more; mark `[TBD-measure]` target from reference videos.

## QA checklist (run before every draft shown)
Hard fails (must fix):
1. Audio sync: captions within 80 ms of speech [TBD-measure tolerance].
2. No silences longer than padding setting; no clipped words at cuts.
3. Text inside safe zones; all text readable at phone size (min 40 px for body, 64+ for emphasis at 1080 wide) [TBD-measure].
4. No two same scene types adjacent.
5. One focal point per scene; no overlapping text/objects.
6. Only 2 fonts, palette within 60/30/10.
7. Every asset licensed or flagged; no watermarks.
8. Arabic checks (if AR): joins intact, RTL order, punctuation placement.
9. Texture overlays move with their layer.
10. Final frame is clean (no cut-off animation).

Soft checks: rhythm feels varied, animations ease in and out, loudness targets met (see sound-design.md).

How to check: render preview frames at the start/middle/end of every scene, view them, and run an automated pass for text bounding boxes and caption timing against the transcript.

## Revision protocol
- User sends numbered notes with timecodes. Apply all, re-render, re-run QA, and reply with a one-line list of what changed per note.
- After 2 rounds, ask "ready for sound design?" and lock picture.
