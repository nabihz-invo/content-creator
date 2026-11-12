# Round 4: the 72 ideas at stage "new" (12 Nov 2026)

Owner's request: build HTML content for every idea still at stage "new", respecting all his review notes
(`plans/Stacko design rules review comments and lessons.md`). Everything built is in the CRM for review (stage content).
Send a post again after edits with `node --env-file=workers/.env scripts/html/publish-html.mjs --only <ID>` from
`content-creation/` (add `--brand Aiphin` for AIP-xx). Folder names follow the CRM plan row.

## Builders

| What | Script (from `content/`) |
|---|---|
| Stacko carousels and stories (16) | `python -I -X utf8 posts/build_idea_round4.py --only fn` |
| Stacko reels, hand-written `reel.html` (17) | captions/notes: `python -I -X utf8 posts/round4_reels.py [ID]` |
| Stacko short image reels IDEA-032…170 (11) | `python -I -X utf8 posts/build_round4_short_reels.py [ID]` |
| Aiphin statics and carousels (6) | `node posts/build_aip_round4.mjs [AIP-xx]` |
| Aiphin reels (8) | `node posts/build_aip_round4_reels.mjs [AIP-xx]` |

## Built (58)

- Stacko carousels: DEC-01, D30-06, D30-11, D30-15, D30-20, D30-25, D30-29, RES-03, RES-07, JAN-01, JAN-02, UED-01, UED-05, UED-06
- Stacko stories: D30-04, D30-09
- Stacko reels: RES-01, RES-04, RES-05, RES-08, D30-03, D30-08, D30-14, D30-17, D30-19, D30-21, D30-26, D30-30, UED-02, UED-03, UED-04, UED-07, JAN-03,
  IDEA-032, 041, 058, 072, 094, 108, 130, 138, 142, 143, 170
- Aiphin: AIP-10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24

## Not built (14, need the owner)

| ID | Why |
|---|---|
| IDEA-166 | Founder reel: needs Nabih's own voice and footage |
| IDEA-171 | Team carousel: needs real team photos |
| IDEA-180 | Collab with a customs broker: needs a real partner and their approved words |
| D30-28 | Team milestone: needs a real milestone and photos |
| EDU-18, EDU-33 | Build-in-public weekly facts only the team has; "in development"/pilot wording |
| EDU-34 | "Feature we killed": the user test it describes would be invented |
| EDU-55 | Live / planned / concept status post: status chips are banned; roadmap needs the owner |
| EDU-75 | Referral programme: no reward defined |
| D30-13 | Roadmap vote: phase-2 features plus a vote ask |
| RES-02, RES-06 | Research stories made only of polls and question boxes |
| D30-18, D30-23 | Show the bot's / AI's real test results: need real recordings |

## Checks for the owner

- Dates: D30-25 falls on 25 Dec; JAN-01 placed 2027-01-01; JAN-02/03, UED-xx and IDEA-094…170 have no date in the plan.
- UED-04 / UED-07 show notifications: delivery must be switched on in the live app.
- D30-20 overlaps EDU-45; D30-17 is the third invoice post (space it from D30-08 / IDEA-130).
- Aiphin Arabic is Modern Standard Arabic, needs a native read. AIP-15 plays the Stacko MP4s (IDEA-232, D30-12): render on a PC that has them.
- Missing images the plans asked for were replaced: SC-03.jfif (renderer can't load), Aiphin PR-09…12 and SC-03…05, presenter clips (Karim/Maya), founder footage.
