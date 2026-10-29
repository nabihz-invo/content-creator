# 0004 — Preview isolation

**Status:** accepted

## Context
Creative previews run AI-generated HTML/JS (including Three.js). Blueprint
forbids executing generated code inside the CRM origin.

## Decision
- Preview bundles are uploaded to the `previews` bucket and served from an
  origin different from the CRM (dedicated preview domain or the Storage
  domain; never the CRM domain).
- Embedded only via `<iframe sandbox="allow-scripts">` (no
  `allow-same-origin`, `allow-top-navigation`, `allow-forms`, `allow-popups`).
- CSP on preview responses: `default-src 'self' data: blob:; script-src 'self'
  'unsafe-inline'; connect-src 'none'; frame-ancestors <crm-origin>`.
- Short-lived signed URLs; previews never receive tokens.
- Where CSP headers can't be set by the host, a tiny preview proxy (Edge
  Function or worker) serves the files and adds them.

## Consequences
Generated code cannot read CRM cookies/storage, call APIs, or navigate the
parent. Rendered PNG/MP4 previews are used where interaction isn't needed.
