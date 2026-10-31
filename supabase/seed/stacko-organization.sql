-- P5-T08: the Stacko brand inside the owner's existing "Stacko" workspace.
-- The workspace and its admin are created by the owner, never by this script.
-- Idempotent: never creates a second brand and only rewrites brand_settings
-- when they differ (which bumps settings_version and records history).

do $$
declare
  v_email text := 'nabihzanaty@gmail.com';
  v_user uuid;
  v_ws uuid;
  v_brand uuid;
  v_settings jsonb := $json$
{
  "languages": ["en", "ar"],
  "studio": {
    "engine": "studio-1",
    "languages": ["en", "ar"],
    "sfx_allow": ["pop", "typing", "ding", "check", "tick", "click", "notification", "send", "scan", "marker", "paper", "shutter"],
    "transitions": "music-driven: cuts on the beat, no transition sounds",
    "music_default": "MU-01",
    "music": {
      "MU-01": { "mood": "Calm pulse", "file": "audio/music/Paperback_Pages.mp3", "bpm": 82 },
      "MU-02": { "mood": "Upbeat tech", "file": "audio/music/Second_Cup_of_Coffee.mp3", "bpm": 82 },
      "MU-03": { "mood": "Tension → release", "file": "audio/music/Second_Cup_of_Coffee.mp3", "bpm": 82 },
      "MU-04": { "mood": "Light Levantine percussion", "file": "audio/music/Paperback_Pages.mp3", "bpm": 82, "note": "stand-in until a Levantine track is added" },
      "MU-05": { "mood": "Minimal piano", "file": "audio/music/The_Slowest_Hour.mp3", "bpm": 74 },
      "MU-06": { "mood": "Ambient loop", "file": "audio/music/No_More_Place_To_Be.mp3", "bpm": 82 },
      "MU-07": { "mood": "Comedic pizzicato", "file": "audio/music/Second_Cup_of_Coffee.mp3", "bpm": 82, "note": "stand-in until a comedic track is added" }
    }
  },
  "taglines": { "en": "Your stock, always in sight", "ar": "مخزونك دايماً قدّام عينك" },
  "endorsement": "A product by AIPHIN",
  "voice": {
    "tone": "Clear, practical, confident, a little warm — a calm, competent warehouse manager who loves good data.",
    "personality": "Leads with the pain, then the fix. Concrete scenes over abstractions. AI is the means, not the headline.",
    "do": [
      "Lead with the pain: \"You don't know what's in your warehouses.\" Then the fix.",
      "Concrete scenes: \"40 LED strips on the way from Beirut to Sidon, arriving in 1h 20m.\"",
      "Short sentences, plain words.",
      "Arabic written natively: Levantine for Lebanon, MSA for region-wide pieces; keep AI, Telegram, WhatsApp in Latin script.",
      "Direct, friendly microcopy: \"Logged: 40 × LED Strip, Beirut → Sidon.\""
    ],
    "dont": ["leverage", "seamless", "revolutionary", "game-changer", "world-class", "jargon"]
  },
  "palette": [
    { "name": "Abyss", "hex": "#0E2440", "role": "Main text on light, dark backgrounds" },
    { "name": "Night top", "hex": "#1B416B", "role": "Inner colour of the Night gradient" },
    { "name": "Signal", "hex": "#0895A6", "role": "Accent on light: links, the teal o, active states" },
    { "name": "Glow", "hex": "#2EF2EE", "role": "AI and live signal, on dark only, one thing per layout" },
    { "name": "Ocean", "hex": "#2F86B8", "role": "Primary buttons on light, charts" },
    { "name": "Dolphin", "hex": "#79C0DE", "role": "Secondary blue, illustrations" },
    { "name": "Deep sea", "hex": "#2C5974", "role": "Secondary text on light, borders on dark" },
    { "name": "Visor", "hex": "#C9D8E4", "role": "Dividers, muted text on dark" },
    { "name": "Foam", "hex": "#EEF6F9", "role": "Light backgrounds, cards" },
    { "name": "Paper", "hex": "#F4F8FA", "role": "Page background for light layouts" }
  ],
  "night_gradient": "radial-gradient(120% 90% at 30% 35%, #1B416B 0%, #0E2440 62%)",
  "typography": {
    "heading_font": "Readex Pro",
    "body_font": "Readex Pro",
    "arabic_font": "Noto Kufi Arabic",
    "rules": "Headlines Readex Pro 600 with tight tracking (−0.02 to −0.045em); body Readex Pro 400/600, line height 1.5; Arabic headlines and ستاكو in Noto Kufi Arabic 700, Arabic body ~10% larger; Audiowide only for the word AIPHIN; handwriting (Caveat) only in whiteboard scenes; tabular figures for numbers."
  },
  "logo": {
    "mark": "Dot core: ~150 dots forming an isometric cube split by a Y of routes, glowing core = AI. Never redraw, mirror, rotate, stretch, recolour outside the versions, or put Glow dots on white.",
    "wordmark": "lowercase stacko, Readex Pro 600, teal final o (Glow on dark, Signal on light); Arabic ستاكو in Noto Kufi Arabic 700 with teal و.",
    "versions": {
      "dark": "LG-01 / LG-05 / LG-07 (primary colours: top Glow, left Dolphin, right Ocean, white core)",
      "light": "LG-02 / LG-06 (top Signal, left Ocean, right Abyss, Signal core)",
      "photo": "LG-03 one-colour white",
      "arabic": "LG-08 (ستاكو)"
    }
  },
  "audiences": [
    { "id": "sme-traders", "name": "Trading and distribution SMEs (Lebanon, GCC)", "description": "Several warehouses, frequent imports (often from China), stock spread across locations and spreadsheets." },
    { "id": "ops-managers", "name": "Operations and warehouse managers", "description": "Need to know what is where without calling the team; want transfers logged without extra work." },
    { "id": "owners", "name": "Business owners", "description": "Want one live picture of stock across branches and fewer surprises at stock-count time." }
  ],
  "platform_rules": {
    "instagram_reel": "1080×1920, 30 fps; text and key UI inside y 220–1500, x 60–930; motion in the first 0.5 s, hook readable by 1.5 s; no logo first.",
    "instagram_carousel": "1080×1350; one theme for every slide (all dark or all light); never the same layout on two consecutive slides; one idea per slide; pager dots.",
    "instagram_story": "1080×1920; leave the centre band free for the real Instagram sticker.",
    "youtube": "1920×1080 for long videos and thumbnails.",
    "languages": "Every post is rendered as a separate English and Arabic version from one page; never both languages in one frame, slide, end card or caption file.",
    "sound": "Transitions are music-driven: cuts land on the music beat, no transition sound effects. Only small UI sounds from components (pop, typing, ding, check, tick). Music from the owner's ElevenLabs tracks by MU code."
  },
  "cta": {
    "default": "Book a demo",
    "preferred": ["Book a demo", "See your stock live", "Message us on WhatsApp"],
    "contact": { "whatsapp": "+961 71 313 917", "web": "aiphin.me", "email": "info@aiphin.me" }
  },
  "claims": {
    "permitted": [
      "One live map of every warehouse, item and shipment",
      "Log moves by sending a message (Telegram); a person approves the draft",
      "Invoice → AI draft for review",
      "Low-stock alerts and an audit ledger of every move",
      "English and Arabic (RTL)"
    ],
    "prohibited": [
      "Invented savings, percentages, results, customers, testimonials or quotes",
      "Real customer names, logos or data",
      "GPS tracking (vehicle positions in phase 1 are estimated from the ETA)",
      "Naming specific ERPs as integrations"
    ],
    "requires_verification": [
      "Prices and plans (use [PRICE] until confirmed)",
      "Any number that is not demo data or from the Product Bible",
      "Features marked Planned or Concept"
    ]
  },
  "stage_labels": {
    "prototype": { "en": "Prototype · demo data", "ar": "نموذج أوّلي · بيانات تجريبية" },
    "planned": { "en": "Planned — in build", "ar": "مخطّط · قيد البناء" },
    "concept": { "en": "Concept", "ar": "فكرة" },
    "rule": "Show the stage label on screen whenever a feature is visible."
  },
  "demo_data": {
    "warehouses": [
      { "code": "W1", "en": "Beirut", "ar": "بيروت", "units": 7250 },
      { "code": "W2", "en": "Sidon", "ar": "صيدا", "units": 4980 },
      { "code": "W3", "en": "Tripoli", "ar": "طرابلس", "units": 3120 }
    ],
    "items": ["LED Strip 5m"],
    "note": "Demo data only; always labelled as such on screen."
  }
}
$json$::jsonb;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'No auth user with email % — sign in to the CRM once first', v_email;
  end if;

  select w.id into v_ws
  from public.workspaces w
  join public.workspace_members m on m.workspace_id = w.id and m.user_id = v_user and m.role = 'admin'
  where w.name = 'Stacko'
  limit 1;

  if v_ws is null then
    raise exception 'Workspace "Stacko" with % as admin not found — the owner creates it; this script never does', v_email;
  end if;

  select id into v_brand from public.brands where workspace_id = v_ws and name = 'Stacko';
  if v_brand is null then
    insert into public.brands (workspace_id, name, description, default_language, brand_settings)
    values (v_ws, 'Stacko',
      'Stacko (ستاكو) — AI-assisted live stock management by Aiphin: every warehouse, item and shipment on one live map.',
      'en', v_settings)
    returning id into v_brand;
  else
    update public.brands set brand_settings = v_settings
    where id = v_brand and brand_settings is distinct from v_settings;
  end if;

  raise notice 'Stacko workspace %, brand %, admin %', v_ws, v_brand, v_email;
end
$$;
