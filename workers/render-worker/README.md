# Render worker (ADR-0008)

Turns an **approved** creative into final media: PNG (static post) and one
PNG per carousel slide. Video (`mp4`) is Phase 5 — this worker never claims
those jobs (`RENDER_OUTPUT_TYPES`).

Per job:

1. Claim a `render_worker` job with `claim_render_job(worker, lease, types)`.
2. Check out the creative at its `commit_sha` from the creatives repository
   and recompute the tree hash: it must equal the approved `content_hash`.
3. Add back the vendored files (fonts, Three.js) from pinned packages and
   re-run the code validator.
4. Render in headless Chromium at the exact configured size (device scale 1)
   from a local static server, every other request aborted; wait for fonts,
   images and `window.__ready`.
5. Validate each file (decoded PNG: dimensions, non-blank, size; carousel:
   all slides 1…n, none identical) — failures are permanent.
6. Upload to `media/<project>/render-<render_job>/`, then `save_render()`
   records the assets, builds and hashes the manifest, moves the project to
   `media_in_review` and completes the job in one transaction.

```bash
pnpm --filter @cc/render-worker start          # needs Playwright on NODE_PATH
pnpm --filter @cc/render-worker test           # PNG decoder + validator
pnpm --filter @cc/render-worker test:integration   # real jobs against the DB on :54322
```

## Configuration

| Variable | Default | Meaning |
|----------|---------|---------|
| `DATABASE_URL` | local stack | Postgres (RPCs only) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | local stack | Uploads to the `media` bucket |
| `CREATIVES_REPO_URL` | `file://…/tmp/creatives.git` | Read access to the creatives repository |
| `RENDER_OUTPUT_TYPES` | `png,carousel` | What this worker claims |
| `RENDER_PAGE_TIMEOUT_S` | 60 | Per output file |
| `RENDER_MAX_PNG_BYTES` | 8 MiB | Largest accepted PNG |
| `RENDER_MIN_LUMA_STDDEV` | 2 | Below this a frame counts as blank |
| `RENDER_CONCURRENCY` | 1 | Jobs rendered in parallel by one process |
| `LEASE_S`, `POLL_MS` | 120 / 3000 | Queue timing |
| `N8N_BASE_URL`, `N8N_WEBHOOK_SECRET` | — | `media_ready` / `needs_attention` notifications |

## Isolation

`Dockerfile` builds a non-root image with Chromium (Playwright) and FFmpeg.
Run it with CPU/memory limits, a read-only root filesystem plus a tmpfs work
directory, and **egress only to the Supabase project and GitHub**. Inside,
the browser can reach nothing but the job's own static server.
