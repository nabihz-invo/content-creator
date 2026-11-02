# Prompt — research → filtered content → Supabase import SQL

Run in Claude Code from the content-studio workspace (the folder with `research/` and
`Stacko_Content_Studio.xlsx`). It needs the pipeline repository (`content-creator`) for two
files: `supabase/queries/export-existing-content.sql` and `scripts/import/content-plan-to-sql.py`.

---

Load the stacko-content-studio and stacko-brand skills and read CLAUDE.md first.

TASK: turn the research files in research/inbox/ into (1) filtered, checked content briefs, delivered as ONE SQL file that imports them into Supabase (the CRM is the system of record), and (2) a separate register of possible product feature gaps. Do NOT build or render any post, do NOT run the SQL — I review and run it.

You may write in research/ only. Don't edit Stacko_Content_Studio.xlsx or anything in Supabase.

PIPELINE REPO: the content-creator repository. Default path ../content-creator; if it isn't there, ask me for the path before starting.

STEP 0 — Load what already exists
- If $SUPABASE_DB_URL is set, run:
  psql "$SUPABASE_DB_URL" -At -f <pipeline repo>/supabase/queries/export-existing-content.sql > research/existing-content.json
  Otherwise stop and ask me to run that query in the Supabase SQL editor and save the single result cell as research/existing-content.json. Don't continue without it.
- Also read the Content and Backlog sheets of Stacko_Content_Studio.xlsx (read-only) for rows that aren't in the export yet.
- EXISTING = both lists. It holds every planned, produced and published post: plan ID, title, status, format, publish date, pillar, funnel, stage label, hook, objective, creative codes (RC, HK, OP, EC, CL), overlaps and tags.

STEP 1 — Read the research
- Read every file in research/inbox/ that is not yet listed in research/processed.md.
- Each finding has: ID, Category (A–J), Summary, Quote, Who, Region, Product mentioned, Signal, Engagement, Date, Link.
- Give each finding a global ID: <batch file name>/<finding ID>, e.g. 2026-11-02_batch-01/F-013.

STEP 2 — Filter the findings
Keep a finding only if:
- it has a real link and a quote;
- it is about stock or inventory, not general accounting or ecommerce marketing;
- it is from 2023 or later — OR it repeats a pattern that newer findings also show;
- it isn't a vendor promoting itself, and it isn't an obviously incentivised review saying something generic ("poor security").
Group the kept findings into PATTERNS: findings saying the same thing, across sources. A pattern is strong when it has 3+ findings or High signal.
Write research/<date>_review.md with:
- what was read, how many findings were kept and dropped, and why (one line per dropped finding);
- the patterns, strongest first, each with its supporting IDs and 1–2 short quotes;
- research gaps: categories with no or weak evidence (e.g. no Reddit, no Lebanon/Gulf/Arabic, nothing on why people don't use a system or on staff adoption), and a one-paragraph focus for the next research round.

STEP 3 — Check each strong pattern against EXISTING, then decide
For each strong pattern that Stacko can honestly answer, compare it with EXISTING (same message, same angle, same capability, same audience). Decide ONE of:
- NEW POST — nothing in EXISTING says this. Write a brief (STEP 4).
- EVIDENCE — an existing post already says it. Don't create a post; add an evidence note to that post (STEP 5). This is the only change allowed to existing posts.
- LATER — it's new but the next weeks already carry the same pillar/format heavily; write the brief with a later date and say why.
- SKIP — Stacko can't honestly answer it (not in the Product Bible), or it only works by naming a competitor or quoting a reviewer.
Add a "Decisions" table to the review file: pattern · decision · new RES ID or existing plan ID it matches · one-line reason.

Rules for every brief:
- Check every Stacko claim against research/reference/Stacko_Product_Bible.docx. Phase 1 = live map, inventory, transfers with ETA, China shipments, Telegram bot, AI invoice reading, roles and audit trail, Arabic + English. Phase 2 = GPS, WhatsApp, barcode. Phase 3 = multi-company product, pricing plans, forecasting. Use the right stage label: Prototype · demo data / Planned — in build / Concept / No product claim. If the Bible doesn't support a claim, don't make it.
- Never quote a reviewer, name a competitor, or present a review as a Stacko customer. The research is evidence for the idea, not on-screen copy. No invented numbers; example figures are labelled as examples.
- Don't use images from the research links (other companies' material). Visuals come from the Post Images / Backgrounds sheets and our own app screens.
- Story posts can collect our own research (polls, question boxes) — good for the gaps.
- Aim for 5–8 new posts per batch, mixing reels, carousels and stories.

STEP 4 — Write the new posts as an import plan
IDs: the next free IDs in the RES series — check BOTH EXISTING and the workbook (RES-01, RES-02 … never reuse one).
Dates: after the last publish date in EXISTING, keeping the rhythm already used: about 3 feed posts + stories per week, never two feed posts on the same day.
Fill EVERY creative field, with the same column names the Content sheet uses and codes from its Options sheet:
ID · Status ("Brief ready") · Publish date (YYYY-MM-DD) · Slot · Format · Duration / slides · Title · Pillar · Funnel · Stage label (on screen) · Objective · Recipe (RC) · Hook type (HK) · Hook EN (on screen, first 1.5 s) · Hook AR (Lebanese Arabic) · Opener (OP) · Text effects (TX) · Transitions (TR) · Camera (CM) · App animations (AN) · Components (CP) · Slide / frame layouts (CL) (carousels start with "Theme dark ·" or "Theme light ·") · End card (EC) · Logo variant (LG) · Background (BG / GFX) · Post images (PI) · App screens (SCR) · Map elements (ME) · Presenter (PR) · Voice-over · Music (MU) · Key SFX (UI sounds only — no whoosh/swoosh) · Language ("EN version · AR version (separate files)") · Scene plan (beat by beat) with timings · Original script (from the plan) · Caption · Caption AR · Hashtags · CTA · Pinned comment · Content folder (content/<YYYY-MM>/<ID>_<slug>/) · Main file (<ID>_EN.mp4 · <ID>_AR.mp4 or slide-01…_EN.png · slide-01…_AR.png) · Revision # (0) · Verify before approving (from the plan): the pattern, the supporting finding IDs and their links, and every claim that needs checking.
House rules: two separate language versions, silent transitions, at least one dot moment per reel (CP-33 / EC-01 · EC-02 · EC-10 · EC-11), one theme per carousel, at least 3 visual sources (count them: app animation · photo · background · presenter · iso/map elements · logo variant · graphics), real app animation for product posts.
Variety, checked against the posts just before each new one by date (EXISTING + the new ones): the recipe differs from the last 4, the hook type from the last 3, the opener from the last 4, the end card from the last 2, and the hook's first word from the last 5. If a check fails, pick another option — prefer ones the Variety sheet shows as unused. Report the checks per new post in the review file.

Save research/out/<batch>_plan.json in this shape:
{
  "workbook_key": "research-<batch file name>",
  "source_file": "research/<batch file name>",
  "content": [ { one object per new post, keys = the field names above } ],
  "evidence": [ { "plan_id": "<existing ID>", "note": "Research <batch> — <pattern> (<strong/medium>): <finding IDs> — <links>" } ]
}

STEP 5 — Build the SQL
Run:
  python3 -I <pipeline repo>/scripts/import/content-plan-to-sql.py research/out/<batch>_plan.json research/out/<batch>_import.sql --existing research/existing-content.json --email <my CRM email>
It must exit with 0. If it reports IDs that are already used, take the next free IDs and run it again; read every warning (same title as an existing post, evidence for an unknown ID) and fix the plan, not the SQL. Never edit the generated SQL by hand.
The SQL creates one CRM project per new post (status new, tagged, the full brief kept) and appends the evidence notes to existing posts. It's safe to run twice.

STEP 6 — Feature gaps (separate file)
Create or update research/Stacko_Feature_Gaps.xlsx (one sheet "Gaps", header row frozen, filters on). Columns:
Gap ID (GAP-01…) · Feature / need · Problem it solves (in the user's words) · Evidence (finding IDs) · Links · Signal (count of findings + strongest signal) · Who asks (roles / business types) · Region · Products where people complain it's missing or weak · In Stacko today? (Yes / Phase 1 / Phase 2 / Phase 3 / No — from the Product Bible) · Fit with our audience (High / Medium / Low + one line why) · Effort guess (S / M / L) · Content angle (could we post about it? which RES or existing ID) · Suggested decision (Build now / Add to phase 2 / Later / Skip) · Status (leave "To review" for me) · First seen (batch) · Notes.
Rules: one row per distinct feature; if a gap already exists, add the new evidence to it and update the signal instead of a new row. Include gaps that Stacko already covers but should state more clearly in sales material (mark "In Stacko today = Yes", decision "Say it clearly"). If the file is open in Excel, stop and tell me.

STEP 7 — Finish
- Add the processed file names and date to research/processed.md.
- Reply with:
  - the review file path and the SQL file path (and how many posts it creates / how many evidence notes it adds);
  - a table of the new RES posts (ID · date · format · hook EN · pattern · stage label);
  - patterns that were already covered: pattern → existing plan ID that got the evidence note;
  - patterns moved later or skipped, with the reason;
  - the top 5 feature gaps;
  - anything you couldn't verify.
Don't render anything and don't run the SQL. I'll check it and run it in the Supabase SQL editor.
