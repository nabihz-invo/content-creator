"""Undated batch 1 (IDEA-089, 090, 091, 092, 093, 095, 096), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_01.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (L, T_, alertscard, card, chatcard, codescard, dark_car, dark_static, legcard, mapcard, rowscard,  # noqa: E402
                     searchcard)

OB = "/assets/post-images/final/{}.jpg".format


def idea_089():
    for lang in ("en", "ar"):
        dark_static("IDEA-089", "IDEA-089_always-know-where", lang, OB("OB-07"),
                    T_(lang, "Always know<br><em>where it is.</em>", "دايماً بتعرف<br><em>وين هي.</em>"),
                    T_(lang, "Every item, in every location, on one map.", "كل صنف، بكل موقع، على خريطة وحدة."),
                    extra=f'<div class="chipx" style="left:600px;top:780px"><i></i>{T_(lang, "Desk Lamp · 45 · Jounieh", L("Desk Lamp") + " · 45 · جونيه")}</div>',
                    title="always know where")


def idea_090():
    for lang in ("en", "ar"):
        en = lang == "en"
        sl = [(T_(lang, "Give every location<br><em>a code.</em>", "اعطي كل موقع<br><em>رمز.</em>"), codescard(["WH-01", "WH-02", "WH-03", "DXB-01"])),
              (T_(lang, "Log moves when they happen,<br><em>not at the end of the day.</em>", "سجّل الحركة وقت ما تصير،<br><em>مش آخر النهار.</em>"),
               chatcard(T_(lang, "sent 40 LED strips from Beirut to Sidon", f"بعتت 40 {L('LED Strip')} من بيروت لصيدا"), T_(lang, "Logged ✓ · 10:42 AM", "تسجّلت ✓ · 10:42 الصبح"))),
              (T_(lang, "Search<br><em>before you call someone.</em>", "دوّر<br><em>قبل ما تتّصل بحدا.</em>"),
               searchcard(T_(lang, "Desk Lamp", L("Desk Lamp")), [(T_(lang, "WH-04 · Jounieh", f"{L('WH-04')} · جونيه"), "45", ""), (T_(lang, "WH-01 · Beirut", f"{L('WH-01')} · بيروت"), "0", "")])),
              (T_(lang, "Put every location<br><em>on one map.</em>", "حط كل المواقع<br><em>على خريطة وحدة.</em>"), mapcard())]
        dark_car("IDEA-090", "IDEA-090_lost-in-your-warehouse", lang, "OB-07.jpg",
                 (T_(lang, "Lost in your<br><em>own warehouse?</em>", "ضايع<br><em>بمستودعك؟</em>"), T_(lang, "4 fixes that work in any business.", "4 حلول بتزبط بأيّ شغل.")),
                 sl, "lost in your warehouse", kick=T_(lang, "Fix {n} of 4", "حل {n} من 4"))


def idea_091():
    css = """.lbl{position:absolute;display:inline-flex;align-items:center;gap:10px;background:rgba(14,36,64,.85);border:1px solid rgba(46,242,238,.5);
  color:#fff;border-radius:999px;padding:12px 22px;font-size:26px;font-weight:600;white-space:nowrap}
.lbl i{width:10px;height:10px;border-radius:50%;background:var(--glow)}"""
    for lang in ("en", "ar"):
        lb = T_(lang, ["Unlogged moves", "In transit", "Not moved in months"], ["حركات مش مسجّلة", "عالطريق", "ما تحرّكت من أشهر"])
        pos = [(250, 760), (560, 880), (280, 1010)]
        extra = "".join(f'<div class="lbl" style="left:{x}px;top:{y}px"><i></i>{t}</div>' for t, (x, y) in zip(lb, pos))
        dark_static("IDEA-091", "IDEA-091_just-the-tip", lang, OB("OB-08"),
                    T_(lang, "The stock you see<br><em>is just the tip.</em>", "المخزون اللي بتشوفه<br><em>هو بس الراس.</em>"),
                    T_(lang, "Unlogged moves, stock in transit, forgotten boxes:<br>the rest is below.", "حركات مش مسجّلة، بضاعة عالطريق، كراتين منسيّة:<br>الباقي تحت."),
                    extra=extra, css=css, title="just the tip")


def idea_092():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "Stock in another branch<br><em>you didn't check.</em>", "بضاعة بفرع تاني<br><em>ما شيّكت عليه.</em>"),
               rowscard([(T_(lang, "Here · Beirut", "هون · بيروت"), T_(lang, "Desk Lamp", L("Desk Lamp")), "0", "zero"),
                         (T_(lang, "Jounieh", "جونيه"), T_(lang, "Desk Lamp", L("Desk Lamp")), "45", "okc")])),
              (T_(lang, "Moves<br><em>nobody logged.</em>", "حركات<br><em>ما حدا سجّلها.</em>"),
               alertscard(lang, [("mis", T_(lang, "LED Strip 5m · WH-02 · counted 38, system 40", f"{L('LED Strip 5m')} · {L('WH-02')} · انعدّ 38، بالنظام 40"))])),
              (T_(lang, "Containers you forgot<br><em>were coming.</em>", "حاويات نسيت<br><em>إنها جايي.</em>"),
               rowscard([(L("SHP-24035"), T_(lang, "600 × USB-C Cable", L("600 × USB-C Cable")), T_(lang, "Arrives in 2 days", "بتوصل خلال يومين"), "okc")])),
              (T_(lang, "Boxes that haven't moved<br><em>in months.</em>", "كراتين ما تحرّكت<br><em>من أشهر.</em>"),
               rowscard([(L("USB-C Cable 1m"), T_(lang, "WH-04 · Jounieh", f"{L('WH-04')} · جونيه"), T_(lang, "5 months", "من 5 أشهر"), "okc"),
                         (L("Desk Lamp"), T_(lang, "WH-02 · Sidon", f"{L('WH-02')} · صيدا"), T_(lang, "4 months", "من 4 أشهر"), "okc")], T_(lang, "Last move", "آخر حركة"))),
              (T_(lang, "Stacko brings it all<br><em>to the surface.</em>", "ستاكو بيطلّعهن كلّن<br><em>عالسطح.</em>"), mapcard())]
        dark_car("IDEA-092", "IDEA-092_below-the-waterline", lang, "OB-08.jpg",
                 (T_(lang, "What's below<br><em>your waterline?</em>", "شو مخبّى<br><em>تحت المي؟</em>"),
                  T_(lang, "4 costs that never show up in the spreadsheet.", "4 كلف ما بتبيّن أبداً بالجدول.")),
                 sl, "below the waterline", kick=None)


def idea_093():
    for lang in ("en", "ar"):
        dark_static("IDEA-093", "IDEA-093_one-missed-log", lang, OB("OB-09"),
                    T_(lang, "One missed log.<br><em>Ten wrong decisions.</em>", "تسجيل واحد ناقص.<br><em>عشر قرارات غلط.</em>"),
                    T_(lang, "Mismatch alerts stop the chain early.", "تنبيهات الفرق بتوقّف السلسلة بكّير."),
                    extra=f'<div class="chipx" style="left:420px;top:590px"><i style="background:#8A5A00"></i>{T_(lang, "Mismatch alert", "تنبيه فرق")}</div>',
                    title="one missed log")


def idea_095():
    for lang in ("en", "ar"):
        dark_static("IDEA-095", "IDEA-095_always-in-sight-lighthouse", lang, OB("OB-10"),
                    T_(lang, "Your stock,<br><em>always in sight.</em>", "مخزونك<br><em>دايماً قدّام عينك.</em>"),
                    T_(lang, "Even at night. Even across branches.", "حتى بالليل. وحتى بين الفروع."),
                    h_size=T_(lang, 76, 68), sub_top=T_(lang, 380, 410), title="always in sight",
                    css="[dir=rtl] .h1,[dir=rtl] .sub{right:auto;left:64px;width:620px}")


def idea_096():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "Stock in<br><em>every location.</em>", "المخزون<br><em>بكل موقع.</em>"),
               rowscard([(T_(lang, "Beirut", "بيروت"), "WH-01", "2,140", ""), (T_(lang, "Sidon", "صيدا"), "WH-02", "860", ""),
                         (T_(lang, "Tripoli", "طرابلس"), "WH-03", "640", ""), (T_(lang, "Dubai", "دبي"), "DXB-01", "1,720", "")])),
              (T_(lang, "Trucks on the road,<br><em>with ETAs.</em>", "الشاحنات عالطريق،<br><em>مع أوقات الوصول.</em>"),
               rowscard([(T_(lang, "Beirut → Sidon", "بيروت ← صيدا"), T_(lang, "40 × LED Strip 5m", L("40 × LED Strip 5m")), T_(lang, "in 35m", "خلال 35 دقيقة"), "okc"),
                         (T_(lang, "Tripoli → Jounieh", "طرابلس ← جونيه"), T_(lang, "12 × Desk Lamp", L("12 × Desk Lamp")), T_(lang, "in 1h 10m", "خلال ساعة و10"), "okc")])),
              (T_(lang, "Containers at sea,<br><em>leg by leg.</em>", "الحاويات بالبحر،<br><em>مرحلة مرحلة.</em>"),
               legcard(L("SHP-24021"), T_(lang, "Day 24 of ~30", "اليوم 24 من حوالي 30"), [(70, ""), (8, "c"), (6, "t")],
                       T_(lang, ["Shenzhen → Suez → Beirut", "Customs", "Truck"], ["شنتشن ← السويس ← بيروت", "جمرك", "شاحنة"]))),
              (T_(lang, "Low stock and mismatches,<br><em>before they hurt.</em>", "النقص والفروقات،<br><em>قبل ما يوجعوا.</em>"),
               alertscard(lang, [("low", T_(lang, "Desk Lamp · 3 left in Jounieh", f"{L('Desk Lamp')} · باقي 3 بجونيه")),
                                 ("mis", T_(lang, "WH-02 · counted 38, system 40", f"{L('WH-02')} · انعدّ 38، بالنظام 40"))]))]
        dark_car("IDEA-096", "IDEA-096_light-for-every-warehouse", lang, "OB-10.jpg",
                 (T_(lang, "A light for<br><em>every warehouse.</em>", "ضوّ<br><em>لكل مستودع.</em>"), T_(lang, "What Stacko lights up.", "شو ستاكو بيضوّي عليه.")),
                 sl, "light for every warehouse")


if __name__ == "__main__":
    for f in (idea_089, idea_090, idea_091, idea_092, idea_093, idea_095, idea_096):
        f()
    print("ok")
