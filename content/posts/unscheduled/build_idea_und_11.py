"""Undated batch 11 (IDEA-167, 169, 173, 183, 184: carousels), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_11.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import L, T_, alertscard, card, dark_car, mapcard, rowscard  # noqa: E402
from build_idea_und_09 import BG58D, big, text_cover  # noqa: E402


def shrink_cover(folder, pid, px, sub_top):
    """Smaller cover headline + lower support line for long titles. px/sub_top: dict lang -> value."""
    from und_lib import name
    for lang in ("en", "ar"):
        f = Path(__file__).resolve().parent / folder / "source" / f"{name(pid, lang, 1)}.html"
        css = (f"<style>.cover .h1{{font-size:{px[lang]}px!important;line-height:1.14!important}}"
               f".cover .sub{{top:{sub_top[lang]}px!important}}</style>")
        f.write_text(f.read_text(encoding="utf-8").replace("</head>", css + "</head>", 1), encoding="utf-8")


def idea_167():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "New, unrelated products<br><em>from China every month.</em>", "منتجات جديدة ومش مرتبطة<br><em>من الصين كل شهر.</em>"),
               rowscard([(L("Air Cooler 20L"), "", T_(lang, "new", "جديد"), "okc"), (L("Kitchen Scale"), "", T_(lang, "new", "جديد"), "okc"),
                         (L("Rechargeable Lantern"), "", T_(lang, "new", "جديد"), "okc")], T_(lang, "This month's container", "حاوية هالشهر"))),
              (T_(lang, "A team that<br><em>didn't log transfers.</em>", "فريق<br><em>ما كان يسجّل التحويلات.</em>"),
               alertscard(lang, [("mis", T_(lang, "WH-02 · counted 38, system 40", f"{L('WH-02')} · انعدّ 38، بالنظام 40")),
                                 ("mis", T_(lang, "WH-03 · counted 12, system 20", f"{L('WH-03')} · انعدّ 12، بالنظام 20"))])),
              (T_(lang, "So we made logging<br><em>take 10 seconds.</em>", "فعملنا التسجيل<br><em>ياخد 10 ثواني.</em>"), big("10s", T_(lang, "one message from the phone", "رسالة وحدة من التلفون"))),
              (T_(lang, "And made every log<br><em>visible on a map.</em>", "وخلّينا كل تسجيل<br><em>يبيّن عالخريطة.</em>"), mapcard()),
              (T_(lang, "We're building it together.<br><em>More soon.</em>", "عم نبنيه سوا.<br><em>والجايي أكتر.</em>"),
               card(f'<div style="font-size:34px;font-weight:600;line-height:1.4">{T_(lang, "Your stock, always in sight.", "مخزونك دايماً قدّام عينك.")}</div>'))]
        dark_car("IDEA-167", "IDEA-167_how-stacko-started", lang, "SC-08.jpg",
                 (T_(lang, "3 warehouses. Monthly imports.<br><em>No clear picture.</em>", "3 مستودعات. استيراد كل شهر.<br><em>وما في صورة واضحة.</em>"),
                  T_(lang, "How Stacko started, with a real business.", "كيف بلّش ستاكو، مع شغل حقيقي.")), sl, "how Stacko started", slide_bg=BG58D)


def ph(t):
    return f'<div style="border:3px dashed var(--visor);border-radius:16px;padding:26px;font-size:32px;color:var(--deep);text-align:center">{t}</div>'


def idea_169():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "The problem:<br><em>[in their words].</em>", "المشكلة:<br><em>[بكلماتهن].</em>"), card(ph(T_(lang, "[Their problem, in their words]", "[مشكلتهن، بكلماتهن]")))),
              (T_(lang, "What changed:<br><em>[features used].</em>", "شو تغيّر:<br><em>[الميزات اللي استعملوها].</em>"), card(ph(T_(lang, "[Live map · transfers · invoices]", "[الخريطة · التحويلات · الفواتير]")))),
              (T_(lang, "Results:<br><em>[real numbers only].</em>", "النتائج:<br><em>[أرقام حقيقية بس].</em>"), card(ph("[ — ]   [ — ]   [ — ]"))),
              (T_(lang, "“[Real quote,<br><em>with permission]”</em>", "«[اقتباس حقيقي،<br><em>بإذنهن]»</em>"), card(ph(T_(lang, "[Name, role, company]", "[الاسم، الدور، الشركة]"))), "")]
        text_cover("IDEA-169", "IDEA-169_case-study-template", lang,
                   (T_(lang, "How [Company] got every warehouse<br><em>on one map.</em>", "كيف [الشركة] حطّت كل مستودعاتها<br><em>على خريطة وحدة.</em>"),
                    T_(lang, "Problem → what changed → results.", "المشكلة ← شو تغيّر ← النتائج.")),
                   mapcard(520), sl, "case study template")


def dates_card(lang, hl):
    rows = T_(lang, [("Early Jan", "Factories busy, then slowing"), ("6 Feb", "Chinese New Year"), ("~8 Feb", "Ramadan begins")],
              [("أوّل كانون التاني", "المعامل مشغولة، وبعدين بتبطّئ"), ("6 شباط", "رأس السنة الصينية"), ("حوالي 8 شباط", "بداية رمضان")])
    out = "".join(f'<div class="rw2" style="opacity:{1 if hl is None or k == hl else .35}"><b style="min-width:200px">{a}</b><span class="sp">{b}</span></div>'
                  for k, (a, b) in enumerate(rows))
    return card(f'<div class="rws">{out}</div>')


def idea_173():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "Chinese New Year: 6 February 2027.<br><em>Factories slow down before it.</em>", "رأس السنة الصينية: 6 شباط 2027.<br><em>المعامل بتبطّئ قبله.</em>"), dates_card(lang, 1)),
              (T_(lang, "Ramadan starts<br><em>around 8 February.</em>", "رمضان بيبلّش<br><em>حوالي 8 شباط.</em>"), dates_card(lang, 2)),
              (T_(lang, "Sea freight from China:<br><em>about 30 days, plus customs.</em>", "الشحن البحري من الصين:<br><em>حوالي 30 يوم، وزيد الجمرك.</em>"),
               rowscard([(T_(lang, "Sea", "بحر"), T_(lang, "Shenzhen → Beirut", "شنتشن ← بيروت"), T_(lang, "~30 days", "حوالي 30 يوم"), "okc"),
                         (T_(lang, "Customs", "جمرك"), T_(lang, "Port of Beirut", "مرفأ بيروت"), T_(lang, "~2 days", "حوالي يومين"), "okc")])),
              (T_(lang, "So Ramadan stock has to be produced<br><em>before the factories close.</em>", "يعني بضاعة رمضان لازم تتصنّع<br><em>قبل ما تسكّر المعامل.</em>"), dates_card(lang, 0)),
              (T_(lang, "Track every container<br><em>until it lands.</em>", "تابع كل حاوية<br><em>لحتى توصل.</em>"),
               rowscard([(L("SHP-24021"), T_(lang, "Shenzhen → Beirut · at sea", "شنتشن ← بيروت · بالبحر"), T_(lang, "Day 18 of ~30", "اليوم 18 من حوالي 30"), "okc")]))]
        dark_car("IDEA-173", "IDEA-173_ramadan-and-cny-same-week", lang, "OB-40.jpg",
                 (T_(lang, "Ramadan and Chinese New Year,<br><em>in the same week.</em>", "رمضان ورأس السنة الصينية،<br><em>بنفس الأسبوع.</em>"),
                  T_(lang, "A double squeeze on imports in February 2027.", "ضغط مضاعف عالاستيراد بشباط 2027.")), sl, "Ramadan and CNY", slide_bg=BG58D)


def idea_183():
    for lang in ("en", "ar"):
        ev = T_(lang, [("6 Feb", "Chinese New Year", "Factories slow before and after."), ("~8 Feb", "Ramadan begins", "Order Ramadan stock early."),
                       ("15 Apr – 5 May", "Canton Fair, spring", "New products, new SKUs."), ("1–7 Oct", "Golden Week in China", "Plan Q4 orders around it.")],
                [("6 شباط", "رأس السنة الصينية", "المعامل بتبطّئ قبل وبعد."), ("حوالي 8 شباط", "بداية رمضان", "اطلب بضاعة رمضان بكّير."),
                 ("15 نيسان – 5 أيار", "معرض كانتون، الربيع", "منتجات جديدة، أصناف جديدة."), ("1–7 تشرين الأول", "الأسبوع الذهبي بالصين", "خطّط طلبيات آخر السنة حوله.")])
        sl = [(f"{t}<br><em>{d}</em>", card(f'<div style="font-size:72px;font-weight:700;color:var(--signal);line-height:1.1">{dt}</div>')) for dt, t, d in ev]
        sl.append((T_(lang, "Comment CALENDAR<br><em>for the full PDF.</em>", f"اكتب {L('CALENDAR')} بالكومنت<br><em>لتاخد الـ{L('PDF')} كامل.</em>"),
                   card('<div style="font-size:64px;font-weight:700;text-align:center;color:var(--signal);direction:ltr">CALENDAR</div>')))
        dark_car("IDEA-183", "IDEA-183_2027-import-calendar", lang, "OB-40.jpg",
                 (T_(lang, "Your 2027<br><em>import calendar.</em>", "روزنامة الاستيراد<br><em>لـ2027.</em>"), T_(lang, "The dates that move your stock.", "التواريخ اللي بتحرّك مخزونك.")),
                 sl, "import calendar", slide_bg=BG58D)


def idea_184():
    for lang in ("en", "ar"):
        yn = card(f'<div style="display:flex;gap:20px">' + "".join(
            f'<div style="flex:1;display:flex;align-items:center;gap:14px;border:2px solid #E1EAF0;border-radius:18px;padding:18px 22px;font-size:32px;font-weight:600">'
            f'<span style="width:40px;height:40px;border:3px solid var(--signal);border-radius:10px"></span>{x}</div>' for x in T_(lang, ["Yes", "No"], ["إيه", "لأ"])) + "</div>")
        qs = T_(lang, ["Do you know your stock<br><em>in every location today?</em>", "Is every transfer logged<br><em>the same day?</em>",
                       "Do you know what's at sea<br><em>right now?</em>", "Can you say who changed<br><em>any quantity?</em>"],
                ["بتعرف مخزونك بكل موقع<br><em>اليوم؟</em>", "كل تحويل بيتسجّل<br><em>بنفس النهار؟</em>", "بتعرف شو بالبحر<br><em>هلّق؟</em>", "فيك تقول مين غيّر<br><em>أيّ كمية؟</em>"])
        sl = [(q, yn) for q in qs]
        sl.append((T_(lang, "Score under 7?<br><em>Comment CHECK for the full guide.</em>", f"نتيجتك تحت الـ7؟<br><em>اكتب {L('CHECK')} للدليل الكامل.</em>"),
                   card('<div style="font-size:64px;font-weight:700;text-align:center;color:var(--signal);direction:ltr">CHECK</div>'), ""))
        text_cover("IDEA-184", "IDEA-184_stock-health-check", lang,
                   (T_(lang, "Stock health check:<br><em>10 questions.</em>", "فحص صحة المخزون:<br><em>10 أسئلة.</em>"), T_(lang, "Score yourself out of 10.", "قيّم حالك من 10.")),
                   yn.replace('style="top:560px"', 'style="top:520px"'), sl, "health check", kick=T_(lang, "Question {n} of 10", "سؤال {n} من 10"))


if __name__ == "__main__":
    for f in (idea_167, idea_169, idea_173, idea_183, idea_184):
        f()
    shrink_cover("IDEA-167_how-stacko-started", "IDEA-167", {"en": 60, "ar": 54}, {"en": 380, "ar": 420})
    shrink_cover("IDEA-169_case-study-template", "IDEA-169", {"en": 56, "ar": 56}, {"en": 430, "ar": 420})
    shrink_cover("IDEA-173_ramadan-and-cny-same-week", "IDEA-173", {"en": 60, "ar": 56}, {"en": 380, "ar": 420})
    print("ok")
