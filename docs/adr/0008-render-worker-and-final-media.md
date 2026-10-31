# 0008 — Render worker, database-built media manifests, manual publishing package

**Status:** accepted (2026-10-31)

## Context
Phase 4 turns an approved creative into final files (PNG, carousel slides),
lets a reviewer approve exactly those files, and prepares a package for manual
posting (blueprint §9 stages 9–11, §13). Video (MP4) is Phase 5.

## Decision
1. **Render worker, not n8n.** Approving a creative calls `queue_render()`,
   which creates a `render_jobs` row (version per project, output type derived
   from the creative's format, expected width/height) and its `render_worker`
   workflow job. `workers/render-worker` claims with
   `claim_render_job(worker, lease, output_types)` so a Phase 4 worker never
   takes an `mp4` job; those stay queued for the Phase 5 worker. Workflow F is
   folded into the worker + RPCs, like E (ADR-0007).
2. **Render from Git, not from the preview bucket.** The worker checks out the
   approved version at its `commit_sha`, recomputes the tree hash and refuses
   to render if it differs from the approved `content_hash`. The trusted
   runtime, fonts and vendored libraries are restored from the templates, as
   in the creative worker.
3. **Isolation.** Chromium runs with every request outside the job's local
   static server aborted, service workers blocked, one temp directory per job
   (removed afterwards), a per-job timeout, and in production the container in
   `workers/render-worker/Dockerfile` (non-root, Chromium + FFmpeg, egress only
   to Supabase).
4. **Validation before saving.** Each PNG is decoded: exact configured
   dimensions, not blank (luma standard deviation threshold), ≤ 8 MB; a carousel
   has every slide of the spec, numbered 1…n, all the same size. Failures are
   permanent (`needs_attention`), not retried.
5. **The manifest is built by Postgres.** `save_render()` inserts the
   `media_assets`, builds the manifest (`CONTRACTS.md §8`) from those rows, and
   computes `manifest_hash = sha256(manifest::text)` (jsonb text is canonical).
   The render job is then frozen (only `status` may move to `outdated`).
6. **Final approval** is `record_approval('media_manifest', render_job_id,
   render version, manifest_hash, …, p_return_to)`:
   approve → assets `approved`, project `ready_to_publish`;
   changes requested + `render` → rerender the same creative (new render
   version); changes requested + `creative` → creative revision from that
   version with the comment as notes; reject → fresh creative direction.
   A newer render or creative version marks older renders and their media
   `outdated`.
7. **Publishing preparation.** `create_publishing_job()` requires an approved
   media approval whose render is still current; the existing trigger checks
   the manifest hash. Platform rules (`packages/shared/src/platform-rules.ts`:
   media types, aspect ratios, slide counts, caption and hashtag limits) are
   checked in the API. The job is `ready`; the bundle endpoint streams a zip
   (media in order, `caption.txt`, `hashtags.txt`, `manifest.json`) built from
   storage on the fly. "Mark as posted" records the URL and moves the project
   to `published` — a human confirmation, which is the manual-integration
   equivalent of provider confirmation (WORKFLOW.md §3).
8. **Notifications.** Workers send the signed `notify` webhook
   (`creative_ready`, `media_ready`, `needs_attention`) when n8n is configured.

## Consequences
- Every final file is traceable: media asset → render job (version, manifest
  hash) → creative version (commit SHA, content hash) → script → brief.
- Re-rendering is cheap and safe; old renders can never be published.
- Phase 5 adds `mp4` to the worker's output types without schema changes.
