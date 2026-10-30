# 0007 — Creative worker: Claude Code in a disposable workspace, git-traced source, isolated preview origin

**Status:** accepted (2026-10-30)

## Context
Phase 3 turns an approved script into creative source (HTML/CSS, or Three.js
for video), previews it safely in the CRM, and keeps every version traceable to
a Git revision (blueprint §7–9, §13). Generation can take minutes and runs
untrusted, model-written code.

## Decision
1. **Worker, not n8n.** Script approval queues a `creative_worker` job. The
   Node worker (`workers/creative-worker`) claims jobs from Postgres
   (`claim_job`, leases, heartbeats) and writes results through RPCs
   (`save_creative_version` completes the job atomically). n8n is not involved.
2. **Workspace.** Each job gets a fresh temp directory containing the format's
   starter template (`templates/<format>`), shared runtime and fonts, vendored
   Three.js for video, `spec.js` (the content spec), and a workspace
   `CLAUDE.md` with the rules. Revisions start from the previous version's files.
3. **Generators.**
   - `claude-code` (production): `claude -p` headless in the workspace with the
     deterministic creative prompt (ADR-0006) appended to the system prompt,
     tools limited to file editing plus `node check.mjs`, an empty environment
     except its own API key, a turn limit and a wall-clock timeout.
   - `template` (dev/CI/fallback): the starter template rendered from the spec
     as-is. Same contract, no model.
4. **Validation before anything leaves the sandbox**: allowed file types and
   sizes, no network APIs, no `eval`, no remote URLs, no `Math.random`, required
   `window.__ready` (and `window.__render` for video).
5. **Source of truth.** Files are committed to the creatives repository at
   `projects/<project_id>/v<version>/` — GitHub in production
   (`CREATIVES_REPO_URL` with a repo-scoped token), a local bare repo in dev.
   `creative_versions` stores repository URL, commit SHA, path, and a tree
   hash; the worker pushes with rebase-retry.
6. **Preview origin.** Preview bundles go to the private `previews` bucket.
   `workers/preview-server` serves them on a **separate origin** behind
   short-lived HMAC tokens, with CSP (`connect-src 'none'`, local assets only,
   `frame-ancestors` = CRM), `nosniff`, and no cookies. The CRM embeds it with
   `<iframe sandbox="allow-scripts">`. (Supabase Storage serves HTML as plain
   text, so it cannot be the preview origin.)
7. **Thumbnails** are captured by Playwright from the local bundle with all
   network requests blocked except the local file server.

## Consequences
- Creative approval in the CRM queues a `render_worker` job for Phase 4.
- Local dev needs no GitHub or API key; production needs `CREATIVES_REPO_URL`,
  `ANTHROPIC_API_KEY` for the worker, and `PREVIEW_SIGNING_SECRET` shared by
  the API and the preview server.
- Network egress restrictions for the worker container (Anthropic, GitHub, npm
  only) are an infrastructure setting, documented in the worker README.
