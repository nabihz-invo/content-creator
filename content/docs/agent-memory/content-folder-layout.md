---
name: content-folder-layout
description: "content/ was merged into one structure on 2026-11-06 (posts/<YYYY-MM>/<ID>_<slug>/, plans/, assets/, studio/, references/); register posts imported into the content CRM"
metadata:
  node_type: memory
  type: project
  originSessionId: 8f558c24-d4cf-413c-8527-09e9bf123346
  modified: 2026-11-06T07:06:59.420Z
---

On 2026-11-06 the user asked to merge `content/Stacko_Studio_Kit/Stacko-Studio` (incl. `New/` post-design kit), `content/_archive` and `content/2026-12` into one folder; newest version of each post ID wins, older ones went to the Recycle Bin. Layout and rules are in `content/CLAUDE.md`; full log in `content/docs/MERGE_LOG.md`.

- Posts: `content/posts/<YYYY-MM>/<ID>_<slug>/` (workbook "Content folder" column says `content/…`: read it as `posts/…`); undated → `posts/unscheduled/`.
- Static-post sources use root paths (`/assets/…`); `studio/post/render.mjs` serves content/ over HTTP; finals in `en/`, `ar/` as `slide-NN.png` (the layout `content-creation/scripts/import/finished-posts.mjs` reads).
- `references/` = images the user drops for "make a post like this" (inspiration only).
- Register IDs renamed for the CRM importer regex: BRAND-A→BRD-01, STK-Just-Ask/Notebooks-to-Map/One-Message→GEM-01/02/03, STK-01-Myths…→STK-01…10.
- The kit's own `stacko_posts` Supabase schema was NOT applied (kept in plans/archive/supabase-kit); posts live in the content-creation CRM. 23 register posts created via content-plan-to-sql.py (batch 8db4f44d…), 59 PNGs attached to 27 projects (incl. existing NOV-09, NOV-11, EDU-49, EDU-57).

**Why:** the user wants one clean folder with skills, assets, data and posts, and the CRM as the record.
**How to apply:** build new posts inside posts/…; don't rename files under assets/ (CRM brand library mirrors paths). Related: [[stacko-background-library]], [[research-to-content-sql]], [[content-creation-storage-rules]].
