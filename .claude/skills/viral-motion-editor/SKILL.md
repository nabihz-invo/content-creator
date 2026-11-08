---
name: viral-motion-editor
description: Edit talking-head clips into viral short-form videos (9:16) with premium motion graphics, kinetic captions and sound design, in English or Arabic. Use when the user sends a raw talking clip and wants a "viral edit", "minimal animation edit", "motion graphics reel", captions with highlighted words, or asks to plan scenes for a script. Not for long-form YouTube edits or videos with no speech.
---

# Viral Motion Editor

Turns a raw talking clip into a 9:16 edit: silence cut, word-timed captions, designed scenes (paintings, lines, graphs, illustrations, B-roll), and sound design. Built as a **core engine + swappable style packs**.

## Workflow (always in this order)

1. **Intake**: detect language (EN / AR / mixed), confirm style pack (default: `minimal-paper`), target length, platform. Ask at most 2 questions, then proceed.
2. **Transcribe + cut**: word-level transcript (ms), remove silences keeping 30 ms padding, keep a cut map so captions stay in sync after cutting.
3. **Plan document (STOP here for approval)**: build the plan per `references/planning-and-qa.md`. Show script beside recommended scene per segment, with a one-line reason each. Do not build before the user approves or edits the plan.
4. **Asset list**: list every asset needed (fonts, B-roll, paintings, images, textures, SFX, music) with source and license note. Fetch; flag what cannot be found.
5. **Build**: Remotion project, one component per scene type (`references/scene-library.md`). Captions first, then scenes.
6. **Self-QA before showing**: run the checklist in `references/planning-and-qa.md`. Fix what fails; do not show a draft that fails hard rules.
7. **Revisions**: expect 60-70% on first draft. Apply numbered revision notes, re-render, re-run QA.
8. **Sound design** after picture lock only (`references/sound-design.md`), then loudness check and final render.

## Output format

- **Default:** Remotion (React) project rendered to MP4, 1080x1920 (4:5 = 1080x1350 on request), 30 fps (60 fps only if asked). Chosen because it is deterministic, supports custom fonts and RTL text, and every revision is a code change.
- **Plan document:** a Docs artifact (script + scene cards), exportable to PDF.
- **Alternatives on request:** DaVinci timeline (see the davinci-video skill), After Effects handoff, or vertical + 16:9 exports.

## Hard rules (never break)

- One main font + one accent font (serif/script for special words). Main font covers ~80% of text.
- Color split 60 / 30 / 10 (primary / secondary / accent). The accent marks the single focal element.
- Every scene has ONE focal point. Max 2 objects per scene.
- Speaker sits in the upper third on A-roll; captions in the lower third. Keep text inside platform safe zones (top 12%, bottom 20% reserved for UI overlays unless the scene is full-frame design).
- Captions: 5 words or fewer per line. Most important word is largest, centered; supporting words smaller above/below.
- Announce a new idea on the speaker's face (A-roll); SHOW the idea while he/she describes it.
- Never place two scenes of the same type back to back. Never exceed 4 s without a visual change.
- Smaller text looks more premium; 1-2 lines max on overlays.
- Arabic and mixed text follow `references/arabic-rtl.md` exactly (no letter-spacing, no per-letter animation, correct shaping).

## References (load as needed)

- `references/design-principles.md`: typography, thirds, balance, contrast, color, layouts. Load for any design decision.
- `references/scene-library.md`: 10 scene types with layout, assets, animation, when to use. Load when planning and building.
- `references/arabic-rtl.md`: Arabic/RTL rules, font pairings, mixed-language handling.
- `references/planning-and-qa.md`: plan template, retention pacing, hook rules, QA checklist, revision protocol.
- `references/sound-design.md`: SFX map, music, ducking, loudness targets.
- `references/style-packs/minimal-paper.md`: the first style pack (paper texture, blue line, painted illustrations).
- `references/style-packs/kinetic-typography.md`: five measured sub-styles (gold keyword A-roll, black/white word-per-cut, UI/3D, editorial collage, abstract UI showreel).
- `references/style-packs/motion-graphics-reel.md`: seven measured sub-styles (gradient agency promo, clean explainer, podcast + overlays, logo reveal, dark SaaS promo, particle morph, phone intro), new scene types, and the cut-driven vs morph-driven pacing modes.
- `references/style-packs/speaker-overlay-edit.md`: two measured speaker edits (concept inserts, two-tier captions, punch-ins); the closest reference for talking-head clips.
- `references/training-new-styles.md`: how to add a new style pack from reference videos.

## Measured values policy

Numbers marked `[TBD-measure]` in the references are placeholders until frame analysis of reference videos confirms them. When reference videos are provided, measure and replace them; never invent precision.
