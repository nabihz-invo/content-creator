# Example posts (static post design)

Finished posts whose `source/` HTML you can copy structure and CSS from. Each lives in its own post folder; the source files use root paths (`/assets/...`), so a copy works from any other post folder.

| Post | Folder | What it shows |
|---|---|---|
| LCH-00 | `posts/unscheduled/LCH-00_meet-stacko/` | "Meet Stacko" launch carousel, 6 slides, EN + AR (What / Why / Who / How) |
| WHAT-1, WHAT-2, WHY-1, WHY-2, WHO-1, WHO-2, HOW-1, HOW-2 | `posts/unscheduled/<ID>_…/` | Launch statics, EN + AR: photo panel + chips, data-to-physical flow, problem scene, network hero + tracker, phone conversation + steps |
| NOV-09 | `posts/2026-11/NOV-09_imagine-overseeing-five-warehouses/` | "Five warehouses" 7-slide diorama carousel, EN + AR, poll on the last slide |
| STK-01 … STK-10 | `posts/unscheduled/STK-<nn>_…/` | HTML-only posts: myths, folder meme, glossary, audit card, poll, big numbers, alerts lock screen, branch map, roles grid, shipment route |
| NOV-11 | `posts/2026-11/NOV-11_stacko-designed-help-see/` | Numbered hub infographic |
| EDU-49 | `posts/unscheduled/EDU-49_spreadsheet-chaos-map-clarity/` | Before / after split with a 3D character, map on the tablet |
| EDU-57 | `posts/unscheduled/EDU-57_whatsapp-warehouse-group/` | Meme chat (light). Names WhatsApp in its headline, which predates standing rule 8: don't copy that |
| BRD-01 (was BRAND-A) | `posts/unscheduled/BRD-01_know-where-every-box/` | Concept fusion: map pin made of boxes |
| GEM-01, GEM-02, GEM-03 (were STK-Just-Ask, STK-Notebooks-to-Map, STK-One-Message) | `posts/unscheduled/GEM-0n_…/` | Nabih's Gemini posts rebuilt with our frame: photo band kept, baked text covered, real UI on the devices |

Render any of them: `node studio/post/render.mjs <folder>/source/<file>.html --out <somewhere>` (default output is the post's own `preview/`).

Reels and motion carousels made with the engine (`reel.html`, `carousel.html`) are in `posts/2026-11/NOV-01…03` and the engine demos in `studio/examples/`.
