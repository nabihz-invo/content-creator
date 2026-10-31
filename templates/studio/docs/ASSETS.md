# Assets — where things go and how they are named

The workbook's **Assets**, **Backgrounds** and **Post Images** sheets are the full lists. This is the short version.

| Folder | What | Naming |
|---|---|---|
| `assets/brand/logo/` | LG logo files (made by `studio/tools/export_logos.mjs`, or your official files with the same names) | `LG-05_lockup-horizontal-dark.png` |
| `assets/brand/fonts/` | Readex Pro, Noto Kufi Arabic, Audiowide, Caveat (woff2) | as shipped |
| `assets/backgrounds/raw/` | BG images straight from the image tool, green screens included | `BG-03_v1.png`, `BG-03_v2.png` |
| `assets/backgrounds/final/` | The chosen BG with real screens placed — **only these go in posts** | `BG-03.png` (or `BG-03_map.png` for a variant) |
| `assets/post-images/raw/` · `final/` | PI photos; final = picked, cropped, screens placed | `PI-14.png`, `PI-14_9x16.png` |
| `assets/screens/` | SCR / SIGN screenshots for green placeholders | `SCR-01_live-map-dashboard_16x9.png` |
| `assets/graphics/` | GFX backdrops, frames, thumbnails | `GFX-01_dark_9x16.png` |
| `assets/map-elements/` | the 65-element isometric library (`stacko-map-elements.js/json`) | — |
| `assets/presenters/karim/` · `maya/` | ElevenLabs avatar clips + alignment JSON | `D30-14_take1.mp4`, `D30-14_take1_alignment.json` |
| `assets/audio/voice/` | voice-overs + alignment JSON | `D30-26_vo.mp3`, `D30-26_vo_alignment.json` |
| `assets/audio/music/` | licensed music by mood code | `MU-02_<title>.mp3` |
| `assets/audio/sfx/` | sound effects by name (pop, whoosh, ding …) | `<name>.mp3` |
| `assets/clips/` | real footage / B-roll | `CLIP-01_loading-door.mp4` |

**Placing real screens on a background**
```bash
python3 studio/tools/place_screens.py assets/backgrounds/raw/BG-01_v2.png --list          # numbers each green screen, writes BG-01_v2_screens.png
python3 studio/tools/place_screens.py assets/backgrounds/raw/BG-01_v2.png \
   --fill 1=assets/screens/SCR-11_audit-ledger.png 2=assets/screens/SCR-01_live-map-dashboard_16x9.png 3=assets/screens/SCR-04_warehouse-panel.png \
   -o assets/backgrounds/final/BG-01.png
```
Options: `--order lr|tb|area`, `--fit cover|contain|stretch`, `--blur auto|N`, `--glare .18`, `--dim .92`, `--grain auto|N`, `--min-area .002`.
The Backgrounds sheet says which SCR goes on which placeholder.

**Never** use spaces, Arabic letters or brackets in file names. Never put client data in an asset.
