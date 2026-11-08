-- Seed: everything created on 2026-11-06 (status = exported). Safe to re-run.

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('NOV-11','Batch 1 · Content plan',null,'static','dark','en','A4 Numbered hub infographic','Your stock, always in sight.',null,'What Stacko is designed to help you see, across every location you run.',null,'{}',null,'Concept chip and disclaimer removed on request. Footer to update.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('EDU-57','Batch 1 · Content plan',null,'static','light','en','Meme chat (HTML)','Your inventory system is a WhatsApp group.',null,'We''ve all been in this group.',null,'{}',null,'Names WhatsApp in the headline: review against the later "no third-party app branding" rule. Footer to update.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('EDU-49','Batch 1 · Content plan',null,'static','dark','en','A1 Before / After split','From carrying it all, to seeing it all.',null,'Before: spreadsheets, calls, guesswork · With Stacko: one map, every warehouse',null,'{"EDU49-A","SRC-MAP"}',null,'Footer to update.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('BRAND-A','Batch 1 · Brand',null,'static','dark','en','A6 Concept fusion','Know where every box is.',null,'Your stock, always in sight.',null,'{"BRAND-A"}',null,'Also usable as the NOV-01 reel cover. Footer to update.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('NOV-09','Batch 1 · NOV-09 carousel',null,'carousel','dark','en+ar','A7 Diorama map','Five warehouses.','خمس مستودعات.','How do you keep the full picture in view?','[{"n": 1, "headline": "Five warehouses.", "headline_ar": "خمس مستودعات.", "support": "How do you keep the full picture in view?", "image_assets": ["NOV09-A"], "layout": "A7 Diorama map"}, {"n": 2, "headline": "Each location holds a piece of your stock.", "headline_ar": "كل موقع فيه جزء من مخزونك.", "support": "Its own items, counts and people.", "image_assets": ["NOV09-A"], "layout": "A7 Diorama map"}, {"n": 3, "headline": "Which warehouse are we talking about?", "headline_ar": "عن أيّ مستودع عم نحكي؟", "support": "Teams need to know which location they mean.", "image_assets": ["NOV09-A"], "layout": "A7 Diorama map"}, {"n": 4, "headline": "Every transfer links two locations.", "headline_ar": "كل تحويل بيربط موقعين.", "support": "And every link needs someone to coordinate it.", "image_assets": ["NOV09-A"], "layout": "A7 Diorama map"}, {"n": 5, "headline": "One shared picture.", "headline_ar": "صورة وحدة للكل.", "support": "So everyone knows where things are.", "image_assets": ["NOV09-A"], "layout": "A7 Diorama map"}, {"n": 6, "headline": "Stacko puts your locations on one map.", "headline_ar": "ستاكو بيحطّ مواقعك على خريطة وحدة.", "support": "We''re building it now. Here''s an early look.", "image_assets": ["SRC-MAP"], "layout": "Product screenshot"}, {"n": 7, "headline": "What would you want to see first?", "headline_ar": "شو بدّك تشوف أول شي؟", "support": "On a map of all your warehouses. Tell us in the comments.", "image_assets": [], "layout": "Poll A–D"}]'::jsonb,'{"NOV09-A","SRC-MAP"}',null,'Chip numbers are demo figures.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-Just-Ask','Gemini recreations',null,'static','dark','en','A8 Product in scene','Just ask. Stacko knows.',null,'How much do we have, and where?',null,'{"SRC-G1"}',null,'Phone shows question → answer: Beirut 320 · UAE 140 · Tripoli 60. No CTA.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-Notebooks-to-Map','Gemini recreations',null,'static','dark','en','A1 Before / After split','From notebooks to one map.',null,null,null,'{"SRC-G2","SRC-MAP"}',null,'No CTA.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-One-Message','Gemini recreations',null,'static','dark','en','A9 Data-to-physical flow','One message. Truck moving.',null,'Log stock moves from your phone in 10 seconds.',null,'{"SRC-G3"}',null,'Telegram removed. No CTA.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-01-Myths','10-post batch',null,'static','light','en','Myth vs reality list','3 stock myths, busted.',null,'What we hear from warehouse teams, and what''s true.',null,'{}',null,'From content plan EDU-06','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-02-Folder','10-post batch',null,'static','light','en','Meme: file window','Every stock manager has this folder.',null,'Tag the person who made v7.',null,'{}',null,'From EDU-58','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-03-Glossary','10-post batch',null,'static','light','en','Glossary card','Stock transfer (glossary #01)',null,'Moving goods between your locations, and keeping both counts right.',null,'{}',null,'From EDU-42 series','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-04-Audit','10-post batch',null,'static','light','en','Audit-trail card','“Who changed this quantity?”',null,'Every move is saved with who, what, when and where.',null,'{}',null,'From EDU-50','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-05-Poll','10-post batch',null,'static','light','en','Poll A–D','Where does your stock really live?',null,'Answer with a letter in the comments.',null,'{}',null,'From EDU-27','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-06-Numbers','10-post batch',null,'static','dark','en','Big numbers','3 warehouses. 1,200 SKUs. 1 spreadsheet.',null,'Sound familiar?',null,'{}',null,'From EDU-09','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-07-Alerts','10-post batch',null,'static','dark','en','Phone lock screen','Know before the shelf is empty.',null,'Low-stock and mismatch alerts, straight to your phone.',null,'{}',null,'Inspired by Zoho reference','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-08-Branch','10-post batch',null,'static','dark','en','Branch map','Which branch has the last 12 units?',null,'Ask once. See the answer on the map.',null,'{}',null,'From EDU-10; includes Dubai','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-09-Roles','10-post batch',null,'static','dark','en','A4 role grid','4 roles. One clean workflow.',null,'Everyone sees what they need, and every move is traced.',null,'{}',null,'Inspired by Made4net reference','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('STK-10-Shipment','10-post batch',null,'static','dark','en','A3 Route timeline','From Shenzhen to your shelf.',null,'Track every import by sea or air, leg by leg.',null,'{}',null,'Inspired by impargo reference','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('LCH-00','Launch · What/Why/Who/How',null,'carousel','dark','en+ar','A6 Concept cover','Meet Stacko.','تعرّف على ستاكو.','Your stock, always in sight.','[{"n": 1, "headline": "Meet Stacko.", "headline_ar": "تعرّف على ستاكو.", "support": "Your stock, always in sight.", "image_assets": ["LCH-01"], "layout": "A6 Concept cover"}, {"n": 2, "headline": "One live map of your stock.", "headline_ar": "خريطة حيّة لمخزونك.", "support": "Every warehouse, item and shipment, in one view.", "image_assets": ["LCH-02", "SRC-MAP"], "layout": "A8 Product in scene"}, {"n": 3, "headline": "Stock you can''t see costs you.", "headline_ar": "المخزون اللي ما بتشوفه بيكلّفك.", "support": "Missed sales, double orders, boxes nobody can find.", "image_assets": ["LCH-04"], "layout": "Problem scene"}, {"n": 4, "headline": "Traders with more than one warehouse.", "headline_ar": "للتجّار اللي عندهم أكتر من مستودع.", "support": "Distributors and importers in Lebanon and the Gulf.", "image_assets": ["LCH-07"], "layout": "Portrait + checklist"}, {"n": 5, "headline": "One message. Logged in 10 seconds.", "headline_ar": "رسالة وحدة. بتتسجّل بـ10 ثواني.", "support": "Your team logs moves from their phone.", "image_assets": ["LCH-08", "SRC-MAP"], "layout": "Phone conversation"}, {"n": 6, "headline": "Your stock, always in sight.", "headline_ar": "مخزونك، دايماً قدّام عينك.", "support": "How many warehouses do you run?", "image_assets": [], "layout": "Text-led close"}]'::jsonb,'{"LCH-01","LCH-02","LCH-04","LCH-07","LCH-08","SRC-MAP"}','Meet Stacko (ستاكو): one live map for every warehouse, item and shipment you have.

Swipe to see what it is, why we built it, who it''s for and how it works.

How many warehouses or branches do you run?','Post LCH-00 carousel first.','exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHAT-1','Launch · What/Why/Who/How','what','static','light','en+ar','Photo panel + 7 feature chips','Your whole stock operation, on one screen.','كل شغل المخزون، على شاشة وحدة.','7 features listed as chips',null,'{"LCH-02","SRC-MAP"}','What is Stacko? One screen for your whole stock operation:
• A live map of every warehouse
• Transfers with a live ETA
• Imports by sea and air, leg by leg
• Logging from the phone in seconds
• AI that reads supplier invoices
• Low-stock and mismatch alerts
• Arabic and English

Which one would you use first?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHAT-2','Launch · What/Why/Who/How','what','static','dark','en+ar','A9 Data-to-physical flow','Snap the invoice. Stacko creates the items.','صوّر الفاتورة. ستاكو بيعمل الأصناف.','PDF, Excel or a photo. AI reads it for you.',null,'{"LCH-03"}','Typing a 40-line supplier invoice into a system takes an hour. In Stacko, you upload it (PDF, Excel or a photo) and AI creates the items and the incoming shipment for you.

How many invoices do you enter each month?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHY-1','Launch · What/Why/Who/How','why','static','dark','en+ar','Problem scene','Stock you can''t see is money you can''t use.','المخزون اللي ما بتشوفه مصاري واقفة.','Every forgotten box is cash sitting on a shelf.',null,'{"LCH-04"}','Stock you can''t see doesn''t sell. It sits in a corner, gets re-ordered by mistake, or goes missing.

Stacko shows every item in every location, so nothing hides.

When did you last find stock you didn''t know you had?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHY-2','Launch · What/Why/Who/How','why','static','dark','en+ar','Macro scene + ETA tag','Log a move. Watch the truck drive.','سجّل الحركة. وشوف الشاحنة ماشية.','When logging has a payoff, teams actually do it.',null,'{"LCH-05"}','Most stock systems fail for one reason: nobody logs anything.

In Stacko, every move your team logs puts a truck on the map with a live countdown. The map is the reward, so the data stays clean.

Does your team log every move today?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHO-1','Launch · What/Why/Who/How','who','static','dark','en+ar','A2 Network hero + tracker','Import every month? Follow every container.','بتستورد كل شهر؟ تابع كل حاوية.','From the supplier''s port to your shelf, leg by leg.',null,'{"LCH-06"}','If you import from China every month, half your stock is somewhere at sea.

Stacko tracks each shipment by sea or air, leg by leg, and lands it in the right warehouse on arrival.

How many containers do you bring in a year?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('WHO-2','Launch · What/Why/Who/How','who','static','light','en+ar','Photo panel + checklist','Made for businesses with more than one warehouse.','معمول للشركات اللي عندها أكتر من مستودع.','From Beirut to Dubai.',null,'{"LCH-07"}','Stacko is made for trading and distribution businesses that run more than one warehouse or branch, in Lebanon and across the Gulf.

If your stock lives in more than one place, it was built for you.

Where are your warehouses?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('HOW-1','Launch · What/Why/Who/How','how','static','light','en+ar','Phone conversation + 3 steps','How Stacko works, in 3 steps.','كيف بيشتغل ستاكو، بـ3 خطوات.','No training manuals. Just a message.',null,'{"LCH-08","SRC-MAP"}','How does Stacko work?
1. Your team sends a message or a photo: "sent 40 LED strips to Tripoli"
2. Stacko logs it, with who and when
3. The stock moves on the map

About 10 seconds per move.

What would your team log first?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_posts (id,campaign,question,format,theme,languages,layout,headline,headline_ar,support_line,slides,image_assets,caption,design_notes,status,created_at)
values ('HOW-2','Launch · What/Why/Who/How','how','static','light','en+ar','Photo panel + chip flow','Find it. Move it. Sell it.','لاقيه. حرّكه. بيعه.','See stock in another branch, transfer it, and keep the sale.',null,'{"LCH-09"}','"Sorry, it''s out of stock" often means "it''s in our other branch."

With Stacko you see every location at once, move the stock and keep the sale.

How often do you lose a sale to stock in the wrong place?',null,'exported','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('EDU49-A','prompt','Before/After split: same manager stressed with boxes (left) vs calm on a bean bag with a tablet (right)','4:5 vertical','EDU49-A — 4:5 vertical
Subject: the same man shown twice in one split image. Character: Lebanese warehouse manager, early 30s, short dark hair, trimmed beard, light-blue shirt with rolled sleeves, navy trousers, brown shoes. LEFT half: he is stressed, walking and struggling to carry a tall wobbling stack of cardboard boxes and loose papers, a phone buzzing in his shirt pocket. RIGHT half: the same man calm and smiling, sitting relaxed in a soft grey bean bag, holding a tablet facing the camera.
Composition: split down the exact centre by a thin vertical light line; both figures in the lower 60% of the frame; leave the top 35% as clean empty gradient background for text.
Style: soft 3D clay render, Pixar-like, full body, slight low angle, clean studio floor.
Light & colour: cool blue studio gradient from deep navy #0E2440 to #1B416B, soft blue #79C0DE rim light, a subtle teal #2EF2EE glow on the right half only; no orange, yellow or red.
Screens: the tablet screen is blank, evenly lit white, facing the camera.
Avoid: any text, letters, numbers, logos, labels on boxes, watermarks, UI content, extra fingers.','assets/images/EDU49-A.jpg','received','{"EDU-49"}','EDU-49: Full-bleed background; tablet screen replaced with the live map','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('NOV09-A','prompt','Five warehouses on a dark miniature Lebanese coast (diorama) for the NOV-09 carousel','4:5 vertical','NOV09-A — 4:5 vertical
Subject: five small, identical modern warehouse buildings placed far apart on a dark, smooth miniature landscape of Lebanon''s coast, like a tabletop model, with thin empty roads between them and the sea on the left edge.
Composition: buildings spread across the lower 60% of the frame at different depths; leave the top 35% as clean empty dark dusk sky for text.
Style: isometric 3D miniature diorama, slightly tilted top-down view, tilt-shift depth of field.
Light & colour: cool blue dusk, deep navy #0E2440 shadows, soft blue #79C0DE building roofs, faint teal #2EF2EE light from each warehouse door; no orange, yellow or red.
Avoid: any text, letters, numbers, logos, signs, vehicles, people, watermarks.','assets/images/NOV09-A.jpg','received','{"NOV-09 slides 1–5 (EN + AR)"}','NOV-09 slides 1–5 (EN + AR): Background on every slide (full, zoomed in on slide 2, dimmed on slide 3)','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('BRAND-A','prompt','Concept fusion: a map pin built from stacked cardboard boxes','4:5 vertical','BRAND-A — 4:5 vertical
Subject: a large map location pin built entirely from neatly stacked small cardboard boxes, standing on a smooth surface, its tip touching the ground where a soft teal circle of light glows.
Composition: pin centred in the lower 60%; leave the top 35% clean empty background for text.
Style: photoreal 3D product render, studio shot, eye level, sharp focus.
Light & colour: seamless deep navy #0E2440 to #1B416B backdrop, soft blue #79C0DE key light, teal #2EF2EE glow only under the tip; no orange, yellow or red.
Avoid: any text, letters, numbers, logos, tape markings, labels, watermarks.','assets/images/BRAND-A.jpg','received','{"BRAND-A"}','BRAND-A: Full-bleed hero','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-01','prompt','Cube built from cardboard boxes with a glowing core (echoes the Dot core logo)','4:5 vertical','LCH-01 — 4:5 vertical
A large perfect cube built from hundreds of small identical cardboard boxes, floating slightly above a dark glossy floor, with soft teal #2EF2EE light glowing from its centre and leaking through the thin gaps between the boxes. Composition: cube centred in the lower 60% of the frame, slight three-quarter angle so three faces show; leave the top 40% as clean empty dark navy gradient. Style: photoreal 3D product render, studio, eye level. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-01.jpg','received','{"LCH-00-1 (EN + AR)"}','LCH-00-1 (EN + AR): Carousel cover background','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-02','prompt','Laptop with blank screen in an office overlooking a warehouse (real Stacko map placed on screen)','4:5 vertical','LCH-02 — 4:5 vertical
A modern laptop open on a clean desk in a glass-walled office overlooking a large warehouse floor with tall shelves of boxes, the laptop facing the camera with a blank, evenly lit white screen, a coffee cup and a notebook beside it. Composition: laptop in the lower-centre, screen large and straight to camera; warehouse softly blurred behind; leave the top 35% calm (blurred warehouse ceiling). Style: photoreal editorial, 35mm, shallow depth of field. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-02.jpg','received','{"LCH-00-2 (EN + AR)","WHAT-1 (EN + AR)"}','LCH-00-2 (EN + AR): Full-bleed, map on the laptop screen | WHAT-1 (EN + AR): Rounded photo panel, map on the laptop screen','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-03','prompt','Flat lay: blank invoice, phone with blank screen, pen, box (AI invoice reading)','4:5 vertical','LCH-03 — 4:5 vertical
Top-down flat lay on a dark navy desk: a printed supplier invoice sheet with only grey blank lines and boxes (no readable text), a smartphone lying next to it with a blank white screen, a pen, and a small closed cardboard box. Composition: objects grouped in the left half and lower part; leave the right 45% and the top 30% as clean empty desk surface. Style: photoreal flat lay, soft even light. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-03.jpg','received','{"WHAT-2 (EN + AR)"}','WHAT-2 (EN + AR): Full-bleed; chat with invoice placed on the phone screen','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-04','prompt','Forgotten pile of dusty boxes in a dark warehouse corner (hidden stock)','4:5 vertical','LCH-04 — 4:5 vertical
A forgotten pile of dusty cardboard boxes in a dim back corner of a huge warehouse, a single cool spotlight beam falling on them, faint dust in the air, the rest of the warehouse fading into darkness. Composition: boxes in the lower-right third; leave the top 40% as dark empty space. Style: photoreal cinematic, wide angle. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-04.jpg','received','{"LCH-00-3 (EN + AR)","WHY-1 (EN + AR)"}','LCH-00-3 (EN + AR): Full-bleed with chips on the boxes | WHY-1 (EN + AR): Full-bleed with chip and message card','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-05','prompt','Macro: tiny white truck on a glowing teal line across a dark map (logging payoff)','4:5 vertical','LCH-05 — 4:5 vertical
Macro shot of a tiny white delivery truck model driving along a glowing teal #2EF2EE line drawn across a dark navy map surface with faint coastline shapes, small warehouse models in the soft-focus background, bokeh. Composition: truck in the lower-centre, glowing line running from bottom-left to the upper-right; leave the top 35% dark and empty. Style: photoreal macro, tilt-shift, low angle. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-05.jpg','received','{"WHY-2 (EN + AR)"}','WHY-2 (EN + AR): Full-bleed; ETA tag on the truck, log card','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-06','prompt','Container ship being unloaded at Beirut port at blue dusk (importers)','4:5 vertical','LCH-06 — 4:5 vertical
A large container ship being unloaded at Beirut port at blue dusk, gantry cranes above, stacks of containers in navy, teal and white, calm water reflections, city lights faint in the distance. Composition: ship and cranes in the lower 55%; leave the top 40% as clean dusk sky. Style: photoreal editorial, wide angle, slightly elevated view. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-06.jpg','received','{"WHO-1 (EN + AR)"}','WHO-1 (EN + AR): Full-bleed; shipment tracker card on the water','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-07','prompt','Lebanese distribution business owner, arms crossed, in his warehouse aisle','4:5 vertical','LCH-07 — 4:5 vertical
A confident Lebanese distribution business owner, man in his early 40s, short dark hair, trimmed beard, navy blazer over a light-blue shirt, standing with arms crossed in the main aisle of his own warehouse, tall shelves of cardboard boxes on both sides. Composition: he stands in the right third, waist up; leave the left 45% as softly blurred aisle for text. Style: photoreal editorial portrait, 50mm, shallow depth of field, cool natural light. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-07.jpg','received','{"LCH-00-4 (EN + AR)","WHO-2 (EN + AR)"}','LCH-00-4 (EN + AR): Full-bleed with checklist | WHO-2 (EN + AR): Rounded photo panel with checklist','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-08','prompt','Young warehouse worker holding a phone with a blank screen toward the camera','4:5 vertical','LCH-08 — 4:5 vertical
A young Lebanese warehouse worker, man in his mid-20s, navy polo shirt, standing next to a pallet of boxes and holding a smartphone up toward the camera, the phone screen facing the camera, blank and evenly lit white, his face friendly and focused behind it. Composition: phone large in the centre-right, worker slightly out of focus; leave the top 35% calm. Style: photoreal editorial, 35mm, shallow depth of field. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-08.jpg','received','{"LCH-00-5 (EN + AR)","HOW-1 (EN + AR)"}','LCH-00-5 (EN + AR): Full-bleed; Stacko conversation on the phone screen | HOW-1 (EN + AR): Photo panel; conversation on the phone screen','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,aspect,prompt,file_path,status,used_in,usage_notes,created_at)
values ('LCH-09','prompt','Shop counter: salesperson hands a box to a happy customer (keep the sale)','4:5 vertical','LCH-09 — 4:5 vertical
Inside a bright, modern electronics and hardware shop in Beirut, a smiling salesperson behind the counter hands a closed cardboard box to a happy customer, shelves of neatly stacked boxes behind them. Composition: both people in the lower 60%, counter at the bottom; leave the top 35% as calm softly blurred shop ceiling. Style: photoreal editorial, 35mm, natural cool daylight. Style & light: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, teal #2EF2EE accent light only where stated; no orange, yellow or red. Avoid: any text, letters, numbers, logos, labels, signage, watermarks, UI content, extra fingers.','assets/images/LCH-09.jpg','received','{"HOW-2 (EN + AR)"}','HOW-2 (EN + AR): Photo panel with 3-step chip flow','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,prompt,file_path,status,used_in,usage_notes,created_at)
values ('SRC-MAP','source','Screenshot of the Stacko live map (Lebanon view) (Sent by Nabih)',null,'assets/sources/SRC-MAP-livemap.png','received','{"EDU-49 (tablet + map card)","NOV-09 slide 6 (EN + AR)","STK-Notebooks-to-Map (tablet)","LCH-00-2, WHAT-1 (laptop)","LCH-00-5, HOW-1 (map in chat) — EN + AR"}','Only the map area is shown; the SKU list with client item codes was cropped out.','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,prompt,file_path,status,used_in,usage_notes,created_at)
values ('SRC-G1','source','Gemini post "Just ask. Stacko knows." (hand + phone in a warehouse) (Made by Nabih in Gemini)',null,'assets/sources/SRC-G1.jpg','received','{"STK-Just-Ask"}','Only the photo band was kept; phone screen rebuilt as a Stacko conversation; baked text, CTA and footer removed.','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,prompt,file_path,status,used_in,usage_notes,created_at)
values ('SRC-G2','source','Gemini post "From notebooks to one map." (desk split before/after) (Made by Nabih in Gemini)',null,'assets/sources/SRC-G2.jpg','received','{"STK-Notebooks-to-Map"}','Photo panel kept; tablet screen replaced with the real map; CTA removed.','2026-11-06')
on conflict (id) do nothing;

insert into public.stacko_assets (id,kind,description,prompt,file_path,status,used_in,usage_notes,created_at)
values ('SRC-G3','source','Gemini post "One message. Truck moving." (phone → truck → warehouse) (Made by Nabih in Gemini)',null,'assets/sources/SRC-G3.jpg','received','{"STK-One-Message"}','Scene kept; Telegram icon replaced with the Stacko mark; bubble and ETA tag redrawn.','2026-11-06')
on conflict (id) do nothing;
