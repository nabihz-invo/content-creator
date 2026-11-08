# Post images

| Folder | What |
|---|---|
| `raw/` | Straight from the image tool (`PI-xx.jfif`, `<ASSET-ID>_v1.png`). Never used in a post directly |
| `final/` | Picked / cropped images used in posts: `PI-xx.png` (Post Images sheet of `plans/Stacko_Content_Studio.xlsx`) and the register images below (`LCH-xx`, `NOV09-A`, `EDU49-A`, `BRAND-A`; full prompts in the Image Prompts sheet of `plans/Stacko_Content_Register.xlsx`) |
| `img-library/` | `IMG-01…27` from the 30-day plan's Image Library (`plans/archive/Stacko_30-Day_Plan_Review.xlsx`), used by the D30 carousels |

New images: original in `raw/`, the one to use in `final/<ASSET-ID>.jpg`.

## final/ (register images)

| File | Shows | Used in |
|---|---|---|
| LCH-01.jpg | Cube made of cardboard boxes with a glowing teal core | LCH-00 slide 1 |
| LCH-02.jpg | Laptop (blank screen) on a desk overlooking a warehouse — screen corners: 360,695 / 571,695 / 571,836 / 360,836 | LCH-00 slide 2, WHAT-1 |
| LCH-03.jpg | Flat lay: blank invoice, phone (blank, angled), pen, box — phone screen corners: 355,436 / 474,465 / 420,719 / 295,690 | WHAT-2 |
| LCH-04.jpg | Forgotten pile of dusty boxes in a dark warehouse, light beam | LCH-00 slide 3, WHY-1 |
| LCH-05.jpg | Tiny white truck on a glowing teal line across a dark map | WHY-2 |
| LCH-06.jpg | Container ship at Beirut port, blue dusk | WHO-1 |
| LCH-07.jpg | Business owner, arms crossed, in his warehouse aisle (right side) | LCH-00 slide 4, WHO-2 |
| LCH-08.jpg | Worker holding a phone (blank) toward camera; landscape 1376×768 — screen corners: 776,240 / 910,230 / 921,525 / 784,531 | LCH-00 slide 5, HOW-1 |
| LCH-09.jpg | Shop counter: salesperson hands a box to a customer | HOW-2 |
| EDU49-A.jpg | 3D split: stressed man with boxes / calm man on bean bag with tablet | EDU-49 |
| NOV09-A.jpg | Five warehouses on a dark miniature Lebanese coast (diorama) | NOV-09 slides 1–5 |
| BRAND-A.jpg | Map pin built from cardboard boxes, teal glow at the tip | BRAND-A |

Screen corners are in source-image pixels: pass them to `studio/post/screen-map.mjs` with the image's scale/offset.

Live-map crops (`map-zoom.jpg`, `map-crop.jpg`, `map-tab.jpg`, `map-full.jpg`, no client data) are in `assets/screens/live-map/`; use `map-zoom.jpg` on laptop/tablet/phone screens.

## Other sources

- `assets/screens/live-map/SRC-MAP-livemap.png`: full screenshot of the Stacko live map. It contains a client SKU list on the right: **never show that part**, use the crops.
- `assets/sources/SRC-G1/G2/G3.jpg`: Nabih's Gemini posts (baked text). Only their photo bands were reused, in GEM-01…03.
