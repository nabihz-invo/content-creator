# Aiphin brand kit

Everything needed to make content for Aiphin (أيفِن), the AI and automation agency at aiphin.me. Stacko keeps its own kit in `content/assets/`; don't mix the two.

Open `kit-sheet.html` through the studio server to see the whole kit on one page.

## What's here

| Path | What it is |
|---|---|
| `brand-settings.json` | The first version of the CRM brand record. After import, the CRM's Brands page is the source of truth. |
| `assets/brand/brand.css` | Colour and gradient tokens and all font faces. |
| `assets/brand/fonts/` | Audiowide, Readex Pro (Latin and Arabic), Noto Kufi Arabic. Same files as aiphin.me. |
| `assets/brand/logo/wordmark/` | AIPHIN in five versions, SVG and PNG. |
| `assets/brand/logo/lockups/` | Dolphin with the name, stacked and horizontal. |
| `assets/brand/logo/arabic/` | أيفِن wordmarks, Arabic lockups, bilingual lockups. |
| `assets/brand/logo/icons/` | Avatars (Ocean, dark, light) and app icon. |
| `assets/brand/logo/character/` | The master dolphin on a transparent background. |

The full guide (services, voice, character prompts, checklist) is the `aiphin-brand` skill in `../../../.claude/skills/aiphin-brand/SKILL.md`.

## Which logo to use

| Background | Wordmark | Lockup |
|---|---|---|
| White, Foam, light photo | `primary` | `*-light` |
| Abyss, dark | `reversed` | `*-dark` (transparent) or `*-dark-bg` |
| Ocean | `ocean` | `aiphin-stacked-ocean-bg` |
| One-colour print | `navy` | none |
| Busy photo | `white` | none |

Arabic-only layouts use the `arabic/` files. Layouts read in both languages use `aiphin-bilingual-*`.

## Contact details for every piece

WhatsApp and phone +961 71 313 917 · aiphin.me · info@aiphin.me

The README inside the original `Aiphin_Logo_Kit` still shows the retired number. Don't use it.

## CRM

- Brand name in the CRM: `Aiphin`.
- Only the core files are uploaded, to save storage: wordmark SVGs, transparent lockup SVGs, Arabic and bilingual lockups, avatar, character and fonts. The rest stay in this folder.
- Importers take the brand as an option, and Stacko is the default, so always pass it: `--brand Aiphin`.
