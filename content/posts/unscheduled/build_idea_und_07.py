"""Undated batch 7 (IDEA-141, 144–152), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_07.py

Real app screens from assets/screens/app-captures (demo company "Cedar Trading (demo)") on the UI-01 phone and UI-03 tablet.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (BG57, CARD_CSS, DARK_CAR_CSS, EXTRA_CSS, FOOT, L, ROWS_CSS, T_, bar, card, chatcard, dark_car, dark_static,  # noqa: E402
                     light_car, mapcard, name, page, rowscard, top, write)

OB = "/assets/post-images/final/{}.jpg".format
CAP = "/assets/screens/app-captures/{}".format


def phone(src, s=0.9, left=122, top_=330):
    """UI-01 photo scaled by s at (left, top) with a real screen inside (screen in source px: 307.5–632 × 265–955, r 37)."""
    x, y, w, h, r = left + 307.5 * s, top_ + 265 * s, 324.5 * s, 690 * s, 37 * s
    return (f'<img src="{OB("UI-01")}" alt="" style="position:absolute;left:{left}px;top:{top_}px;width:{928 * s:.0f}px">'
            f'<div style="position:absolute;left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h:.0f}px;border-radius:{r:.0f}px;overflow:hidden;background:#fff">'
            f'<img src="{src}" alt="" style="width:100%;display:block"></div>')


# ---------------------------------------------------------------- IDEA-141 · one transfer, start to finish (7 slides, dark)
def idea_141():
    for lang in ("en", "ar"):
        trf = CAP(T_(lang, "en-ph-owner-trf.png", "ar-ph-owner-trf.png"))
        inc = T_(lang, "Incoming · WH-03 Tripoli", "واردة · " + L("WH-03") + " طرابلس")
        css_bg = '<div style="position:absolute;inset:0;background:#081A30"></div>'
        bg58 = '<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="" style="filter:brightness(.45)">'
        cover = (T_(lang, "One transfer,<br><em>start to finish.</em>", "تحويل واحد،<br><em>من الأوّل للآخر.</em>"),
                 T_(lang, "What happens after your driver sends one message.", "شو بيصير بعد ما يبعت الشوفير رسالة وحدة."))
        sl = [(T_(lang, "The driver sends:<br><em>“Sent 40 LED strips to Tripoli.”</em>", f"الشوفير بيبعت:<br><em>«بعتت 40 {L('LED Strip')} لطرابلس.»</em>"),
               chatcard(T_(lang, "Sent 40 LED strips to Tripoli", f"بعتت 40 {L('LED Strip')} لطرابلس"), T_(lang, "Received · reading it…", "وصلت · عم نقراها…"))),
              (T_(lang, "Stacko reads it:<br><em>item, quantity, from, to.</em>", "ستاكو بيقراها:<br><em>الصنف، الكمية، من، ولوين.</em>"),
               rowscard([(T_(lang, "Item", "الصنف"), "", L("LED Strip 5m"), ""), (T_(lang, "Quantity", "الكمية"), "", "40", ""),
                         (T_(lang, "From", "من"), "", T_(lang, "WH-01 · Beirut", f"{L('WH-01')} · بيروت"), ""), (T_(lang, "To", "لـ"), "", T_(lang, "WH-03 · Tripoli", f"{L('WH-03')} · طرابلس"), "okc")])),
              (T_(lang, "Stock is deducted<br><em>at the source.</em>", "المخزون بينقص<br><em>من المصدر.</em>"),
               rowscard([(T_(lang, "WH-01 · Beirut", f"{L('WH-01')} · بيروت"), L("LED Strip 5m"), L("1,380 → 1,340"), "okc")])),
              (T_(lang, "A truck moves on the map<br><em>with a live countdown.</em>", "شاحنة بتمشي عالخريطة<br><em>مع عدّاد مباشر.</em>"),
               mapcard() + f'<div style="position:absolute;left:50%;transform:translateX(-50%);top:1060px;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:14px 24px;font-size:27px;font-weight:600;white-space:nowrap;box-shadow:0 0 0 3px rgba(46,242,238,.6)"><i style="width:12px;height:12px;border-radius:50%;background:var(--signal)"></i>{T_(lang, "Beirut → Tripoli · ETA 1h 30m", "بيروت ← طرابلس · بتوصل خلال ساعة ونص")}</div>'),
              (T_(lang, "Tripoli sees the ETA.<br><em>No calls.</em>", "طرابلس بتشوف وقت الوصول.<br><em>بلا تلفونات.</em>"),
               card(f'<div class="lab">{inc}</div><b class="t">{L("40 × LED Strip 5m")}</b>'
                    f'<div class="t2 okc">{T_(lang, "From Beirut · arrives in 1h 30m", "من بيروت · بتوصل خلال ساعة ونص")}</div>')),
              (T_(lang, "On arrival, the stock lands.<br><em>Every step has a name and a time.</em>", "لمّا توصل، المخزون بينزل.<br><em>وكل خطوة إلها اسم ووقت.</em>"),
               phone(trf, s=0.78, left=170, top_=360))]
        # dark_car with the cover on the phone frame: build via dark_car then swap cover art
        dark_car("IDEA-141", "IDEA-141_one-transfer-start-to-finish", lang, "UI-01.jpg", cover,
                 [(h, c) for h, c in sl], "one transfer", slide_bg=css_bg + bg58)
        # replace the cover's full-bleed photo with the scaled phone + real screen
        folder = Path(__file__).resolve().parent / "IDEA-141_one-transfer-start-to-finish" / "source"
        f = folder / f"{name('IDEA-141', lang, 1)}.html"
        html = f.read_text(encoding="utf-8").replace(f'<img class="bg" src="/assets/post-images/final/UI-01.jpg" alt="">',
                                                       css_bg + phone(trf, s=0.86, left=140, top_=360))
        html = html.replace(".cover .shade-t{height:640px}", ".cover .shade-t{height:0}")
        f.write_text(html, encoding="utf-8")


# ---------------------------------------------------------------- IDEA-144 · questions owners ask us (7 slides, light)
def idea_144():
    for lang in ("en", "ar"):
        qa = T_(lang,
                [("“Does my team need training?”", "If they can send a message, they can log a move."),
                 ("“Does it work in Arabic?”", "Yes. Full Arabic interface, right to left."),
                 ("“What if someone forgets to log?”", "Counts show the mismatch before anyone approves it."),
                 ("“Can I follow my imports from China?”", "Sea and air, leg by leg, until they land."),
                 ("“Do I need GPS on my trucks?”", "No. Trucks move on the map by departure time and ETA. GPS comes later.")],
                [("«فريقي بدّو تدريب؟»", "إذا بيعرفوا يبعتوا رسالة، بيعرفوا يسجّلوا حركة."),
                 ("«بيشتغل بالعربي؟»", "إيه. واجهة عربية كاملة، من اليمين للشمال."),
                 ("«شو إذا حدا نسي يسجّل؟»", "الجرد بيبيّن الفرق قبل ما حدا يوافق عليه."),
                 ("«فيني تابع استيراداتي من الصين؟»", "بحر وجو، مرحلة مرحلة، لحتى توصل."),
                 ("«بدّي GPS عالشاحنات؟»", f"لأ. الشاحنات بتمشي عالخريطة حسب وقت الطلعة والوصول. الـ{L('GPS')} جايي بعدين.")])
        sl = [(q, card(f'<div class="lab">{T_(lang, "Our answer", "جوابنا")}</div><div style="font-size:36px;font-weight:600;line-height:1.35;margin-top:8px">{a}</div>'))
              for q, a in qa]
        sl.append((T_(lang, "Ask yours<br><em>in the comments.</em>", "اسأل سؤالك<br><em>بالكومنت.</em>"), mapcard(), ""))
        light_car("IDEA-144", "IDEA-144_questions-owners-ask", lang, "OB-02.jpg", -250,
                  (T_(lang, "Questions<br><em>owners ask us.</em>", "أسئلة بيسألونا ياها<br><em>أصحاب المصالح.</em>"), T_(lang, "Straight answers.", "أجوبة دغري.")),
                  sl, "FAQ", kick=T_(lang, "Q{n} of 5", "سؤال {n} من 5"))


# ---------------------------------------------------------------- IDEA-145 · spreadsheets, a big ERP, or Stacko? (light, BG-57)
def idea_145():
    css = CARD_CSS + """
.post.light{background:#F4F8FA}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.cols{position:absolute;left:40px;right:40px;top:480px;display:flex;gap:16px}
.col{flex:1;background:#fff;border-radius:26px;padding:26px 22px;box-shadow:0 18px 50px rgba(14,36,64,.15)}
.col.st{box-shadow:0 0 0 3px var(--signal),0 18px 50px rgba(14,36,64,.2)}
.col h3{font-size:30px;color:var(--abyss);margin:0 0 14px}
.col.st h3{color:var(--signal)}
.col p{font-size:24px;line-height:1.35;color:var(--deep);margin:0;padding:12px 0;border-top:1px solid #E1EAF0}
.col p::before{content:"• ";color:var(--visor)}
.col.st p{color:var(--abyss);font-weight:600}.col.st p::before{content:"✓ ";color:#0B7A87}
"""
    T = {"en": dict(h="Spreadsheets, a big ERP,<br><em>or Stacko?</em>", s="Pick the tool that fits the size of your problem.",
                    c=[("Spreadsheets", ["Free to start", "No live picture", "Version chaos"]),
                       ("Big ERP", ["Does everything", "Long setup", "Heavy training"]),
                       ("Stacko", ["Stock, moves and imports on one map", "Logging by message", "Arabic and English"])]),
         "ar": dict(h=f"جداول، ولا {L('ERP')} كبير،<br><em>ولا ستاكو؟</em>", s="اختار الأداة اللي على قدّ مشكلتك.",
                    c=[("الجداول", ["ببلاش بالبداية", "ما في صورة مباشرة", "فوضى نسخ"]),
                       (f"{L('ERP')} كبير", ["بيعمل كل شي", "تركيب طويل", "تدريب تقيل"]),
                       ("ستاكو", ["المخزون والحركات والاستيراد على خريطة وحدة", "التسجيل برسالة", "عربي وإنكليزي"])])}
    for lang, t in T.items():
        cols = "".join(f'<div class="col{" st" if i == 2 else ""}"><h3>{h}</h3>' + "".join(f"<p>{x}</p>" for x in ps) + "</div>" for i, (h, ps) in enumerate(t["c"]))
        body = f"""{BG57}
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="cols" style="top:{470 if lang == 'en' else 500}px">{cols}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-145", lang)
        write("IDEA-145_spreadsheet-erp-or-stacko", nm, page(lang, f"{nm} · comparison", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-146 · Stacko in Arabic (5 slides, light, UI-03 tablet + real AR screens)
def idea_146():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:470px;background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.85) 70%,rgba(244,248,250,0))}
.h1{color:var(--abyss);font-size:60px;line-height:1.12} .sub{color:var(--deep)}
[dir=rtl] .h1{font-size:56px}
.light .bar{color:var(--deep)} .light .bar b{color:var(--abyss)}
.light .dots i{background:rgba(44,89,116,.25)} .light .dots i.on{background:var(--abyss)}
.tab{position:absolute;left:279px;top:430px;width:509px;height:713px;border-radius:12px;overflow:hidden;background:#fff}
.tab img{width:100%;height:100%;object-fit:cover;object-position:50% 0}
.bg{top:0}
"""
    shots = ["ar-ph-owner-map.png", "ar-ph-owner-map.png", "ar-ph-owner-trf.png", "ar-ph-owner-approvals.png", "en-ph-owner-map.png"]
    pos = ["50% 0", "50% 0", "50% 0", "50% 0", "50% 0"]
    T = {"en": [("Stacko<br><em>in Arabic.</em>", "The whole interface, right to left."), ("The map:<br><em>every warehouse and its stock.</em>", ""),
                ("Transfers:<br><em>every move, with its details.</em>", ""), ("Approvals and alerts,<br><em>in Arabic too.</em>", ""),
                ("One tap<br><em>back to English.</em>", "")],
         "ar": [("ستاكو<br><em>بالعربي.</em>", "الواجهة كلّها، من اليمين للشمال."), ("الخريطة:<br><em>كل مستودع وكميته.</em>", ""),
                ("التحويلات:<br><em>كل حركة مع تفاصيلها.</em>", ""), ("الموافقات والتنبيهات،<br><em>كمان بالعربي.</em>", ""),
                ("بكبسة وحدة<br><em>بترجع عالإنكليزي.</em>", "")]}
    for lang, slides in T.items():
        n = len(slides)
        for i, (h, s) in enumerate(slides):
            sub = f'<p class="sub" style="top:{340 if lang == "en" else 370}px">{s}</p>' if s else ""
            body = f"""<img class="bg" src="{OB('UI-03')}" alt="">
<div class="tab"><img src="{CAP(shots[i])}" alt="" style="object-position:{pos[i]}"></div>
<div class="veil"></div>
<h1 class="h1">{h}</h1>
{sub}
{top(lang, light=True)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-146", lang, i + 1)
            write("IDEA-146_stacko-in-arabic", nm, page(lang, f"{nm} · Stacko in Arabic", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-147 · story: your first transfer in 4 taps (BG-61)
def idea_147():
    css = DARK_CAR_CSS + """
.bg{height:1920px}
.top{top:120px}
.kick{top:300px;font-size:24px}
[dir=rtl] .kick{top:290px;font-size:26px}
.h1{top:350px;font-size:88px;line-height:1.06}
[dir=rtl] .h1{top:350px}
[dir=rtl] .h1{font-size:76px;line-height:1.32}
.pc{top:700px;padding:40px 44px}
.pc .bu{font-size:36px;padding:22px 30px}
.pc .ok2{font-size:32px}
.pc b.t{font-size:46px}.pc .t2{font-size:34px}
.shade-b{height:420px}
.foot{bottom:120px}
"""
    T = {"en": dict(k="Your first transfer · {n}/4", f=[
        ("Type it<br><em>like you'd say it.</em>", chatcard("Sent 40 LED strips to Tripoli", "", 700)),
        ("See<br><em>“Logged ✓”.</em>", chatcard("Sent 40 LED strips to Tripoli", "Logged ✓ · 40 × LED Strip 5m · WH-01 → WH-03", 700)),
        ("Watch the truck<br><em>on the map.</em>", mapcard(700)),
        ("Tripoli sees<br><em>the ETA.</em>", card('<div class="lab">Incoming · WH-03 Tripoli</div><b class="t">40 × LED Strip 5m</b><div class="t2 okc">Arrives in 1h 30m</div>', 700))]),
         "ar": dict(k="أوّل تحويل إلك · {n}/4", f=[
        ("اكتبها<br><em>متل ما بتحكيها.</em>", chatcard(f"بعتت 40 {L('LED Strip')} لطرابلس", "", 700)),
        ("شوف<br><em>«تسجّلت ✓».</em>", chatcard(f"بعتت 40 {L('LED Strip')} لطرابلس", f"تسجّلت ✓ · {L('40 × LED Strip 5m')} · {L('WH-01')} ← {L('WH-03')}", 700)),
        ("تابع الشاحنة<br><em>عالخريطة.</em>", mapcard(700)),
        ("طرابلس بتشوف<br><em>وقت الوصول.</em>", card(f'<div class="lab">واردة · {L("WH-03")} طرابلس</div><b class="t">{L("40 × LED Strip 5m")}</b><div class="t2 okc">بتوصل خلال ساعة ونص</div>', 700))])}
    for lang, t in T.items():
        for i, (h, c) in enumerate(t["f"]):
            k = t["k"].format(n=i + 1)
            body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<div class="kick">{k}</div>
<h1 class="h1">{h}</h1>
{c}
{top(lang)}
{FOOT[lang]}"""
            nm = name("IDEA-147", lang, i + 1)
            write("IDEA-147_story-first-transfer-4-taps", nm, page(lang, f"{nm} · first transfer", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-148 · phantom stock (dark, OB-33)
def idea_148():
    for lang in ("en", "ar"):
        dark_static("IDEA-148", "IDEA-148_system-40-shelf-0", lang, OB("OB-33"),
                    T_(lang, "The system says 40.<br><em>The shelf says 0.</em>", "النظام بيقول 40.<br><em>الرفّ بيقول 0.</em>"),
                    T_(lang, "That's phantom stock.", "هيدا المخزون الوهمي."),
                    extra=f'<div class="chipx" style="left:50%;transform:translateX(-50%);top:560px"><i style="background:#8A5A00"></i>{T_(lang, "In system: 40 · On shelf: 0", "بالنظام: 40 · عالرف: 0")}</div>',
                    h_size=T_(lang, 76, 72), sub_top=T_(lang, 380, 420), title="phantom stock")


# ---------------------------------------------------------------- IDEA-149 · where phantom stock comes from (5 slides, dark)
def idea_149():
    for lang in ("en", "ar"):
        fx = T_(lang, "Fix", "الحل")
        causes = T_(lang,
                    [("A transfer<br><em>nobody logged.</em>", "Log by message, in 10 seconds."),
                     ("Receiving without checking<br><em>against the invoice.</em>", "The invoice already created the items."),
                     ("The wrong item<br><em>picked and shipped.</em>", "Counts flag the mismatch."),
                     ("Adjustments<br><em>with no name on them.</em>", "Every change has a name and a time.")],
                    [("تحويل<br><em>ما حدا سجّله.</em>", "سجّل برسالة، بعشر ثواني."),
                     ("استلام بلا ما تقابله<br><em>مع الفاتورة.</em>", "الفاتورة عملت الأصناف من قبل."),
                     ("صنف غلط<br><em>انسحب وانبعت.</em>", "الجرد بيبيّن الفرق."),
                     ("تعديلات<br><em>بلا اسم عليها.</em>", "كل تغيير إلو اسم ووقت.")])
        sl = [(h, card(f'<div class="lab">{fx}</div><div style="font-size:38px;font-weight:600;line-height:1.3;margin-top:6px">{f}</div>')) for h, f in causes]
        dark_car("IDEA-149", "IDEA-149_where-phantom-stock-comes-from", lang, "OB-33.jpg",
                 (T_(lang, "Where phantom stock<br><em>comes from.</em>", "من وين بيجي<br><em>المخزون الوهمي؟</em>"),
                  T_(lang, "4 everyday causes, and the fix for each.", "4 أسباب يومية، والحل لكل واحد.")),
                 sl, "phantom stock causes", kick=T_(lang, "Cause {n} of 4", "سبب {n} من 4"))


def idea_150():
    for lang in ("en", "ar"):
        dark_static("IDEA-150", "IDEA-150_cash-gathering-dust", lang, OB("OB-34"),
                    T_(lang, "How much cash<br><em>is gathering dust?</em>", "قدّيش مصاري<br><em>عم تجمع غبرة؟</em>"),
                    T_(lang, "Stock that hasn't moved in months is money that isn't working.", "المخزون اللي ما تحرّك من أشهر، مصاري مش عم تشتغل."),
                    h_size=T_(lang, 72, 68), title="gathering dust")


def idea_151():
    for lang in ("en", "ar"):
        box = '<span style="display:inline-block;width:150px;height:72px;border:3px dashed var(--visor);border-radius:14px;vertical-align:middle"></span>'
        op = lambda o: f'<span style="font-size:52px;font-weight:700;color:var(--signal);margin:0 14px;vertical-align:middle">{o}</span>'
        f1 = card(f'<div style="direction:ltr;text-align:center">{box}{op("×")}{box}</div><div class="t2" style="text-align:center;margin-top:14px">'
                  f'{T_(lang, "sales lost per day × days out of stock", "المبيعات الضايعة باليوم × أيام النقص")}</div>')
        f2 = card(f'<div style="direction:ltr;text-align:center">{op("×")}{box}</div><div class="t2" style="text-align:center;margin-top:14px">{T_(lang, "your margin", "ربحك")}</div>')
        f3 = card(f'<div style="direction:ltr;text-align:center">{op("+")}{box}</div><div class="t2" style="text-align:center;margin-top:14px">{T_(lang, "customers lost next time", "الزباين اللي بيروحوا لغيرك")}</div>')
        f4 = card(f'<div style="direction:ltr;text-align:center">{op("=")}{box}</div><div class="t2" style="text-align:center;margin-top:14px">{T_(lang, "the real cost", "الكلفة الحقيقية")}</div>')
        sl = [(T_(lang, "Sales lost per day<br><em>× days out of stock.</em>", "المبيعات الضايعة باليوم<br><em>× أيام النقص.</em>"), f1),
              (T_(lang, "× your margin<br><em>on that item.</em>", "× ربحك<br><em>على هالصنف.</em>"), f2),
              (T_(lang, "+ the customers<br><em>who buy elsewhere next time.</em>", "+ الزباين<br><em>اللي بيشتروا من غير محل المرّة الجاية.</em>"), f3),
              (T_(lang, "= the real cost.<br><em>Usually more than the stock itself.</em>", "= الكلفة الحقيقية.<br><em>عادةً أكتر من البضاعة نفسها.</em>"), f4),
              (T_(lang, "Comment COST<br><em>and we'll send you the calculator.</em>", f"اكتب {L('COST')} بالكومنت<br><em>ومنبعتلك الحاسبة.</em>"),
               card(f'<div style="font-size:64px;font-weight:700;text-align:center;color:var(--signal);direction:ltr">COST</div>'), "")]
        light_car("IDEA-151", "IDEA-151_empty-shelf-cost", lang, "OB-37.jpg", -260,
                  (T_(lang, "What does an empty<br><em>shelf cost you?</em>", "قدّيش بيكلّفك<br><em>الرفّ الفاضي؟</em>"),
                   T_(lang, "Do the maths with your own numbers.", "احسبها بأرقامك.")), sl, "empty shelf cost", kick=T_(lang, "Step {n} of 4", "خطوة {n} من 4"))


def idea_152():
    for lang in ("en", "ar"):
        dark_static("IDEA-152", "IDEA-152_cash-that-cant-move", lang, OB("OB-35"),
                    T_(lang, "Stock is cash<br><em>that can't move.</em>", "المخزون هو<br><em>مصاري واقفة.</em>"),
                    T_(lang, "Until you know where it is, and what isn't selling.", "لحتى تعرف وينه، وشو مش عم ينباع."),
                    h_size=T_(lang, 84, 76), sub_top=T_(lang, 400, 430), title="cash that can't move")


if __name__ == "__main__":
    for f in (idea_141, idea_144, idea_145, idea_146, idea_147, idea_148, idea_149, idea_150, idea_151, idea_152):
        f()
    print("ok")
