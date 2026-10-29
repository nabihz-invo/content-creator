# 0003 — Postgres-backed job queue

**Status:** accepted

## Context
Blueprint requires durable, resumable, retryable jobs and says n8n executions
must not be the only record of progress. Creative generation and rendering run
for minutes in separate workers.

## Decision
`workflow_jobs` (and `render_jobs` for render detail) act as the queue.
Workers claim with `claim_job()` using `FOR UPDATE SKIP LOCKED`, a lease
(`lease_expires_at`) and heartbeats. `complete_job` / `fail_job` finalize;
retryable failures get exponential backoff; exhausted jobs become
`needs_attention`. Completion triggers a Supabase database webhook to n8n.
n8n Workflow R (cron) recovers expired leases. No extra queue infrastructure
(Redis, etc.) in the initial release.

## Consequences
- One source of truth for job state, visible in the workflow monitor.
- Polling interval adds a few seconds of latency — acceptable.
- Can migrate to `pgmq` later behind the same RPCs if throughput requires it.
