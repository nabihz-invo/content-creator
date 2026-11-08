---
name: stacko-post-design
description: Design Stacko (ستاكو) static posts and carousel slides as HTML (EN + AR), request images by prompt, render PNGs and hand finished posts to the content CRM. Use for any Stacko post, carousel, infographic, quote card, ad visual, or "make a post like this reference image".
---

# Stacko post design

Load `stacko-brand` first (logo, colours, fonts, voice). Product facts come only from `docs/product-bible.md` (or the plan row's own text); never invent features, prices or client data. Reels and motion carousels go to `stacko-content-studio`.

All paths below are relative to the `content/` folder (run commands from there).

## Nabih's standing rules (from his reviews — these override everything below)

1. **Logo at the top of every post.** Lockup (Dot core mark + lowercase stacko, teal "o") top-left in EN; ستاكو top-right in AR. Never only in the footer.
2. **Footer = "A product by AIPHIN" + `www.stacko-lb.com`.** No aiphin.me, no WhatsApp number, no tagline block. Carousel slides 1 to n-1 show page dots + "Swipe →" instead; the last slide has the full footer.
3. **No CTA buttons on the visual** ("Try it free", "Book a demo"). The call to action goes in the caption, or as a question/options on the last carousel slide.
4. **No status chips or disclaimers on the visual**: no "Concept", "Prototype", "in development", "Demo data" pills, no small print. They make the post look AI-generated. Keep claims honest through wording.
5. **Headlines confident, not huge.** 64–76 px with a photo (max 2 lines); 96–112 px only on short cover or text-led slides. One accent phrase in `<em>` (Glow on dark, Signal on light).
6. **Devices show real interaction.** Phone = a conversation (user question bubble → Stacko answer with the numbers inside). Laptop/tablet = the real live-map screenshot (`/assets/screens/live-map/map-zoom.jpg`, `map-crop.jpg`, `map-tab.jpg`, `map-full.jpg`).
7. **Locations mix Lebanon and the Gulf.** Beirut, Tripoli, Sidon, Jounieh, and include UAE/Dubai where a list of locations appears. Truck routes stay inside one country.
8. **No third-party app branding** on the visual (no Telegram/WhatsApp logos or names). Say "from your phone"; the chat avatar is the Stacko mark.
9. **Deliver editable HTML + PNG.** Per post: `source/` HTML, `preview/` PNGs for review; after approval the final PNGs (`en/`, `ar/`) and a bundled self-contained HTML (Edit text + Save PNG) in `html/`.
10. **English and Arabic** for every post unless the user says otherwise: build EN first, then AR from the same layout.
11. **Clear on its own.** Anyone who sees the post in a feed, with no caption, must know what it is about: the headline says the problem or benefit in plain words, and the visual shows the actual thing (the card, the chat, the map, the number), not decoration. If a stranger would ask "what is this about?", rewrite it.

## Core method: AI scene + HTML layer

Image models garble text and invent UI. So:
1. **Images come from the human** (Nano Banana / Gemini) using Claude's prompts: no text, no logos, blank screens, empty space where copy goes.
2. **Claude builds everything else in HTML**: headline, logo, chips, cards, chat bubbles, routes, map screenshots on devices, footer.
If the idea needs no photo (infographic, poll, meme, glossary, big numbers), build it fully in HTML/SVG.

## Where things are

| What | Where |
|---|---|
| One folder per post | `posts/<YYYY-MM>/<ID>_<slug>/` (by publish month) or `posts/unscheduled/<ID>_<slug>/` |
| Inside a post folder | `source/<ID>.html`, `source/<ID>-AR.html` (carousels `<ID>-1.html` … / `<ID>-1-AR.html` …) · `preview/` · `en/slide-01.png` … · `ar/slide-01.png` … · `html/` (bundled) · `notes.md` · optional `caption_en.txt`, `caption_ar.txt`, `hashtags.txt`, `links.txt` |
| Templates | `studio/post/templates/post-en.html`, `post-ar.html`, `post.css` (shared components), `gem.css` |
| Brand | `/assets/brand/brand.css` (frame + font faces), `/assets/brand/fonts/`, `/assets/brand/logo/mark-dark.svg`, `mark-light.svg` |
| Images made from prompts | `/assets/post-images/final/<ASSET-ID>.jpg` (raw originals in `raw/`); notes and screen corners in `assets/post-images/README.md` |
| Real screens | `/assets/screens/` (SCR-xx, live-map crops in `live-map/`, app captures in `app-captures/`) |
| Other sources | `/assets/sources/` (Nabih's Gemini posts SRC-G1…G3) |
| Reference images to imitate | `references/` (inspiration only — never placed in a post) |
| Example posts | see `studio/post/EXAMPLES.md` |
| Register of designed posts + prompts | `plans/Stacko_Content_Register.xlsx` |

Source HTML uses **root paths** (`/assets/...`, `/studio/post/templates/...`). They resolve because the scripts serve `content/` as the web root, so a source file works from any post folder.

## Workflow (one post)

1. **Brief.** From the user's ask, the plan row (`plans/Stacko_Content_Studio.xlsx`) or the CRM project. Write one line: the idea a viewer must get in 1 second.
2. **Pick a layout** from the archetypes below; open 1–2 similar sources (`studio/post/EXAMPLES.md`) and reuse their structure and CSS.
3. **Check images.** Reuse a file in `assets/post-images/final/` when it fits (see its README and the register's Image Prompts sheet). Otherwise write the prompt (template below), add it to the register's Image Prompts sheet with Received = No, and list the prompts in your reply. Continue with posts that don't need new images.
4. **Copy.** Use the brief's headline/support/slides. If missing, write: headline ≤ 8 words, support ≤ 15 words, in the brand voice.
5. **Build** `posts/<bucket>/<ID>_<slug>/source/<ID>.html` from `studio/post/templates/post-en.html` (and `<ID>-AR.html` from `post-ar.html`). Size 1080×1350 unless the brief says story (1080×1920) or square (1080×1080).
6. **Preview:** `node studio/post/render.mjs posts/<…>/source/*.html` → `preview/`. Open every PNG (or a contact sheet) and check it against the QA list. Fix and re-render until clean. Show the previews and wait.
7. **Review loop:** apply feedback, re-render. Any reusable lesson → add it to the standing rules above.
8. **Finalise after approval:** render each page to its final name, e.g. `node studio/post/render.mjs <src>/WHY-3.html --out <post>/en/slide-01.png` and `… WHY-3-AR.html --out <post>/ar/slide-01.png` (carousels: slide-01 … slide-0n), then `node studio/post/bundle.mjs <post>/source/*.html` → `html/`. Write `notes.md`, add/refresh the row in `plans/Stacko_Content_Register.xlsx`.
9. **Hand to the CRM** (see below) so the post can be reviewed and scheduled there.

## Making a post like a reference image

When the user drops an image in `references/` and asks for "a post like this":
1. Describe what makes the reference work (layout, focal point, type scale, colour use) and map it to the closest archetype.
2. Rebuild it in **our** brand: Stacko palette, Readex/Kufi, our frame, logo top, our footer, our standing rules. Never copy the reference's brand, logo, text, people or product UI; product visuals come only from `assets/screens/`.
3. If it needs a photo, write an image prompt (no text, blank screens) instead of reusing the reference image. To reuse a Gemini post Nabih made himself, follow "Recreating an AI-made post" below.
4. Note the reference file name in the post's `notes.md`.

## Placing things precisely

- **Find coordinates** in a photo: `node studio/post/grid.mjs assets/post-images/final/X.jpg <x> <y> <w> <h> --zoom 2 --out <post>/preview/grid.png`, then read the PNG.
- **Put UI on a device screen** (phone/tablet/laptop at an angle): draw the UI flat (chat at 300×600, map at 420×284) inside `<div class="scr" style="width:W;height:H;transform:…">`, and get the transform from `node studio/post/screen-map.mjs W H tl tr br bl --scale s --left L --top T` (corners in source-image pixels, plus how the `<img>` is scaled/offset).
- **Recreating an AI-made post** the user sends (e.g. Gemini): keep only the photo band inside an `overflow:hidden` panel, cover every baked word (screens, tags, icons) with HTML, replace screens with real UI, then apply the standing rules.

## The series frame

- Canvas 1080×1350, margin 64 px. Top bar y 64–120: lockup (mark 52 px + wordmark 40 px), nothing top-right.
- Headline from y ≈ 160 (≈ 200 when a small kicker like "01 · What" sits above it). Support line below.
- Hero ends by y ≈ 1220. Footer line at the bottom (see rule 2).
- Dark (Night gradient) and light (Paper) posts alternate in the feed. One Glow element per dark post. No orange, yellow or red outside product-UI alerts (low-stock red pill is fine).

## Archetypes

| ID | Layout | Best for | Example posts (folder ID → `source/`) |
|---|---|---|---|
| A1 | Before / After split | pain → fix | `EDU-49`, `GEM-02` |
| A2 | Network hero (port, ship, routes) | imports, brand | `WHO-1` |
| A3 | Route-as-timeline | how it works, shipments | `STK-10`, `STK-03` |
| A4 | Numbered hub / grid infographic | education, features, roles | `NOV-11`, `STK-09` |
| A5 | Object metaphor / meme | brand voice, engagement | `EDU-57`, `STK-02` |
| A6 | Concept fusion (box-pin, box-cube) | high-reach brand, covers | `BRD-01`, `LCH-00` slide 1 |
| A7 | Map / diorama with chips and trucks | visibility, multi-location | `NOV-09` slides 1–7, `STK-08` |
| A8 | Product in scene (device with real UI) | features, "just ask" | `HOW-1`, `LCH-00` slide 2, `GEM-01` |
| A9 | Data-to-physical flow | automation, invoice reading | `WHAT-2`, `GEM-03` |
| A10 | Photo panel + chips / checklist | light posts, audience, revenue | `WHO-2`, `HOW-2`, `WHAT-1` |
| — | Poll A–D, myths, big numbers, audit card, alerts | engagement, education | `STK-05`, `STK-01`, `STK-06`, `STK-04`, `STK-07` |

Carousels tell one story in one visual world (same scene zoomed/dimmed): cover → detail → problem → link/flow → shared picture → real product → question with A–D options. Launch-type posts follow **What / Why / Who / How** (see `LCH-00`).

## Image prompt template

```
<ASSET-ID> — 4:5 vertical
<Subject: one concrete scene or object>. Composition: <where it sits>; leave <the top 35% / left 40%> as clean empty <sky / wall / backdrop> for text. Style: <photoreal editorial | 3D product render | isometric diorama>, <lens/angle>. Light & colour: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent only where stated; no orange, yellow or red. Screens: any phone/tablet/laptop screen is blank, evenly lit white, facing the camera. Avoid: any text, letters, numbers, logos, labels on boxes, signage, watermarks, UI content, extra fingers.
```
Name people consistently (e.g. "Lebanese warehouse worker, mid-20s, navy polo shirt") and say "Lebanese warehouse", "Beirut port" or "Dubai" so scenes aren't US/EU by default. Ask for originals at ≥1080 px wide; save them as `assets/post-images/raw/<ASSET-ID>.<ext>` and the picked/cropped one as `assets/post-images/final/<ASSET-ID>.jpg`.

## Arabic

- Same file name + `-AR`, `<html lang="ar" dir="rtl">`, from `studio/post/templates/post-ar.html`. Levantine for Lebanon-facing posts.
- Headlines Noto Kufi 700 (~60 px), break before `<em>` with `<br>` so no single word sits alone; move the support line down to ~356 px for 2-line headlines.
- Photos and maps are never mirrored; cards placed over an image's empty side stay there. Kickers and absolute text blocks move to `right:64px`.
- Keep codes, numbers and Latin terms (WH-01, SHP-24021, PDF, Excel, LED) Latin; wrap them in `<span class="ltr">` inside Arabic lines. Arrows point ← (بيروت ← طرابلس). Arabic names in chats (رامي، هادي، لينا).

## The content CRM (Supabase)

Posts are tracked in the **content-creation CRM** (its own Supabase project; tooling in the repo root, one level above `content/`). Never create separate post tables; the old `stacko_posts` schema in `plans/archive/supabase-kit/` was not applied.

- Each post is a `content_projects` row with `source_metadata.origin = 'content_plan_import'` and `source_metadata.plan_id = <ID>`. Plan IDs must match `^[A-Z][A-Z0-9]{1,4}-[A-Z]?\d+[a-z]?$` (e.g. `STK-11`, `WHY-3`) because the media importer finds post folders by that name.
- New post: add it to the register, then create the project with `content-creation/scripts/import/content-plan-to-sql.py` (JSON input, `workbook_key` = `stacko-content-register`) and run the SQL (ask the user first).
- Finished files: `node scripts/import/finished-posts.mjs --from <folder> --only <ID>` in `content-creation` (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). It reads `<folder>/<ID>/en/slide-NN.png`, `ar/…`, `caption_*.txt`, `hashtags.txt`, `links.txt`, so stage a copy named by the bare ID. It uploads only what isn't live yet (storage is limited: upload finished posts only).
- Review happens in the CRM: approve → `ready_to_publish`; changes requested → the note is in `source_metadata.review.note` (fix, re-render, re-import the changed files and the post goes back to review); once live, "Mark as published" with the link frees the storage.
- Never approve or mark a post published yourself.

## QA checklist (every preview)

- [ ] Logo at the top; footer = AIPHIN + www.stacko-lb.com (or dots + Swipe on non-final slides)
- [ ] No CTA button, no concept/demo chips, no disclaimer, no third-party app logos
- [ ] Idea clear in 1 second; one focal point; nothing clipped; no overlaps; no one-word last line
- [ ] No AI-generated text visible anywhere (screens, tags, box labels)
- [ ] Devices show a conversation or the real map; no real client data (SKU lists) from screenshots
- [ ] Palette only; one Glow element on dark; text ≥ 22 px except tiny labels
- [ ] AR: RTL, Kufi headline, mark and photos not mirrored, no collisions
