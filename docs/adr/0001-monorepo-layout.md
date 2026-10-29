# 0001 — Monorepo layout, no Lovable

**Status:** accepted (2026-10-29, decided by the project owner)

## Context
The blueprint listed Lovable for the CRM. The owner decided all code —
including the frontend — is written by Claude Code agents. Lovable's
root-level sync constraint therefore no longer applies.

## Decision
- Single pnpm monorepo. The CRM is a Vite + React + TypeScript + Tailwind +
  shadcn/ui app at `apps/crm/`, developed directly by agents.
- Backend (`supabase/`), orchestration exports (`n8n/`), workers
  (`workers/*`), shared contracts (`packages/shared`), and creative templates
  (`templates/`) live beside it.
- Shared types and schemas reach the CRM, workers, and Edge Functions from
  `packages/shared` (workspace dependency; Edge Functions import the built
  JSON schemas / TS sources via relative import map).

## Consequences
- One PR can change a contract and every consumer together.
- shadcn/ui components are vendored into `apps/crm/src/components/ui` the
  normal shadcn way (generated source, owned by the repo).
- Blueprint §2 "Lovable" is superseded by this ADR; everything else in the
  frontend stack stands.
