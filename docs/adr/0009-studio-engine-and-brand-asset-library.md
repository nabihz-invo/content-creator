# 0009 — Studio engine as a brand template pack, brand asset library mounted read-only

**Status:** accepted (2026-11-01)

## Context
Stacko's earlier content work (`../content/Stacko_Studio_Kit/Stacko-Studio`,
27 Oct 2026) produced a frame-exact HTML motion engine (`sm-core`,
`sm-components`, `sm-app`), a 65-element isometric map library, starter pages,
26 recipes and a large brand asset library (backgrounds with real screens placed,
post photos, screens, graphics, logos, fonts, music, UI sounds). Its output was
good except for sound: every SFX was synthesized from sine waves and noise and the
music was a placeholder. Phase 5 needs a deterministic video template; the engine
already is one (`SM_SEEK(t)`), and the owner wants its rules kept: every video is
HTML before it is rendered, English and Arabic as separate versions from one page,
the recreated app instead of screenshots, a dot moment per reel, music-driven
transitions.

## Decision
1. **Engine as a template pack.** `templates/studio/` vendors the engine
   byte-identical with the kit (excluded from lint/format), its docs, starter
   pages and a `bridge.js` that maps `SM_READY`/`SM_META`/`SM_SEEK` onto the
   pipeline's timeline contract (`CONTRACTS.md §10`). A brand opts in with
   `brand_settings.studio.engine = "studio-1"`; the content spec then carries
   `studio: { engine, brand_id, languages, sfx_allow }`.
2. **Workspace layout.** A studio workspace is `index.html` + `spec.js` (the
   creative's own, committed files) plus two trusted, never-committed folders:
   `studio/` (engine, docs) and `assets/` (the brand library). The engine's
   absolute paths (`/studio/engine/…`, `/assets/…`) resolve because the
   workspace root is the server root everywhere (capture, preview, render).
3. **Brand asset library.** `BRAND_ASSETS_DIR/<brand_id>/` is a local mirror of
   the brand's `brand-assets` bucket (P5-T09 syncs it). Claude Code gets the
   whole library mounted while writing; previews and renders get only the files
   the page references plus fonts, map elements and allowed UI sounds, and a page
   that names a file the library lacks fails the build.
4. **Validator.** `studio/` and `assets/` are trusted (no code rules, no size
   limits); audio/video files are allowed only under `assets/`; size limits
   apply to the creative's own files; a page that loads the bridge and builds
   `SM.reel()`/`SM.carousel()` satisfies the ready and render hooks.
5. **Two language versions.** Capture and render load the page once per
   language (`?render=1&lang=en|ar`); outputs are suffixed `_EN`/`_AR`.
6. **Sound policy enforced at render time.** Transitions are music-driven: the
   engine mutes transition SFX, and the renderer mixes only cues listed in
   `spec.studio.sfx_allow` (UI sounds), so a page cannot reintroduce whooshes.

## Consequences
- Previews and renders stay small (tens of files) although the library is
  hundreds of megabytes.
- Engine updates are deliberate: copy the kit's files into `templates/studio/engine/`
  and bump the engine id if behaviour changes.
- Workers need `BRAND_ASSETS_DIR` and a synced library before they can build a
  studio creative.
