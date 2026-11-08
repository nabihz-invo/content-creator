# Handoff: making Stacko posts and reels from any PC

For a Claude Code agent (or the owner) continuing content work on another machine. Everything needed is in this repo except the secret files in step 3. Written 2026-11-08.

## 1. What is where

| Path | What |
|---|---|
| `content/` | The content kit, moved here from a separate folder on 2026-11-08: `studio/` (renderers), `assets/`, `plans/`, `docs/product-bible.md`, `posts/<YYYY-MM>/<ID>_<slug>/`. Read `content/CLAUDE.md` first. |
| `.claude/skills/` | `stacko-post-design` (statics, carousels), `stacko-content-studio` (reels, stories), `stacko-brand`, `viral-motion-editor`. |
| `CLAUDE.md` §3a, §3b | Owner's notes on ideas (check every session) and the Visual library. |
| `content/docs/agent-memory/` | The previous agent's notes, copied as they were. Paths written as `../content` or `content/` outside this repo now mean `content/` here; some older notes are marked old. |
| `content/tools/legacy/` | Older render and capture scripts. Not needed for new posts. Needs its own `npm install`. |

The live data is in Supabase (the CRM): projects, finished files, the Visual library. Git holds tools, source files, assets and plans.

**Not in git, on purpose:** rendered output (`posts/**/en/`, `ar/`, `preview/`, `html/`, post PNGs and MP4s). Finished posts live in the CRM. The original PC keeps its old renders. To change an old post, re-render it from its `source/`, or from `reel.html` for a reel.

## 2. Set up a new PC

Needs Git, Node 22+, Python 3.12+, and on Windows Git Bash. Install `psql` 17 if you will run SQL.

```bash
# GitHub's default branch is not main, so -b main is required.
git clone -b main https://github.com/nabihz-invo/content-creator.git content-creation
cd content-creation
cd content/studio && npm install && npx playwright install chromium && cd ../..
python -m pip install openpyxl pillow opencv-python-headless numpy
```

For the CRM, workers or lint only: `corepack enable && pnpm install` at the repo root.

The GitHub account on that PC needs access to this repo.

## 3. Secrets (never through git or chat)

Copy these files from the first PC by password manager or USB. They are ignored by git. The owner does this, not the agent.

| File | Needed for |
|---|---|
| `workers/.env` | Library, import and CRM scripts (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), and the pipeline |
| `supabase/.env.local` | SQL helper and `supabase db push` |
| `apps/crm/.env` | Running the CRM locally |
| `supabase/functions/.env` | Deploying Edge Functions only |

In `workers/.env`, change the values that are paths on the old PC: `NODE_PATH`, `BRAND_ASSETS_DIR`, `CLAUDE_BIN`, `CLAUDE_CODE_GIT_BASH_PATH`, `FFMPEG_PATH`.

Check it works, from the repo root:

```bash
node --env-file=workers/.env scripts/library/library.mjs list --usable
node content/studio/post/render.mjs content/posts/2026-11/IDEA-046_empty-spot-costs-more/source/IDEA-046.html --out tmp/check.png
```

## 4. Two PCs, one repo

- Work on `main`. `git pull --rebase` before starting; commit and push when each batch is done.
- Split the work by batch so both PCs never build the same post. Before building, check the post has no folder in `content/posts/` after a pull, and no finished files in the CRM.
- Workbooks (`.xlsx`) cannot be merged. Only one PC edits a given workbook between pushes.
- Run the CRM pipeline (`scripts/pipeline.ps1`) on one PC at a time. Its creatives repo (`.creatives.git/`) is local to the PC.
- Only the owner runs `npx supabase db push --linked` and function deploys. Docker doesn't work on the first PC, so pgTAP runs on the hosted DB inside a rolled-back transaction.

## 5. Making posts

Rules: `content/CLAUDE.md`. EN + AR always. At most 3 posts per batch, show previews, wait for the owner. Never approve or publish in the CRM.

1. Read the idea in the CRM (`source_metadata.content_plan`). Pick images with `library.mjs list --usable` and `show <CODE>`; only approved or ready entries.
2. Check product claims in `content/docs/product-bible.md`, and EN/AR terms in the app's `docs/TERMINOLOGY.md` if that repo is available.
3. Build. Generators that write EN + AR from one set of slide data: `content/posts/2026-11/build_idea_week1.py` and `build_idea_week1b.py`; copy that pattern. From `content/`:
   `node studio/post/render.mjs posts/<…>/source/*.html --out posts/<…>/preview`, then look at every PNG.
4. Finals: `en/slide-NN.png`, `ar/slide-NN.png`, `caption_en.txt`, `caption_ar.txt`, `hashtags.txt`, `notes.md`; bundle with `node studio/post/bundle.mjs`.
5. Attach to the CRM with `scripts/import/finished-posts.mjs --from <folder>`. It only accepts folders named exactly by plan ID (`IDEA-046`), so copy `en/ ar/ caption_* hashtags.txt` into a temporary folder with that name. Use `--dry-run` first.
6. Reels: `stacko-content-studio`, `node studio/render.mjs <page.html> --preview --lang all`, then without `--preview`. Music only from `assets/audio/music/`. Voice comes from ElevenLabs with timestamps; there is no API key in this repo, so ask the owner for the takes.

New image folders from the owner: `CLAUDE.md` §3b (`scripts/import/image-batch.py`, dry run first). BG-01…06 in owner workbooks mean BG-56…61 in the library.

SQL on hosted: `bash scripts/sql.sh "select 1"` or `bash scripts/sql.sh -f file.sql`.

On Windows, shell heredocs break on quotes and non-ASCII text. Write Python edit scripts to a file first and run them with `python -X utf8`.

## 6. Where things stand (updated 2026-11-08, evening)

**Library:** 70 new images are in (BG-56…61, OB-01…40, SC-01…16, SE-01…04, UI-01…03, PR-01), all approved.

**Ideas:** IDEA-001…187 are in the CRM as pending.

**Built and attached to the CRM (waiting for the owner's review):** every dated IDEA post from 9 Nov 2026 to 24 Mar 2027 except the reels: 84 posts. Generators per month: `content/posts/2026-11/build_idea_week*.py`, `2026-12/build_idea_dec_[abc].py`, `2027-01/build_idea_jan_[abc].py`, `2027-02/build_idea_feb_[ab].py`, `2027-03/build_idea_mar_[ab].py` (they share helpers from `build_idea_week1.py`, `build_idea_week3.py` and `build_idea_dec_a.py`). The owner reviews in the CRM and leaves notes (`scripts/ideas/feedback.mjs list`).

**CRM uploads are JPG q92** (about 8× smaller than PNG); the PNGs stay in each post's `en/` and `ar/`. `finished-posts.mjs` reads JPEG dimensions too.

**Undated ideas (IDEA-089…187) are built too, locally only (not uploaded, CRM storage is the limit):** `content/posts/unscheduled/` with generators `build_idea_und_01…11.py` and shared helpers `und_lib.py`. Upload them with the same staging + `finished-posts.mjs` flow once storage is sorted.

**Posting order:** `content/plans/posting-order.md` (168 posts from 9 Nov 2026). The launch block introduces Stacko first; seasonal posts keep their dates. The same dates are in the CRM (`source_metadata.publish_date`).

**Not built yet:**
- Reels IDEA-032, 041, 058, 072 (dated) and 8 undated reels: need the motion engine and, where there is voice, ElevenLabs takes from the owner.
- IDEA-171 (needs real team photos) and IDEA-180 (needs a real customs-broker partner). Templates IDEA-132, 168, 169 are built but need real numbers/permission.
- Storage was 952 MB after the March batch; check the Supabase plan's storage limit before uploading the undated posts.

**Flagged in the posts' notes.md (CHECK):** IDEA-018 and IDEA-013 founder quotes (confirm with Nabih), IDEA-086/087/088 Ramadan and Eid dates (moon sighting), IDEA-071 onboarding timeline (confirm with product).

**Open with the owner:**
- The older NOV plan has posts on some of the same days (NOV-04, S2, 05, 06, 07, S3, 08, 09). Owner decides which to keep.
- Arabic copy was written by the agent and needs a native check.
- Owner images are 928 px wide; ask for 1080 px or more.
- P5-T20, T21 and T22 are still in progress in `PLAN.md`: the Idea review and Visual library pages have not been checked in a browser by an agent.
