---
name: content-v2-production-rules
description: "Rules for the v2 content run (Stacko_Content_Plan_Review_v2.xlsx, routes A–L, outputs in content/<ID>/) set by the user 2026-10-25"
metadata:
  node_type: memory
  type: project
  originSessionId: c7e9e62f-20fd-47bf-87bf-5a0275dff805
  modified: 2026-10-25T15:55:48.210Z
---

From 2026-10-25 the user wants every row of content/Stacko_Content_Plan_Review_v2.xlsx produced by its "Production Route" column (A design, B Remotion motion, C app capture, D/E only if /footage/<ID>/ exists else blocked, F/G/L templates/story backgrounds only). Resume from content/PRODUCTION_STATUS_v2.md.

- Text: exact Hook / Full Script / Caption from the sheet, EXCEPT drop "in development / still building" wording and make every CTA "Book a meeting" (AR "احجز اجتماعاً"); log each change in the row's Reviewer Comments.
- Arabic version of every row, built from "Arabic Hook (Levantine)"; mark it "needs native review".
- Claim label not plain 🟢 → tag product visuals "Concept". No orange/yellow/red in visuals (pins Signal/Glow teal). Keep a source line on any stat slide. No real customer names/logos/data.
- Output per row in content/<ID>/: slides PNG or MP4, caption_en.txt, caption_ar.txt, hashtags.txt, subtitles.srt. Then Status "In production" + output path in Reviewer Comments.
- Old v1 outputs (content/posts|carousels|stories|videos) are kept untouched as an archive.
- Route C: run app/ locally, demo company "Cedar Trading (demo)" only; creating fictional records there is allowed. Demo password comes from app/supabase/.env.local at runtime (root supabase/ folder removed 2026-11-01), never copied.
- Voices (eleven_v4): EN "Justin Case" DtQLDxHbTiQTpVVanTy1; AR Levantine "Fadi - Lebanese Conversational Voice" oJQlz7pz2yWd7MRmDUXm (male, to pair with Justin).
- Tooling: build2.js (routes A/F/G/L, content/<ID>/copy.json), remotion/ (Remotion 4.0.535, React 18.3.1, Edge as browser) + build_reel2.py (route B, content/<ID>/reel2.json + audio/{en,ar}.mp3), app_capture.js (route C).

**Why:** the user replaced the v1 rules ([[content-production-rules]]) with these for the v2 sheet.
**How to apply:** tooling in C:\Users\Hp\stacko-content-tools (see [[content-production-pipeline]]).

- Remotion leaves a ~60 MB `remotion-webpack-bundle-*` folder in %TEMP% per render; after ~45 renders the C: drive filled (ENOSPC). Delete them after each batch.

Superseded layout: since 2026-11-06 the old outputs, plans and PRODUCTION_STATUS files were merged into content/ (posts/…, plans/archive/); see [[content-folder-layout]].
