"""Round 4 short reels (12 Nov 2026): IDEA-032 … IDEA-170, one approved image + a product proof + an end card each.
    python -I -X utf8 posts/build_round4_short_reels.py [IDEA-032 ...]
Writes posts/<month or unscheduled>/<ID>_<slug>/reel.html + caption_en/ar.txt + notes.md.
Owner rules: no badges, no Telegram, no comment asks or closing questions; every reel shows Stacko doing the thing.
"""
import sys
from pathlib import Path

POSTS = Path(__file__).resolve().parent

HEAD = """<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    <!-- Round 4 (12 Nov 2026), built by posts/build_round4_short_reels.py. {note} -->
    <script src="/assets/map-elements/stacko-map-elements.js"></script>
    <script src="/studio/engine/sm-core.js"></script>
    <script src="/studio/engine/sm-components.js"></script>
    <script src="/studio/engine/sm-app.js"></script>
    <style>.sm-paper .ex{{display:none}}</style>
  </head>
  <body>
    <script>
      const R = SM.reel({{ title: "{title}" }});
      const T = SM.t, BG = "/assets/graphics/GFX-01_dark-backdrop_9x16.jpg", PI = (c) => `/assets/post-images/final/${{c}}.jpg`;
      const DIR = SM.ar() ? "rtl" : "ltr", FONT = SM.ar() ? "'Noto Kufi Arabic'" : "'Readex Pro'";
      const card = (inner, w = 900) => `<div dir="${{DIR}}" style="width:${{w}}px;background:#fff;border-radius:32px;padding:30px 36px;box-shadow:0 26px 70px rgba(3,9,18,.45);font-family:${{FONT}},sans-serif;color:#0E2440">${{inner}}</div>`;
      const pill = (bg, fg, t) => `<span style="background:${{bg}};color:${{fg}};border-radius:999px;padding:6px 16px;font-size:24px;font-weight:700;flex:none">${{t}}</span>`;
      const row = (a, b, c) => `<div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid #E1EAF0;font-size:31px"><b style="flex:1">${{a}}</b><span style="color:#2C5974">${{b}}</span>${{c || ""}}</div>`;
      const FADE = "background:linear-gradient(180deg,rgba(244,248,250,0) 80%,rgba(244,248,250,.96) 88%,rgba(244,248,250,.96) 100%)";
      const mapLine = (s, en, ar, at) => {{ s.fill(FADE); s.text(T(en, ar), {{ y: 1750, size: 58, fx: "rise", at, w: 980, color: SM.C.abyss, theme: "light" }}); }};

      // ── image + hook ─────────────────────────────────────────────────────────────────
      const a = R.scene({d1}, {{ bg: PI("{img}"), move: "{move}", dim: .3, gradient: true, focus: "{focus}", name: "image" }});
      a.text(T("{h_en}", "{h_ar}"), {{ y: 400, size: 96, fx: "blur", at: .1, w: 980 }});
      a.text(T("{s_en}", "{s_ar}"), {{ y: 1640, size: 46, weight: 600, style: "pill", fx: "pop", at: .9, w: 980 }});
{body}
      R.endcard("{end}", {{ in: "{end_in}", dur: 3.2{end_opt} }});
      R.watermark({{ variant: "white", size: 60, pos: "tr", op: .6, from: .3, to: {wm_to} }});
      R.grain(.03).vignette(.4).safe();
      R.audio({{ music: "/assets/audio/music/{music}", musicVolume: .4, lufs: -14, sfxVolume: .5 }});
      R.cover(1.6);
    </script>
  </body>
</html>
"""

# id: (month, slug, title, img, move, focus, d1, (h_en, h_ar), (s_en, s_ar), body_js, body_dur, end, end_in, end_opt, music, cap_en, cap_ar, note)
REELS = {
    "IDEA-032": ("2027-01", "watch-transfer-land", "IDEA-032 · Watch a transfer land", "SC-01", "push", "50% 60%", 3,
                 ("Watch a transfer *land.*", "شوف التحويل *كيف بيوصل.*"), ("With Stacko, every transfer has a countdown.", "مع ستاكو، كل تحويل إلو عدّ تنازلي."),
                 """
      SM.PT.W4 = [33.846, 35.902]; SM.WH_NAMES.W4 = { code: "WH-04", en: "Zahle", ar: "زحلة", units: 2140 };
      const b = R.scene(7, { in: "zoom-through", name: "map" });
      const m = b.map({ intro: "drop", at: 0, fitH: .5, warehouses: ["W1", "W2", "W3", "W4"] });
      m.header({ y: 330, at: .2 });
      m.truck({ from: "W1", to: "W4", at: .4, dur: 5.8, eta: 80, qty: 40, item: "LED Strip 5m", stock: true, follow: true, followZoom: 1.6, followOffset: [0, 260], toast: true, toastText: T("+40 landed in Zahle ✓", "+40 وصلوا عزحلة ✓") });
      mapLine(b, "Log the move. *Watch it arrive.*", "سجّل الحركة. *وشوفها توصل.*", .8);
""", 7, "dots", "dots", "", "Second_Cup_of_Coffee.mp3",
                 "Log the move. Watch it arrive. That's it.\n\nIn Stacko, every transfer drives on the live map with a countdown, and the stock lands at the other warehouse on arrival.",
                 "سجّل الحركة. وشوفها توصل. وبس.\n\nبستاكو، كل تحويل بيمشي عالخريطة المباشرة مع عدّ تنازلي، والبضاعة بتنضاف عالمستودع التاني لمّا توصل.",
                 "Caption question removed. Zahle added as a demo warehouse (WH-04). Truck positions follow the ETA (no GPS in phase 1)."),
    "IDEA-041": ("2027-02", "pov-11pm-shipment", "IDEA-041 · POV: 11 PM and you remember the shipment", "SC-18", "in", "50% 50%", 3,
                 ("POV: it's 11 PM and you\n*remember the shipment.*", "تخيّل: الساعة 11 بالليل\n*وتذكّرت الشحنة.*"), ("With Stacko, you check the map, not the phone book.", "مع ستاكو، بتشيّك الخريطة، مش دفتر التلفونات."),
                 """
      const b = R.scene(6.4, { in: "zoom-through", name: "map" });
      const m = b.map({ intro: "drop", at: 0, fitH: .5 });
      m.header({ y: 330, at: .2 });
      m.camera(.4, { focus: "W2", zoom: 2.2, dur: 1, offset: [0, 160] });
      m.units("W2", 1.4, 1200); m.pulse("W2", 1.4);
      m.toast(1.6, T("Received ✓ SHP-24021 · 1,200 units · WH-02 Sidon", "تسلّمت ✓ SHP-24021 · 1,200 قطعة · WH-02 صيدا"));
      mapLine(b, "It arrived. *Lamp off.*", "وصلت. *طفّي الضو.*", 2.4);
""", 6.4, "dots", "dots", "", "The_Slowest_Hour.mp3",
                 "The best kind of late-night check: one look at the map, and the shipment is there, received.",
                 "أحلى تشييك آخر الليل: نظرة وحدة عالخريطة، والشحنة هونيك، متسلّمة.",
                 "SC-03 (sofa) is a .jfif the renderer can't load, so SC-18 (night office) is used. Stacko has no 'arrived' notification, so the owner checks the map instead of receiving an alert."),
    "IDEA-058": ("2027-02", "unboxing-container-stacko-way", "IDEA-058 · Unboxing a container, the Stacko way", "SC-08", "push", "50% 55%", 3,
                 ("Unboxing a container,\n*the Stacko way.*", "فتح كونتينر،\n*على طريقة ستاكو.*"), ("With Stacko, the list is ready before the doors open.", "مع ستاكو، اللائحة جاهزة قبل ما تنفتح البواب."),
                 """
      const b = R.scene(6, { in: "zoom-through", bg: BG, name: "list" });
      b.text(T("The list was ready\\n*before the doors opened.*", "اللائحة كانت جاهزة\\n*قبل ما تنفتح البواب.*"), { y: 380, size: 78, fx: "rise", at: .05, w: 980 });
      const items = [[T("LED Strip 5m", "لمبات LED"), "600", pill("#BCE5E0", "#0B7A87", "✓")], [T("Wireless Earbuds", "سمّاعات لاسلكية"), "300", pill("#BCE5E0", "#0B7A87", "✓")],
                     [T("Yoga Mat", "حصيرة يوغا"), "180", pill("#FFF1D6", "#8A5A00", T("New item", "صنف جديد"))], [T("Storage Box", "صندوق تخزين"), "120", pill("#FFF1D6", "#8A5A00", T("New item", "صنف جديد"))]];
      b.html(card(`<div style="font-size:24px;font-weight:600;letter-spacing:.06em;color:#0E8FA0">${T("SHP-24017 · INCOMING SHIPMENT", "SHP-24017 · شحنة واردة")}</div><div class="rows">${items.map(r => row(r[0], r[1], r[2])).join("")}</div>`), { x: 540, y: 1080, w: 900, in: "rise", at: .4 });
      b.text(T("Receive it, and it joins the warehouse.", "استلمها، وبتنضاف عالمستودع."), { y: 1600, size: 46, weight: 600, style: "pill", fx: "pop", at: 2.2, w: 980 });
""", 6, "dots", "dots", "", "Paperback_Pages.mp3",
                 "No crowbar needed. The list was ready before the doors opened.\n\nIn Stacko, the supplier invoice becomes an incoming shipment with every item on it, new ones flagged, so receiving is a check, not a hunt.",
                 "ما في داعي للعتلة. اللائحة كانت جاهزة قبل ما تنفتح البواب.\n\nبستاكو، فاتورة المورّد بتصير شحنة واردة فيها كل الأصناف، والجديدة معلّمة، فالاستلام بيصير تشييك، مش تفتيش.",
                 "Item rows from the demo invoice (LED strip, earbuds, yoga mat, storage box)."),
    "IDEA-072": ("2027-03", "page-became-map", "IDEA-072 · The page that became a map", "OB-05", "in", "50% 50%", 3,
                 ("The page that\n*became a map.*", "الصفحة اللي\n*صارت خريطة.*"), ("With Stacko, move your stock from the notebook to the map.", "مع ستاكو، انقل مخزنك من الدفتر للخريطة."),
                 """
      const b = R.scene(3, { in: "dots", bg: BG, name: "dots" });
      b.dotMorph({ count: 480, y: 980, steps: [{ at: 0, shape: "rain" }, { at: .3, shape: "lebanon", size: 900, dur: 1.4 }] });
      b.text(T("Your notebook, *upgraded.*", "دفترك، *بنسخة أحسن.*"), { y: 330, size: 90, fx: "rise", at: .2 });
      const c = R.scene(5, { in: "zoom-out", name: "map" });
      const m = c.map({ intro: "draw", at: 0, fitH: .5 });
      m.header({ y: 330, at: .4 });
      m.truck({ from: "W1", to: "W3", at: .8, dur: 4, eta: 95, qty: 24, item: "Desk Lamp" });
      mapLine(c, "Every page, *a live location.*", "كل صفحة، *موقع مباشر.*", 1);
""", 8, "dots", "dots", "", "Second_Cup_of_Coffee.mp3",
                 "Your notebook, upgraded.\n\nWith Stacko, every warehouse you used to keep on a page is a live location on one map, with every move logged.",
                 "دفترك، بنسخة أحسن.\n\nمع ستاكو، كل مستودع كنت تكتبه عصفحة صار موقع مباشر عخريطة وحدة، وكل حركة متسجّلة.",
                 "OB-05 notebook → dot map of Lebanon → the live map."),
    "IDEA-094": (None, "stop-the-chain", "IDEA-094 · Stop the chain", "OB-09", "in", "50% 55%", 3,
                 ("Stop *the chain.*", "وقّف *السلسلة.*"), ("With Stacko, an alert comes before the shelf is empty.", "مع ستاكو، التنبيه بيوصل قبل ما يفضى الرف."),
                 """
      const b = R.scene(5.4, { in: "zoom-through", bg: BG, name: "alert" });
      b.text(T("One alert at the right moment\\n*saves a week of fixing.*", "تنبيه واحد بالوقت الصح\\n*بيوفّر أسبوع تصليح.*"), { y: 380, size: 70, fx: "rise", at: .05, w: 980 });
      b.notify({ x: 540, y: 820, w: 900, app: "Stacko", title: T("Low stock", "نقص"), text: T("USB-C Cable · WH-02 Sidon · 3 left", "كابل USB-C · WH-02 صيدا · باقي 3"), at: .5 });
      b.html(card(`${row(T("Missed sale", "بيعة ضايعة"), "", pill("#BCE5E0", "#0B7A87", T("avoided", "ما صارت")))}${row(T("Angry call", "تلفون معصّب"), "", pill("#BCE5E0", "#0B7A87", T("avoided", "ما صار")))}${row(T("Emergency order", "طلبية مستعجلة"), "", pill("#BCE5E0", "#0B7A87", T("avoided", "ما صارت")))}`), { x: 540, y: 1250, w: 900, in: "rise", at: 1.6 });
""", 5.4, "dots", "dots", "", "The_Slowest_Hour.mp3",
                 "One missed log becomes a missed sale, then an angry call, then an emergency order.\n\nIn Stacko, a low-stock alert reaches you before the shelf is empty, and the chain stops at the first box.",
                 "تسجيلة ضايعة بتصير بيعة ضايعة، بعدين تلفون معصّب، بعدين طلبية مستعجلة.\n\nبستاكو، تنبيه النقص بيوصلك قبل ما يفضى الرف، والسلسلة بتوقف عند أوّل كرتونة.",
                 "OB-09 dominoes; low-stock alert (bible: alerts). No date in the plan."),
    "IDEA-108": (None, "message-takes-off", "IDEA-108 · A message takes off", "OB-16", "in", "50% 50%", 3,
                 ("A message that\n*moves stock.*", "رسالة\n*بتحرّك البضاعة.*"), ("With Stacko, a message from the phone is the log.", "مع ستاكو، رسالة من التلفون هيّي التسجيل."),
                 """
      const b = R.scene(3.2, { in: "zoom-through", bg: BG, name: "msg" });
      b.html(card(`<div style="font-size:30px;font-weight:600;color:#0E8FA0">${T("Hadi · Beirut · 09:10", "هادي · بيروت · 09:10")}</div><div style="margin-top:14px;margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:36px;padding:16px 26px;border-radius:26px">${T("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا")}</div><div style="margin-top:14px;font-size:31px;font-weight:600;color:#0B7A87">${T("Logged ✓ approved by Karim", "تسجّلت ✓ وافق كريم")}</div>`), { x: 540, y: 960, w: 900, in: "rise", at: .2 });
      b.sfx("send", .2, .4);
      b.text(T("Type it. *Send it.*", "اكتبها. *ابعتها.*"), { y: 420, size: 96, fx: "rise", at: .05 });
      const c = R.scene(5, { in: "push-up", name: "map" });
      const m = c.map({ intro: "drop", at: 0, fitH: .5 });
      m.header({ y: 330, at: .2 });
      m.truck({ from: "W1", to: "W2", at: .3, dur: 4.4, eta: 35, qty: 40, item: "LED Strip 5m" });
      mapLine(c, "*Watch it arrive.*", "*وشوفها توصل.*", .6);
""", 8.2, "dots", "dots", "", "Paperback_Pages.mp3",
                 "Type it. Send it. Watch it arrive.\n\nIn Stacko, one message from the phone drafts the transfer, a manager approves it, and the truck drives on the map.",
                 "اكتبها. ابعتها. وشوفها توصل.\n\nبستاكو، رسالة وحدة من التلفون بتحضّر التحويل، المدير بيوافق، والشاحنة بتمشي عالخريطة.",
                 "OB-16 paper plane; message card (no app name) → truck on the map. No date in the plan."),
    "IDEA-130": (None, "invoice-becomes-stock", "IDEA-130 · Watch an invoice become stock", "OB-27", "in", "50% 50%", 3,
                 ("Watch an invoice\n*become stock.*", "شوف الفاتورة\n*كيف بتصير بضاعة.*"), ("With Stacko, upload it and the items appear.", "مع ستاكو، ارفعها والأصناف بتطلع."),
                 """
      const b = R.scene(6.4, { in: "zoom-through", bg: BG, name: "invoice" });
      b.text(T("Upload. *Read. Done.*", "ارفع. *انقرت. خلص.*"), { y: 300, size: 90, fx: "rise", at: .05 });
      const inv = b.invoice({ x: 540, y: 760, w: 900, in: "drop", at: .3, rot: -1.5 });
      inv.scan(.9, 1.3);
      inv.draft(2.4, { x: 540, y: 1360, w: 900, code: "SHP-24017", label: T("Incoming shipment · draft", "شحنة واردة · مسودة") });
""", 6.4, "dots", "dots", "", "Second_Cup_of_Coffee.mp3",
                 "Upload. Read. Done.\n\nIn Stacko, AI reads the supplier invoice, creates the incoming shipment with every line on it, and flags new items for you to confirm before anything is recorded.",
                 "ارفع. انقرت. خلص.\n\nبستاكو، الذكاء الاصطناعي بيقرا فاتورة المورّد، بيعمل الشحنة الواردة بكل سطورها، وبيعلّم الأصناف الجديدة لتأكّدها قبل ما يتسجّل شي.",
                 "OB-27 sheet folding into a box; the engine's invoice → draft (EXAMPLE stamp hidden). Light theme in the plan; kept dark like the other reels. No date in the plan."),
    "IDEA-138": (None, "look-again", "IDEA-138 · Look again", "OB-31", "down", "50% 40%", 3.4,
                 ("Look *again.*", "تطلّع *مرّة تانية.*"), ("With Stacko, every box has a place on the map.", "مع ستاكو، كل كرتونة إلها مطرح عالخريطة."),
                 """
      const b = R.scene(5.4, { in: "dots", name: "map" });
      const m = b.map({ intro: "draw", at: 0, fitH: .5 });
      m.header({ y: 330, at: .4 });
      m.select("W1", 1.6); m.select("W1", 3.6, false);
      mapLine(b, "There's more to your stock\\n*than meets the eye.*", "مخزنك فيه أكتر\\n*من اللي بتشوفه.*", .8);
""", 5.4, "dots", "dots", "", "The_Slowest_Hour.mp3",
                 "There's more to your stock than meets the eye.\n\nA pile of boxes tells you nothing. In Stacko, every warehouse on the map shows what it holds, what's low and what's on its way.",
                 "مخزنك فيه أكتر من اللي بتشوفه.\n\nكومة كراتين ما بتقلّك شي. بستاكو، كل مستودع عالخريطة بيورجيك شو فيه، شو ناقص، وشو جايي.",
                 "OB-31 (boxes whose reflection is a map), camera tilts down, then the live map. No date in the plan."),
    "IDEA-142": (None, "stacko-in-15-seconds", "IDEA-142 · Stacko in 15 seconds", "PR-01", "in", "50% 30%", 3,
                 ("Stacko\n*in 15 seconds.*", "ستاكو\n*بـ15 ثانية.*"), ("Every warehouse, item and shipment on one map.", "كل مستودع وصنف وشحنة عخريطة وحدة."),
                 """
      const b = R.scene(9, { in: "zoom-through", name: "map" });
      const m = b.map({ intro: "draw", at: 0, fitH: .5 });
      m.header({ y: 330, at: .3 });
      m.camera(1.4, { focus: "W1", zoom: 2.1, dur: 1, offset: [0, 160] }); m.select("W1", 2); m.select("W1", 3.6, false);
      m.zoomAll(3.8);
      m.truck({ from: "W1", to: "W3", at: 4.2, dur: 4.4, eta: 95, qty: 24, item: "Desk Lamp" });
      m.ship({ at: 4, dur: 4.8, eta: 12 * 1440 });
      mapLine(b, "Live stock, transfers with ETAs,\\n*incoming shipments.*", "الكميّات مباشرة، تحويلات مع وقت الوصول،\\n*وشحنات واردة.*", 1);
""", 9, "dots", "dots", "", "Second_Cup_of_Coffee.mp3",
                 "Every warehouse, item and shipment on one map. Here it is, live.\n\nStacko is the stock management system built for businesses with several warehouses.",
                 "كل مستودع وصنف وشحنة عخريطة وحدة. هيدا هوّي، مباشر.\n\nستاكو هو نظام إدارة المخازن المعمول للشركات اللي عندها أكتر من مستودع.",
                 "PR-01 is used as a host still only (never as a customer or founder). The live map is the engine's recreation of the real UI; replace with a screen recording if one is made. 'Comment MAP' mechanic removed. No date in the plan."),
    "IDEA-143": (None, "feature-15s-how-much-where", "IDEA-143 · How much, and where?", "OB-02", "in", "50% 50%", 3,
                 ("“How much do we have,\n*and where?”*", "«قدّيش عنّا،\n*ووين؟»*"), ("Feature in 15 seconds #1: Ask Stacko.", "ميزة بـ15 ثانية #1: اسأل ستاكو."),
                 """
      const b = R.scene(5.2, { in: "zoom-through", bg: BG, name: "ask" });
      b.html(card(`<div style="margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:36px;padding:16px 26px;border-radius:26px">${T("How many LED strips do we have, and where?", "قدّيش عنّا لمبات LED، ووين؟")}</div>
        <div style="margin-top:18px;font-size:32px;font-weight:600">${T("LED Strip 5m: 1,250 in total", "لمبات LED: 1,250 بالمجموع")}</div>
        ${row("WH-01 · " + T("Beirut", "بيروت"), "380")}${row("WH-02 · " + T("Sidon", "صيدا"), "320")}${row("WH-03 · " + T("Tripoli", "طرابلس"), "550")}${row(T("Incoming", "القادم") + " · SHP-24021", "600", pill("#DCEFFA", "#2F86B8", T("ETA 4 days", "بعد 4 أيام")))}`), { x: 540, y: 1000, w: 900, in: "rise", at: .3 });
      b.text(T("Ask it like you'd ask a colleague.", "اسأله متل ما بتسأل زميلك."), { y: 330, size: 66, fx: "rise", at: .05, w: 980 });
      const c = R.scene(4, { in: "push-up", name: "map" });
      const m = c.map({ intro: "drop", at: 0, fitH: .5 });
      m.header({ y: 330, at: .2 });
      m.pulse("W1", .6); m.pulse("W2", 1.0); m.pulse("W3", 1.4);
      mapLine(c, "The answer, *by location.*", "الجواب، *حسب الموقع.*", .6);
""", 9.2, "dots", "dots", "", "Paperback_Pages.mp3",
                 "Ask it like you'd ask a colleague. Get the answer by location, with what's on the way.\n\nAsk Stacko answers from your own stock records, in Arabic or English.",
                 "اسأله متل ما بتسأل زميلك. بياخدك الجواب حسب الموقع، مع اللي جايي عالطريق.\n\nاسأل ستاكو بيجاوب من سجلّات مخازنك، بالعربي أو بالإنكليزي.",
                 "Series #1 (Ask Stacko, built: app/docs/PLAN.md P3.5). Comment question removed. OB-02 magnifying glass. Demo figures. No date in the plan."),
    "IDEA-170": (None, "how-we-draw-warehouse", "IDEA-170 · How we draw a warehouse", "OB-49", "in", "50% 50%", 2.6,
                 ("How we draw\n*a warehouse.*", "كيف منرسم\n*مستودع.*"), ("Every warehouse on the Stacko map, down to the pallets.", "كل مستودع عخريطة ستاكو، لآخر طبلية."),
                 """
      const b = R.scene(6.4, { in: "dots", bg: BG, name: "build" });
      b.text(T("Piece by piece.", "قطعة قطعة."), { y: 360, size: 90, fx: "rise", at: .05 });
      b.iso({ x: 540, y: 1150, scale: 4.4, intro: "pop", stagger: .45, at: .3, items: [
        { id: "ground", o: { k: "concrete" }, x: -10, y: -10, d: -99 },
        { id: "warehouse", o: { size: "m" }, x: 0, y: -14 },
        { id: "racking", o: {}, x: 72, y: 34 },
        { id: "pallet", o: { levels: 2, wrap: true }, x: 50, y: 50 },
        { id: "forklift", o: {}, x: 34, y: 64 },
        { id: "boxTruck", o: {}, x: -46, y: 58 },
        { id: "tree", o: { k: "olive" }, x: -44, y: -6 },
        { id: "lamp", o: {}, x: 88, y: -8 },
      ] });
      const c = R.scene(4, { in: "zoom-out", name: "map" });
      const m = c.map({ intro: "drop", at: 0, fitH: .5 });
      m.header({ y: 330, at: .2 });
      m.camera(.4, { focus: "W1", zoom: 2.4, dur: 1.2, offset: [0, 160] });
      mapLine(c, "Details matter. *So does your stock.*", "التفاصيل بتفرق. *ومخزنك كمان.*", .8);
""", 10.4, "dots", "dots", "", "Paperback_Pages.mp3",
                 "Every warehouse on the Stacko map is drawn piece by piece, down to the pallets and the forklift.\n\nDetails matter, because it's your stock.",
                 "كل مستودع عخريطة ستاكو انرسم قطعة قطعة، لآخر طبلية ورافعة.\n\nالتفاصيل بتفرق، لأنو هيدا مخزنك.",
                 "The plan asked for a real screen capture of the illustration being built; this is the engine assembling the map-element library pieces instead. OB-49 (warehouse and its twin) as the opener. No date in the plan."),
}


def esc(x):
    return x.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def build(pid):
    (month, slug, title, img, move, focus, d1, h, s, body, bdur, end, end_in, end_opt, music, cap_en, cap_ar, note) = REELS[pid]
    folder = POSTS / (month or "unscheduled") / f"{pid}_{slug}"
    folder.mkdir(parents=True, exist_ok=True)
    html = HEAD.format(title=title, note=note.replace("--", "-"), img=img, move=move, focus=focus, d1=d1, h_en=esc(h[0]), h_ar=esc(h[1]), s_en=esc(s[0]), s_ar=esc(s[1]),
                       body=body, end=end, end_in=end_in, end_opt=end_opt, wm_to=round(d1 + bdur - .3, 1), music=music)
    (folder / "reel.html").write_text(html, encoding="utf8")
    (folder / "caption_en.txt").write_text(cap_en + "\n", encoding="utf8")
    (folder / "caption_ar.txt").write_text(cap_ar + "\n", encoding="utf8")
    (folder / "notes.md").write_text(f"# {pid} · round 4 reel\n\nreel.html written by posts/build_round4_short_reels.py (12 Nov 2026), motion engine.\n\n{note}\n", encoding="utf8")
    print("wrote", folder.relative_to(POSTS))


if __name__ == "__main__":
    for pid in (sys.argv[1:] or REELS):
        build(pid)
