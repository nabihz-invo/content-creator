# Deployment

How to run the pipeline in production (and against a real Supabase project
from a developer machine). Local development uses `scripts/local-stack`
instead — see `DEVELOPMENT.md`.

## 1. What runs where

| Piece | Where | Notes |
|-------|-------|-------|
| Database, Auth, Storage | Supabase project | `npx supabase db push` applies `supabase/migrations` |
| `api`, `telegram-webhook` | Supabase Edge Functions | Secrets: `supabase/functions/.env.example` |
| CRM (`apps/crm`) | Any static host | Build with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| n8n (`n8n/workflows`) | Self-hosted n8n | Import the JSON exports; see `n8n/README.md` |
| **Creative worker** (`workers/creative-worker`) | Always-on server/container | Claims creative jobs from Postgres; writes to the creatives repo |
| **Render worker** (`workers/render-worker`) | Always-on server/container | `workers/render-worker/Dockerfile` |
| **Preview server** (`workers/preview-server`) | Always-on, **own https domain** | e.g. `preview.example.com`, never the CRM's domain |

The three workers are long-running Node processes, not Edge Functions: any host
that keeps a process alive works (a VPS, Fly.io, Railway, Render, ECS…). They
can share one machine. All of their settings are listed in
`workers/.env.example`.

## 2. Creatives repository and token (P3-T08)

1. Create the repository (e.g. `content-creatives`), **with at least one
   commit** (tick "Add a README" on GitHub). The worker pushes to `main`.
2. GitHub → Settings → Developer settings → **Fine-grained tokens**:
   - Repository access: **only** the creatives repository.
   - Permissions: **Contents: Read and write**. Nothing else.
   - The render worker only reads; it may use a separate read-only token.
3. Put the token **only** into the workers' environment (the host's secret
   settings, or a git-ignored `workers/.env`) — never in the repository, the
   CRM build, or the Edge Function secrets:

   ```bash
   CREATIVES_REPO_URL=https://x-access-token:<TOKEN>@github.com/<owner>/<repo>.git
   CREATIVES_REPO_DISPLAY_URL=https://github.com/<owner>/<repo>
   ```

   `CREATIVES_REPO_DISPLAY_URL` is stored on each creative version and shown as
   the commit link in the CRM, so it never contains the token. Git errors in
   worker logs mask credentials in URLs.

## 3. Creative worker

Needs Node 22+, `git`, Playwright with Chromium (stills), and — for
`CREATIVE_GENERATOR=claude-code` — the Claude Code CLI (`claude`) and
`ANTHROPIC_API_KEY`.

```bash
pnpm install
npm install -g playwright@1 && npx playwright install --with-deps chromium
npm install -g @anthropic-ai/claude-code      # only for the claude-code generator
export NODE_PATH="$(npm root -g)"
set -a; . workers/.env; set +a
pnpm --filter @cc/creative-worker start
```

Start with `CREATIVE_GENERATOR=template`: approve a script in the CRM and
check that a commit appears at `projects/<project_id>/v1` in the creatives
repository. Then switch to `claude-code`. Isolation requirements (non-root,
egress only to `api.anthropic.com`, `github.com` and the Supabase project) are
in `workers/creative-worker/README.md`.

## 4. Render worker

```bash
docker build -f workers/render-worker/Dockerfile -t cc-render-worker .
docker run -d --restart unless-stopped --env-file workers/.env \
  --read-only --tmpfs /work:rw,size=2g --memory 2g --cpus 2 cc-render-worker
```

Same `DATABASE_URL`, `SUPABASE_*` and `CREATIVES_REPO_URL` (read access is
enough). Without Docker, run it like the creative worker:
`pnpm --filter @cc/render-worker start`. Video (`mp4`) jobs stay queued until
the Phase 5 renderer exists.

## 5. Preview server

Serve it behind https on its **own domain** (that separation is what keeps
generated code away from the CRM):

```bash
PORT=54400 PREVIEW_SIGNING_SECRET=<long random string> \
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… CRM_ALLOWED_ORIGINS=https://crm.example.com \
  node --experimental-strip-types workers/preview-server/src/main.ts
```

Then give the `api` function the same origin and secret:

```bash
npx supabase secrets set PREVIEW_ORIGIN=https://preview.example.com PREVIEW_SIGNING_SECRET=<same string>
```

## 6. Edge Functions

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env   # from .env.example
npx supabase functions deploy api
npx supabase functions deploy telegram-webhook
```

## 7. Order of operations

1. Supabase: link, `db push`, secrets, deploy functions.
2. Preview server on its domain; set `PREVIEW_ORIGIN` / `PREVIEW_SIGNING_SECRET`.
3. Creative worker with `CREATIVE_GENERATOR=template`; check the first commit.
4. Render worker; approve a static post or carousel creative and check the
   Media tab.
5. Switch the creative worker to `claude-code`.
6. Optional: n8n workflows + Telegram (`scripts/telegram-set-webhook.sh`).

Not yet verified end to end against hosted services: the Dockerfile build,
real n8n delivery, and real Claude Code generation (see `PROGRESS_LOG.md`).
