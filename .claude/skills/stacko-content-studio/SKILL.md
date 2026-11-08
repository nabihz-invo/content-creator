---
name: "stacko-content-studio"
description: "Produce Stacko reels, carousels and stories from Stacko_Content_Studio.xlsx with the HTML motion engine: real app animations, photos, backgrounds, presenters, map elements, logo variants, a new recipe per post."
---
 
# Stacko Content Studio
 
You turn approved rows of **plans/Stacko_Content_Studio.xlsx** into finished posts. All paths are relative to the `content/` folder (the studio root: `studio/`, `assets/`, `posts/` sit side by side). Every post is an HTML page built
from layers with the Stacko Motion engine (`studio/engine/`) and rendered frame-exactly to MP4 / PNG by
`studio/render.mjs`. Because it is HTML, you can recreate the real Stacko app and animate it — so **a screenshot
alone is never the answer**, and **no two posts may look or open the same way**.
 
Four house rules the owner asked for (never break them):
1. **English and Arabic are separate versions.** One page, rendered twice (`--lang all`). Never both languages in the same frame, slide, end card or caption file.
2. **Transitions are silent.** No whoosh / swoosh between scenes (the engine mutes them; never add one by hand).
3. **The dot effect is the brand signature.** Every reel has at least one dot moment: dots building a number, word, icon, the map of Lebanon or the logo (`s.dotMorph`, end cards `dots` · `dotword` · `dotmap`).
4. **One theme per carousel.** All slides dark (Night / dark photos) or all slides light (Paper) — never switch mid-carousel; cover and CTA match the rest.
Read first, every session: this file → `CLAUDE.md` → `studio/docs/ENGINE.md` (API) → `studio/docs/RECIPES.md`.
For brand rules use the `stacko-brand` skill if it is available (colours, logo versions, voice, taglines).
Look at `studio/examples/` (three demo reels, a carousel, `component-gallery.html`, `dots-demo.html`, `dots-endcard.html`) before writing a new page.
 
---
 
## 1. The workbook is the brief
 
| Sheet | What you use it for |
|---|---|
| **Content** | One row per post. Build only rows with Status = **Approved for production** (or **Changes requested**). |
| Options | The meaning of every code (RC recipe, HK hook type, OP opener, TX text effect, TR transition, CM camera, AN app animation, CP component, EC end card, LG logo, PR presenter, MU music, CL layout) and the engine call that builds it. |
| Approval Checklist | The checks the reviewer applies — run them on yourself before handing over. |
| Assets | Folder map, naming rules, lists of screens (SCR), logos (LG), SFX, presenters. |
| Presenters | Karim / Maya: identity, reference prompts, Styles, voices. |
| Music | The chosen ElevenLabs tracks per mood code (MU), file names and licence notes. |
| Backgrounds / Post Images | Which BG / PI image fits which situation and which real screen goes on its green placeholder. |
| Variety | How often each option is used. Prefer **unused** options when a row leaves you a choice. |
| Backlog | Ideas only. Never build from it unless the user moves a row into Content. |
 
Read rows with `openpyxl` (headers are on row 2, data from row 3). Build from: Format · Duration · Stage label · Recipe ·
Hook type · **Hook EN** (English version) · **Hook AR** (Arabic version) · Opener · Text effects · Transitions · Camera ·
App animations · Components · Layouts · End card · Logo variant · Background · Post images · App screens · Map elements ·
Presenter · Voice-over · Music · Key SFX · **Scene plan (beat by beat)** · Original script · Caption · Hashtags · CTA ·
Pinned comment · Content folder · Reviewer comments · Verify-before-approving.
 
The **scene plan is the contract**: follow its beats and timings in both versions. If something in it is impossible with the
assets on disk, build the closest honest version and say exactly what you changed in `notes.md`.
 
## 2. Folder per post
 
```
posts/<YYYY-MM>/<ID>_<slug>/          ← the row's "Content folder" value, with the leading content/ read as posts/
                                        (no publish date yet → posts/unscheduled/<ID>_<slug>/)
  brief.md                 the row, copied in plain text
  reel.html                (carousel.html / story.html / static.html) — ONE page for both versions
  preview_EN.png  preview_AR.png        contact sheets — render these first
  <ID>_EN.mp4     <ID>_AR.mp4           reels   (carousels: slide-01_EN.png … slide-01_AR.png …; stories: frame-01_EN …)
  cover_EN.png    cover_AR.png          Reels covers
  caption_EN.txt  caption_AR.txt        caption, hashtags, CTA, pinned comment — one language per file
  notes.md                 what you built, assets used, self-check against the approval checks, deviations, open questions
```
Never write outside `posts/` and `assets/` (and the workbook columns listed in §8). Older versions of a post were replaced by the newest one during the 6 Nov 2026 merge; don't look for an archive.
 
## 3. Two language versions (how)
 
* Write every on-screen string once for each language: `SM.t('Every location. *One map.*', 'كل المواقع. *خريطة وحدة.*')`.
  Use `SM.ar()` for Arabic-only layout tweaks (a smaller size for a long Arabic headline, a different line break).
* The engine handles the rest in the Arabic version: RTL text in Noto Kufi Arabic, left/right-aligned layouts mirrored,
  map chips / header / toasts / chat / ledger / KPIs / poll / captions / journey in Arabic, end cards with ستاكو and the Arabic tagline.
* Counters: `suffix: SM.t(' units', ' قطعة')` (the Arabic suffix flips the counter to RTL so the number is read first).
* Never use `s.swap()`, `tagline: 'both'`, a second-language subtitle line, or Arabic + English in one caption bar.
* Hooks: Hook EN for the English version, Hook AR for the Arabic one. Arabic is Lebanese dialect for Lebanon posts and needs
  a native check before publishing — note it in `notes.md`. Keep Western digits unless the row says otherwise.
* Voice-over / presenter: one take per language (`<ID>_vo_EN.mp3`, `<ID>_vo_AR.mp3`, same for presenter clips), captions in the
  same language: `R.audio({ voice: SM.t('/assets/audio/voice/D30-26_vo_EN.mp3', '/assets/audio/voice/D30-26_vo_AR.mp3') })`.
## 4. How to merge everything — the layer stack
 
Build every piece from these layers. A strong post uses **at least three of them**, and a product post must use the app layer.
 
1. **World layer** (background): `BG-xx` office photo from `assets/backgrounds/final/` (screens already replaced), a `PI-xx`
   photo from `assets/post-images/final/`, a presenter clip, or a brand backdrop (`'night'`, `'paper'`, GFX). Always give it a
   camera move (CM) — never a dead still unless it is a carousel slide.
2. **App layer** (the product, recreated, animated): the live map (`s.map` + trucks, ships, planes, chips, header KPIs, toasts,
   low-stock badges), Telegram chat with draft/approve/reject, invoice → AI draft, ledger, lock-screen alerts, device frames.
   These are the Stacko UI itself — they must move: a vehicle drives, a count changes, a message types, a button is tapped.
3. **Dot layer** (signature): `s.dotMorph` — brand dots that build a number (`{text:'41'}`), a word, an icon (`{icon:'truck'}`),
   the map of Lebanon with the three warehouses glowing (`'lebanon'`), or the Dot core (`'logo'`), then break apart.
   Use it for an opener (dots build the hook number), a mid-reel beat (problem → icon → map) or the end card
   (`dots` EC-01, `dotword` EC-10, `dotmap` EC-11). Recipe RC-26 is a whole reel built from it.
4. **Illustration layer**: isometric scenes from the map-element library (`s.iso`, 65 elements) — openers, problems with no photo, stories, carousels.
5. **People layer**: Karim / Maya avatar clips (full screen, picture-in-picture circle, or split), hands-only photos,
   always with word-by-word captions (`s.captions` from the ElevenLabs alignment JSON).
6. **Type layer**: the hook and the lines from the scene plan with the TX effects in the row. Max 2 text effects per piece;
   one highlight per line.
7. **Brand layer**: the LG variant from the row (`s.lockup`, `s.logoDots`, `R.watermark`), the end card (EC) and the
   **stage-label badge** (`R.badge(SM.t(…))`) whenever a feature is on screen.
8. **Sound layer**: voice (if any) → music (MU, the track named in the Music sheet) ducked under it → small UI sounds that come with
   components. **No transition sounds** (no whoosh / swoosh between scenes, none added by hand on cuts).
How layers hand over (use these joins, they are what makes it feel produced):
* **Photo → app**: push into an object in the photo (phone, laptop, container) with `zoom-through`, or `iris` from the object.
* **Presenter → app**: `round` transition into the app while the presenter continues in a PiP circle (`s.image(clip, { frame:'circle', offset })`).
* **Illustration → map**: an iso yard pulls out (`zoom-out`) and lands as the warehouse marker on the map.
* **Dots → anything**: dots break out of one shape and rebuild the next (number → truck → Lebanon → logo).
* **Chaos → calm**: storm / sheet / sticky notes → `glitch` → the calm map.
* **Grid → one**: four clipped cells, each a mini-scene, collapse into one map.
* **Beat cuts**: `punch` / `whip-*` on the music beat (`R.beats(bpm)`) — silent; the music carries the cut.
Asset rules:
* **Backgrounds**: only `assets/backgrounds/final/` (real screens placed with `studio/tools/place_screens.py`). Never publish a green screen.
* **Post images**: one PI per beat, never the same PI in two posts of the same week, never stretched (use `focus` / crops).
* **App screens (SCR)** are for screens inside photos. In the motion itself, recreate the UI with the engine instead.
* **Map elements**: pick by story (port → `gantryCrane`, `ship`, `containerStack`; warehouse → `racking`, `forklift`, `pallet`, `people`).
* **Logos**: dark scenes → LG-01/05/07; light → LG-02/06; photos → LG-03 white; Arabic version → LG-08 (the engine picks ستاكو automatically). Never Glow on white.
* A missing asset is never a reason to fake one: use a brand backdrop, iso or dot scene instead and list the missing file in `notes.md`.
## 5. Variety rules (hard)
 
* The row's recipe, hook type, opener and end card are already chosen so that nothing repeats. Do not swap them for your
  favourites. If you must change one (missing asset), pick an option the **Variety** sheet shows as unused or rarely used.
* Never start two posts with the same first frame, the same first word, or the same text effect in the same week.
* Never reuse a scene layout from the previous post (same component in the same position).
* Opening frame: motion within 0.5 s, no fade-from-black longer than 0.3 s, no logo first.
* Carousels: one theme for every slide (dark or light, as the row's layouts say — default dark); never the same layout (CL) on two
  consecutive slides; one idea per slide; pager dots; one language per image.
## 6. Honesty, numbers
 
* Show the **stage label** from the row on screen (`R.badge`) for as long as a feature is visible: 🟢 Prototype · demo data /
  🟡 Planned — in build / 🔵 Concept (`SM.t` both languages). Vehicles on the map are ETA-based in phase 1 — say so when movement is the point.
* Numbers: only Product Bible facts, real Story results, or clearly demo data (W1 Beirut 7,250 · W2 Sidon 4,980 · W3 Tripoli 3,120,
  LED Strip 5m…). Never invent savings, percentages, customers or quotes. Unknown → `[PLACEHOLDER]` and a note.
* Instagram safe zone on 9:16: keep text and key UI inside y 220 → 1500 and x 60 → 930. Toggle "Safe zones" in the player.
## 7. Audio
 
* Voice-over / presenter lines: ElevenLabs **with timestamps**, one take per language. Without API access, list the exact lines
  per language in `notes.md` and ask the user to drop the files into `assets/audio/voice/` or `assets/presenters/<name>/`.
* Music: use the track the **Music** sheet assigns to the row's MU code (`assets/audio/music/MU-xx_<title>.mp3`). These are existing
  ElevenLabs tracks chosen by the owner — don't generate new music. If the file isn't on disk yet, use `placeholder-calm.mp3` and say so.
  Brand posts need the track's **Paid Marketing** licence (the Social Media licence is for personal channels) — flag it in `notes.md`.
* SFX: only the small UI sounds components make (pop, typing, ding, check, tick). No whoosh/swoosh/riser on transitions or cuts.
## 8. Build loop for one post
 
1. Read the row; copy it into `brief.md`. Check every asset it names exists; list what's missing.
2. Copy the template from `studio/templates/` (reel / carousel / story) into the post folder; replace the placeholders.
3. Build the scene plan beat by beat with the codes in the row, every string as `SM.t(EN, AR)`.
4. `node studio/render.mjs <page> --preview --lang all` → open `preview_EN.png` and `preview_AR.png` and look at every frame:
   hook timing, overlaps, safe zone, text fit (Arabic lines run longer), labels, logo version, no mixed language, empty frames.
5. Self-check against the approval checks and write the result in `notes.md` (✓ / ✗ / n/a with one line each, per version where it differs).
6. Render: reels `--lang all` (MP4s) + `--cover --lang all`; carousels `--stills --lang all`; stories as the template explains.
7. Write `caption_EN.txt` and `caption_AR.txt` from the row.
8. Update the workbook row (see §9).
**Batch rule:** build at most 3 posts, show the user their preview contact sheets and the self-check, then wait for feedback
before the next batch — unless the user explicitly asked for more.
 
## 9. Writing back to the workbook
 
Use openpyxl on the real file (load **without** `data_only`, so formulas survive) and change only:
* `Status` → "In production" when you start, "Rendered — review" when files are ready;
* `Main file` → both outputs, e.g. `NOV-01_EN.mp4 · NOV-01_AR.mp4`;
* `Revision #` → +1 on every re-render after "Changes requested".
Never fill the check columns (they are the reviewer's), never edit formulas, never reorder rows.
If the file is locked (open in Excel), write `notes.md` and tell the user.
When the user sends a new content plan, add rows to **Content** in date order with every creative column filled from Options,
keeping the variety flags OK (recipe ≠ last 4, hook type ≠ last 3, opener ≠ last 4, end card ≠ last 2, first word ≠ last 5).
 
## 10. Changes requested
 
Read `Reviewer comments`, fix only what is asked (plus anything that breaks a check), re-preview, re-render both versions,
bump `Revision #`, and list the changes at the top of `notes.md`.
 
## 11. Never
 
* Never mix English and Arabic in one frame, slide, end card or caption file.
* Never add transition sounds.
* Never use a screenshot as the whole product moment, never show a green screen, never reuse the previous post's opener.
* Never invent features, prices, customers, quotes or results.
* Never use colours outside the Aiphin palette, Glow (#2EF2EE) on white, or a mirrored / recoloured logo.
* Never touch the engine files (unless the user asks for an engine change) or other posts' folders.
## Quick commands
 
```bash
cd studio && npm install && npx playwright install chromium     # once
node studio/render.mjs --serve                                    # live player: http://localhost:4173/posts/…/reel.html?lang=ar
node studio/render.mjs <page> --preview --lang all                # preview_EN.png + preview_AR.png
node studio/render.mjs <page> --lang all                          # <ID>_EN.mp4 + <ID>_AR.mp4
node studio/render.mjs <page> --stills --lang all                 # carousel slides, both versions
node studio/render.mjs <page> --cover --lang all                  # covers
python3 studio/tools/place_screens.py <bg.png> --list | --fill 1=SCR-01.png -o out.png
```
 