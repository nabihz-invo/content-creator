# Research review — batch `chrome` (2026-11-02)

## What was read

| File | Content | Findings |
|---|---|---|
| `research/inbox/chrom.txt` | Round 1: Reddit (via snapshot mirrors), Capterra, Software Advice, the Shopify app store, Shopify Community, the Odoo forum, TrustRadius, ShippingEasy | F-001 to F-046 |
| `research/inbox/chrome 1.txt` | Round 2 of the same research: Capterra, Software Advice, Trustpilot (Katana, Sortly, Fishbowl, Unleashed, Inventory Planner) | F-047 to F-070 |

The finding IDs continue from one file to the next, so both files are handled as **one batch, `chrome`**. Global IDs keep the file name, e.g. `chrom/F-013` and `chrome 1/F-049`.

**Checked against:**
- the CRM export, plus the 4 posts from batch `reddit` that aren't imported yet (RES-01 to RES-04, in `existing-content.with-pending.json`);
- the Content and Backlog sheets of the workbook;
- the Product Bible.

**Result: 70 findings read, 68 kept, 2 dropped.**

Dropped:
- `chrom/F-016`: it is about IT assets across factories, not stock. The file itself calls it indirect evidence.
- `chrome 1/F-052` (freight in the cost of materials): it is from Dec 2020 and no newer finding repeats it.

Kept, with these notes:
- **Older than 2023 but repeated by newer findings** (so they pass the date rule):
  - F-036 (2022) → F-057, F-070
  - F-040 (2022) → F-044, F-054
  - F-041 and F-042 (2022) → F-003, F-060
  - F-046 (before 2020) → F-058
  - F-048 (2019) and F-032 (2021) → F-024, F-065
- **Undated, but repeating newer patterns:** F-026, F-027, F-045.
- **F-063 is an invited review with an incentive.** It is kept because it is specific (adding a location needed a server restart), not a generic complaint. Flagged.
- **Almost every review names a product** (Cin7, Odoo, Sortly…). Those names stay in this file only. No post names a competitor or quotes a reviewer.

## Findings

| Global ID | Cat. | Date | Product | Signal | Pattern(s) | Kept? |
|---|---|---|---|---|---|---|
| chrom/F-001 | A | ≈ Feb 2025 (snapshot Dec | Shopify | Low | P5, P6 | kept |
| chrom/F-002 | A | ≈ Feb 2025 | Shopify, spreadsheets | Low | P5, P6 | kept |
| chrom/F-003 | D | ≈ Feb 2025 (snapshot Dec | none | Medium | P4 | kept |
| chrom/F-004 | C | ≈ Feb 2025 | none | Medium | P1 | kept |
| chrom/F-005 | E | ≈ Feb 2025 | none | Low | P12 | kept |
| chrom/F-006 | G | ≈ Feb 2025 | none | Low | P14 | kept |
| chrom/F-007 | H | ≈ Feb 2025 | Extensiv | Low | P6 | kept |
| chrom/F-008 | A | ≈ Jul 2025 (snapshot Mar | Excel | Low | P6 | kept |
| chrom/F-009 | G | ≈ Jul 2025 | none | Low | P11 | kept |
| chrom/F-010 | A | ≈ Jun 2025 (snapshot Feb | Clover, Shopify | Low | P5 | kept |
| chrom/F-011 | J | ≈ Jun 2025 | none | Low | P14 | kept |
| chrom/F-012 | I | ≈ Oct 2025 (snapshot Apr | none | Low | P3, P11 | kept |
| chrom/F-013 | A | ≈ Oct 2025 | none | Low | P11 | kept |
| chrom/F-014 | I | ≈ Oct 2025 | none | Low | P3 | kept |
| chrom/F-015 | I | ≈ Oct 2025 | none | Low | P3 | kept |
| chrom/F-016 | I | ≈ Dec 2025 (snapshot Mar | none | Medium | — | dropped — about IT assets across factories, not stock (the file itself calls it indirect) |
| chrom/F-017 | I | ≈ Jul 2025 (snapshot Mar | none | Medium | P3 | kept |
| chrom/F-018 | D | ≈ Jan 2026 (snapshot Jun | Odoo | Medium | P2 | kept |
| chrom/F-019 | J | ≈ Jan 2026 | Odoo | Medium | P7 | kept |
| chrom/F-020 | H | ≈ Jan 2026 | Odoo | Low | P2 | kept |
| chrom/F-021 | A | ≈ Jan 2026 | Shopify, Amazon | Low | P6 | kept |
| chrom/F-022 | F | Feb 3, 2025 | none | Low | P16 | kept |
| chrom/F-023 | C | Feb 3, 2025 | Odoo | Low | P2 | kept |
| chrom/F-024 | D | Feb 17, 2025 | Cin7 | Low | P7 | kept |
| chrom/F-025 | H | May 9, 2025 | Cin7 (Odoo being considered) | Low | P7 | kept |
| chrom/F-026 | A | not shown (“2d ago” on m | Amazon, ShipStation | Low | P6, P12 | kept |
| chrom/F-027 | F | not shown | none | Low | P16 | kept |
| chrom/F-028 | D | Oct 9, 2024 | Cin7 Core | Medium | P1 | kept |
| chrom/F-029 | D | Apr 23, 2024 | Cin7 Core | Low | P4 | kept |
| chrom/F-030 | D | Mar 2025 | Cin7 Core | Medium | P2 | kept |
| chrom/F-031 | D | Dec 2025 | Cin7 Omni | High | P9 | kept |
| chrom/F-032 | D | Jun 2021 | Cin7 Omni | Low | P7 | kept |
| chrom/F-033 | D | Feb 8, 2023 | Cin7 Omni (Shopify app) | Medium | P2, P9 | kept |
| chrom/F-034 | D | Feb 8, 2023 | Cin7 Omni | Low | P3 | kept |
| chrom/F-035 | J | Aug 22, 2025 | Cin7 Core | Low | P1 | kept |
| chrom/F-036 | E | Sep 2022 (older than 3 y | inFlow | Low | P8 | kept |
| chrom/F-037 | D | Dec 2025 | inFlow | Low | P1 | kept |
| chrom/F-038 | D | Jul 2024 | inFlow | Low | P3 | kept |
| chrom/F-039 | D | Sep 2024 | inFlow | Medium | P12 | kept |
| chrom/F-040 | D | Nov 10, 2022 | Zoho Inventory | Medium | P5 | kept |
| chrom/F-041 | A | Apr 21, 2022 | Zoho Inventory | Low | P4 | kept |
| chrom/F-042 | H | Apr 21, 2022 | Zoho Inventory | Low | P2 | kept |
| chrom/F-043 | D | May 14, 2025 | Zoho Inventory | Low | P2 | kept |
| chrom/F-044 | A | Jul 22, 2024 | Shopify | Medium | P5 | kept |
| chrom/F-045 | E | not shown | Odoo | Low | P4 | kept |
| chrom/F-046 | E | not shown (thread predat | ShippingEasy | Medium | P4, P8 | kept |
| chrome 1/F-047 | I | Dec 27, 2024 | Katana | Low | P3 | kept |
| chrome 1/F-048 | D | Sep 10, 2019 (older than | Katana | Low | P7 | kept |
| chrome 1/F-049 | D | Apr 15, 2024 | Katana | High | P1 | kept |
| chrome 1/F-050 | D | Feb 14, 2023 | Katana | Medium | P10 | kept |
| chrome 1/F-051 | D | Feb 11, 2023 | Katana | Low | P3 | kept |
| chrome 1/F-052 | D | Dec 27, 2020 (older than | Katana | Low | — | dropped — Dec 2020 and no newer finding repeats it (landed cost / freight) |
| chrome 1/F-053 | D | Feb 5, 2025 | Sortly | Low | P4 | kept |
| chrome 1/F-054 | D | Feb 10, 2025 | Sortly | Medium | P5, P10 | kept |
| chrome 1/F-055 | D | May 7, 2025 | Sortly | High | P1 | kept |
| chrome 1/F-056 | G | Jul 7, 2025 | Sortly | Low | P13 | kept |
| chrome 1/F-057 | E | Feb 4, 2025 | Sortly | Low | P8 | kept |
| chrome 1/F-058 | E | Feb 13, 2025 | Sortly | Low | P4 | kept |
| chrome 1/F-059 | D | Dec 5, 2025 | Sortly | Low | P5, P10 | kept |
| chrome 1/F-060 | I | Jan 29, 2025 | Sortly | Medium | P2, P3 | kept |
| chrome 1/F-061 | D | Sep 4, 2025 | Fishbowl | Medium | P2 | kept |
| chrome 1/F-062 | D | Apr 17, 2026 | Fishbowl | Low | P5 | kept |
| chrome 1/F-063 | D | Jul 2026 | Fishbowl | Low | P4 | kept |
| chrome 1/F-064 | E | Apr 16, 2026 | Fishbowl | Low | P15 | kept |
| chrome 1/F-065 | D | Jun 4, 2026 | Fishbowl | Low | P7 | kept |
| chrome 1/F-066 | G | Nov 24, 2025 | Fishbowl | Low | P1, P14 | kept |
| chrome 1/F-067 | D | Jul 9, 2026 | Unleashed | High | P1 | kept |
| chrome 1/F-068 | D | Jul 9, 2026 | Unleashed | High | P9 | kept |
| chrome 1/F-069 | H | Jul 21, 2026 | Unleashed | Low | P1 | kept |
| chrome 1/F-070 | A | Jun 29, 2026 | Inventory Planner | Low | P5, P8 | kept |

## Patterns (strongest first)

A pattern is strong when it has 3+ findings or High signal.

1. **P2. Too complex: learning curve, long or failed setup.** 9 findings, Medium: F-018, F-020, F-023, F-030, F-033, F-042, F-043, F-060, F-061.
   - *"If you do not have it set up properly in the beginning, it is a nightmare to figure out."* (F-061)
   - *"like I need 3 clicks to do 1 thing"* (F-043)
2. **P1. Price rises, billing surprises, tools priced for big companies.** 9 findings, High: F-004, F-028, F-035, F-037, F-049, F-055, F-066, F-067, F-069.
   - *"now it is too expensive and only for big guys."* (F-037)
   - *"300% price increase with only 30 days supposed notice."* (F-055)
3. **P3. Getting staff to count, scan and enter data correctly.** 9 findings, Medium: F-012, F-014, F-015, F-017, F-034, F-038, F-047, F-051, F-060.
   - *"make the correct action the easiest action for the worker."* (F-017)
   - *"the hardest part … was getting correct daily counts from employees."* (F-047)
4. **P5. The number on screen isn't the stock on the shelf.** 9 findings, Medium: F-001, F-002, F-010, F-040, F-044, F-054, F-059, F-062, F-070.
   - *"what we actually have versus what Shopify thinks we have"* (F-002)
5. **P4. Multi-location limits.** 8 findings, Medium: F-003, F-029, F-041, F-045, F-046, F-053, F-058, F-063.
   - *"fall apart when you need real multi location orchestration"* (F-003)
   - *"Lots of items were either lost or misplaced for sometimes weeks at a time"* (F-041)
6. **P6. Spreadsheets and manual compiling break as the business grows.** 6 findings: F-001, F-002, F-007, F-008, F-021, F-026.
   - *"spreadsheet hell"* (F-007)
7. **P7. Data import, migration and lock-in.** 6 findings, Medium: F-019, F-024, F-025, F-032, F-048, F-065.
   - *"It is virtually impossible to migrate away."* (F-019)
8. **P8. Stock in an in-between state.** 4 findings, Medium: F-036, F-046, F-057, F-070.
   - *"in transit with an ETA … included in stock levels"* (F-036)
9. **P9. Slow, ticket-only support.** 3 findings, High: F-031, F-033, F-068.
   - *"Response times regularly stretched to one to two weeks"* (F-068)
10. **P10. Several people at once.** 3 findings, Medium: F-050, F-054, F-059.
    - *"if several users tried to update the same thing at once, the numbers would almost always be wrong."* (F-054)
    - *"Only one user per acount at any time"* (F-050)
11. **P11. Messy item master data.** 3 findings, 2 from the same thread: F-009, F-012, F-013.
    - *"Same product gets typed 5+ different ways depending on who's working that day"* (F-012)
12. **P12. Reports a non-analyst can read.** 3 findings, Medium: F-005, F-026, F-039.
    - *"reporting that doesn't require a data analyst to interpret"* (F-005)

Weak (1–3 findings, Low):
- P13 English-only interface: F-056
- P14 buying advice and distrust of online recommendations: F-006, F-011, F-066
- P15 splitting one order across facilities: F-064
- P16 wanting a basic or off-the-shelf tool: F-022, F-027

## Research gaps

- **Region.** Still no first-person evidence from Lebanon, the GCC or any Arabic speaker. The only countries visible are the UK, the US, South Africa and Argentina.
- **Audience.** Most posters are e-commerce sellers (Shopify, Amazon) or US/UK SMEs. Trading and distribution with imports, our core segment, is thin.
- **No evidence on:**
  - chat-based logging (WhatsApp or Telegram);
  - trust in an AI draft that needs approval;
  - China imports, customs, containers or landed cost (the one finding was dropped as too old);
  - VAT and accountants;
  - working offline;
  - theft and shrinkage.
- **Arabic wording.** We still don't know what Arabic words people use for these problems.
- **Language.** P13 has a single mention, and it is a request for Spanish. Nothing yet confirms that an Arabic interface matters to buyers, even though it is a phase 1 feature.

**Focus for the next round:**
1. **Arabic and Gulf sources first:**
   - Lebanese and GCC business Facebook groups;
   - LinkedIn posts by distributors in Beirut, Dubai and Riyadh;
   - Arabic YouTube comments on inventory and ERP tutorials;
   - Hsoub / Khamsat requests for inventory programs (the file notes these need another way in).
2. **Importers talking about** customs, ETAs and short deliveries.
3. **Anything on logging stock by message** and on trusting AI drafts.

RES-02 and RES-06 (stories) collect our own answers to the same questions. Add them to the inbox as first-party batches.

## Decisions

| Pattern | Decision | New RES ID / existing ID | Reason |
|---|---|---|---|
| P10 several people at once | NEW POST | RES-05 | Nothing in EXISTING shows several people logging at once with one live number; the Bible supports 20 accounts, realtime updates and an immutable ledger |
| Research gaps (chat logging, AI drafts, imports, Arabic wording) | NEW POST | RES-06 (stories) | No evidence at all for these; we collect our own |
| P2 setup + P11 master data + P7 import | NEW POST | RES-07 | D30-25 covers rollout order, UED-05 covers supplier aliases; nothing covers the data to settle before day one. No product claim |
| P4 multi-location + P8 in-between | NEW POST | RES-08 | NOV-01 shows 3 warehouses and D30-26 shows the truck; nothing gets owners to count *every* place stock sits |
| P4 stock lost between locations | EVIDENCE | NOV-07 | "Beirut says it left, Sidon says it never arrived" says it |
| P4 tools that fail with several locations | EVIDENCE | NOV-01 | "Can you see all your warehouses?" says it |
| P3 staff logging correctly | EVIDENCE | D30-06, RES-04 | D30-06 slide 5 is the same fix ("logging that takes seconds"); RES-04 (batch reddit) is the floor team's view |
| P2 too many steps | EVIDENCE | D30-11 | One message → one approval → one move answers "3 clicks to do 1 thing" |
| P5 number ≠ shelf | EVIDENCE | D30-07, DEC-01 | Mismatch (38 vs 41) and on hand vs sellable already covered |
| P8 in-between states | EVIDENCE | D30-26, JAN-02, RES-01 | Stock on the truck, the 5 transfer states, incoming vs on hand |
| P6 spreadsheets break | EVIDENCE | D30-22 | "Better than column AZ" says it |
| P11 same product, many names | EVIDENCE | UED-05 | Supplier aliases is the same problem |
| P12 readable answers | EVIDENCE | D30-05 | Ask "where's the stock?" from the phone |
| P1 price rises + P9 slow support + P7 lock-in | EVIDENCE | EDU-80 | A buyer's evaluation guide is the honest place; the note warns not to promise transparent pricing before phase 3 |
| P7 lock-in | EVIDENCE | EDU-23 | "Who owns my data?"; the note says to confirm full export in the app first |
| P1 as its own post | SKIP | — | Stacko has no pricing plans until phase 3 and only a first-client estimate in the Bible; a pricing post would invite "what's yours?" with no honest answer, or would need competitor names |
| P9 as its own post | SKIP | — | The Bible has an optional support plan but no response-time promise, so we can't claim better support; feature gap GAP-18 |
| P13 Arabic interface | No post (weak) | — | 1 finding, about Spanish. But **no existing post shows Stacko's full Arabic interface** — a phase 1 feature. Worth a post from the Bible alone, outside this research |
| P14, P15, P16 | No action | — | Weak, or out of scope (sales orders across facilities) |

No post was moved later. Week 2 of January (11–15 Jan) had nothing scheduled. If JAN-01 or JAN-02 get dates in that week, move RES-07 (the carousel) to the next free Wednesday.

**4 new posts.** The research is rich, but 11 of its 12 strong patterns are already said by planned posts. Those got 15 evidence notes instead of duplicate posts.

## New posts and variety checks

Rhythm: Mon / Wed / Fri feed posts + Tuesday stories. Each post was checked against the posts before it, including RES-01 to RES-04.

| ID | Date | Format | Recipe ≠ last 4 | Hook type ≠ last 3 | Opener ≠ last 4 | End card ≠ last 2 | First word ≠ last 5 | Visual sources |
|---|---|---|---|---|---|---|---|---|
| RES-05 | 2027-01-11 Mon | Reel 20 s | OK: RC-25 vs 26/16/20/02 | OK: HK-02 vs 11/08/14 | OK: OP-22 vs 23/12/—/06 | OK: EC-11 vs CL-15/EC-10 | OK: "same" | 4: app animation · GFX-01 · dots · logo variant |
| RES-06 | 2027-01-12 Tue | Stories 4 frames | OK: RC-15 vs 16/20/02/25 | OK: HK-01 vs 08/14/02 | OK: OP-04 vs 12/—/06/22 | n/a | OK: "would" | 4: photo PI-05 · iso elements · GFX-01 · LG-10 |
| RES-07 | 2027-01-13 Wed | Carousel 8 slides, dark | OK: RC-18 vs 20/02/25/15 | OK: HK-18 vs 14/02/01 | n/a | OK: CL-15 vs EC-11/— | OK: "how" | 4: photo PI-01 · GFX-10 · iso elements · logo variant |
| RES-08 | 2027-01-15 Fri | Reel 18 s | OK: RC-09 vs 02/25/15/18 | OK: HK-15 vs 02/01/18 | OK: OP-10 vs 06/22/04/— | OK: EC-05 vs —/CL-15 | OK: "if" | 5: iso elements · app animation · dots · GFX-01 · logo variant |

House rules:
- Both reels have a dot moment: RES-05 uses CP-33 + EC-11, RES-08 uses CP-33.
- Transitions are silent; SFX are UI sounds only.
- EN and AR versions are separate files.
- RES-07 uses one theme (dark) on every slide.
- Product reels use real app animations: RES-05 has 5 AN codes, RES-08 has 5.

**Images.** Only images that already exist are used: PI-01 and PI-05 (in `final/`), GFX-01 and GFX-10. No missing PI is needed, and there are no presenters (no clips on disk).

## Claims checked against the Product Bible

| Claim | Post | Bible | Label |
|---|---|---|---|
| Accounts for the whole team (~20 staff) | RES-05 | Roles and audit trail (phase 1) | 🟢 Prototype · demo data |
| Every screen updates the moment someone logs a move | RES-05 | Tech stack: Supabase Realtime | 🟢 |
| Each move is a ledger line with user and time | RES-05 | Transactions table (immutable ledger) | 🟢 |
| Telegram plain-text logging | RES-05 | Telegram bot (phase 1) | 🟢 |
| Live map of every warehouse; transfers with ETA; incoming sea shipments | RES-08 | Features (phase 1) | 🟢, "positions estimated from the ETA" |
| Showroom as a location | RES-08 | Not in the Bible (the map shows warehouses) | Educational point only; no showroom pin on the Stacko map |
| RES-06, RES-07 | — | no product claim | No product claim |

The note from batch `reddit` still applies: the Bible is behind the app. Data import, connected locations (Odoo / ERPNext / WooCommerce), purchase orders and close-short are built but missing from the Bible, so no brief claims them.
