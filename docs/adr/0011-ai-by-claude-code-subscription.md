# ADR-0011: AI stages answered by Claude Code with the owner's subscription

Status: accepted (2026-11-01)

## Context

The analysis, brief and script stages called the Anthropic API from the `api` Edge Function, and the
creative worker ran Claude Code with the same API key. Pay-per-use credit ran out on the first real
creative. The owner wants the CRM to stay their workspace (ideas, review, approvals) while every AI
step runs in Claude Code on their PC, signed in with their Claude subscription, and no API key is used.

## Decision

- `AI_PROVIDER=claude-code` gives the stages a **relay transport** (`_shared/relay.ts`). It does not call
  a model: it looks up the stored reply to this exact request (job + attempt + request hash); without
  one it writes the request to `ai_requests` and the executor parks the job (`defer_job`: back to the
  queue, attempt not spent, asleep).
- The job runner (`workers/job-runner`, ADR-0010) claims requests (`claim_ai_request`), runs Claude
  Code headless with no tools in an empty temp folder (`--system-prompt-file`, `--tools ""`), signed in
  with `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`, and stores the reply as a Messages API
  response (`finish_ai_request`), which wakes the job.
- The stage replays from the start and gets the stored reply: prompts, schema checks, the corrective
  retry (a new request listing the problems) and the `save_*` RPCs are unchanged.
- The creative worker passes `CLAUDE_CODE_OAUTH_TOKEN` instead of `ANTHROPIC_API_KEY` when it is set.

## Consequences

- No API spend; usage counts against the owner's Claude plan limits, and the PC must be on.
- A stage takes one extra round trip (a few seconds) on top of Claude Code's own time.
- `AI_PROVIDER=anthropic` still works unchanged if an API key is wanted again.
