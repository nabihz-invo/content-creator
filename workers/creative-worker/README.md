# Creative worker (ADR-0007)

Claims `creative_worker` jobs from Postgres and turns an approved script into
creative source: content spec → workspace (template + runtime + fonts +
Three.js) → generator → validator → headless thumbnails → Git commit →
preview upload → `save_creative_version`.

```bash
pnpm --filter @cc/creative-worker start          # needs the local stack (scripts/local-stack)
pnpm --filter @cc/creative-worker test           # validator, Claude Code contract (stub CLI), git store
pnpm --filter @cc/creative-worker test:render    # every template × style × language in headless Chromium
pnpm --filter @cc/creative-worker test:integration  # full jobs against the local database
```

## Configuration

| Variable | Default | Meaning |
|----------|---------|---------|
| `DATABASE_URL` | local stack | Postgres (service access; RPCs only) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | local stack | Storage uploads (`previews` bucket) |
| `CREATIVES_REPO_URL` | `file://…/tmp/creatives.git` | Git remote. Production: `https://x-access-token:<token>@github.com/<org>/content-creatives.git` (fine-grained token, contents:write on that repo only) |
| `CREATIVES_REPO_DISPLAY_URL` | repo URL without credentials | Stored on each version and shown in the CRM |
| `CREATIVE_GENERATOR` | `template` | `claude-code` in production |
| `ANTHROPIC_API_KEY` | — | Only passed to the Claude Code process |
| `CLAUDE_MODEL` / `CLAUDE_EFFORT` / `CLAUDE_BUDGET_USD` | `claude-opus-5-5` / `high` / `5` | Per-job model, effort, spending cap |
| `JOB_TIMEOUT_S`, `LEASE_S`, `POLL_MS` | 1200 / 120 / 3000 | Limits and queue timing |

## Isolation

- Claude Code runs with `--permission-mode dontAsk`, tools limited to file
  editing and `node check.mjs`, no web tools, no MCP servers, no session
  persistence, a budget cap and a timeout; its environment contains only
  `PATH`, a private `HOME`, and its API key.
- Deploy the worker as a container that runs as non-root with CPU/memory
  limits and **egress limited to `api.anthropic.com`, `github.com`, and the
  Supabase project** (an infrastructure setting).
- Generated code is validated (`src/check.mjs`) before it is executed in the
  browser; thumbnails are captured with every non-local request blocked; the
  shared runtime, fonts, and vendored Three.js are restored from the trusted
  template before packaging.
