# 0002 — Separate repository for generated creative source

**Status:** accepted

## Context
Claude Code generates HTML/CSS/JS per content project. That code is untrusted,
high-volume, and versioned per creative version.

## Decision
Store generated source in a dedicated repository (default `content-creatives`)
at `projects/<project_id>/v<creative_version>/`, one commit per creative
version. Approved reusable templates stay in this repo under `templates/` and
are copied into the workspace at generation time. Large media goes to
Supabase Storage, never Git.

## Consequences
- The creative worker's GitHub token is scoped to that repo only.
- `creative_versions.repository_url + commit_sha + source_path` fully identify
  the source; renders check out that exact commit.
- Platform code reviews never include generated code.
