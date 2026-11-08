---
name: content-production-rules
description: "How Stacko social content must be produced (scope, copy rules, languages, formats, voice) — decided by the user 2026-10-24/25"
metadata:
  node_type: memory
  type: project
  originSessionId: c7e9e62f-20fd-47bf-87bf-5a0275dff805
  modified: 2026-10-25T04:13:10.293Z
---

The user asked Claude to produce every item in content/Stacko_Content_Plan_Review.xlsx, resuming across sessions via content/PRODUCTION_STATUS.md (read it first, continue at the next unchecked item).

Rules the user set:
- Order: November plan items (NOV-xx) first, then all DeepSeek items EDU-01 → EDU-80.
- Never use "in development", "still building", "prototype", or the website URL in posts/carousels/reels. Every CTA is "Book a meeting" (AR: "احجز اجتماعاً").
- Claims: align to the website (website/index.html is the source of truth, e.g. roles count, "works with your ERP" without naming Odoo/SAP). Skip items that need real customers, a pilot programme or unverifiable numbers (testimonials, pilot offers, ROI figures) and mark them Skipped in the tracker.
- Posts: 4 versions each (EN/AR × light/dark), PNG + PPTX (Canva import). Carousels: EN + AR, HTML source + PNGs. Reels: English only, 1080×1920, website footage, ElevenLabs voice "Justin Case – Warm, Trustworthy, Clear" (voice_id from creative_list_voices, model eleven_v4).
- Keep "Illustration · demo data" style labels on visuals; use website screenshots/footage for product visuals.

**Why:** user approved the sample set (NOV-01 reel, NOV-02 carousel, NOV-11 post) and asked to finish everything in that style.
**How to apply:** follow [[content-production-pipeline]] tooling notes; tick items in content/PRODUCTION_STATUS.md as each is verified.

Superseded layout: since 2026-11-06 the old outputs, plans and PRODUCTION_STATUS files were merged into content/ (posts/…, plans/archive/); see [[content-folder-layout]].
