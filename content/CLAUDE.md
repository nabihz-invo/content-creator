# Stacko content — rules for Claude Code

This folder holds everything for Stacko's (ستاكو) social content: plans, skills, the asset library, the two production tools and every post. It is part of the `content-creation` git repository (moved here on 2026-11-08; rendered output is ignored, see `../docs/HANDOFF_CONTENT.md`). Run all commands from this folder.

## Which skill
- **Static posts, carousel slides, infographics, "a post like this reference"** → `stacko-post-design` (`../.claude/skills/stacko-post-design/SKILL.md`).
- **Reels, stories, motion carousels (HTML motion engine)** → `stacko-content-studio` (`../.claude/skills/stacko-content-studio/SKILL.md`).
- Always load `stacko-brand` too (logo, colours, fonts, voice). Product facts only from `docs/product-bible.md` or the plan row.

## Layout
```
CLAUDE.md · README.md
../.claude/skills/     stacko-post-design · stacko-content-studio · stacko-brand
plans/                 Stacko_Content_Studio.xlsx (main plan: Content, Backlog, Backgrounds, Post Images, Music …)
                       Stacko_Content_Register.xlsx (designed static posts + image prompts)
                       Stacko_Background_Library.xlsx (BG-xx / GFX-xx / SCR-xx rules, Library Guide §4)
                       archive/ (old plans, production logs, unused stacko_posts schema)
docs/                  product-bible.md · PROMPTS.md · MERGE_LOG.md
references/            example images the user wants imitated (inspiration only)
assets/                brand/ (fonts, logo, brand.css, logo-pack, legacy-v1) · backgrounds/ (raw, final) ·
                       post-images/ (raw, final, img-library) · screens/ (SCR-xx, SIGN-xx, live-map, app-captures,
                       captured, website-v1/v2) · sources/ · graphics/ · map-elements/ · presenters/ · audio/ · clips/
studio/                motion engine (engine/, render.mjs, templates/, examples/, docs/, tools/) + post/ (static post
                       render, bundle, grid, screen-map, templates/, EXAMPLES.md)
posts/<YYYY-MM>/<ID>_<slug>/     one folder per post, by publish month
posts/unscheduled/<ID>_<slug>/   no publish date yet (backlog EDU-xx, register posts); move it once it's scheduled
```
`studio/` and `assets/` must stay side by side: pages use root paths (`/assets/…`, `/studio/…`) and both renderers serve this folder as the web root.

The workbook's "Content folder" column says `content/<YYYY-MM>/<ID>_<slug>/`: read the leading `content/` as `posts/`.

## Rules for every post
1. Two language versions (EN + AR), never mixed in one frame, slide or caption file. Levantine Arabic for Lebanon.
2. Logo at the top; footer "A product by AIPHIN · www.stacko-lb.com". No CTA buttons, no "Concept / Prototype / demo" chips, no third-party app logos (full list: standing rules in `stacko-post-design`).
3. Product visuals only from `assets/screens/` or the recreated app in the engine; never invent an interface, numbers, customers or quotes. The logo only from `assets/brand/`.
4. Images are made by the user from Claude's prompts; Claude never generates or fakes them. No AI-generated people in office backgrounds. Scenes the owner made with people in them (SC-03, SC-04, SC-07) are allowed; blur them or cover them with text when they distract.
5. Backgrounds: choose by `plans/Stacko_Background_Library.xlsx` → Library Guide §4; only rows with Status Approved/Ready; place real screens with `python studio/tools/place_screens.py assets/backgrounds/raw/BG-xx_vN.png --list`, then `--fill … -o assets/backgrounds/final/BG-xx.png`. Don't reuse a background in two consecutive posts; one time of day per video.
6. Reels: silent transitions, at least one dot moment, one theme per carousel, music only from `assets/audio/music/` (never generate music). Render `--preview --lang all` and check both contact sheets first.
7. Work in batches of at most 3 posts, show previews, wait for the user. Feedback that applies to future posts → add it to the skill's standing rules.

## Where to write
- Only inside `posts/`, new images in `assets/post-images/` or `assets/backgrounds/final/`, and the plan/register rows you are working on.
- Don't rename or delete existing files under `assets/`: the CRM's brand library mirrors it by path (`../scripts/brand/sync-kit.mjs`).
- `Stacko_Content_Studio.xlsx`: only the columns Status, Main file, Revision #.

## The content CRM (Supabase)
Posts are tracked in the content-creation CRM (the parent folder, its own Supabase project). Each post = a `content_projects` row with `source_metadata.plan_id = <ID>` (origin `content_plan_import`). Create projects with `../scripts/import/content-plan-to-sql.py`, attach finished files with `../scripts/import/finished-posts.mjs` (it reads `<ID>/en/slide-NN.png`, `ar/…`, `caption_*.txt`, `hashtags.txt`, `links.txt`). Review, approval and "Mark as published" happen in the CRM; never approve or publish yourself. Upload only finished posts (storage is limited). Details: `stacko-post-design` → "The content CRM".

## Commands
```bash
# static posts
node studio/post/render.mjs posts/<…>/source/<ID>.html                       # → <post>/preview/<ID>.png
node studio/post/render.mjs posts/<…>/source/<ID>.html --out posts/<…>/en/slide-01.png
node studio/post/bundle.mjs posts/<…>/source/<ID>.html                       # → <post>/html/<ID>.html (Edit text + Save PNG)
node studio/post/grid.mjs <image> <x> <y> <w> <h> --out <post>/preview/grid.png
node studio/post/screen-map.mjs W H tl tr br bl --scale s --left L --top T
# motion engine
node studio/render.mjs <page.html> --preview --lang all                      # preview_EN.png + preview_AR.png
node studio/render.mjs <page.html> --lang all                                # <ID>_EN.mp4 + <ID>_AR.mp4
node studio/render.mjs <page.html> --stills --lang all                       # carousel slides
node studio/render.mjs --serve                                               # http://localhost:4173/posts/…
```
First time on a new machine: `cd studio && npm install && npx playwright install chromium`.
Docs: `studio/docs/ENGINE.md`, `studio/docs/RECIPES.md`, `studio/docs/ASSETS.md`, `studio/post/EXAMPLES.md`.
