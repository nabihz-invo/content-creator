---
name: motion-production-mode
description: "Stacko content is made through the CRM pipeline running on the user's PC (job runner replaces n8n, claude-code creative worker); how to start/check it"
metadata:
  node_type: memory
  type: project
  originSessionId: 69e4889b-0b75-4877-80e0-31da3d6d1746
  modified: 2026-11-05T10:34:23.509Z
---

Decision 2026-11-01 (ADR-0010): the user creates content in the CRM; the pipeline runs on their Windows PC. `workers/job-runner` replaces n8n (pulls queued analysis/brief/script jobs → signed `/internal/run-job`, recover every minute). Creative worker uses `CREATIVE_GENERATOR=claude-code` with the user's Anthropic key, $3 per creative (CLAUDE_BUDGET_USD). Render worker does png, carousel, mp4. Creatives repo is local `content-creation/.creatives.git/` (no GitHub yet). No Telegram notifications (they went through n8n).

**Why:** the user was confused when told to bring posts to Claude sessions — the CRM was built to make the content, and they want to drive it there ("we build the crm to create the content").

**How to apply:** start/check with `powershell -NoProfile -File scripts/pipeline.ps1` (`-Status`, `-Stop`); logs in `content-creation/tmp/pipeline/`. The PC must be on and the script started after a reboot. New ideas: "Start pipeline" button on the project page (or Inbox → Analyze selected). Imported posts with finished files go through the review flow instead. For a one-off local render outside the pipeline: `pnpm --dir workers/render-worker render:local <page.html> --out <dir>`.

Motion craft: the user's **viral-motion-editor** skill (installed 2026-11-05 in ~/.claude/skills, unchanged) is the playbook for every video. For Stacko it is applied through `templates/studio/docs/MOTION.md` (copied into each creative workspace with the references in `docs/motion/`): studio engine not Remotion, silent transitions, brand fonts/palette, assets only from the library, no-speaker style packs.

Related: [[content-v2-production-rules]], [[stacko-background-library]], [[content-creation-storage-rules]], [[content-creation-db-testing]]
