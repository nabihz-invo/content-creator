-- Aiphin visual library, round 1: image prompts for AIP-01..AIP-11 (AIP-12 not approved).
-- Safe to run again (skips codes that already exist for the brand).
with b as (select id from public.brands where name = 'Aiphin' and archived_at is null limit 1),
base as (select
  'Using the attached image as the exact character reference, keep this same dolphin character identical: same 3D Pixar-like style, same light sky-blue body and white belly, same big blue eyes, same white AR visor with cyan HUD lines, same white headset with glowing cyan ear-light and mic boom, same glass backpack with glowing cyan neural-circuit core, same white belt with cyan chip buckle. Cyan glow only on the tech parts. Change only: '::text as pre,
  ' Same soft studio lighting and render quality. No text, no logos, no watermark. Square 1:1, at least 2048×2048 px, the whole character in frame (fins and tail not cropped) with generous empty margin on every side.'::text as post,
  'text, letters, numbers, logos, watermark, orange, yellow, red, extra fins, changed visor shape, green or brown eyes, missing backpack, missing headset, flat vector style, cropped tail'::text as neg,
  'Attach the master character: content/brands/aiphin/assets/brand/logo/character/aiphin-character-transparent.png'::text as ref)
insert into public.library_items (brand_id, code, kind, status, title, collection, aspect, reference, prompt, negative_prompt, use_for, when_to_use, fits_posts, notes)
select b.id, v.code, 'post_image', 'to_generate', v.title, v.collection, v.aspect, v.ref, v.prompt, v.neg, v.use_for, 'Any time (reusable)', v.fits, v.notes
from b, base, lateral (values
  ('PR-01', 'Aiphin waving hello, big open smile', 'Presenter', '1:1', base.ref,
   base.pre || 'waving hello with his right flipper, big open smile, looking at the viewer. Background: pure white.' || base.post, base.neg,
   'Opening shot of the brand intro reel; any "Hi, I''m Aiphin" moment', 'AIP-01',
   'Pure white background so it can be cut out and placed on the Ocean glow or Night gradients. Check the Look list (visor, eyes, backpack) before uploading.'),
  ('PR-02', 'Aiphin pointing to the side, presenting', 'Presenter', '1:1', base.ref,
   base.pre || 'pointing to the side with his left flipper (toward the viewer''s left), presenting something next to him, confident friendly smile, body in three-quarter view facing left. Background: pure white.' || base.post, base.neg,
   'Presenting service cards, steps or a CTA placed to his left (mirror in HTML for the other side)', 'AIP-01; AIP-07', 'Pure white background for cut-out.'),
  ('PR-03', 'Aiphin thinking, flipper on chin', 'Presenter', '1:1', base.ref,
   base.pre || 'thinking, one flipper on his chin, looking up and to the side, curious calm expression. Background: pure white.' || base.post, base.neg,
   'Question or "do you recognise this?" hooks', 'AIP-02', 'Pure white background for cut-out.'),
  ('PR-04', 'Aiphin holding a smartphone with a chat', 'Presenter', '1:1', base.ref,
   base.pre || 'holding a modern smartphone in both flippers, screen turned toward the viewer, the screen showing a plain generic chat with a few blank message bubbles (no words, no real app logos), happy helpful smile. Background: pure white.' || base.post, base.neg || ', readable words on the phone screen, real app logos',
   'Chatbot and WhatsApp reels, end cards with "Chat with Aiphin"', 'AIP-03',
   'Pure white background for cut-out. The phone screen can be replaced in HTML with the animated chat; keep the screen flat and fully visible.'),
  ('PR-05', 'Aiphin calm smile on dark navy with cyan halo', 'Presenter', '4:5', base.ref,
   base.pre || 'calm, warm closed-mouth smile, floating in three-quarter view facing left, as if quietly listening. Background: plain dark navy #0E2440 with a soft cyan glow halo behind him (subtle, large blur). Place him in the lower-right third of the frame; keep the top 50% and the left side empty dark navy for a headline.' || ' Same soft studio lighting and render quality. No text, no logos, no watermark. Portrait 4:5, at least 1080×1350 px.', base.neg,
   'Point-of-view quote card on the Night background (full-bleed, no cut-out needed)', 'AIP-04',
   'Generated on the final background so it can be used full-bleed. Halo must stay cyan, not white.'),
  ('PR-06', 'Aiphin looking at a holographic chart going up', 'Presenter', '1:1', base.ref,
   base.pre || 'looking with a pleased expression at a floating cyan holographic bar-and-line chart going up, the chart to the left of him, made of glowing cyan lines only (no numbers, no labels). Background: pure white.' || base.post, base.neg,
   'Dashboards, reporting and results moments', 'AIP-06', 'Pure white background for cut-out; the hologram must have no digits.'),
  ('PR-07', 'Aiphin typing on a floating holographic screen', 'Presenter', '1:1', base.ref,
   base.pre || 'typing with both flippers on a floating holographic keyboard, a translucent cyan holographic screen in front of him with abstract interface blocks (no readable text), focused happy expression, three-quarter view facing left. Background: pure white.' || base.post, base.neg,
   '"We build" moments: product, CRM and website build scenes', 'AIP-08', 'Pure white background for cut-out.'),
  ('PR-08', 'Aiphin celebrating with sparkles', 'Presenter', '1:1', base.ref,
   base.pre || 'celebrating with both flippers raised, big joyful smile, small cyan sparkles around him. Background: pure white.' || base.post, base.neg,
   'Results, proof and "done" moments', 'AIP-10; AIP-11', 'Pure white background for cut-out. Sparkles cyan only.'),
  ('SC-01', 'Night city skyline seen from a desk, laptop glowing', 'Scene', '4:5 vertical', null,
   'A laptop open on a clean desk in a dark room at 2am, the laptop screen glowing a soft blank white-blue (no content on it), a large window behind showing a calm city skyline at night with cool blue and white lights, no one in the room. Composition: desk and laptop in the lower 50%, laptop screen facing the viewer slightly angled and fully visible so a website mockup can be placed on it later; top 35% dark sky for text. Style: photoreal, 35 mm, calm and quiet. Light & colour: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, a little teal #2EF2EE glow from the screen; no orange, yellow or red, city lights cool white and blue only. Avoid: any text, letters, numbers, logos, signage, watermarks, UI content, people. Size: at least 1080×1350 px (portrait 4:5).',
   'text, letters, numbers, logos, warm orange street lights, yellow windows, red lights, people, clutter',
   'Cover slide of "What your website does at 2am" (website mockup added on the laptop screen in HTML)', 'AIP-05', 'Theme: Dark'),
  ('SC-02', 'Office worker stuck between three monitors', 'Scene', '4:5 vertical', null,
   'A tired office employee (Middle Eastern, early 30s, business-casual) sitting at a desk between three monitors arranged in a curve around them, one hand on the mouse, the other holding a printed sheet, glancing from one screen to another, a coffee cup and a few papers on the desk, a modern office in the evening. The three monitor screens show soft blank light-blue glows (no content) so screens can be added later. Composition: person and screens in the lower 60%, face clearly visible but not centred to the camera; top 30% calm out-of-focus office wall for text. Style: photoreal, 35 mm, natural and relatable, not staged. Light & colour: cool blue tones, deep navy #0E2440 shadows, soft blue #79C0DE fills, white monitor glow; no orange, yellow or red. Avoid: any text, letters, numbers, logos, UI content on screens, watermarks, extra fingers, distorted hands. Size: at least 1080×1350 px (portrait 4:5).',
   'text, letters, numbers, logos, UI on screens, extra fingers, distorted hands, warm orange light, red, yellow',
   'Cover of "The copy-paste middle" (labels CRM / ERP / Finance added on the screens in HTML)', 'AIP-09', 'Theme: Light-dark mixed')
) as v(code, title, collection, aspect, ref, prompt, neg, use_for, fits, notes)
on conflict (brand_id, code) do nothing;
