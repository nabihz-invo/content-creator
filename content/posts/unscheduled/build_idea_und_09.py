"""Undated batch 9 (IDEA-159 … 165, carousels), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_09.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (BG57, EXTRA_CSS, L, T_, alertscard, card, chatcard, da, dark_car, light_car, mapcard, rowscard)  # noqa: E402

HERE = Path(__file__).resolve().parent
BG58D = '<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="" style="filter:brightness(.45)">'


def big(txt, sub=""):
    return card(f'<div style="font-size:120px;font-weight:700;color:var(--signal);text-align:center;direction:ltr;line-height:1">{txt}</div>'
                + (f'<div class="t2" style="text-align:center;margin-top:10px">{sub}</div>' if sub else ""))


def text_cover(pid, folder, lang, cover, cover_card, slides, title, kick=None):
    """Light carousel whose cover is text + a card (no photo)."""
    h, s = cover
    sl = [("cover", f"""{BG57}<style>{EXTRA_CSS}</style>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>
{cover_card}""")]
    for i, sd in enumerate(slides):
        h, c = sd[0], sd[1]
        kt = sd[2] if len(sd) > 2 else (kick.format(n=i + 1) if kick else "")
        k = f'<div class="kick">{kt}</div>' if kt else ""
        sl.append(("", f"""{BG57}<style>{EXTRA_CSS}</style>
{k}
<h1 class="h1">{h}</h1>
{c}"""))
    da.carousel(pid, folder, lang, sl, title)


# ---------------------------------------------------------------- IDEA-159 · why messages over forms (6 slides, dark)
def idea_159():
    for lang in ("en", "ar"):
        form = card('<div style="display:flex;flex-direction:column;gap:14px">' + "".join(
            f'<div style="height:44px;border:2px solid #E1EAF0;border-radius:12px;width:{w}%"></div>' for w in (100, 80, 100, 60)) +
            f'</div><div style="position:absolute;right:40px;top:40px;transform:rotate(-10deg);border:4px solid #B4233C;color:#B4233C;border-radius:12px;'
            f'padding:6px 18px;font-size:34px;font-weight:800">{T_(lang, "SKIPPED", "انتسى")}</div>')
        msgs = card('<div style="display:flex;flex-direction:column;gap:12px">' + "".join(
            f'<div class="bu" style="font-size:26px;padding:12px 20px">{m}</div>' for m in T_(lang, ["on my way", "sent the invoice", "call me after lunch"],
                                                                                                  ["عالطريق", "بعتت الفاتورة", "اتّصل فيّ بعد الغدا"])) + "</div>")
        parsed = rowscard([(T_(lang, "Item", "الصنف"), "", L("LED Strip 5m"), ""), (T_(lang, "Quantity", "الكمية"), "", "40", ""),
                           (T_(lang, "From", "من"), "", T_(lang, "Beirut", "بيروت"), ""), (T_(lang, "To", "لـ"), "", T_(lang, "Sidon", "صيدا"), "okc")])
        sl = [(T_(lang, "Forms get skipped<br><em>when the day is busy.</em>", "الفورمات بتنتسى<br><em>لمّا النهار عجقة.</em>"), form),
              (T_(lang, "Everyone already sends messages,<br><em>all day.</em>", "الكل بيبعت رسائل،<br><em>طول النهار.</em>"), msgs),
              (T_(lang, "AI reads plain language:<br><em>item, quantity, from, to.</em>", "الذكاء الاصطناعي بيقرا الحكي العادي:<br><em>الصنف، الكمية، من، لوين.</em>"), parsed),
              (T_(lang, "Logging drops<br><em>to about 10 seconds.</em>", "التسجيل بينزل<br><em>لحوالي 10 ثواني.</em>"), big("10s", T_(lang, "per move", "للحركة"))),
              (T_(lang, "When logging is easy,<br><em>the data stays clean.</em>", "لمّا التسجيل سهل،<br><em>البيانات بتضلّ نضيفة.</em>"), mapcard())]
        dark_car("IDEA-159", "IDEA-159_messages-over-forms", lang, "OB-16.jpg",
                 (T_(lang, "Why we chose<br><em>messages over forms.</em>", "ليش اخترنا الرسائل<br><em>بدل الفورمات؟</em>"),
                  T_(lang, "The design decision behind Stacko.", "القرار اللي ورا تصميم ستاكو.")), sl, "messages over forms")


# ---------------------------------------------------------------- IDEA-160 · how Stacko reads a messy message (5 slides, light)
def idea_160():
    msg = "sent 40 led strips beirut to saida"
    for lang in ("en", "ar"):
        sl = [(T_(lang, "The message:", "الرسالة:") + f"<br><em>“{msg}”</em>", chatcard(msg, T_(lang, "No capitals. No item code. Still fine.", "بلا أحرف كبيرة. بلا رمز صنف. وماشي الحال."))),
              (T_(lang, "Item:", "الصنف:") + f"<br><em>{L('LED Strip 5m')}</em>",
               rowscard([("“led strips”", "→", L("LED Strip 5m"), "okc")], T_(lang, "Matched to your catalogue", "انطابق مع أصنافك"))),
              (T_(lang, "Quantity: 40<br><em>From: Beirut · To: Sidon</em>", "الكمية: 40<br><em>من: بيروت · لـ: صيدا</em>"),
               rowscard([("“40”", "→", T_(lang, "Quantity 40", "الكمية 40"), "okc"), ("“beirut”", "→", T_(lang, "From WH-01 Beirut", f"من {L('WH-01')} بيروت"), "okc"),
                         ("“saida”", "→", T_(lang, "To WH-02 Sidon", f"لـ{L('WH-02')} صيدا"), "okc")])),
              (T_(lang, "Logged ✓,<br><em>with who and when.</em>", "تسجّلت ✓،<br><em>مع مين وإيمتى.</em>"),
               rowscard([(T_(lang, "Logged ✓", "تسجّلت ✓"), T_(lang, "Hadi", "هادي"), T_(lang, "Today, 10:42 AM", "اليوم، 10:42 الصبح"), "okc")]))]
        light_car("IDEA-160", "IDEA-160_reads-a-messy-message", lang, "UI-01.jpg", -180,
                  (T_(lang, "How Stacko reads<br><em>a messy message.</em>", "كيف ستاكو بيقرا<br><em>رسالة مش مرتّبة.</em>"),
                   T_(lang, "From a quick text to a clean record.", "من رسالة سريعة لسجل نضيف.")), sl, "messy message")
    for lang in ("en", "ar"):
        from und_lib import name
        f = HERE / "IDEA-160_reads-a-messy-message" / "source" / f"{name('IDEA-160', lang, 1)}.html"
        html = f.read_text(encoding="utf-8")
        bubble = (f'<div style="position:absolute;left:400px;top:740px;width:300px;background:#2F86B8;color:#fff;font-size:24px;line-height:1.3;'
                  f'padding:14px 18px;border-radius:20px 20px 6px 20px;direction:ltr;font-family:\'Readex Pro\'">{msg}</div>')
        f.write_text(html.replace('<h1 class="h1">', bubble + '\n<h1 class="h1">', 1), encoding="utf-8")


# ---------------------------------------------------------------- IDEA-161 · ABC analysis (5 slides, light)
def bars(lang, hl=None):
    rows = [("A", 20, 80), ("B", 30, 15), ("C", 50, 5)]
    out = ""
    for k, (c, it, val) in enumerate(rows):
        op = "1" if hl is None or hl == k else ".35"
        out += (f'<div style="display:flex;align-items:center;gap:16px;margin:12px 0;opacity:{op};direction:ltr">'
                f'<b style="width:52px;height:52px;border-radius:14px;background:var(--abyss);color:#fff;display:grid;place-items:center;font-size:28px">{c}</b>'
                f'<div style="flex:1"><div style="height:16px;border-radius:8px;background:#C9D8E4;width:{it}%"></div>'
                f'<div style="height:16px;border-radius:8px;background:var(--signal);width:{val}%;margin-top:6px"></div></div></div>')
    leg = T_(lang, '<span style="color:#8AA3B5">■</span> share of items &nbsp; <span style="color:var(--signal)">■</span> share of value · typical split',
             '<span style="color:#8AA3B5">■</span> نسبة الأصناف &nbsp; <span style="color:var(--signal)">■</span> نسبة القيمة · التقسيم المعتاد')
    return f'{out}<div class="t2" style="font-size:22px;margin-top:10px">{leg}</div>'


def idea_161():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "A: the few items<br><em>that carry most of your value.</em>", "A: الأصناف القليلة<br><em>اللي فيها أغلب قيمتك.</em>"),
               card(bars(lang, 0) + f'<div class="ok2">{T_(lang, "Count them often · e.g. weekly", "اجردها كتير · مثلاً كل جمعة")}</div>')),
              (T_(lang, "B: the middle.<br><em>Count them regularly.</em>", "B: النص.<br><em>اجردها بانتظام.</em>"),
               card(bars(lang, 1) + f'<div class="ok2">{T_(lang, "e.g. monthly", "مثلاً كل شهر")}</div>')),
              (T_(lang, "C: the many small items.<br><em>Count them less.</em>", "C: الأصناف الصغيرة الكتيرة.<br><em>اجردها أقل.</em>"),
               card(bars(lang, 2) + f'<div class="ok2">{T_(lang, "e.g. every 3 months", "مثلاً كل 3 أشهر")}</div>')),
              (T_(lang, "Start with your top 20 items<br><em>this week.</em>", "ابدأ بأوّل 20 صنف عندك<br><em>هالجمعة.</em>"),
               card(f'<div style="font-size:34px;font-weight:600;line-height:1.4">{T_(lang, "Sort by value. Mark the top 20 as A. Count them first.", "رتّب حسب القيمة. علّم أوّل 20 بـA. واجردهن أوّل شي.")}</div>'), "")]
        text_cover("IDEA-161", "IDEA-161_abc-analysis-60-seconds", lang,
                   (T_(lang, "ABC analysis,<br><em>in 60 seconds.</em>", "تحليل ABC،<br><em>بدقيقة وحدة.</em>"),
                    T_(lang, "Not all stock deserves the same attention.", "مش كل المخزون بيستاهل نفس الانتباه.")),
                   card(bars(lang), 520), sl, "ABC analysis", kick=T_(lang, "Class {n} of 3", "فئة {n} من 3"))


# ---------------------------------------------------------------- IDEA-162 · when should you reorder? (5 slides, light)
def idea_162():
    for lang in ("en", "ar"):
        fbox = lambda t: f'<span style="display:inline-block;background:#EEF4F7;border-radius:12px;padding:10px 16px;font-size:26px;font-weight:600">{t}</span>'
        op = lambda o: f'<span style="font-size:40px;font-weight:700;color:var(--signal);margin:0 10px">{o}</span>'
        formula = card('<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px">'
                       + fbox(T_(lang, "Daily sales", "المبيع اليومي")) + op("×") + fbox(T_(lang, "Lead time", "مدّة التوريد")) + op("+")
                       + fbox(T_(lang, "Safety stock", "مخزون أمان")) + "</div>")
        example = card('<div style="direction:ltr;text-align:center;font-size:52px;font-weight:700;color:var(--abyss)">10 × 35 + 50 = <span style="color:var(--signal)">400</span></div>'
                       f'<div class="t2" style="text-align:center">{T_(lang, "10 a day · 35 days by sea, door to door · 50 extra", "10 باليوم · 35 يوم بالبحر للباب · 50 زيادة")}</div>')
        level = card('<div style="position:relative;height:60px;border-radius:14px;background:linear-gradient(90deg,#FBE3E7,#EEF4F7 40%);direction:ltr">'
                     '<div style="position:absolute;left:40%;top:-10px;bottom:-10px;border-left:4px solid var(--signal)"></div>'
                     '<div style="position:absolute;left:40%;top:70px;transform:translateX(-50%);font-size:26px;font-weight:700;color:var(--signal)">400</div></div>'
                     f'<div class="t2" style="margin-top:50px">{T_(lang, "Stock falls to 400 → the next container should be at sea.", "المخزون نزل لـ400 → الحاوية الجاية لازم تكون بالبحر.")}</div>')
        sl = [(T_(lang, "Daily sales × lead time<br><em>+ safety stock.</em>", "المبيع اليومي × مدّة التوريد<br><em>+ مخزون أمان.</em>"), formula),
              (T_(lang, "Example:<br><em>10 a day × 35 days + 50 = 400.</em>", "مثال:<br><em>10 باليوم × 35 يوم + 50 = 400.</em>"), example),
              (T_(lang, "When you hit 400,<br><em>the next order should already be leaving.</em>", "لمّا توصل لـ400،<br><em>الطلبية الجاية لازم تكون طالعة.</em>"), level),
              (T_(lang, "Stacko's low-stock alerts<br><em>tell you when you reach your minimum.</em>", "تنبيهات النقص بستاكو<br><em>بتخبّرك لمّا توصل للحدّ الأدنى.</em>"),
               alertscard(lang, [("low", T_(lang, "LED Strip 5m · WH-01 · at minimum", f"{L('LED Strip 5m')} · {L('WH-01')} · عالحدّ الأدنى"))]), "")]
        text_cover("IDEA-162", "IDEA-162_when-to-reorder", lang,
                   (T_(lang, "When should<br><em>you reorder?</em>", "إيمتى لازم<br><em>تعيد الطلب؟</em>"),
                    T_(lang, "The reorder point, explained with one import example.", "نقطة إعادة الطلب، بمثال استيراد واحد.")),
                   formula.replace('style="top:560px"', 'style="top:520px"'), sl, "reorder point", kick=T_(lang, "Step {n} of 3", "خطوة {n} من 3"))


# ---------------------------------------------------------------- IDEA-163 · lead time is longer than you think (6 slides, dark)
def legs_card(lang, hl):
    legs = T_(lang, [("Production at the supplier", "varies"), ("Sea · Shenzhen → Beirut", "~30 days"), ("Customs · Port of Beirut", "~2 days"),
                     ("Truck → your warehouse, then receiving", "hours")],
              [("التصنيع عند المورّد", "بيختلف"), ("بحر · شنتشن ← بيروت", "حوالي 30 يوم"), ("جمرك · مرفأ بيروت", "حوالي يومين"),
               ("شاحنة ← مستودعك، وبعدين الاستلام", "ساعات")])
    rows = ""
    for k, (a, b) in enumerate(legs):
        on = hl is None or k == hl
        rows += (f'<div class="rw2" style="opacity:{1 if on else .35}"><span style="width:18px;height:18px;border-radius:50%;flex:none;'
                 f'background:{"var(--signal)" if on else "#C9D8E4"}"></span><b>{a}</b><span class="sp"></span><span class="okc">{b}</span></div>')
    return card(f'<div class="rws">{rows}</div>')


def idea_163():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "Production<br><em>at the supplier.</em>", "التصنيع<br><em>عند المورّد.</em>"), legs_card(lang, 0)),
              (T_(lang, "Sea:<br><em>about 30 days.</em>", "البحر:<br><em>حوالي 30 يوم.</em>"), legs_card(lang, 1)),
              (T_(lang, "Customs:<br><em>about 2 days.</em>", "الجمرك:<br><em>حوالي يومين.</em>"), legs_card(lang, 2)),
              (T_(lang, "Truck to your warehouse,<br><em>then receiving.</em>", "شاحنة لمستودعك،<br><em>وبعدين الاستلام.</em>"), legs_card(lang, 3)),
              (T_(lang, "Stacko tracks every leg<br><em>so the date you promise is real.</em>", "ستاكو بيتابع كل مرحلة<br><em>لحتى التاريخ اللي بتوعد فيه يكون حقيقي.</em>"), legs_card(lang, None))]
        dark_car("IDEA-163", "IDEA-163_lead-time-longer", lang, "OB-40.jpg",
                 (T_(lang, "Your lead time is<br><em>longer than you think.</em>", "مدّة التوريد<br><em>أطول مما بتفكّر.</em>"),
                  T_(lang, "Add up every leg before you promise a date.", "اجمع كل المراحل قبل ما توعد بتاريخ.")), sl, "lead time", slide_bg=BG58D)


# ---------------------------------------------------------------- IDEA-164 · landed cost (6 slides, light)
def cost_bar(lang, n):
    segs = [(62, "var(--abyss)"), (18, "var(--signal)"), (12, "#79C0DE"), (8, "#C9D8E4")]
    labs = T_(lang, ["Product", "Freight", "Customs", "Local"], ["البضاعة", "الشحن", "الجمرك", "النقل"])
    bar_ = '<div style="display:flex;height:70px;border-radius:16px;overflow:hidden;direction:ltr">' + "".join(
        f'<div style="flex:{w};background:{c};opacity:{1 if i < n else .12}"></div>' for i, (w, c) in enumerate(segs)) + "</div>"
    lg = '<div style="display:flex;justify-content:space-between;margin-top:12px;font-size:22px;color:var(--deep);direction:ltr">' + "".join(
        f'<span style="opacity:{1 if i < n else .3}">{t}</span>' for i, t in enumerate(labs)) + "</div>"
    return card(bar_ + lg + f'<div class="t2" style="font-size:20px;margin-top:10px">{T_(lang, "Illustrative split", "تقسيم توضيحي")}</div>')


def idea_164():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "Product price<br><em>from the supplier.</em>", "سعر البضاعة<br><em>من المورّد.</em>"), cost_bar(lang, 1)),
              (T_(lang, "+ freight<br><em>(sea or air).</em>", "+ الشحن<br><em>(بحر أو جو).</em>"), cost_bar(lang, 2)),
              (T_(lang, "+ customs<br><em>and duties.</em>", "+ الجمرك<br><em>والرسوم.</em>"), cost_bar(lang, 3)),
              (T_(lang, "+ local transport<br><em>to your warehouse.</em>", "+ النقل المحلي<br><em>لمستودعك.</em>"), cost_bar(lang, 4)),
              (T_(lang, "Price your products on the landed cost,<br><em>not the invoice.</em>", "سعّر بضاعتك على الكلفة الواصلة،<br><em>مش عالفاتورة.</em>"), cost_bar(lang, 4), "")]
        text_cover("IDEA-164", "IDEA-164_landed-cost", lang,
                   (T_(lang, "Landed cost:<br><em>what you really paid.</em>", "الكلفة الواصلة:<br><em>قدّيش دفعت فعلاً.</em>"),
                    T_(lang, "The price on the invoice is only the start.", "السعر عالفاتورة هو بس البداية.")),
                   cost_bar(lang, 4).replace('style="top:560px"', 'style="top:520px"'), sl, "landed cost", kick=T_(lang, "Layer {n} of 4", "طبقة {n} من 4"))


# ---------------------------------------------------------------- IDEA-165 · what we're building next (5 slides, dark)
def idea_165():
    for lang in ("en", "ar"):
        nxt = T_(lang, "Next", "جايي")
        note = T_(lang, "Not live yet.", "مش موجود بعد.")
        item = lambda t: card(f'<span class="pill" style="background:#E6F2F6;color:#0B7A87;font-size:24px">{nxt}</span>'
                              f'<div style="font-size:34px;font-weight:600;margin-top:14px">{t}</div><div class="t2">{note}</div>')
        opts = card('<div class="rws">' + "".join(f'<div class="rw2"><b style="width:46px;height:46px;border-radius:12px;background:var(--abyss);color:#fff;display:grid;place-items:center">{l}</b><span class="sp" style="font-size:30px;color:var(--abyss)">{o}</span></div>'
                                                 for l, o in zip(T_(lang, "ABC", "أبج"), T_(lang, ["GPS on trucks", "More messaging apps", "Barcode and QR scanning"],
                                                                                                [L("GPS") + " عالشاحنات", "تطبيقات رسائل أكتر", "مسح الباركود والـ" + L("QR")]))) + "</div>")
        sl = [(T_(lang, "GPS on trucks,<br><em>for real positions.</em>", f"{L('GPS')} عالشاحنات،<br><em>لمواقع حقيقية.</em>"), item(T_(lang, "See where each truck really is.", "شوف وين كل شاحنة فعلاً."))),
              (T_(lang, "Logging from<br><em>more messaging apps.</em>", "التسجيل من<br><em>تطبيقات رسائل أكتر.</em>"), item(T_(lang, "Log from the app your team already uses.", "سجّل من التطبيق اللي فريقك أصلاً بيستعمله."))),
              (T_(lang, "Barcode and QR scanning<br><em>on mobile.</em>", f"مسح الباركود والـ{L('QR')}<br><em>من الموبايل.</em>"), item(T_(lang, "Scan instead of typing the item.", "امسح بدل ما تكتب الصنف."))),
              (T_(lang, "Which one<br><em>do you want first?</em>", "أيّا وحدة<br><em>بدّك أوّل شي؟</em>"), opts)]
        dark_car("IDEA-165", "IDEA-165_what-were-building-next", lang, "SC-15.jpg",
                 (T_(lang, "What we're<br><em>building next.</em>", "شو عم نبني<br><em>بعدين؟</em>"), T_(lang, "An honest look at the roadmap.", "نظرة صريحة عالخطة.")),
                 sl, "roadmap", kick=None)


if __name__ == "__main__":
    for f in (idea_159, idea_160, idea_161, idea_162, idea_163, idea_164, idea_165):
        f()
    print("ok")
