"""Undated batch 4 (IDEA-115 … 124), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_04.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (L, T_, alertscard, card, chatcard, dark_car, dark_static, light_car, mapcard, rowscard, togglecard)  # noqa: E402
from build_idea_und_03 import light_static  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format


def idea_115():
    for lang in ("en", "ar"):
        mis_lab = T_(lang, "Mismatch · WH-02 Sidon", "فرق · " + L("WH-02") + " صيدا")
        adj = T_(lang, "Adjustment −2 approved by Lina", "تعديل " + L("−2") + " · وافقت لينا")
        sl = [(T_(lang, "Put every location<br><em>on one map.</em>", "حط كل المواقع<br><em>على خريطة وحدة.</em>"), mapcard()),
              (T_(lang, "Log every move<br><em>the day it happens.</em>", "سجّل كل حركة<br><em>بنفس النهار.</em>"),
               chatcard(T_(lang, "received 300 desk lamps at WH-02", f"استلمنا 300 {L('Desk Lamp')} بـ{L('WH-02')}"), T_(lang, "Logged ✓ · today, 9:12 AM", "تسجّلت ✓ · اليوم، 9:12 الصبح"))),
              (T_(lang, "Count a little,<br><em>often.</em>", "اجرد شوي،<br><em>وكتير مرّات.</em>"),
               rowscard([(T_(lang, "Mon", "الاتنين"), T_(lang, "WH-01 · Aisle A", f"{L('WH-01')} · الممر {L('A')}"), T_(lang, "Counted ✓", "انجرد ✓"), "okc"),
                         (T_(lang, "Wed", "الأربعا"), T_(lang, "WH-02 · Aisle C", f"{L('WH-02')} · الممر {L('C')}"), T_(lang, "Counted ✓", "انجرد ✓"), "okc"),
                         (T_(lang, "Fri", "الجمعة"), T_(lang, "WH-03 · Aisle B", f"{L('WH-03')} · الممر {L('B')}"), T_(lang, "Next", "بعدين"), "")])),
              (T_(lang, "Check mismatches<br><em>before approving.</em>", "شيّك الفروقات<br><em>قبل ما توافق.</em>"),
               card(f'<div class="lab">{mis_lab}</div><b class="t">{L("Desk Lamp")}</b>'
                    f'<div class="t2">{T_(lang, "Counted 38 · System 40", "انعدّ 38 · بالنظام 40")}</div>'
                    f'<div class="ok2">✓ {adj}</div>')),
              (T_(lang, "Use the numbers<br><em>in every meeting.</em>", "استعمل الأرقام<br><em>بكل اجتماع.</em>"),
               rowscard([(T_(lang, "Beirut", "بيروت"), "WH-01", "96", ""), (T_(lang, "Sidon", "صيدا"), "WH-02", "71", ""), (T_(lang, "Tripoli", "طرابلس"), "WH-03", "47", "")],
                        T_(lang, "Moves logged this week", "حركات تسجّلت هالجمعة")))]
        light_car("IDEA-115", "IDEA-115_5-steps-cleaner-stock", lang, "OB-20.jpg", -160,
                  (T_(lang, "5 steps to<br><em>cleaner stock.</em>", "5 خطوات<br><em>لمخازن أنضف.</em>"),
                   T_(lang, "Start at the bottom. Climb one step a week.", "ابدأ من تحت. وطلاع درجة كل جمعة.")), sl, "5 steps",
                  kick=T_(lang, "Step {n} of 5", "خطوة {n} من 5"))


def idea_116():
    for lang in ("en", "ar"):
        light_static("IDEA-116", "IDEA-116_next-step-2027", lang, OB("OB-20"),
                     T_(lang, "Your next step<br><em>for 2027?</em>", "شو خطوتك الجاية<br><em>بـ2027؟</em>"),
                     T_(lang, "Pick one habit and climb.", "اختار عادة وحدة وطلاع."), title="next step")


def idea_117():
    for lang in ("en", "ar"):
        dark_static("IDEA-117", "IDEA-117_stacko-is-live", lang, OB("OB-21"),
                    T_(lang, "Stacko<br><em>is live.</em>", "ستاكو<br><em>صار جاهز.</em>"),
                    T_(lang, "Your stock, always in sight.", "مخزنك دايماً قدّام عينك."),
                    h_size=T_(lang, 110, 96), sub_top=T_(lang, 430, 470), title="Stacko is live")


def idea_118():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "A live map<br><em>of every location.</em>", "خريطة مباشرة<br><em>لكل المواقع.</em>"), mapcard()),
              (T_(lang, "Logging from the phone,<br><em>in about 10 seconds.</em>", "التسجيل من التلفون،<br><em>بحوالي 10 ثواني.</em>"),
               chatcard(T_(lang, "sent 40 LED strips from Beirut to Sidon", f"بعتت 40 {L('LED Strip')} من بيروت لصيدا"), T_(lang, "Logged ✓ · on the map", "تسجّلت ✓ · عالخريطة"))),
              (T_(lang, "AI that reads<br><em>supplier invoices.</em>", "ذكاء اصطناعي<br><em>بيقرا فواتير المورّد.</em>"),
               rowscard([(L("LED Strip 5m"), "", "× 1,200", ""), (L("Desk Lamp"), "", "× 300", ""), (T_(lang, "12 items created", "انعملوا 12 صنف"), "", "✓", "okc")],
                        T_(lang, "Supplier invoice · PDF", f"فاتورة المورّد · {L('PDF')}"))),
              (T_(lang, "Arabic and English,<br><em>one tap apart.</em>", "عربي وإنكليزي،<br><em>بكبسة وحدة.</em>"), togglecard(lang))]
        dark_car("IDEA-118", "IDEA-118_ready-for-lift-off", lang, "OB-21.jpg",
                 (T_(lang, "Ready for<br><em>lift-off?</em>", "جاهز<br><em>للإقلاع؟</em>"), T_(lang, "4 things you get on day one.", "4 شغلات بتاخدها من أوّل يوم.")),
                 sl, "lift-off", kick=T_(lang, "Day one · {n} of 4", "من أوّل يوم · {n} من 4"))


def idea_119():
    css = """.ty{position:absolute;font-size:24px;color:#8AA3B5;font-weight:600;background:rgba(255,255,255,.75);border-radius:999px;padding:6px 14px;direction:ltr}
.tl{position:absolute;left:640px;top:880px;display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--abyss);border-radius:999px;padding:12px 22px;
  font-size:27px;font-weight:700;box-shadow:0 0 0 3px rgba(46,242,238,.6),0 12px 30px rgba(14,36,64,.25)}
.tl i{width:12px;height:12px;border-radius:50%;background:var(--signal)}"""
    for lang in ("en", "ar"):
        a, b, c, d = T_(lang, ("calls", "v7.xlsx", "notebook", "one map"), ("تلفونات", "v7.xlsx", "دفتر", "خريطة وحدة"))
        extra = (f'<span class="ty" style="left:90px;top:700px">{a}</span><span class="ty" style="left:330px;top:690px">{b}</span>'
                 f'<span class="ty" style="left:130px;top:1090px">{c}</span><div class="tl"><i></i>{d}</div>')
        light_static("IDEA-119", "IDEA-119_untangle-your-stock", lang, OB("OB-22"),
                     T_(lang, "Untangle<br><em>your stock.</em>", "فكّ عقدة<br><em>مخزنك.</em>"),
                     T_(lang, "Calls, files and chats in. One clear line out.", "تلفونات وملفات ومحادثات بتفوت. وخط واحد واضح بيطلع."),
                     extra=extra, css=css + ".h1{font-size:88px}[dir=rtl] .h1{font-size:76px}", sub_top=T_(lang, 400, 430), title="untangle")


def idea_120():
    for lang in ("en", "ar"):
        light_static("IDEA-120", "IDEA-120_meme-stock-process", lang, OB("OB-22"),
                     T_(lang, "Your stock process,<br><em>honestly:</em>", "عملية المخازن عندك،<br><em>بصراحة:</em>"), "",
                     css=".h1{font-size:84px;line-height:1.08}[dir=rtl] .h1{font-size:76px}", title="meme")


def idea_121():
    for lang in ("en", "ar"):
        dark_static("IDEA-121", "IDEA-121_no-crystal-ball", lang, OB("OB-23"),
                    T_(lang, "No crystal ball<br><em>needed.</em>", "ما في داعي<br><em>للبصّارة.</em>"),
                    T_(lang, "Just a live map of your stock.", "بس خريطة مباشرة لمخزنك."),
                    h_size=T_(lang, 88, 80), sub_top=T_(lang, 400, 440), title="no crystal ball")


def idea_122():
    css = """.abc{position:absolute;left:64px;right:64px;top:1110px;display:flex;gap:14px}
.abc span{flex:1;display:flex;align-items:center;gap:14px;background:rgba(14,36,64,.88);border:1px solid rgba(201,216,228,.35);border-radius:18px;
  padding:16px 18px;font-size:27px;color:#fff;backdrop-filter:blur(6px)}
.abc b{width:46px;height:46px;border-radius:12px;background:#fff;color:var(--abyss);display:grid;place-items:center;font-size:24px;flex:none}
.bg{top:-60px}"""
    for lang in ("en", "ar"):
        o = T_(lang, ["I know", "I guess", "Depends on the day"], ["بعرفه", "بخمّن", "حسب النهار"])
        lt = T_(lang, "ABC", "أبج")
        extra = '<div class="abc">' + "".join(f"<span><b>{lt[i]}</b>{x}</span>" for i, x in enumerate(o)) + "</div>"
        dark_static("IDEA-122", "IDEA-122_guess-or-know-poll", lang, OB("OB-23"),
                    T_(lang, "Do you guess your stock,<br><em>or know it?</em>", "بتخمّن مخزنك،<br><em>ولا بتعرفه؟</em>"), "",
                    extra=extra, css=css, h_size=T_(lang, 70, 66), title="guess or know")


def idea_123():
    for lang in ("en", "ar"):
        dark_static("IDEA-123", "IDEA-123_cash-on-shelves", lang, OB("OB-24"),
                    T_(lang, "Your stock is<br><em>cash on shelves.</em>", "مخزنك هو<br><em>مصاري عالرفوف.</em>"),
                    T_(lang, "Treat it like cash: every move recorded.", "عامله متل المصاري: كل حركة مسجّلة."),
                    extra=f'<div class="chipx" style="left:470px;top:760px"><i></i>{T_(lang, "Every move: who · when", "كل حركة: مين · إيمتى")}</div>',
                    h_size=T_(lang, 84, 76), sub_top=T_(lang, 400, 430), title="cash on shelves")


def idea_124():
    css = """.bg{transform:scale(1.2);transform-origin:70% 55%}
.lg{position:absolute;left:64px;right:64px;top:1000px;background:#fff;border-radius:24px;padding:22px 28px;box-shadow:0 22px 60px rgba(0,0,0,.5);
  display:flex;align-items:center;gap:18px;font-size:27px;color:var(--abyss)}
.lg .av{width:54px;height:54px;border-radius:50%;background:var(--deep);color:#fff;display:grid;place-items:center;font-weight:700;flex:none}
.lg small{display:block;color:#0B7A87;font-weight:600;font-size:23px}"""
    for lang in ("en", "ar"):
        ini, line, sm = T_(lang, ("L", "<b>Lina</b> · adjusted −2 · Desk Lamp · WH-02", "Today 11:05 · approved by Rami"),
                           ("لـ", f"<b>لينا</b> · عدّلت {L('−2')} · {L('Desk Lamp')} · {L('WH-02')}", "اليوم 11:05 · وافق رامي"))
        dark_static("IDEA-124", "IDEA-124_who-moved-it-when", lang, OB("OB-24"),
                    T_(lang, "Who moved it,<br><em>and when?</em>", "مين حرّكها،<br><em>وإيمتى؟</em>"),
                    T_(lang, "Every change has a name and a time.", "كل تغيير إلو اسم ووقت."),
                    extra=f'<div class="lg"><span class="av">{ini}</span><div>{line}<small>{sm}</small></div></div>', css=css,
                    h_size=T_(lang, 88, 80), sub_top=T_(lang, 400, 440), title="who moved it")


if __name__ == "__main__":
    for f in (idea_115, idea_116, idea_117, idea_118, idea_119, idea_120, idea_121, idea_122, idea_123, idea_124):
        f()
    print("ok")
