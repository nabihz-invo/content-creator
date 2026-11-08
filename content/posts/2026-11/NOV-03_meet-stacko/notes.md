# NOV-03 · notes

## Revision 1 — owner feedback (27 Oct)
- Two separate versions: NOV-03_EN.mp4 and NOV-03_AR.mp4 (+ cover, preview, caption per version). Titles, captions, toast and ETA note follow the version.
- The EN → AR tagline swap (TX-16) is gone: the end card is now a tagline card (EC-04) — the mark pops, the wordmark scrambles in (EN) or ستاكو appears (AR), tagline in that language only.
- Transitions are silent (swoosh / whoosh removed); the "assemble" sound stays under the dot build.
- Old single-language files (NOV-03.mp4, cover.png, preview.png, caption.txt) are replaced by the _EN / _AR files.

**Files:** NOV-03_EN.mp4 · NOV-03_AR.mp4 (26.0 s) · cover_EN/AR.png · preview_EN/AR.png · caption_EN/AR.txt

**Status note:** the row said "Brief ready", not "Approved for production"; built because you named NOV-01/02/03.

## What I built
RC-22 brand moment: one glowing dot falls (motion at frame 1), hundreds rain into the Dot core (OP-14), the three Y routes light up in Glow, snap zoom into the core (CM-08) → TR-18 dots → BG-10 presenter corner (SCR-13 placed on the TV edge) with "Meet Stacko." → TR-07 iris into the live map: map draws (AN-01), truck W1 → W2 with ETA tag (AN-03), toast "Logged: 40 × LED Strip 5m" (AN-11), "Positions estimated from the ETA" → EC-04 bilingual: Dot core + scrambled wordmark (TX-09) → Arabic lockup (LG-08), tagline EN → AR swap (TX-16), "A product by AIPHIN".

## Deviations and missing assets
- Maya's 6 s avatar clip (PR-02) is not in assets/presenters/maya/. The BG-10 beat shows the presenter corner with her line as on-screen text instead. Line to generate: "Meet Stacko. Every warehouse, every item, every shipment, on one live map." → assets/presenters/maya/NOV-03_take1.mp4 + _alignment.json; I then add the clip, captions and the lower third "Maya · Stacko".
- PI-43 (dot cube hero for the cover) is not on disk — cover.png is the assembled Dot core frame from the reel (real logo, not AI).
- LG-07 stacked lockup is built as mark + wordmark stacked (the scramble resolves into the real wordmark).
- Music: MU-01 / MU-02 tracks are not in assets/audio/music/ — the render uses placeholder-calm.mp3 (previews only, not licensed for publishing).

## Self-check (14 approval checks)
| # | | Note |
|---|---|---|
| C01 | ✓ | HK-12 reveal tease, hook blurs in at 0.25 s; first word "every". |
| C02 | ✓ | A dot drops from frame 1. |
| C03 | ✓ | AN-01 + AN-03 + AN-11. |
| C04 | ✓ | logo dots · BG-10 office · app map · LG-07/08 lockups (presenter missing). |
| C05 | ✓ | Text within y 220–1500. |
| C06 | ✓ | Dark variants on Night, teal o, Noto Kufi for ستاكو. |
| C07 | ✓ | Badge for the whole map beat + ETA note. |
| C08 | ✓ | Demo transfer (40 × LED Strip 5m, W1 → W2, ETA 1h 13m). |
| C09 | ✗ | Tagline AR is the official one; caption AR drafted. |
| C10 | ✗ | No voice yet; placeholder music. |
| C11 | ✗ | Captions come with Maya's clip. |
| C12 | ✓ | EC-04 bilingual, 5 s. |
| C13 | ✗ | CTA column is empty — pinned comment suggested; AR caption drafted. |
| C14 | ✗ | Watch the MP4 on a phone. |
