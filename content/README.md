# Stacko content

One folder for all of Stacko's social content (merged on 6 Nov 2026 from `Stacko_Studio_Kit/`, `_archive/` and `2026-12/`).

| Folder | What's in it |
|---|---|
| `posts/2026-11/`, `posts/2026-12/` | One folder per post, by publish month (`<ID>_<slug>/`) |
| `posts/unscheduled/` | Finished or planned posts with no date yet; move a folder into its month once it's scheduled |
| `plans/` | The content plan, the post register, the background library; `archive/` has old plans and logs |
| `references/` | Drop example images here and ask Claude for "a post like this" |
| `assets/` | Everything posts are made from: brand (logo, fonts), backgrounds, post images, real app screens, graphics, map elements, music, sounds, clips |
| `studio/` | The tools: motion engine for reels (`render.mjs`) and the static-post tools (`post/`) |
| `docs/` | Product facts, ready-to-use prompts, the merge log |
| `.claude/skills/` | The three skills Claude uses here (post design, motion studio, brand) |

Inside a post folder
- Static posts: `source/` (HTML to edit) · `en/` and `ar/` (final PNGs, `slide-01.png` …) · `html/` (one-file editable version with **Edit text** and **Save PNG**) · `preview/` · `notes.md`
- Reels: `reel.html` · `<ID>_EN.mp4` / `<ID>_AR.mp4` · covers · captions · `notes.md`
- Older posts keep the layout they were made with (`en/`, `ar-needs-native-review/`, `png-en/` …).

See `CLAUDE.md` for the rules and commands, `docs/PROMPTS.md` for what to ask Claude.
