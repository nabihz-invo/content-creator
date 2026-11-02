# ADR-0010: Run the pipeline on the owner's PC, with a job runner in place of n8n

Status: accepted (2026-11-01)

## Context

The AI stages (analysis, brief, script) run in the `api` Edge Function, but they were started by
n8n: the API pushed a signed webhook to n8n, n8n called back `/internal/run-job`, and n8n's cron
called `/internal/recover`. No n8n instance was ever set up, so every job would have stayed
queued. The creative and render workers and the preview server were never started either. The owner
wants the CRM to drive the whole pipeline now, from their own Windows PC, without hosting n8n.

## Decision

- `workers/job-runner` replaces n8n. It **pulls** instead of receiving webhooks (the hosted function
  can't reach the PC): every few seconds it reads queued `kind = 'n8n'` jobs for the stages the API
  runs and calls `/internal/run-job`, signed with `N8N_WEBHOOK_SECRET` exactly as n8n did; every
  minute it calls `/internal/recover`. `N8N_BASE_URL` stays unset, so the API's dispatcher is a no-op
  and the job rows remain the source of truth (ADR-0003).
- `scripts/pipeline.ps1` starts the job runner, the creative worker (`CREATIVE_GENERATOR=claude-code`,
  native `claude.exe`, Git Bash for its Bash tool), the render worker (png, carousel, mp4) and the
  preview server (`PREVIEW_ORIGIN=http://localhost:54400`) in the background with logs in `tmp/pipeline/`.
- The creatives repository (ADR-0002) is a local bare repo, `.creatives.git/`, until a private
  GitHub repo is set up.
- Telegram notifications are not sent (they went through n8n); the CRM shows every state.

## Consequences

- Nothing needs a public URL; the pipeline pauses while the PC is off and resumes from the queue.
- n8n can come back later by setting `N8N_BASE_URL` and stopping the job runner; nothing else changes.
- The creative source lives only on this PC until it is pushed to GitHub — back up `.creatives.git/`.
