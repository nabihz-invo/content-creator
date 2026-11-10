---
name: "stacko-brand"
description: "Stacko brand guide (AI stock-management product by Aiphin): Dot core logo SVG, wordmark, colours, type, voice, EN/AR rules. Use for anything visual or written for Stacko / ستاكو."
---

# Stacko brand guide

**Stacko (ستاكو)** is an AI-assisted stock-management product by **Aiphin**, Nabih's MENA AI agency (aiphin.me). It shows every warehouse, item and shipment on one live map, so teams actually log their moves. The name comes from *stacking* goods.

- **Tagline (EN):** Your stock, always in sight
- **Tagline (AR):** مخزنك دايماً قدّام عينك
- **Endorsement:** "A product by AIPHIN" (AIPHIN set in Audiowide, "AI" Signal + "PHIN" Abyss on light; "AI" Glow + "PHIN" white on dark)
- **Audience:** trading and distribution SMEs in Lebanon and the GCC with several warehouses and frequent imports (often from China)
- **First customer:** a client with 3 warehouses, ~10,000 SKUs, ~20 staff, monthly China imports

For product facts (features, stack, pricing, roadmap) use the "Stacko — Product Bible" doc. Only claim features, prices and numbers from that doc or the user; mark anything else as a placeholder like `[PRICE]`.

## 1. Logo

The logo is the **Dot core** mark plus the lowercase **stacko** wordmark.

### The mark: Dot core

About 150 dots on a triangular grid form an isometric cube (a hexagon outline). Each dot is a unit of stock.
- Three faces in three tones (top lightest, left middle, right darkest) make it read as 3D.
- Dots grow towards the centre and shrink towards the edges.
- Three empty lines (a Y) split the cube: the routes between warehouses.
- A glowing core sits where the routes meet: the AI.

Story to use when presenting it: *every dot is a unit of stock; together they form one box, split by the routes between your warehouses, with AI at the core.*

**Master SVG (primary, for dark backgrounds).** Colours come from CSS variables with these defaults, so the same file recolours for other backgrounds by setting `--t`, `--l`, `--r`, `--c` on the `<svg>` (or by editing the defaults in the `<style>`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter></defs><style>.t{fill:var(--t,#2EF2EE);stroke:var(--t,#2EF2EE);stroke-width:.9}.l{fill:var(--l,#79C0DE);stroke:var(--l,#79C0DE);stroke-width:.9}.r{fill:var(--r,#2F86B8);stroke:var(--r,#2F86B8);stroke-width:.9}.c{fill:var(--c,#FFFFFF)}</style><circle cx="60" cy="60" r="11" class="c" opacity=".55" filter="url(#glow)"/><circle cx="18.43" cy="42.86" r="1.31" class="l"/><circle cx="18.43" cy="49.71" r="1.38" class="l"/><circle cx="18.43" cy="56.57" r="1.42" class="l"/><circle cx="18.43" cy="63.43" r="1.42" class="l"/><circle cx="18.43" cy="70.29" r="1.38" class="l"/><circle cx="18.43" cy="77.14" r="1.31" class="l"/><circle cx="18.43" cy="84" r="1.20" class="l"/><circle cx="24.37" cy="32.57" r="1.31" class="t"/><circle cx="24.37" cy="46.29" r="1.55" class="l"/><circle cx="24.37" cy="53.14" r="1.61" class="l"/><circle cx="24.37" cy="60" r="1.64" class="l"/><circle cx="24.37" cy="66.86" r="1.61" class="l"/><circle cx="24.37" cy="73.71" r="1.55" class="l"/><circle cx="24.37" cy="80.57" r="1.44" class="l"/><circle cx="24.37" cy="87.43" r="1.31" class="l"/><circle cx="30.31" cy="29.14" r="1.38" class="t"/><circle cx="30.31" cy="36" r="1.55" class="t"/><circle cx="30.31" cy="49.71" r="1.79" class="l"/><circle cx="30.31" cy="56.57" r="1.84" class="l"/><circle cx="30.31" cy="63.43" r="1.84" class="l"/><circle cx="30.31" cy="70.29" r="1.79" class="l"/><circle cx="30.31" cy="77.14" r="1.69" class="l"/><circle cx="30.31" cy="84" r="1.55" class="l"/><circle cx="30.31" cy="90.86" r="1.38" class="l"/><circle cx="36.25" cy="25.71" r="1.42" class="t"/><circle cx="36.25" cy="32.57" r="1.61" class="t"/><circle cx="36.25" cy="39.43" r="1.79" class="t"/><circle cx="36.25" cy="53.14" r="2.02" class="l"/><circle cx="36.25" cy="60" r="2.06" class="l"/><circle cx="36.25" cy="66.86" r="2.02" class="l"/><circle cx="36.25" cy="73.71" r="1.93" class="l"/><circle cx="36.25" cy="80.57" r="1.79" class="l"/><circle cx="36.25" cy="87.43" r="1.61" class="l"/><circle cx="36.25" cy="94.29" r="1.42" class="l"/><circle cx="42.18" cy="22.29" r="1.42" class="t"/><circle cx="42.18" cy="29.14" r="1.64" class="t"/><circle cx="42.18" cy="36" r="1.84" class="t"/><circle cx="42.18" cy="42.86" r="2.02" class="t"/><circle cx="42.18" cy="56.57" r="2.26" class="l"/><circle cx="42.18" cy="63.43" r="2.26" class="l"/><circle cx="42.18" cy="70.29" r="2.17" class="l"/><circle cx="42.18" cy="77.14" r="2.02" class="l"/><circle cx="42.18" cy="84" r="1.84" class="l"/><circle cx="42.18" cy="90.86" r="1.64" class="l"/><circle cx="42.18" cy="97.71" r="1.42" class="l"/><circle cx="48.12" cy="18.86" r="1.38" class="t"/><circle cx="48.12" cy="25.71" r="1.61" class="t"/><circle cx="48.12" cy="32.57" r="1.84" class="t"/><circle cx="48.12" cy="39.43" r="2.06" class="t"/><circle cx="48.12" cy="46.29" r="2.26" class="t"/><circle cx="48.12" cy="60" r="2.48" class="l"/><circle cx="48.12" cy="66.86" r="2.41" class="l"/><circle cx="48.12" cy="73.71" r="2.26" class="l"/><circle cx="48.12" cy="80.57" r="2.06" class="l"/><circle cx="48.12" cy="87.43" r="1.84" class="l"/><circle cx="48.12" cy="94.29" r="1.61" class="l"/><circle cx="48.12" cy="101.14" r="1.38" class="l"/><circle cx="54.06" cy="15.43" r="1.31" class="t"/><circle cx="54.06" cy="22.29" r="1.55" class="t"/><circle cx="54.06" cy="29.14" r="1.79" class="t"/><circle cx="54.06" cy="36" r="2.02" class="t"/><circle cx="54.06" cy="42.86" r="2.26" class="t"/><circle cx="54.06" cy="49.71" r="2.48" class="t"/><circle cx="54.06" cy="63.43" r="2.66" class="l"/><circle cx="54.06" cy="70.29" r="2.48" class="l"/><circle cx="54.06" cy="77.14" r="2.26" class="l"/><circle cx="54.06" cy="84" r="2.02" class="l"/><circle cx="54.06" cy="90.86" r="1.79" class="l"/><circle cx="54.06" cy="97.71" r="1.55" class="l"/><circle cx="54.06" cy="104.57" r="1.31" class="l"/><circle cx="60" cy="12" r="1.20" class="t"/><circle cx="60" cy="18.86" r="1.44" class="t"/><circle cx="60" cy="25.71" r="1.69" class="t"/><circle cx="60" cy="32.57" r="1.93" class="t"/><circle cx="60" cy="39.43" r="2.17" class="t"/><circle cx="60" cy="46.29" r="2.41" class="t"/><circle cx="60" cy="53.14" r="2.66" class="t"/><circle cx="65.94" cy="15.43" r="1.31" class="t"/><circle cx="65.94" cy="22.29" r="1.55" class="t"/><circle cx="65.94" cy="29.14" r="1.79" class="t"/><circle cx="65.94" cy="36" r="2.02" class="t"/><circle cx="65.94" cy="42.86" r="2.26" class="t"/><circle cx="65.94" cy="49.71" r="2.48" class="t"/><circle cx="65.94" cy="63.43" r="2.66" class="r"/><circle cx="65.94" cy="70.29" r="2.48" class="r"/><circle cx="65.94" cy="77.14" r="2.26" class="r"/><circle cx="65.94" cy="84" r="2.02" class="r"/><circle cx="65.94" cy="90.86" r="1.79" class="r"/><circle cx="65.94" cy="97.71" r="1.55" class="r"/><circle cx="65.94" cy="104.57" r="1.31" class="r"/><circle cx="71.88" cy="18.86" r="1.38" class="t"/><circle cx="71.88" cy="25.71" r="1.61" class="t"/><circle cx="71.88" cy="32.57" r="1.84" class="t"/><circle cx="71.88" cy="39.43" r="2.06" class="t"/><circle cx="71.88" cy="46.29" r="2.26" class="t"/><circle cx="71.88" cy="60" r="2.48" class="r"/><circle cx="71.88" cy="66.86" r="2.41" class="r"/><circle cx="71.88" cy="73.71" r="2.26" class="r"/><circle cx="71.88" cy="80.57" r="2.06" class="r"/><circle cx="71.88" cy="87.43" r="1.84" class="r"/><circle cx="71.88" cy="94.29" r="1.61" class="r"/><circle cx="71.88" cy="101.14" r="1.38" class="r"/><circle cx="77.82" cy="22.29" r="1.42" class="t"/><circle cx="77.82" cy="29.14" r="1.64" class="t"/><circle cx="77.82" cy="36" r="1.84" class="t"/><circle cx="77.82" cy="42.86" r="2.02" class="t"/><circle cx="77.82" cy="56.57" r="2.26" class="r"/><circle cx="77.82" cy="63.43" r="2.26" class="r"/><circle cx="77.82" cy="70.29" r="2.17" class="r"/><circle cx="77.82" cy="77.14" r="2.02" class="r"/><circle cx="77.82" cy="84" r="1.84" class="r"/><circle cx="77.82" cy="90.86" r="1.64" class="r"/><circle cx="77.82" cy="97.71" r="1.42" class="r"/><circle cx="83.75" cy="25.71" r="1.42" class="t"/><circle cx="83.75" cy="32.57" r="1.61" class="t"/><circle cx="83.75" cy="39.43" r="1.79" class="t"/><circle cx="83.75" cy="53.14" r="2.02" class="r"/><circle cx="83.75" cy="60" r="2.06" class="r"/><circle cx="83.75" cy="66.86" r="2.02" class="r"/><circle cx="83.75" cy="73.71" r="1.93" class="r"/><circle cx="83.75" cy="80.57" r="1.79" class="r"/><circle cx="83.75" cy="87.43" r="1.61" class="r"/><circle cx="83.75" cy="94.29" r="1.42" class="r"/><circle cx="89.69" cy="29.14" r="1.38" class="t"/><circle cx="89.69" cy="36" r="1.55" class="t"/><circle cx="89.69" cy="49.71" r="1.79" class="r"/><circle cx="89.69" cy="56.57" r="1.84" class="r"/><circle cx="89.69" cy="63.43" r="1.84" class="r"/><circle cx="89.69" cy="70.29" r="1.79" class="r"/><circle cx="89.69" cy="77.14" r="1.69" class="r"/><circle cx="89.69" cy="84" r="1.55" class="r"/><circle cx="89.69" cy="90.86" r="1.38" class="r"/><circle cx="95.63" cy="32.57" r="1.31" class="t"/><circle cx="95.63" cy="46.29" r="1.55" class="r"/><circle cx="95.63" cy="53.14" r="1.61" class="r"/><circle cx="95.63" cy="60" r="1.64" class="r"/><circle cx="95.63" cy="66.86" r="1.61" class="r"/><circle cx="95.63" cy="73.71" r="1.55" class="r"/><circle cx="95.63" cy="80.57" r="1.44" class="r"/><circle cx="95.63" cy="87.43" r="1.31" class="r"/><circle cx="101.57" cy="42.86" r="1.31" class="r"/><circle cx="101.57" cy="49.71" r="1.38" class="r"/><circle cx="101.57" cy="56.57" r="1.42" class="r"/><circle cx="101.57" cy="63.43" r="1.42" class="r"/><circle cx="101.57" cy="70.29" r="1.38" class="r"/><circle cx="101.57" cy="77.14" r="1.31" class="r"/><circle cx="101.57" cy="84" r="1.20" class="r"/><circle cx="60" cy="60" r="3.6" class="c"/></svg>
```

If several copies of the mark sit in one HTML page, define it once as a `<symbol>` and place it with `<svg><use href="#id"/></svg>`, setting the colour variables on each `<svg>`; rename the `glow` filter id if it clashes.

### Colour versions of the mark

| Version | `--t` top | `--l` left | `--r` right | `--c` core | Use on |
|---|---|---|---|---|---|
| Primary (dark) | `#2EF2EE` Glow | `#79C0DE` Dolphin | `#2F86B8` Ocean | `#FFFFFF` | Night gradient, Abyss, dark photos |
| Light | `#0895A6` Signal | `#2F86B8` Ocean | `#0E2440` Abyss | `#0895A6` Signal | White, Foam, light UI |
| One colour white | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` | Busy photos, embossing; set the glow circle's opacity to 0 |
| One colour navy | `#0E2440` | `#0E2440` | `#0E2440` | `#0E2440` | Stamps, invoices, one-colour print; glow opacity 0 |

Never use Glow `#2EF2EE` dots on white: they disappear. Use the Light version there.

### Wordmark

- Lowercase **stacko**, Readex Pro SemiBold (600), letter-spacing −0.045em, line-height 0.9–1.
- The final **o** is teal: Glow `#2EF2EE` on dark, Signal `#0895A6` on light; the rest is white on dark, Abyss `#0E2440` on light.
- Arabic: **ستاكو** in Noto Kufi Arabic Bold (700), with "ستاك" in the main colour and "و" in teal, mirroring the English.
- Live text is fine (Readex Pro is on Google Fonts and `@fontsource/readex-pro`); outline it for print files.

### Lockups

- **Horizontal (main):** mark on the left, wordmark on the right, vertically centred. Mark height ≈ 2.2× the wordmark's x-height; gap ≈ 0.4× the mark height. Tagline under the wordmark in Readex Pro Regular at ~16% of the wordmark size, then a thin divider and ستاكو on bilingual pieces.
- **Stacked:** mark centred above the wordmark; wordmark width ≈ 1× the mark width.
- **Arabic horizontal (RTL):** ستاكو on the right, mark on the left. The mark is never mirrored.
- **App icon / avatar:** the Primary mark at ~80% of the tile on a rounded square (radius ~23% of the side) filled with the Night gradient. Below 48 px it still reads; below 24 px use the mark alone, no tagline.
- **Endorsement:** "A product by AIPHIN" sits on the top-right or footer of decks, sites and documents, small (11–13 px label + 18–20 px AIPHIN).

### Rules

- Clear space: at least the height of the wordmark's "k" on every side.
- Minimum size: mark 20 px (8 mm print); horizontal lockup 96 px wide.
- Don't redraw, re-space, rotate, stretch, recolour outside the table, add outlines or drop shadows, or remove the Y-gaps or the core.
- Don't put the mark on a busy background without a solid or Night panel behind it.
- Don't use any of the earlier exploration marks (isometric box stack, orbit, S-route, glass layers, etc.) for Stacko.

## 2. Colours

Stacko uses the Aiphin palette so the two brands read as a family.

| Name | Hex | Role in Stacko |
|---|---|---|
| Abyss | `#0E2440` | Main text on light, dark backgrounds, app icon base |
| Night top | `#1B416B` | Inner colour of the Night gradient |
| Signal | `#0895A6` | Accent on light: links, the "o", active states, light-version top face |
| Glow | `#2EF2EE` | AI and "live" signal on dark only: the core, the "o", moving shipments |
| Ocean | `#2F86B8` | Primary buttons on light, charts, mark right face (dark) |
| Dolphin | `#79C0DE` | Secondary blue, mark left face (dark), illustrations |
| Deep sea | `#2C5974` | Secondary text on light, borders on dark |
| Visor | `#C9D8E4` | Dividers, UI lines, muted text on dark |
| Foam | `#EEF6F9` | Light backgrounds, cards |
| Paper | `#F4F8FA` | Page background for light layouts |

**Signature background, Night:** `radial-gradient(120% 90% at 30% 35%, #1B416B 0%, #0E2440 62%)`. Add a soft Glow halo (blur 40+ px, ~30% opacity) behind the mark on hero sections.

Rules: Glow only on dark, for one thing per layout; long text never in teal or cyan; no orange, yellow or red in brand visuals (status reds/ambers are allowed only inside product UI for alerts).

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Wordmark, headlines (EN) | Readex Pro 600 | Tight tracking (−0.02 to −0.045em) for large headlines |
| Body, UI, buttons (EN + AR) | Readex Pro 400 / 600 | One family for both scripts keeps bilingual screens consistent |
| Arabic headlines and ستاكو | Noto Kufi Arabic 700 | Arabic body ~10% larger than English to feel equal |
| Aiphin endorsement only | Audiowide | Only for the word AIPHIN |

Line height 1.5 for body, 1.1–1.2 for headlines. Numbers in tables and KPIs use tabular figures.

## 4. Product UI style

- Light UI on Paper/Foam with white cards (radius 16–28 px, soft navy shadow `0 10px 34px rgba(22,59,98,.16)`); dark hero or map panels on Night.
- The live map is the signature screen: real map tiles (light), warehouses as isometric buildings with a chip showing code, units and a red low-stock count, routes for road (solid navy), sea (dashed teal) and air (dotted slate), moving vehicles with an ETA tag.
- KPI tiles: Foam background, big tabular number, small label below.
- Status pills: "In stock" Teal-light `#BCE5E0` with navy text; "Low" Red-light `#F0AAAA` with navy text.
- Primary button: Ocean on light, Glow text-button on dark. Touch targets ≥ 44 px. Every screen works in Arabic RTL.

## 5. Voice

Stacko sounds like a calm, competent warehouse manager who loves good data: **clear, practical, confident, a little warm.**

- Lead with the pain: "You don't know what's in your warehouses." "Nobody logs the transfers." Then the fix.
- Concrete scenes over abstractions: "40 LED strips on the way from Beirut to Sidon, arriving in 1h 20m."
- AI is the means, not the headline: "Send a message, Stacko logs it."
- Short sentences, plain words, no jargon. Avoid: leverage, seamless, revolutionary, game-changer, world-class.
- Microcopy in the app is direct and friendly: "Logged: 40 × LED Strip, Beirut → Sidon." "Low on 3 items in WH-02."
- Arabic is written natively (Levantine for Lebanon, MSA for region-wide pieces), keeping tech words like AI, Telegram, WhatsApp in Latin script when that reads more naturally.
- CTAs: "See your stock live", "Book a demo", "Message us on WhatsApp". Contact is Aiphin's: WhatsApp +961 71 313 917, aiphin.me, info@aiphin.me.

## 6. Quick checklist

- [ ] Dot core mark from the master SVG, correct colour version for the background
- [ ] Lowercase "stacko" in Readex Pro 600 with the teal "o"; ستاكو in Noto Kufi Arabic where Arabic appears
- [ ] Aiphin palette only; Glow only on dark; Night gradient for heroes
- [ ] "A product by AIPHIN" endorsement on external pieces
- [ ] Tagline exact: "Your stock, always in sight" / "مخزنك دايماً قدّام عينك"
- [ ] Facts and prices only from the Product Bible or the user
- [ ] English and Arabic versions with proper RTL