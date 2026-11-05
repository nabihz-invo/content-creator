# Showcase reels (Nov 2026)

Studio pages for D30-16, D30-07 and D30-01, built by hand with the viral-motion-editor playbook
(`templates/studio/docs/MOTION.md`). Finished files: `content/2026-12/<ID>_…/` and the CRM.

Re-render one locally (EN + AR) after an edit:

    pnpm --dir workers/render-worker render:local showcase/D30-16/reel.html --out <dir> --lang en,ar --crf 23

then normalise the audio to −14 LUFS (`loudnorm=I=-14:TP=-1.5`) and re-import with
`scripts/import/finished-posts.mjs --only <ID>`.
