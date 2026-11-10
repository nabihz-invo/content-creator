# Stacko design rules: review comments and lessons

For the designer. Every comment Nabih has sent so far, grouped into rules to apply to all next posts, followed by the per-post fixes. Apply the rules before sending a post for review.

## 1. Standing rules (apply to every post)

### Brand frame

1. **Logo at the top of every post.** Lockup top-left in English, ستاكو top-right in Arabic. Never only in the footer.
2. **Footer is "A product by AIPHIN" + www.stacko-lb.com.** Carousel slides 1 to n-1 show page dots + "Swipe" instead; the last slide has the full footer.
3. **No CTA buttons on the visual** (no "Try it free", "Book a demo", "احجز اجتماعاً"). If a call to action is needed, use a plain statement about Stacko, or put it in the caption.
4. **No status chips or disclaimers on the image**: no "Concept", "Prototype", "in development", "Demo data", "Illustration" tags, no dot-plus-label chips. They make the post look AI-generated.
5. **Headlines confident, not huge**: 64-76 px with a photo (max 2 lines). 96-112 px only on short cover or text-led slides. One accent phrase per headline.
6. **No third-party app branding** (no Telegram or WhatsApp). Say "from your phone"; the chat avatar is the Stacko mark.
7. **Palette only.** Glow #2EF2EE only on dark and only once per post. No orange, yellow or red outside product-UI alerts.
8. **Deliver editable HTML + PNG.** English first, then Arabic from the same layout.

### Product and device rules

9. **Phones show a real conversation**: a user question, then the Stacko answer with the numbers inside. Never a blank or generic screen.
10. **Tablets and laptops show the real live map.** Use the product screenshot, never client data such as SKU lists.
11. **Labels placed on a photo must sit exactly on the original bubble or shape**, with text centered inside. No ghost edges or baked-in text showing through.
12. **Locations mix Lebanon and the Gulf**: Beirut, Tripoli, Sidon, Jounieh and include UAE / Dubai whenever a list of locations appears. Truck routes stay inside one country.
13. **Only claim what the Product Bible says.** Barcode / QR scanning, GPS and WhatsApp logging are phase 2: do not show them as live. Numbers in UI are sample placeholders and must stay editable.

### Content rules

14. **Educate first, and show Stacko's strength in the same post.** A stranger should see what Stacko does in 3 seconds: a "With Stacko, \<action>" line plus a small product proof (UI card, log row, map thumbnail, status pill).
15. **Problem posts must end with the fix.** Show the same scenario resolved in Stacko and say what the manager gets. Never stop at the pain.
16. **No closing questions** on the last slide or in the caption ("Which one do you ask most?", "Sound familiar?", "Which piece is missing?"). The last slide shows the payoff instead.
17. **Position Stacko clearly**: the stock management system built for several warehouses. Arabic category term: **نظام إدارة المخازن**.
18. **Support lines state what Stacko does**: "With Stacko, \<action>". Do not repeat the headline.
19. **No specific days in copy** (Friday, Thursday). Use "peak week". White Friday is allowed only as the event name in a cover title, unless Nabih asks to remove it (see IDEA-049).
20. **Posts must be clear to people who do not know Stacko.** Under each slide's visual add a short explanation (max about 14 words per line).
21. **Empty or weak slides** get a concrete visual (real UI, spreadsheet screenshot, map, cards). Keep the same position and style across slides so the swipe feels like one story. Do not change slides he called good.
22. **Pick the right format**: definitions, glossaries and lists are carousels, not single static posts.
23. **Engagement polls must be answerable**: give viewers clues so a guess is informed.
24. **Check cropped hands, arms and faces at photo edges.** Cover the cut area with a useful info card, not a decorative shape.
25. **Text-led slides need an illustration** (static table vs live map, a log, a map card), not just a headline on a texture.

### Arabic rules

26. RTL, Noto Kufi headlines, Levantine dialect, mark and photos never mirrored (flip only a photo if its subject would collide with the Arabic text, and never flip text, logo or numbers).
27. **Arabic lines must name the subject**: "الطلبية تسجلت", not a bare verb. Apply it to on-image chat and UI text too.
28. **English and Arabic must say the same thing**: same message, same key nouns, same elements, same chip content. Compare both tabs side by side.
29. Keep codes and Latin terms Latin (WH-01, TRF-24031, ETA 1h 20m, SKU). Use the same numeral style in both versions.
30. Word choices from Nabih: use **اعرف** instead of **افهم**.

## 2. Per-post comments received

| Post | Comment from Nabih | What to apply |
| --- | --- | --- |
| First Gemini posts | Logo missing at top, title too big, phone should show a conversation, remove "try it for free", add footer, replace Sidon with UAE, replace Telegram with a phone | Rules 1, 2, 3, 5, 6, 9, 12 |
| First batch | Remove the dot and its label, remove "Stacko is in development", deliver HTML so he can edit it and save PNG | Rules 4, 8 |
| Launch posts | Every new product's first post answers: what, why, for whom, how. Use images, send prompts to prepare them | Launch posts follow What / Why / Who / How |
| IDEA-049 White Friday | "Remove White Friday, no need for it" | Remove it from headline, chip and caption in both languages; keep a general empty-shelf message. Submitted as a change request |
| GEM-03 One message. Truck moving. | Labels on the image are not centered | Rule 11. Fixed: labels now sit on the original bubbles with centered text ("Sent 40 LED strips to Sidon", "ETA 1h 20m"). New PNG needs re-uploading to the pipeline |
| IDEA-040 Peace of mind is a feature | Left side is empty; add a zoom of the phone showing the Stacko live map | Zoom lens on the empty left with the live map (Beirut, Tripoli, Dubai, truck with ETA), Dolphin outline, no extra Glow |
| IDEA-063 Find the box game | No one will reply: there is no clue, so no one finds it interesting. Change the question so it can be guessed | Rule 23. Three clue cards pointing to one branch (answer C, Tripoli), EN/AR parity, caption updated |
| STK-06 3 warehouses. 1,200 SKUs. 1 spreadsheet. | The post is not clear | Rules 14, 15, 16. Add a Today vs With Stacko pair of cards and a "With Stacko" line; remove "Sound familiar?" |
| EDU-17 Three questions | Good idea but slides 2 to 4 are empty; last slide is good, remove the question and CTA, add that Stacko solves all of them in one map view | Rules 3, 16, 20, 21. Explanation + proof card on slides 2 to 4; last slide headline "Stacko answers all three in one map view" |
| EDU-01 Your stock data is everywhere | Last image: do not use افهم, use اعرف; replace the book-meeting button with a statement about Stacko | Rules 3, 30. Statement: Stacko is the stock management system built for several warehouses, all on one map. Remove "Book a demo" and the "prototype" line from the caption |

## 3. Earlier lessons from Content Pipeline reviews

- **White Friday checklist (IDEA-077):** removed Friday and Thursday, used "peak week", added an explanation under each slide, caption count matched slides (5 became 4).
- **4 missing pieces of stock data (IDEA-069):** educational, with a problem plus a Stacko fix per piece, final slide shows the completed puzzle, question removed.
- **Growing fast? Don't wobble (IDEA-073):** states that Stacko is built for several warehouses; Arabic term نظام إدارة المخازن.
- **Every new branch adds a box to the tower (IDEA-075):** slide 2 added an Excel sheet image, slide 4 more cards, final slide shows Stacko building the map, question removed.
- **Logged before the engine starts (IDEA-042):** Arabic headline needed a subject: "الطلبية تسجلت قبل ما يدوّر المحرّك", same fix in the Stacko reply bubble.
- **The empty spot costs more than the stock (IDEA-046):** Arabic aligned to English and a 3-step Stacko fix panel added.
- **Glossary #02 ETA (IDEA-006):** definition content becomes a carousel with more abbreviations (ETD, SKU, WH, MOQ, PO).
- **From notebook to map (IDEA-070):** support line "With Stacko, move your stock from the notebook to the map"; Arabic photo flipped so the subject sits away from the text.
- **Why we put stock on a map (IDEA-013):** explanatory illustrations on empty slides; last slide shows logging, the truck moving, and the team seeing the ETA.
- **End the "which file is right?" meeting (IDEA-054):** a cropped hand covered by a "The Stacko map" card; closing question removed.
- **Every hour counting is an hour not selling (IDEA-060):** added a "With Stacko" line and a compact UI card.
- **Sound familiar? #4 (IDEA-022):** added the Stacko fix card (port, on the way with ETA, received at WH-01) and a manager line.

## 4. Checklist before sending a post for review

- [ ] Logo at top; footer correct (or dots + Swipe on non-final slides)
- [ ] No CTA button, no concept or demo tag, no third-party app branding, no closing question
- [ ] A stranger can see what Stacko does in 3 seconds: "With Stacko" line + product proof
- [ ] Problem posts end with the fix; slide counts in the caption match the slides
- [ ] No empty slides; no cropped hands or faces; labels centered on their shapes
- [ ] English and Arabic say the same thing, with the same elements and numerals
- [ ] Arabic: RTL, Kufi, Levantine, subjects named, اعرف not افهم
- [ ] No invented numbers or phase 2 features shown as live
