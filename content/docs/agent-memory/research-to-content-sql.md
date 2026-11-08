---
name: research-to-content-sql
description: "Research inbox → RES briefs → import SQL workflow in content-creation/research; gotchas (export wrapper, Bible behind app)"
metadata:
  node_type: memory
  type: project
  originSessionId: 82a2ab67-8000-4179-9997-136661da4ff9
  modified: 2026-11-02T20:39:58.415Z
---

Research batches live in `content-creation/research/` (pipeline repo = `content-creation`, remote content-creator). Prompt: `content-creation/docs/prompts/research-to-content-sql.md`. Workbook is at `content/plans/Stacko_Content_Studio.xlsx` (moved 2026-11-06, see [[content-folder-layout]]); Product Bible at `research/reference/Stacko_Product_Bible.txt`. No psql/DB URL locally — user exports existing-content.json from the SQL editor. CRM email = nabihzanaty@gmail.com.

Gotchas:
- The SQL-editor export is saved wrapped as `[{"coalesce":[...]}]`; the import script then sees no plan IDs. Unwrap to `existing-content.unwrapped.json` and pass that to `--existing`.
- Product Bible (22 Oct 2026) lags the app: POs, partial receive/close short, overdue alerts, ETA history/"Delayed" are built (app/docs/PLAN.md) but not in the Bible — briefs claim only Bible features.
- Use `python -I -X utf8` (console is cp1256).

Batch 1 (`reddit.txt`, 2026-11-02) was a summary without links/quotes, processed as a low-evidence ideas batch at the user's request → RES-01…04 (2027-01-04…08), GAP-01…07. Batch 2 (`chrom.txt` + `chrome 1.txt`, one batch "chrome", F-001…F-070) → RES-05…08 (2027-01-11…15), 15 evidence notes, GAP-08…20. Pass `existing-content.with-pending.json` (export + RES rows not yet imported) to --existing so pending RES IDs count as taken; run reddit SQL before chrome SQL.

**How to apply:** next batch starts at RES-09 and after 2027-01-15; check processed.md first. Related: [[content-v2-production-rules]], [[terminology-standard]].
