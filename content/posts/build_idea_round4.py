"""Round 4 (12 Nov 2026): the ideas still at stage "new" in the CRM, built as HTML (EN + AR).
    python -I -X utf8 posts/build_idea_round4.py --only dec01,d3006 [--dump out.json]

Same layouts as round 3 (r3_lib). The plan rows were written before most of the owner's reviews, so the copy follows
plans/Stacko design rules review comments and lessons.md where they disagree:
- no "Prototype · demo data" / "Planned" / "Concept" badges, no Telegram on visuals ("from your phone"),
- no closing questions, polls, "comment X", "DM us MAP" or "tag someone" asks; posts end on what Stacko does,
- every post shows a "With Stacko" line and a product proof; educational carousels end on the website-hero map,
- مخازن / مخزنك in Arabic, terms from app/docs/TERMINOLOGY.md (On hand الرصيد, Committed الملتزم به, Available المتاح,
  Incoming القادم, In transit قيد النقل, Stock adjustment تسوية مخزنية, Pending approval بانتظار الموافقة).
Only what the product bible or the built app (app/docs/PLAN.md) supports is shown as Stacko; sample numbers only.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import r3_lib  # noqa: E402
from r3_lib import BG, CAP, MAP, PI, REG, L, U, car, card, crop, dump, static, tag, write, page, name, top, FOOT, CSS  # noqa: E402

T = lambda l: (lambda a, b: a if l == "en" else b)
LS = ("en", "ar")
BGI = lambda c: f'<img class="bg" src="{BG(c)}" alt="">'
PII = lambda c, css="": f'<img class="bg" src="{PI(c)}" alt=""' + (f' style="{css}"' if css else "") + ">"
EX = lambda x: f'<div class="ex">{x}</div>'

R4_CSS = """
.term{display:flex;align-items:center;gap:30px}
.term .n{white-space:nowrap;font-size:132px;font-weight:600;line-height:1;letter-spacing:-.04em;color:var(--signal);direction:ltr;min-width:250px;text-align:center}
.term b{display:block;font-size:46px;line-height:1.1}
.term small{display:block;font-size:28px;color:var(--deep);margin-top:8px;line-height:1.32}
.pho{display:block;width:100%;border-radius:22px;object-fit:cover;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.tln .tlr{display:flex;align-items:center;gap:22px;padding:16px 0;border-bottom:1px solid #E1EAF0;font-size:30px}
.tln .tlr:last-child{border:0}
.tln .tm{font-size:34px;font-weight:600;direction:ltr;min-width:150px;flex:none}
.tln .tx{flex:1}
.tln .bad{color:#B4233C;font-weight:600}
.fld{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fld div{border:2px solid #E1EAF0;border-radius:14px;padding:12px 16px;font-size:24px;color:var(--deep)}
.fld div span{display:block;height:14px;margin-top:10px;border-radius:7px;background:#EEF4F7}
.big3{display:flex;align-items:flex-end;gap:22px;direction:ltr}
.big3 .wc{position:static;flex:1;text-align:center;padding:26px 10px}
.big3 b{display:block;font-weight:600;line-height:1;letter-spacing:-.04em;color:var(--abyss)}
.big3 small{display:block;font-size:24px;color:var(--deep);margin-top:12px}
[dir=rtl] .big3 small{direction:rtl}
.note{font-size:22px;color:var(--deep);opacity:.9}
.dark .note{color:var(--visor)}
.sb{direction:ltr}
.sb .hand{border-bottom:4px solid #0E2440;font-size:28px;font-weight:600;text-align:center;padding-bottom:8px;margin-bottom:14px}
.sb .bars{position:relative;height:120px}
.sb .seg{position:absolute;top:0;height:120px;border-radius:16px;display:grid;place-items:center;font-size:38px;font-weight:600;color:#fff}
.dim{opacity:.22}
.leg{display:flex;flex-wrap:wrap;gap:16px 34px;margin-top:22px;font-size:28px;font-weight:500}
.leg span{display:flex;align-items:center;gap:12px}
.leg i{display:inline-block;width:30px;height:30px;border-radius:8px;box-sizing:border-box}
"""


def reg(pid, slug, date, fmt, h, s, cap, slides=None, note=""):
    """r3_lib.reg into posts/<month>/ (or posts/unscheduled/ without a date), with a round-4 notes header."""
    if date:
        f = r3_lib.reg(pid, slug, date, fmt, h, s, cap, slides, note)
    else:
        REG[pid] = dict(slug=slug, date=None, month="unscheduled", fmt=fmt, h=h, s=s, cap=cap, slides=slides, note=note, folder=f"{pid}_{slug}")
        f = REG[pid]["folder"]
        d = r3_lib.POSTS / "unscheduled" / f
        d.mkdir(parents=True, exist_ok=True)
        (d / "caption_en.txt").write_text(cap[0] + "\n", encoding="utf8")
        (d / "caption_ar.txt").write_text(cap[1] + "\n", encoding="utf8")
    d = r3_lib.POSTS / REG[pid]["month"] / f
    (d / "notes.md").write_text(f"# {pid} · round 4\n\nBuilt by posts/build_idea_round4.py (12 Nov 2026) from the CRM plan row, HTML only.\n\n{note}\n", encoding="utf8")
    return f


def term(n, b, s):
    return card(f'<div class="term"><div class="n">{n}</div><div><b>{b}</b><small>{s}</small></div></div>', 0)


def photo(code, h=520, pos="50% 50%", kind="PI"):
    src = PI(code) if kind == "PI" else BG(code)
    return f'<img class="pho" src="{src}" alt="" style="height:{h}px;object-position:{pos}">'


def fin(l, h, line, theme="dark"):
    """The closing slide the owner asked for on educational carousels: the website-hero map and one plain line."""
    t = T(l)
    hero = (f'<div style="position:absolute;left:64px;right:64px;top:520px;border-radius:30px;overflow:hidden;border:2px solid #79C0DE;box-shadow:0 24px 60px rgba(0,0,0,.4)">'
            f'<img src="/assets/screens/live-map/website-hero-{l}.jpg" alt="" style="display:block;width:100%;height:560px;object-fit:cover;object-position:{t("88%", "12%")} 55%"></div>')
    txt = f'<div class="wc" style="left:64px;right:64px;top:1110px;font-size:30px;line-height:1.35;font-weight:500;padding:22px 30px">{line}</div>'
    return dict(bg=BGI("BG-56" if theme == "dark" else "BG-57"), h=h, extra=hero + txt)


def stockbar(l, hl):
    """On hand 500 = committed 80 + available 420, and 600 incoming beside it. hl: which part to light."""
    t = T(l)
    k = 892 / 1100
    on = lambda key: hl in (key, "all") or (hl == "hand" and key in ("com", "ava"))
    seg = lambda a, b, c, key, txt, extra="": (f'<div class="seg{"" if on(key) else " dim"}" style="left:{a * k:.0f}px;width:{(b - a) * k - 8:.0f}px;background:{c};{extra}">{txt}</div>')
    bar = (seg(0, 80, "#2C5974", "com", L(80)) + seg(80, 500, "#0E8FA0", "ava", L(420))
           + seg(500, 1100, "transparent", "inc", L(600), "border:4px dashed #2C5974;color:#2C5974"))
    hand = f'<div class="hand{"" if hl in ("hand", "all") else " dim"}" style="width:{500 * k - 8:.0f}px">{t("On hand 500", f"الرصيد {L(500)}")}</div>'
    leg = "".join(f'<span class="{"" if on(key) else "dim"}"><i style="{st}"></i>{txt}</span>' for key, st, txt in (
        ("com", "background:#2C5974", t("Committed 80", f"الملتزم به {L(80)}")), ("ava", "background:#0E8FA0", t("Available 420", f"المتاح {L(420)}")),
        ("inc", "border:3px dashed #2C5974", t("Incoming 600", f"القادم {L(600)}"))))
    return card(f'<div class="sb">{hand}<div class="bars">{bar}</div></div><div class="leg">{leg}</div>', 0)


# ---------------------------------------------------------------- DEC-01
def dec01():
    pid = "DEC-01"
    h = ("500 on the shelf.<br><em>How many can you sell?</em>", f"{L('500')} قطعة عالرف.<br><em>قدّيش فيك تبيع منن؟</em>")
    s = ("Four stock numbers every team should keep apart.", "أربع أرقام لازم كل فريق يفرّق بيناتن.")
    sl = [("On hand:<br><em>what's on the shelf.</em>", "الرصيد:<br><em>اللي عالرف.</em>"),
          ("Committed:<br><em>already promised.</em>", "الملتزم به:<br><em>موعود فيه.</em>"),
          ("Available:<br><em>what you can promise.</em>", "المتاح:<br><em>اللي فيك توعد فيه.</em>"),
          ("Incoming:<br><em>not yours to sell yet.</em>", "القادم:<br><em>بعدو مش إلك لتبيعه.</em>"),
          ("With Stacko,<br><em>all four side by side.</em>", "مع ستاكو،<br><em>الأربعة جنب بعض.</em>"),
          ("Use the right system:<br><em>Stacko.</em>", "استعمل النظام الصح:<br><em>ستاكو.</em>")]
    cap = ("A customer asks for 450 units. Your records say 500. Can you say yes?\n\nOnly if 450 are available. 80 may already be promised to orders waiting to go out, and the container at sea doesn't count until it's received.\n\n"
           "On hand is what you have. Available is what you can promise. Stacko shows on hand, committed, available and incoming for every item in every warehouse.\n\nSave this for the next time someone asks \"how many do we have?\"",
           "زبون طلب 450 قطعة. السجلّات بتقول 500. فيك تقلّه إيه؟\n\nبس إذا الـ450 متاحين. ممكن يكون 80 موعودين لطلبيات ناطرة تطلع، والكونتينر اللي بالبحر ما بينحسب قبل ما يتسلّم.\n\n"
           "الرصيد هو اللي عندك. المتاح هو اللي فيك توعد فيه. ستاكو بيورجيك الرصيد، الملتزم به، المتاح والقادم لكل صنف بكل مستودع.\n\nاحفظ هالبوست لمرّة الجايي حدا بيسأل «قدّيش عنّا؟»")
    reg(pid, "500-on-shelf-how-many-sell", "2026-12-04", "Carousel", h, s, cap, slides=[h] + sl,
        note="'Reserved' is called Committed (the app's term: outbound transactions waiting for approval and approved transfers not dispatched). "
             "'Blocked' was dropped: Stacko has no blocked stock, and four numbers that add up (500 = 80 + 420, 600 incoming) read cleaner. Sample figures. Closing 'save this' kept in the caption only.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        ex = [t("Everything recorded at this warehouse today.", "كل شي متسجّل بهالمستودع اليوم."),
              t("Still on the shelf, but taken by orders waiting to go out.", "بعدها عالرف، بس محجوزة لطلبيات ناطرة تطلع."),
              t("On hand minus committed: 500 − 80 = 420. Quote this one.", f"الرصيد ناقص الملتزم به: {L('500 − 80 = 420')}. هيدا الرقم اللي بتعطيه."),
              t("On the water or at customs. It joins on hand only when it's received.", "بالبحر أو بالجمرك. بينضاف عالرصيد بس لمّا يتسلّم.")]
        terms = [term(L(500), t("On hand", "الرصيد"), t("In the warehouse and in the records.", "بالمستودع وبالسجلّات.")),
                 term(L(80), t("Committed", "الملتزم به"), t("Promised to orders not shipped yet.", "موعود لطلبيات بعدها ما طلعت.")),
                 term(L(420), t("Available", "المتاح"), t("What you can still promise today.", "اللي بعد فيك توعد فيه اليوم.")),
                 term(L(600), t("Incoming", "القادم"), t("On its way, not received yet.", "عالطريق، بعدو ما تسلّم."))]
        hls = ["hand", "com", "ava", "inc"]
        stacko = U.rowscard([(t("On hand", "الرصيد"), "", L("500"), "num"), (t("Committed", "الملتزم به"), "", L("80"), "num"),
                             (t("Available", "المتاح"), "", L("420"), "okc"), (t("Incoming", "القادم"), t("Sea · ETA 12 days", f"بحر · {L('12')} يوم"), L("600"), "num")],
                            lab=t("LED Strip 5m · WH-01", f"لمبات LED · {L('WH-01')}"), top_=0)
        slides = [dict(bg=PII("OB-52"), h=h[l == "ar"], s=s[l == "ar"], cover=True, theme="light")]
        for i in range(4):
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=[terms[i], stockbar(l, hls[i]), EX(ex[i])], col_top=470))
        slides.append(dict(bg=B, h=sl[4][l == "ar"], col=[stacko, EX(t("Quote available, not on hand. Incoming counts once it's received.", "أعطي المتاح، مش الرصيد. والقادم بينحسب بس لمّا يتسلّم."))], col_top=450))
        slides.append(fin(l, sl[5][l == "ar"], t("Stacko is the stock management system built for several warehouses: every number, for every item, in every location.",
                                                    "ستاكو هو نظام إدارة المخازن المعمول للشركات اللي عندها أكتر من مستودع: كل رقم، لكل صنف، بكل موقع."), "light"))
        car(pid, l, slides, "four stock numbers", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- D30-06
def d3006():
    pid = "D30-06"
    h = ("Your system isn't wrong.<br><em>It's late.</em>", "السيستم مش غلط.<br><em>هوّي متأخّر.</em>")
    s = ("Why stock numbers go stale, even with a system.", "ليش أرقام المخازن بتعتق، حتى مع سيستم.")
    sl = [("Most systems are built<br><em>for the office.</em>", "أغلب الأنظمة معمولة<br><em>للمكتب.</em>"),
          ("The stock moves<br><em>on the floor.</em>", "البضاعة بتتحرّك<br><em>بالأرض.</em>"),
          ("So the record<br><em>arrives hours later.</em>", "فالتسجيل<br><em>بيوصل بعد ساعات.</em>"),
          ("The fix: logging<br><em>that takes seconds.</em>", "الحلّ: تسجيل<br><em>بياخد ثواني.</em>"),
          ("With Stacko,<br><em>the record moves with the stock.</em>", "مع ستاكو،<br><em>التسجيل بيمشي مع البضاعة.</em>")]
    cap = ("If logging is slow, the records will always be a day behind. The numbers are there; the truth isn't.\n\n"
           "Stacko makes logging fit where the team already works: one message from the phone, a manager's approval, and the move is on the live map.",
           "إذا التسجيل بطيء، السجلّات رح تضلّ متأخّرة نهار. الأرقام موجودة، بس الحقيقة لأ.\n\n"
           "ستاكو بيخلّي التسجيل يصير وين الفريق أصلاً شغّال: رسالة وحدة من التلفون، موافقة المدير، والحركة بتطلع عالخريطة المباشرة.")
    reg(pid, "system-has-numbers-but", "2026-12-06", "Carousel", h, s, cap, slides=[h] + sl,
        note="Closing question ('Agree or disagree?') removed; last slide shows the Stacko fix on the website-hero map. No ERP claims.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        form = card(f'<div class="lab">{t("New stock transfer", "تحويل مخزني جديد")}</div><div class="fld" style="margin-top:14px">' +
                    "".join(f"<div>{x}<span></span></div>" for x in (t("Item code", "رمز الصنف"), t("Unit", "الوحدة"), t("Quantity", "الكمية"), t("From", "من"), t("To", "إلى"), t("Reason", "السبب"), t("Reference", "المرجع"), t("Date", "التاريخ"))) + "</div>", 0)
        tl = card(f'<div class="tln">'
                  f'<div class="tlr"><span class="tm">09:10</span><span class="tx">{t("40 boxes leave Beirut", f"{L(40)} كرتونة طلعوا من بيروت")}</span></div>'
                  f'<div class="tlr"><span class="tm">13:00</span><span class="tx">{t("A customer is quoted the old number", "زبون أخد الرقم القديم")}</span></div>'
                  f'<div class="tlr"><span class="tm">17:30</span><span class="tx">{t("Someone types the move in", "حدا بيسجّل الحركة")}</span></div>'
                  f'<div class="tlr"><span class="tm bad">8h 20m</span><span class="tx bad">{t("of a wrong number", "والرقم غلط")}</span></div></div>', 0)
        chat = U.chatcard(t("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"), t("Logged ✓ 09:10 · waiting for the manager's approval", f"تسجّلت ✓ {L('09:10')} · ناطرة موافقة المدير"), top_=0)
        slides = [dict(bg=BGI("BG-57"), h=h[l == "ar"], s=s[l == "ar"], cover=True,
                       extra=f'<div style="position:absolute;left:64px;right:64px;top:560px">{tl}</div>'),
                  dict(bg=B, h=sl[0][l == "ar"], col=[form, EX(t("Forms, codes and menus: fine at a desk, slow with a box in your hands.", "استمارات ورموز وقوايم: منيحة عالمكتب، بطيئة والكرتونة بإيدك."))], col_top=430),
                  dict(bg=B, h=sl[1][l == "ar"], col=[photo("SC-08", 560), EX(t("The people who move the stock have a phone in one hand and a box in the other.", "اللي بيحرّكوا البضاعة، التلفون بإيد والكرتونة بالإيد التانية."))], col_top=430),
                  dict(bg=B, h=sl[2][l == "ar"], col=[tl, EX(t("Written later, by someone else, or never. Meanwhile the number is wrong.", "بتنكتب بعدين، أو حدا تاني بيكتبها، أو ما بتنكتب. وبهالوقت الرقم غلط."))], col_top=430),
                  dict(bg=B, h=sl[3][l == "ar"], col=[chat, EX(t("Not a bigger system. One message, where the team already is.", "مش سيستم أكبر. رسالة وحدة، وين الفريق أصلاً موجود."))], col_top=450),
                  fin(l, sl[4][l == "ar"], t("One message from the phone, a manager's approval, and the move is on the live map at 09:10, not 17:30.",
                                              f"رسالة وحدة من التلفون، موافقة المدير، والحركة عالخريطة المباشرة الساعة {L('09:10')}، مش {L('17:30')}."), "light")]
        car(pid, l, slides, "numbers not truth", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- D30-15
def d3015():
    pid = "D30-15"
    h = ("$1 to log it. $10 to fix it.<br><em>$100 when a customer finds it.</em>", f"{L('$1')} لتسجّلها. {L('$10')} لتصلّحها.<br><em>{L('$100')} إذا الزبون اكتشفها.</em>")
    s = ("The 1-10-100 rule of thumb, in a warehouse.", f"قاعدة {L('1-10-100')} التقريبية، بالمستودع.")
    sl = [("$1: log it<br><em>when it moves.</em>", f"{L('$1')}: سجّلها<br><em>وقت تتحرّك.</em>"),
          ("$10: fix it<br><em>at the count.</em>", f"{L('$10')}: صلّحها<br><em>وقت الجردة.</em>"),
          ("$100: the customer<br><em>finds it first.</em>", f"{L('$100')}: الزبون<br><em>بيكتشفها قبلك.</em>"),
          ("With Stacko,<br><em>you pay the $1.</em>", f"مع ستاكو،<br><em>بتدفع الـ{L('$1')} وبس.</em>")]
    cap = ("An old rule of thumb about data quality, applied to stock: catching a mistake when the stock moves costs far less than fixing it at the count, and much less than a customer finding it.\n\n"
           "With Stacko, logging a move takes one message from the phone, at the moment it happens.\n\nThe 1-10-100 rule is a common data-quality rule of thumb, not a measured cost.",
           "قاعدة قديمة عن جودة الداتا، عالمخازن: إنك تلقط الغلطة وقت البضاعة تتحرّك بيكلّف أقلّ بكتير من إنك تصلّحها بالجردة، وأقلّ كمان من إنو الزبون يكتشفها.\n\n"
           "مع ستاكو، تسجيل الحركة بياخد رسالة وحدة من التلفون، بنفس اللحظة.\n\nقاعدة 1-10-100 قاعدة تقريبية معروفة عن جودة الداتا، مش كلفة مقاسة.")
    reg(pid, "1-10-100-rule", "2026-12-15", "Carousel", h, s, cap, slides=[h] + sl,
        note="Closing question removed. Footnote kept on slide 4 and in the caption (rule of thumb, not Stacko data). Last slide shows the Stacko fix on the website-hero map.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        big = (f'<div class="big3" style="position:absolute;left:64px;right:64px;top:600px">'
               f'<div class="wc"><b style="font-size:96px">$1</b><small>{t("log it", "سجّلها")}</small></div>'
               f'<div class="wc"><b style="font-size:150px">$10</b><small>{t("fix it", "صلّحها")}</small></div>'
               f'<div class="wc"><b style="font-size:200px">$100</b><small>{t("the customer finds it", "الزبون بيكتشفها")}</small></div></div>')
        foot = f'<div class="note">{t("The 1-10-100 rule is a common data-quality rule of thumb, not a measured cost.", f"قاعدة {L('1-10-100')} قاعدة تقريبية معروفة، مش كلفة مقاسة.")}</div>'
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=big),
                  dict(bg=B, h=sl[0][l == "ar"], col=[photo("SC-08", 400), U.chatcard(t("received 40 LED strips in Beirut", "استلمنا 40 لمبة LED ببيروت"), t("Logged ✓ 09:10 · by Hadi", f"تسجّلت ✓ {L('09:10')} · هادي"), top_=0), EX(t("A few seconds at the door, when the box moves.", "كم ثانية عالباب، وقت الكرتونة تتحرّك."))], col_top=420),
                  dict(bg=B, h=sl[1][l == "ar"], col=[photo("SE-02", 560), EX(t("Hours tracing what happened, weeks after it happened.", "ساعات لتعرف شو صار، بعد أسابيع من ما صار."))], col_top=430),
                  dict(bg=B, h=sl[2][l == "ar"], col=[photo("SC-05", 560), EX(t("You said \"yes, we have it.\" The shelf said no.", "قلتلّه «إيه، موجودة». والرف قال لأ."))], col_top=430),
                  fin(l, sl[3][l == "ar"], t("Logging takes one message from the phone, at the moment the stock moves, and the move shows on the map.",
                                              "التسجيل رسالة وحدة من التلفون، بنفس لحظة ما البضاعة تتحرّك، والحركة بتطلع عالخريطة."), "light")]
        car(pid, l, slides, "1-10-100", theme="light", css=R4_CSS)


def mythfact(l, myth, fact):
    t = T(l)
    return [card(f'<div class="lab" style="color:#B4233C">{t("Myth", "خرافة")}</div><b class="t" style="text-decoration:line-through;text-decoration-color:#B4233C;opacity:.75">{myth}</b>', 0),
            card(f'<div class="lab">{t("Fact", "الحقيقة")}</div><b class="t" style="font-size:38px">{fact}</b>', 0)]


def checks(rows, lab="", mark="☐"):
    rr = "".join(f'<div class="rw2"><span style="font-size:40px;line-height:1;color:var(--signal)">{mark}</span><span class="sp" style="color:var(--abyss);font-size:30px">{x}</span></div>' for x in rows)
    return card((f'<div class="lab">{lab}</div>' if lab else "") + f'<div class="rws">{rr}</div>', 0)


CHAT_MOVE = (("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"))


# ---------------------------------------------------------------- D30-25
def d3025():
    pid = "D30-25"
    h = ("Change your stock system<br><em>without stopping work.</em>", "غيّر طريقة إدارة مخازنك<br><em>بلا ما يوقف الشغل.</em>")
    s = ("Four steps, one habit at a time.", "أربع خطوات، عادة وحدة بكل مرّة.")
    sl = [("You don't switch<br><em>overnight.</em>", "ما بتغيّر<br><em>بليلة وضحاها.</em>"),
          ("1. Start with<br><em>one warehouse.</em>", "1. ابدأ<br><em>بمستودع واحد.</em>"),
          ("2. Start with<br><em>one kind of move.</em>", "2. ابدأ<br><em>بنوع واحد من الحركات.</em>"),
          ("3. Count only what<br><em>you'll start tracking.</em>", "3. عِدّ بس اللي<br><em>رح تبلّش تتابعه.</em>"),
          ("4. One person checks<br><em>the log every day.</em>", "4. شخص واحد بيراجع<br><em>السجلّ كل يوم.</em>"),
          ("With Stacko,<br><em>start small, keep working.</em>", "مع ستاكو،<br><em>ابدأ صغير، وكمّل شغلك.</em>")]
    cap = ("The biggest risk in changing a stock system isn't the software. It's stopping work to switch.\n\n"
           "Start with one warehouse and one kind of move, count only what you'll track, and have one person check the log daily for two weeks. Keep the notebook for a month, compare, then let it go.\n\n"
           "With Stacko, you set up one warehouse, the team logs from the phone, and every move shows on the map while the rest keeps running.",
           "أكبر خطر بتغيير طريقة إدارة المخازن مش السيستم. هوّي إنو يوقف الشغل لتغيّر.\n\n"
           "ابدأ بمستودع واحد ونوع واحد من الحركات، عِدّ بس اللي رح تتابعه، وخلّي شخص واحد يراجع السجلّ كل يوم لأسبوعين. خلّي الدفتر شهر، قارن، وبعدين ودّعه.\n\n"
           "مع ستاكو، بتجهّز مستودع واحد، الفريق بيسجّل من التلفون، وكل حركة بتطلع عالخريطة والباقي ماشي.")
    reg(pid, "move-off-notebook-without", "2026-12-25", "Carousel", h, s, cap, slides=[h] + sl,
        note="CHECK: publish date falls on 25 Dec (Christmas). No onboarding-time promises. Closing 'save this' kept out; last slide shows Stacko.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        slides = [dict(bg=PII("OB-05"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=[photo("SC-14", 300, "50% 78%"), f'<img class="pho" src="{MAP("map-crop")}" alt="" style="height:300px;object-position:50% 50%">', EX(t("Run the notebook and the new system side by side for a while.", "خلّي الدفتر والسيستم الجديد ماشيين سوا لفترة."))], col_top=420),
                  dict(bg=B, h=sl[1][l == "ar"], col=[U.rowscard([(L("WH-01"), t("Beirut", "بيروت"), t("Start here ✓", "ابدأ هون ✓"), "okc"), (L("WH-02"), t("Sidon", "صيدا"), t("Next month", "الشهر الجايي"), "sp"), (L("DXB-01"), t("Dubai", "دبي"), t("Later", "بعدين"), "sp")], top_=0),
                                                      EX(t("Not all three at once. One warehouse builds the habit.", "مش التلاتة سوا. مستودع واحد بيعمل العادة."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[U.rowscard([(t("Transfers", "التحويلات"), "", t("Week 1 ✓", "الأسبوع 1 ✓"), "okc"), (t("Receipts", "الاستلام"), "", t("Week 3", "الأسبوع 3"), "sp"), (t("Counts", "الجردة"), "", t("Month 2", "الشهر 2"), "sp")], top_=0),
                                                      EX(t("Transfers first. Add receipts once the team logs without thinking.", "التحويلات أوّل. زيد الاستلام لمّا الفريق يصير يسجّل بلا ما يفكّر."))], col_top=450),
                  dict(bg=B, h=sl[3][l == "ar"], col=[U.rowscard([(t("LED Strip 5m", "لمبات LED"), "", L("500"), "num"), (t("USB-C Cable", "كابل USB-C"), "", L("1,200"), "num"), (t("Desk Lamp", "لمبة مكتب"), "", L("150"), "num")],
                                                                 lab=t("Opening stock · WH-01", f"الرصيد الافتتاحي · {L('WH-01')}"), top_=0),
                                                      EX(t("Not everything on day one. Just the items you'll start tracking.", "مش كل شي بأوّل يوم. بس الأصناف اللي رح تبلّش تتابعها."))], col_top=450),
                  dict(bg=B, h=sl[4][l == "ar"], col=[U.rowscard([(L("TRF-00014"), t("Transfer · Hadi", "تحويل · هادي"), L("09:10"), "okc"), (L("RCV-00008"), t("Receipt · Rana", "استلام · رنا"), L("11:40"), "okc"), (L("TRF-00015"), t("Transfer · Omar", "تحويل · عمر"), L("15:25"), "okc")],
                                                                 lab=t("Today's transactions", "حركات اليوم"), top_=0),
                                                      EX(t("For the first two weeks. Keep the notebook a month, compare, then let it go.", "لأوّل أسبوعين. خلّي الدفتر شهر، قارن، وبعدين ودّعه."))], col_top=450),
                  fin(l, sl[5][l == "ar"], t("Set up one warehouse, log from the phone, and every move shows on the map while the rest keeps running.",
                                              "جهّز مستودع واحد، سجّل من التلفون، وكل حركة بتطلع عالخريطة والباقي ماشي."), "light")]
        car(pid, l, slides, "move off the notebook", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- RES-03
def res03():
    pid = "RES-03"
    h = ("Don't pick a stock system yet.<br><em>Answer these 3 first.</em>", "لا تختار سيستم للمخازن هلّق.<br><em>جاوب عهالتلاتة أوّل.</em>")
    s = ("Build it, buy it or keep Excel: start from the problem.", "تعمله، تشتريه أو تضلّ عالإكسل: ابدأ من المشكلة.")
    sl = [("The hard part<br><em>isn't the software.</em>", "الصعب<br><em>مش السيستم.</em>"),
          ("1. Can you see every location<br><em>right now?</em>", "1. فيك تشوف كل المواقع<br><em>هلّق؟</em>"),
          ("2. Do you know what's incoming,<br><em>and when it lands?</em>", "2. بتعرف شو جايي،<br><em>وإيمتى بيوصل؟</em>"),
          ("3. Will your team<br><em>log every move?</em>", "3. فريقك رح<br><em>يسجّل كل حركة؟</em>"),
          ("Two or more \"no\"?<br><em>That's your spec.</em>", "جاوبت «لأ» مرّتين أو أكتر؟<br><em>هيدا هوّي طلبك.</em>"),
          ("Build, buy or Excel:<br><em>the same 3 questions.</em>", "تعمله، تشتريه أو إكسل:<br><em>نفس التلات أسئلة.</em>"),
          ("Stacko was built<br><em>around these three.</em>", "ستاكو انعمل<br><em>حول هالتلاتة.</em>")]
    cap = ("Build it, buy it, or wait for AI to make it easy?\n\nBefore any of that, answer three questions: can you see every location right now, do you know what's incoming and when it lands, and will your team actually log every move?\n\n"
           "Your answers are the spec. Judge every option against them, ours included. Stacko was built around these three: every location on one live map, incoming shipments with their ETA, and logging in one message from the phone.",
           "تعمله، تشتريه، ولا تنطر الذكاء الاصطناعي يسهّلها؟\n\nقبل كل هيدا، جاوب عتلات أسئلة: فيك تشوف كل المواقع هلّق، بتعرف شو جايي وإيمتى بيوصل، وفريقك فعلاً رح يسجّل كل حركة؟\n\n"
           "أجوبتك هيّي طلبك. قيّم كل خيار عليها، ونحنا كمان. ستاكو انعمل حول هالتلاتة: كل المواقع عخريطة وحدة مباشرة، الشحنات الواردة مع وقت وصولها، والتسجيل برسالة وحدة من التلفون.")
    reg(pid, "build-or-buy-3-questions", "2027-01-06", "Carousel", h, s, cap, slides=[h] + sl,
        note="Weak evidence (unlinked Reddit summary): no quotes, no competitor names, no prices. Never says 'don't build'. 'Save this' moved out; last slide shows Stacko against the three questions.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        calls = U.rowscard([(L("WH-01"), t("Call Rami", "اتّصل برامي"), "📞", "sp"), (L("WH-02"), t("Call Lina", "اتّصل بلينا"), "📞", "sp"), (L("DXB-01"), t("Call Omar", "اتّصل بعمر"), "📞", "sp")], lab=t("How it works today", "هيك بتمشي اليوم"), top_=0)
        leg = U.legcard(L("SHP-24021"), t("ETA 12 days", f"بعد {L(12)} يوم"), [(30, ""), (3, "c"), (2, "t")], [t("Sea", "بحر"), t("Customs", "جمرك"), t("Truck", "شاحنة")], top_=0)
        chat = U.chatcard(t(*CHAT_MOVE), t("Logged ✓ · 10 seconds", f"تسجّلت ✓ · {L(10)} ثواني"), top_=0)
        q = [t("I can see every location now", "بشوف كل المواقع هلّق"), t("I know what's incoming and when", "بعرف شو جايي وإيمتى"), t("My team logs every move", "فريقي بيسجّل كل حركة")]
        cmp = U.rowscard([(t("Build", "تعمله"), "", "? · ? · ?", "sp"), (t("Buy", "تشتريه"), "", "? · ? · ?", "sp"), (t("Keep Excel", "تضلّ عالإكسل"), "", "? · ? · ?", "sp")], lab=t("Score each against Q1 · Q2 · Q3", f"قيّم كل واحد عـ {L('Q1 · Q2 · Q3')}"), top_=0)
        slides = [dict(bg=PII("OB-15"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=mythfact(l, t("The hard part is the software.", "الصعب هوّي السيستم."), t("The hard part is knowing what it must answer. AI makes building faster; it doesn't tell you what to build.", "الصعب إنك تعرف شو لازم يجاوب. الذكاء الاصطناعي بيسرّع البنا، بس ما بيقلّك شو تبني.")), col_top=450),
                  dict(bg=B, h=sl[1][l == "ar"], col=[calls, EX(t("Without calling anyone. If the answer needs three calls, that's a no.", "بلا ما تتّصل بحدا. إذا الجواب بدّو تلات تلفونات، يعني لأ."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[leg, EX(t("At sea, at customs or on the truck: you should know which leg, and the date.", "بالبحر، بالجمرك أو عالشاحنة: لازم تعرف وين صارت، والتاريخ."))], col_top=460),
                  dict(bg=B, h=sl[3][l == "ar"], col=[chat, EX(t("If logging is slow, the best system goes stale.", "إذا التسجيل بطيء، أحسن سيستم بيعتق."))], col_top=460),
                  dict(bg=B, h=sl[4][l == "ar"], col=[checks(q, t("Your spec", "طلبك")), EX(t("Write it down before any demo, and bring it to every call.", "اكتبه قبل أي عرض، وجيبه معك عكل اجتماع."))], col_top=450),
                  dict(bg=B, h=sl[5][l == "ar"], col=[cmp, EX(t("Judge all three options against the same answers, ours included.", "قيّم الخيارات التلاتة على نفس الأجوبة، ونحنا كمان."))], col_top=450),
                  fin(l, sl[6][l == "ar"], t("Every location on one live map, incoming shipments with their ETA, and logging in one message from the phone.",
                                              "كل المواقع عخريطة وحدة مباشرة، الشحنات الواردة مع وقت وصولها، والتسجيل برسالة وحدة من التلفون."), "light")]
        car(pid, l, slides, "3 questions", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- RES-07
def res07():
    pid = "RES-07"
    h = ("Set up a stock system<br><em>you won't have to fix later.</em>", "جهّز سيستم المخازن<br><em>بلا ما ترجع تصلّحه.</em>")
    s = ("Five things to settle before day one.", "خمس شغلات لازم تحسمها قبل أوّل يوم.")
    sl = [("1. One item,<br><em>one name, one code.</em>", "1. صنف واحد،<br><em>اسم واحد، رمز واحد.</em>"),
          ("2. Decide<br><em>the unit.</em>", "2. حدّد<br><em>الوحدة.</em>"),
          ("3. List every place<br><em>stock sits.</em>", "3. عدّد كل مطرح<br><em>فيه بضاعة.</em>"),
          ("4. Count opening stock<br><em>on one day.</em>", "4. عِدّ الرصيد الافتتاحي<br><em>بنهار واحد.</em>"),
          ("5. Decide who logs<br><em>and who approves.</em>", "5. حدّد مين بيسجّل<br><em>ومين بيوافق.</em>"),
          ("\"We'll clean it<br><em>later.\"</em>", "«منرتّبها<br><em>بعدين.»</em>"),
          ("With Stacko,<br><em>start clean.</em>", "مع ستاكو،<br><em>ابدأ مرتّب.</em>")]
    cap = ("A stock system is only as good as what you load into it on day one.\n\nFive things to settle first: one name and code per item, the unit, every place stock sits, an opening count per location, and who logs and who approves.\n\n"
           "With Stacko, items, locations and opening stock come in from your current files, and the approval rules are set before the first move.",
           "سيستم المخازن قدّ اللي بتحطّه فيه بأوّل يوم.\n\nخمس شغلات لازم تحسمها أوّل: اسم ورمز واحد لكل صنف، الوحدة، كل مطرح فيه بضاعة، جردة افتتاحية لكل موقع، ومين بيسجّل ومين بيوافق.\n\n"
           "مع ستاكو، الأصناف والمواقع والرصيد الافتتاحي بيفوتوا من ملفاتك الحالية، وقواعد الموافقة بتتحدّد قبل أوّل حركة.")
    reg(pid, "set-it-up-clean", "2027-01-13", "Carousel", h, s, cap, slides=[h] + sl,
        note="Research is evidence, not copy: no reviewer quotes, no product names. Item names on slide 2 are invented examples. Opening stock = الرصيد الافتتاحي. 'Save this' kept out; last slide shows Stacko.")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        names = card(f'<div class="lab">{t("Same item, four names", "نفس الصنف، أربع أسامي")}</div>' +
                     "".join(f'<div class="rw2" style="direction:ltr"><span class="sp" style="text-decoration:line-through;text-decoration-color:#B4233C">{x}</span></div>' for x in ("LED strip 5m", "Led-Strip 5M", "strip led 5 m", "LED STRIP 5M WW")) +
                     '<div class="rw2" style="direction:ltr"><b>LED Strip 5m · LED-5M</b><span class="sp"></span><span class="okc">✓</span></div>', 0)
        units = U.rowscard([(t("Piece", "قطعة"), t("what you sell", "اللي بتبيعه"), "1", "num"), (t("Carton", "كرتونة"), t("what arrives", "اللي بيوصل"), t("= 20 pieces", f"= {L(20)} قطعة"), "okc"), (t("Roll", "لفّة"), t("for strips and cables", "للمبات والكابلات"), L("5 m"), "num")], top_=0)
        places = U.rowscard([(L("WH-01"), t("Beirut warehouse", "مستودع بيروت"), "✓", "okc"), (L("WH-02"), t("Sidon warehouse", "مستودع صيدا"), "✓", "okc"), (L("SR-01"), t("Showroom stockroom", "مخزن صالة العرض"), "✓", "okc"), (L("DXB-01"), t("Dubai branch", "فرع دبي"), "✓", "okc")], top_=0)
        roles = U.rowscard([(t("Staff", "الموظّفين"), t("log transfers and receipts", "بيسجّلوا التحويلات والاستلام"), "", "sp"), (t("Manager", "المدير"), t("approves adjustments", "بيوافق عالتسويات"), "", "sp"), (t("Owner", "صاحب الشغل"), t("sees every location", "بيشوف كل المواقع"), "", "sp")], top_=0)
        slides = [dict(bg=PII("OB-27"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=[names, EX(t("Four spellings become four items, and the count never matches.", "أربع طرق كتابة بيصيروا أربع أصناف، والجردة ما بتظبط أبداً."))], col_top=430),
                  dict(bg=B, h=sl[1][l == "ar"], col=[units, EX(t("Piece, carton or roll, and how many pieces are in a carton.", "قطعة، كرتونة أو لفّة، وقدّيش قطعة بالكرتونة."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[places, EX(t("If it holds stock, it's a location, even the showroom's back room.", "إذا فيه بضاعة، يعني هوّي موقع، حتى المخزن ورا صالة العرض."))], col_top=430),
                  dict(bg=B, h=sl[3][l == "ar"], col=[term(t("Day 0", "يوم 0"), t("Opening stock", "الرصيد الافتتاحي"), t("Per location, counted on the same day.", "لكل موقع، معدود بنفس النهار.")),
                                                      EX(t("Everything after is added to, or taken from, that number.", "كل شي بعدها بينزاد أو بينقص من هالرقم."))], col_top=470),
                  dict(bg=B, h=sl[4][l == "ar"], col=[roles, EX(t("Before the first move, not after the first argument.", "قبل أوّل حركة، مش بعد أوّل خلاف."))], col_top=450),
                  dict(bg=B, h=sl[5][l == "ar"], col=mythfact(l, t("We'll clean the data later.", "منرتّب الداتا بعدين."), t("Whatever you load on day one becomes the system's truth.", "اللي بتحطّه بأوّل يوم بيصير هوّي حقيقة السيستم.")), col_top=470),
                  fin(l, sl[6][l == "ar"], t("Items, locations and opening stock come in from your current files, and approval rules are set before the first move.",
                                              "الأصناف والمواقع والرصيد الافتتاحي بيفوتوا من ملفاتك الحالية، وقواعد الموافقة بتتحدّد قبل أوّل حركة."))]
        car(pid, l, slides, "set it up clean", css=R4_CSS)


import build_page_kit as PK  # noqa: E402  (journey icons and CSS)

JR_CSS = PK.CSS + """
.jr{padding:24px 18px 20px}.jn{width:140px;font-size:22px}.jn i{width:78px;height:78px}.jr:before{top:64px}
"""
JI2 = dict(PK.JI, fac='<path d="M3 21V10l5 3V10l5 3V7l8 4v10z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
           air='<path d="M2 14l20-7-3 9-6-2-3 5-1-5z"/>')


def legs(l, keys, on):
    """A journey line with the given steps; steps before `on` done, `on` lit."""
    t = T(l)
    names = {"fac": t("Factory", "المعمل"), "sea": t("Sea", "البحر"), "air": t("Air", "الجوّ"), "cus": t("Customs", "الجمرك"), "road": t("Truck", "الشاحنة"), "wh": L("WH-01")}
    nodes = "".join(f'<div class="jn {"on" if i == on else "done" if i < on else ""}"><i><svg viewBox="0 0 24 24">{JI2[k]}</svg></i>{names[k]}</div>' for i, k in enumerate(keys))
    return f'<div class="jr">{nodes}</div>'


def stepper(l, on):
    """The five states of a stock transfer (app terms), current one lit."""
    t = T(l)
    st = [t("Pending approval", "بانتظار الموافقة"), t("Approved", "تمت الموافقة"), t("Ready to dispatch", "جاهز للشحن"), t("In transit", "قيد النقل"), t("Received", "تمّ الاستلام")]
    rr = "".join(f'<div class="rw2" style="{"" if i == on else "opacity:.38"}"><span style="display:grid;place-items:center;width:46px;height:46px;border-radius:50%;flex:none;'
                 f'background:{"var(--signal)" if i <= on else "#E1EAF0"};color:#fff;font-weight:700;font-size:24px">{"✓" if i < on else L(i + 1)}</span><b>{x}</b></div>' for i, x in enumerate(st))
    return card(f'<div class="lab">{L("TRF-00014")} · {t("40 × LED Strip 5m · WH-01 → WH-02", f"{L(40)} لمبة LED · {L("WH-01 → WH-02")}")}</div><div class="rws">{rr}</div>', 0)


# ---------------------------------------------------------------- JAN-01
def jan01():
    pid = "JAN-01"
    h = ("5 stock habits<br><em>to leave in 2026.</em>", "5 عادات بالمخازن<br><em>خلّيها بـ2026.</em>")
    s = ("And what to do instead, from the first week of the year.", "وشو تعمل بدالها، من أوّل أسبوع بالسنة.")
    sl = [("1. Keeping it<br><em>in your head.</em>", "1. تحفظها<br><em>براسك.</em>"),
          ("2. One person<br><em>who knows everything.</em>", "2. شخص واحد<br><em>بيعرف كل شي.</em>"),
          ("3. Calling the branch<br><em>to ask.</em>", "3. تتّصل بالفرع<br><em>لتسأل.</em>"),
          ("4. Selling what's<br><em>still at sea.</em>", "4. تبيع شي<br><em>بعدو بالبحر.</em>"),
          ("5. Fixing a number<br><em>by typing over it.</em>", "5. تصلّح الرقم<br><em>بإنك تكتب فوقه.</em>"),
          ("With Stacko,<br><em>better habits by default.</em>", "مع ستاكو،<br><em>العادات الصح من الأساس.</em>")]
    cap = ("Five habits that quietly make stock numbers wrong, and what to do instead.\n\n"
           "Log it when it moves. Let every move carry a name and a time. Check the map before you call. Quote what's available, not what's at sea. Fix a number with an adjustment and a reason, never by typing over it.\n\n"
           "Stacko is built so these become the normal way of working.",
           "خمس عادات بتخرّب أرقام المخازن بلا ما تحسّ، وشو تعمل بدالها.\n\n"
           "سجّل الحركة وقت تصير. خلّي كل حركة إلها اسم ووقت. شوف الخريطة قبل ما تتّصل. أعطي المتاح، مش اللي بالبحر. صلّح الرقم بتسوية وسبب، مش إنك تكتب فوقه.\n\n"
           "ستاكو معمول لتصير هيدي الطريقة العادية للشغل.")
    reg(pid, "habits-to-leave-2026", "2027-01-01", "Carousel", h, s, cap, slides=[h] + sl,
        note="The plan row had no slides or date: 5 habits written from the product bible and app (adjustments, audit trail, incoming apart from on hand). Caption question removed. CHECK the publish date (placed in early January 2027).")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        better = lambda x: f'<div class="ex" style="background:#fff;color:var(--abyss)"><b style="color:var(--signal)">{t("Instead: ", "بدالها: ")}</b>{x}</div>'
        proofs = [U.chatcard(t(*CHAT_MOVE), t("Logged ✓ 09:10 · by Hadi", f"تسجّلت ✓ {L('09:10')} · هادي"), top_=0),
                  U.rowscard([(L("TRF-00014"), t("Transfer · Hadi", "تحويل · هادي"), L("09:10"), "okc"), (L("RCV-00008"), t("Receipt · Rana", "استلام · رنا"), L("11:40"), "okc")], lab=t("Inventory ledger", "سجل حركة المخزون"), top_=0),
                  f'<img class="pho" src="{MAP("map-crop")}" alt="" style="height:440px">',
                  U.rowscard([(t("On hand", "الرصيد"), "", L("500"), "num"), (t("Available", "المتاح"), "", L("420"), "okc"), (t("Incoming", "القادم"), t("Sea · 12 days", f"بحر · {L(12)} يوم"), L("600"), "num")], lab=t("LED Strip 5m · WH-01", f"لمبات LED · {L('WH-01')}"), top_=0),
                  U.rowscard([(L("ADJ-00025"), t("Stock adjustment · −4", f"تسوية مخزنية · {L('−4')}"), t("Pending approval", "بانتظار الموافقة"), "sp"), (t("Reason", "السبب"), t("Count variance", "فرق جرد"), "", "sp")], top_=0)]
        tips = [t("Log it when it moves: one message from the phone.", "سجّلها وقت تتحرّك: رسالة وحدة من التلفون."),
                t("Every move carries a name and a time, so anyone can answer.", "كل حركة إلها اسم ووقت، فأي حدا فيه يجاوب."),
                t("Check the map first. Every warehouse, live.", "شوف الخريطة أوّل. كل مستودع، مباشرة."),
                t("Quote what's available. Incoming joins once it's received.", "أعطي المتاح. القادم بينضاف لمّا يتسلّم."),
                t("Record an adjustment with a reason. The history stays.", "سجّل تسوية مع سبب. والتاريخ بيضلّ.")]
        slides = [dict(bg=PII("SE-03"), h=h[l == "ar"], s=s[l == "ar"], cover=True)]
        for i in range(5):
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=[proofs[i], better(tips[i])], col_top=440))
        slides.append(fin(l, sl[5][l == "ar"], t("Logging from the phone, a name on every move, one live map, incoming kept apart, and adjustments that keep the history.",
                                                  "تسجيل من التلفون، اسم عكل حركة، خريطة وحدة مباشرة، القادم لحالو، وتسويات بتحافظ عالتاريخ.")))
        car(pid, l, slides, "habits to leave", css=R4_CSS)


# ---------------------------------------------------------------- JAN-02
def jan02():
    pid = "JAN-02"
    h = ("The 5 states<br><em>of a stock transfer.</em>", "الحالات الخمسة<br><em>للتحويل المخزني.</em>")
    s = ("Most \"missing\" stock is stuck between two of them.", "أغلب البضاعة «الضايعة» عالقة بين حالتين منن.")
    sl = [("1. Pending approval:<br><em>is it allowed?</em>", "1. بانتظار الموافقة:<br><em>مسموح؟</em>"),
          ("2. Approved:<br><em>who prepares it?</em>", "2. تمت الموافقة:<br><em>مين بيجهّزها؟</em>"),
          ("3. Ready to dispatch:<br><em>is it packed?</em>", "3. جاهز للشحن:<br><em>توضّبت؟</em>"),
          ("4. In transit:<br><em>where is it now?</em>", "4. قيد النقل:<br><em>وينها هلّق؟</em>"),
          ("5. Received:<br><em>did it all arrive?</em>", "5. تمّ الاستلام:<br><em>وصلت كلّها؟</em>"),
          ("With Stacko,<br><em>every state is on the map.</em>", "مع ستاكو،<br><em>كل حالة عالخريطة.</em>")]
    cap = ("Most \"missing\" stock between branches isn't missing. It's stuck between two states nobody recorded.\n\n"
           "Pending approval, approved, ready to dispatch, in transit, received: each one answers a question, and the stock only leaves on dispatch and only lands on receipt.\n\n"
           "In Stacko, every transfer shows its state, and the ones on the road drive on the map with their ETA.",
           "أغلب البضاعة «الضايعة» بين الفروع مش ضايعة. هيّي عالقة بين حالتين ما حدا سجّلهن.\n\n"
           "بانتظار الموافقة، تمت الموافقة، جاهز للشحن، قيد النقل، تمّ الاستلام: كل حالة بتجاوب عسؤال، والبضاعة بتطلع بس عند الشحن وبتوصل بس عند الاستلام.\n\n"
           "بستاكو، كل تحويل بيبيّن حالته، واللي عالطريق بيمشوا عالخريطة مع وقت الوصول.")
    reg(pid, "5-states-transfer", "2027-01-08", "Carousel", h, s, cap, slides=[h] + sl,
        note="States and terms from app/docs/TERMINOLOGY.md (Pending approval, Approved / To prepare, Ready to dispatch, In transit, Received; partially received is a badge). "
             "The plan said 'requested, approved, dispatched, in transit, received'; renamed to the app's terms. Stock leaves the source on dispatch and lands on receipt. CHECK the publish date (no date in the plan).")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        eff = [t("Nothing has moved yet. A manager checks the request.", "بعد ما تحرّك شي. المدير بيراجع الطلب."),
               t("The sending warehouse is asked to prepare it. The 40 are now committed.", f"المستودع اللي باعت بيجهّزها. الـ{L(40)} صاروا ملتزم بهن."),
               t("Packed and waiting for the truck. Still counted in Beirut.", "موضّبة وناطرة الشاحنة. بعدها محسوبة ببيروت."),
               t("Out of Beirut, not in Sidon yet: in transit, with an ETA.", "طلعت من بيروت، وبعد ما وصلت صيدا: قيد النقل، مع وقت وصول."),
               t("Lands in Sidon. If 38 arrive, say so: partially received, with a reason.", f"بتوصل صيدا. إذا وصل {L(38)}، قولها: مستلم جزئياً، مع سبب.")]
        slides = [dict(bg=PII("SC-01"), h=h[l == "ar"], s=s[l == "ar"], cover=True)]
        for i in range(5):
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=[stepper(l, i), EX(eff[i])], col_top=440))
        slides.append(fin(l, sl[5][l == "ar"], t("Every transfer shows its state, and the ones on the road drive on the map with their ETA.",
                                                  "كل تحويل بيبيّن حالته، واللي عالطريق بيمشوا عالخريطة مع وقت الوصول."), "light"))
        car(pid, l, slides, "5 states", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- D30-29
def d3029():
    pid = "D30-29"
    h = ("Shenzhen to your shelf:<br><em>the 4 legs of a China import.</em>", "من شنزن لرفّك:<br><em>المراحل الأربعة للاستيراد من الصين.</em>")
    s = ("Durations are typical and vary by carrier and season.", "المدد تقريبية وبتتغيّر حسب الشحن والموسم.")
    sl = [("Leg 1: factory<br><em>to port.</em>", "المرحلة 1: من المعمل<br><em>للمرفأ.</em>"),
          ("Leg 2: the sea,<br><em>about a month.</em>", "المرحلة 2: البحر،<br><em>حوالي شهر.</em>"),
          ("Or by air:<br><em>hours, not weeks.</em>", "أو بالجوّ:<br><em>ساعات، مش أسابيع.</em>"),
          ("Leg 3: customs,<br><em>the least predictable.</em>", "المرحلة 3: الجمرك،<br><em>الأصعب توقّعاً.</em>"),
          ("Leg 4: the truck<br><em>to your warehouse.</em>", "المرحلة 4: الشاحنة<br><em>لمستودعك.</em>"),
          ("Where it<br><em>goes wrong.</em>", "وين بتخرب<br><em>الشغلة.</em>"),
          ("With Stacko,<br><em>every leg is on the map.</em>", "مع ستاكو،<br><em>كل مرحلة عالخريطة.</em>")]
    cap = ("For importers, stock spends weeks \"somewhere\". Knowing which leg it's on changes how you sell it.\n\n"
           "Factory to port, the sea (about a month from Shenzhen via Suez to Beirut) or the air (hours), customs (often a couple of days, the least predictable), then the truck to your warehouse.\n\n"
           "In Stacko, an incoming shipment shows each leg with its ETA on the map, and the stock joins the warehouse only when it's received.\n\nDurations are typical and vary by carrier and season.",
           "عند المستوردين، البضاعة بتقضّي أسابيع «بمحلّ ما». إنك تعرف بأي مرحلة صارت بيغيّر كيف بتبيعها.\n\n"
           "من المعمل للمرفأ، البحر (حوالي شهر من شنزن عبر السويس لبيروت) أو الجوّ (ساعات)، الجمرك (غالباً يومين، والأصعب توقّعاً)، وبعدها الشاحنة لمستودعك.\n\n"
           "بستاكو، الشحنة الواردة بتبيّن كل مرحلة مع وقت وصولها عالخريطة، والبضاعة بتنضاف عالمستودع بس لمّا تتسلّم.\n\nالمدد تقريبية وبتتغيّر حسب الشحن والموسم.")
    reg(pid, "shenzhen-shelf-4-legs", "2026-12-29", "Carousel", h, s, cap, slides=[h] + sl,
        note="Durations from the product bible, marked typical. 'Save this' removed from the visuals; last slide shows the incoming shipment on the Stacko map.")
    keys = ["fac", "sea", "cus", "road", "wh"]
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        ex = [t("Goods leave the supplier. They're yours on paper, not on your shelf.", "البضاعة بتطلع من المورّد. إلك عالورق، مش عرفّك."),
              t("Shenzhen → Suez → Port of Beirut. Typically around 30 days.", f"{L('Shenzhen → Suez → Beirut')}. عادةً حوالي {L(30)} يوم."),
              t("Guangzhou → Beirut in about 14 hours, plus customs. At a cost.", f"{L('Guangzhou → Beirut')} بحوالي {L(14)} ساعة، زائد الجمرك. بس بكلفة."),
              t("Typically about two days, and the leg most likely to slip.", "عادةً حوالي يومين، وهيّي المرحلة اللي ممكن تتأخّر أكتر."),
              t("The last leg, and the one where boxes go missing.", "آخر مرحلة، وهيّي اللي بتضيع فيها الكراتين."),
              t("For weeks the stock is \"somewhere\", and nobody records which leg it's on.", "لأسابيع البضاعة «بمحلّ ما»، وما حدا بيسجّل بأي مرحلة.")]
        imgs = [photo("SC-10", 420), photo("SC-17", 420), None, photo("SC-11", 420), photo("SC-01", 420), None]
        ons = [0, 1, None, 2, 3, None]
        slides = [dict(bg=PII("OB-12"), h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=f'<div style="position:absolute;left:64px;right:64px;bottom:150px">{legs(l, keys, -1)}</div>')]
        for i in range(6):
            if i == 2:
                col = [legs(l, ["fac", "air", "cus", "road", "wh"], 1), U.legcard(L("SHP-24033"), t("ETA 2 days", "بعد يومين"), [(14, ""), (30, "c"), (10, "t")], [t("Air", "جوّ"), t("Customs", "جمرك"), t("Truck", "شاحنة")], top_=0)]
            elif i == 5:
                col = [legs(l, keys, -1), U.rowscard([(L("SHP-24021"), t("Somewhere at sea?", "بمحلّ ما بالبحر؟"), "?", "sp"), (L("SHP-24018"), t("Cleared customs?", "خلّص جمرك؟"), "?", "sp"), (L("SHP-24015"), t("On a truck?", "عالشاحنة؟"), "?", "sp")], top_=0)]
            else:
                col = [imgs[i], legs(l, keys, ons[i])]
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=col + [EX(ex[i])], col_top=430))
        slides.append(fin(l, sl[6][l == "ar"], t("An incoming shipment shows each leg with its ETA on the map, and the stock joins the warehouse only when it's received.",
                                                  "الشحنة الواردة بتبيّن كل مرحلة مع وقت وصولها عالخريطة، والبضاعة بتنضاف عالمستودع بس لمّا تتسلّم.")))
        car(pid, l, slides, "4 legs", css=R4_CSS + JR_CSS)


def status_rows(l, rows, lab=""):
    """rows: (code, text, status key). Status pills in the app's terms."""
    t = T(l)
    names = {"draft": t("Draft", "مسودة"), "pend": t("Pending approval", "بانتظار الموافقة"), "ok": t("Approved", "تمت الموافقة"), "trans": t("In transit", "قيد النقل"),
             "done": t("Completed", "مكتملة"), "part": t("Partially received", "مستلم جزئياً"), "rej": t("Rejected", "مرفوض")}
    col = {"draft": "#E7ECF2;color:#41536A", "pend": "#FFF1D6;color:#8A5A00", "ok": "#BCE5E0;color:#0B7A87", "trans": "#DCEFFA;color:#2F86B8", "done": "#BCE5E0;color:#0B7A87",
           "part": "#FFF1D6;color:#8A5A00", "rej": "#FBE3E7;color:#B4233C"}
    rr = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="pill" style="background:{col[k]};font-size:22px">{names[k]}</span></div>' for a, b, k in rows)
    return card((f'<div class="lab">{lab}</div>' if lab else "") + f'<div class="rws">{rr}</div>', 0)


def shot(src, img_w, x, y, w, h, disp=892):
    """A sharp crop of a real capture in a white frame (r3_lib.crop)."""
    return crop(src, img_w, x, y, w, h, disp)


# ---------------------------------------------------------------- D30-11
def d3011():
    pid = "D30-11"
    h = ("One message moves<br><em>40 LED strips.</em>", f"رسالة وحدة بتنقل<br><em>{L(40)} لمبة LED.</em>")
    s = ("From the phone to the map, step by step.", "من التلفون للخريطة، خطوة بخطوة.")
    sl = [("1. The message,<br><em>as Hadi says it.</em>", "1. الرسالة،<br><em>متل ما بيقولها هادي.</em>"),
          ("2. AI reads<br><em>the four parts.</em>", "2. الذكاء الاصطناعي بيقرا<br><em>الأجزاء الأربعة.</em>"),
          ("3. A draft,<br><em>not a decision.</em>", "3. مسودة،<br><em>مش قرار.</em>"),
          ("4. The manager<br><em>approves or rejects.</em>", "4. المدير<br><em>بيوافق أو بيرفض.</em>"),
          ("5. Stock leaves Beirut,<br><em>the truck shows up.</em>", "5. البضاعة بتطلع من بيروت،<br><em>والشاحنة بتطلع عالخريطة.</em>"),
          ("6. It lands in Sidon,<br><em>with a name and a time.</em>", "6. بتوصل صيدا،<br><em>مع اسم ووقت.</em>"),
          ("With Stacko,<br><em>one message is the log.</em>", "مع ستاكو،<br><em>رسالة وحدة هيّي التسجيل.</em>")]
    cap = ("The whole idea of Stacko in eight slides.\n\nHadi sends one message from his phone. AI reads the item, the quantity, where from and where to, and drafts the transfer. "
           "Nothing moves until the manager approves it. Then Beirut drops by 40, a truck drives on the map with its ETA, and Sidon goes up by 40 on arrival, logged with who, what and when.",
           "فكرة ستاكو كلّها بتمان سلايدات.\n\nهادي بيبعت رسالة وحدة من تلفونه. الذكاء الاصطناعي بيقرا الصنف، الكمية، من وين ولوين، وبيحضّر التحويل. "
           "ما في شي بيتحرّك قبل ما يوافق المدير. بعدها بيروت بتنقص 40، شاحنة بتمشي عالخريطة مع وقت الوصول، وصيدا بتزيد 40 لمّا توصل، متسجّلة مع مين وشو وإيمتى.")
    reg(pid, "one-telegram-message-becomes", "2026-12-11", "Carousel", h, s, cap, slides=[h] + sl,
        note="Telegram is not named (owner rule): 'one message from the phone'. No Prototype labels. 'Save it, or send it' removed from the caption. Numbers are samples (Beirut 420 → 380, Sidon 85 → 125).")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        msg = t('sent <b style="background:#FFF1D6;padding:0 6px;border-radius:6px">40</b> <b style="background:#DCEFFA;padding:0 6px;border-radius:6px">LED strips</b> from <b style="background:#BCE5E0;padding:0 6px;border-radius:6px">Beirut</b> to <b style="background:#FBE3E7;padding:0 6px;border-radius:6px">Sidon</b>',
                'بعتت <b style="background:#FFF1D6;padding:0 6px;border-radius:6px">40</b> <b style="background:#DCEFFA;padding:0 6px;border-radius:6px">لمبة LED</b> من <b style="background:#BCE5E0;padding:0 6px;border-radius:6px">بيروت</b> لـ<b style="background:#FBE3E7;padding:0 6px;border-radius:6px">صيدا</b>')
        parsed = U.rowscard([(t("Item", "الصنف"), "", t("LED Strip 5m", "لمبات LED"), "okc"), (t("Quantity", "الكمية"), "", L(40), "okc"), (t("From", "من"), "", t("WH-01 · Beirut", f"{L('WH-01')} · بيروت"), "okc"), (t("To", "إلى"), "", t("WH-02 · Sidon", f"{L('WH-02')} · صيدا"), "okc")], top_=0)
        btn = "flex:1;text-align:center;border-radius:16px;padding:16px 0;font-size:28px;font-weight:600"
        approve = card(f'<div class="lab">{L("TRF-00014")} · {t("40 × LED Strip 5m · Beirut → Sidon", f"{L(40)} لمبة LED · بيروت ← صيدا")}</div>'
                       f'<div style="display:flex;gap:16px;margin-top:18px"><div style="{btn};background:#0E8FA0;color:#fff">{t("Approve", "موافقة")}</div><div style="{btn};background:#EEF4F7;color:#0E2440">{t("Reject", "رفض")}</div></div>', 0)
        rules = U.rowscard([(t("Approve", "موافقة"), t("the transfer goes ahead", "التحويل بيمشي"), "✓", "okc"), (t("Reject", "رفض"), t("no stock moves", "ما في بضاعة بتتحرّك"), "✕", "sp"), (t("Not enough stock", "الكمية مش كافية"), t("blocked", "ممنوع"), "!", "sp")], top_=0)
        leave = U.rowscard([(L("WH-01"), t("Beirut", "بيروت"), L("420 → 380"), "num"), (t("On the road", "عالطريق"), t("ETA 1h 20m", "ساعة و20 دقيقة"), L("40"), "okc")], top_=0)
        land = U.rowscard([(L("WH-02"), t("Sidon", "صيدا"), L("85 → 125"), "okc"), (L("TRF-00014"), t("Hadi · approved by Karim", "هادي · وافق كريم"), L("10:32"), "num")], lab=t("Inventory ledger", "سجل حركة المخزون"), top_=0)
        slides = [dict(bg=BGI("BG-56"), h=h[l == "ar"], s=s[l == "ar"], cover=True,
                       extra=r3_lib.phone_html(r3_lib.chat(l, t(*CHAT_MOVE), t('<span class="okc">Logged ✓</span> Draft sent to Karim to approve', '<span class="okc">تسجّلت ✓</span> المسودة راحت لكريم ليوافق')), s=.85, left=150, top_=420)),
                  dict(bg=B, h=sl[0][l == "ar"], col=[U.chatcard(t(*CHAT_MOVE), t("Typed in 10 seconds, the way he'd say it.", f"انكتبت بـ{L(10)} ثواني، متل ما بيحكيها."), top_=0), EX(t("No form, no codes. Hadi types it the way he'd say it out loud.", "بلا استمارة ولا رموز. هادي بيكتبها متل ما بيقولها."))], col_top=450),
                  dict(bg=B, h=sl[1][l == "ar"], col=[card(f'<div style="font-size:34px;line-height:1.7">{msg}</div>', 0), parsed], col_top=430),
                  dict(bg=B, h=sl[2][l == "ar"], col=[status_rows(l, [(L("TRF-00014"), t("40 × LED Strip 5m", f"{L(40)} لمبة LED"), "pend")]), EX(t("A transfer draft goes to the manager. Nothing has moved yet.", "مسودة التحويل بتروح للمدير. بعد ما تحرّك شي."))], col_top=450),
                  dict(bg=B, h=sl[3][l == "ar"], col=[approve, rules], col_top=440),
                  dict(bg=B, h=sl[4][l == "ar"], col=[f'<img class="pho" src="{MAP("map-crop")}" alt="" style="height:380px">', leave], col_top=430),
                  dict(bg=B, h=sl[5][l == "ar"], col=[land, EX(t("Every move keeps who, what and when. Any number can be traced back.", "كل حركة بتحفظ مين وشو وإيمتى. وأي رقم فيك ترجع لأصله."))], col_top=450),
                  fin(l, sl[6][l == "ar"], t("Logging takes seconds, a manager always approves, and the map shows what happened.", "التسجيل بياخد ثواني، المدير دايماً بيوافق، والخريطة بتورجيك شو صار."))]
        car(pid, l, slides, "one message", css=R4_CSS)


# ---------------------------------------------------------------- D30-20
def d3020():
    pid = "D30-20"
    h = ("One screen.<br><em>Here's what it tells you.</em>", "شاشة وحدة.<br><em>هيدا اللي بتقلّك ياه.</em>")
    s = ("The Stacko live map, part by part.", "خريطة ستاكو المباشرة، جزء جزء.")
    sl = [("1. Every warehouse<br><em>is a building.</em>", "1. كل مستودع<br><em>هوّي مبنى.</em>"),
          ("2. A truck<br><em>is a transfer.</em>", "2. الشاحنة<br><em>هيّي تحويل.</em>"),
          ("3. The top line:<br><em>the whole business.</em>", "3. السطر الفوقاني:<br><em>الشغل كلّه.</em>"),
          ("4. Tap a building:<br><em>its stock.</em>", "4. اكبس عالمبنى:<br><em>بتشوف كميّاته.</em>"),
          ("With Stacko,<br><em>everything that moves was logged.</em>", "مع ستاكو،<br><em>كل شي بيتحرّك متسجّل.</em>")]
    cap = ("The map isn't decoration. Every building, truck and ship on it is a real stock move someone logged.\n\n"
           "Warehouses with their units and low-stock count, transfers on the road with their ETA, the totals across the business, and each warehouse's stock one tap away.\n\nThat's the idea behind Stacko: make logging visible, and people log.",
           "الخريطة مش زينة. كل مبنى وشاحنة وباخرة عليها هيّي حركة حقيقية حدا سجّلها.\n\n"
           "المستودعات مع كميّاتها والأصناف الناقصة، التحويلات عالطريق مع وقت وصولها، المجموع لكل الشغل، وكميّات كل مستودع بكبسة وحدة.\n\nهيدي فكرة ستاكو: خلّي التسجيل يبيّن، والناس بتسجّل.")
    reg(pid, "one-screen-explained", "2026-12-20", "Carousel", h, s, cap, slides=[h] + sl,
        note="Real demo-company capture (en/ar-map-clean), zoomed per part so the text stays readable. 'DM us' CTA and Prototype label removed. Overlaps EDU-45; approve one of the two.")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        src = CAP(f"{l}-map-clean")
        # en-map-clean is 2065 px wide; the Arabic capture is mirrored (panel on the left), so the boxes flip horizontally
        fx = (lambda x, w: x) if l == "en" else (lambda x, w: 2065 - x - w)
        wh = (428, 325, 520, 200)
        kpi = (66, 18, 1932, 137)
        panel = (1283, 177, 716, 1100)
        mp = (66, 155, 1214, 1121)
        bx = lambda b: (fx(b[0], b[2]), b[1], b[2], b[3])
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[shot(src, 2065, *bx(mp))], col_top=440),
                  dict(bg=B, h=sl[0][l == "ar"], col=[shot(src, 2065, *bx(wh)), EX(t("Each warehouse sits where it really is, with its units and how many lines are low.", "كل مستودع بمحلّه الحقيقي، مع كميّاته وقدّيش صنف ناقص."))], col_top=450),
                  dict(bg=B, h=sl[1][l == "ar"], col=[f'<img class="pho" src="{MAP("map-crop")}" alt="" style="height:440px">', EX(t("A truck on the road is a transfer in progress, with a countdown to arrival.", "الشاحنة عالطريق هيّي تحويل ماشي، مع عدّ تنازلي للوصول."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[shot(src, 2065, *bx((66, 18, 966, 137))), shot(src, 2065, *bx((1032, 18, 966, 137))), EX(t("Units in stock, units in transit, what's moving by sea, air and road, and low-stock lines.", "الكميّات بالمخازن، اللي قيد النقل، اللي ماشي بحر وجوّ وبرّ، والأصناف الناقصة."))], col_top=470),
                  dict(bg=B, h=sl[3][l == "ar"], col=[shot(src, 2065, *bx(panel), disp=560)], col_top=430,
                       extra=f'<div style="position:absolute;left:64px;right:64px;bottom:150px"></div>'),
                  fin(l, sl[4][l == "ar"], t("Every building, truck and ship is a move someone logged. Make logging visible, and people log.", "كل مبنى وشاحنة وباخرة هيّي حركة حدا سجّلها. خلّي التسجيل يبيّن، والناس بتسجّل."))]
        car(pid, l, slides, "one screen", css=R4_CSS + ".col .mapc{align-self:center}")


# ---------------------------------------------------------------- UED-01
def ued01():
    pid = "UED-01"
    h = ("You logged it.<br><em>Why didn't the number change?</em>", "سجّلتها.<br><em>ليش الرقم ما تغيّر؟</em>")
    s = ("Usually the answer is the status.", "غالباً الجواب هوّي الحالة.")
    sl = [("It's waiting<br><em>for approval.</em>", "ناطرة<br><em>الموافقة.</em>"),
          ("Your rules decide<br><em>what needs approval.</em>", "قواعدك بتقرّر<br><em>شو بدّو موافقة.</em>"),
          ("A transfer changes stock<br><em>twice.</em>", "التحويل بيغيّر الرصيد<br><em>مرّتين.</em>"),
          ("Still a draft,<br><em>or rejected?</em>", "بعدها مسودة،<br><em>ولا انرفضت؟</em>"),
          ("With Stacko,<br><em>every move shows its status.</em>", "مع ستاكو،<br><em>كل حركة بتبيّن حالتها.</em>")]
    cap = ("\"I logged it, so why is the number the same?\" Usually the answer is the status.\n\n"
           "A move changes stock only once it's approved. A transfer takes stock out of the sending warehouse when it's dispatched and adds it to the other one when it's received. A draft hasn't been submitted, and a rejected move never changes stock.\n\n"
           "In Stacko, every transaction shows its status, so the answer is one tap away.",
           "«سجّلتها، ليش الرقم بعدو نفسه؟» غالباً الجواب هوّي الحالة.\n\n"
           "الحركة بتغيّر الرصيد بس لمّا تنوافق. التحويل بيطلّع البضاعة من المستودع اللي باعت وقت تنشحن، وبيزيدها عالتاني لمّا تتسلّم. المسودة بعدها ما انبعتت، والحركة المرفوضة ما بتغيّر شي.\n\n"
           "بستاكو، كل حركة بتبيّن حالتها، فالجواب بكبسة وحدة.")
    reg(pid, "submitted-number-didnt-change", None, "Carousel", h, s, cap, slides=[h] + sl,
        note="User-education post. Statuses and rules from the app (app/docs/PLAN.md task 6 and TERMINOLOGY.md): approval rules by type, location and quantity; seeded so documents, adjustments and opening stock need approval and other moves are auto-approved. Manual page not written here.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        pend = status_rows(l, [(L("ADJ-00025"), t("Stock adjustment · −4", f"تسوية مخزنية · {L('−4')}"), "pend")])
        stock = U.rowscard([(t("Desk Lamp · WH-01", f"لمبة مكتب · {L('WH-01')}"), t("On hand", "الرصيد"), L("150"), "num")], top_=0)
        rules = U.rowscard([(t("Stock adjustments", "التسويات المخزنية"), t("need a manager", "بدّها مدير"), "✓", "okc"), (t("Incoming documents", "المستندات الواردة"), t("need a manager", "بدّها مدير"), "✓", "okc"),
                            (t("Small transfers", "التحويلات الصغيرة"), t("approved automatically", "بتنوافق لحالها"), "↻", "okc")], lab=t("Approval rules · your company", "قواعد الموافقة · شركتك"), top_=0)
        two = U.rowscard([(t("Dispatched", "انشحنت"), t("WH-01 Beirut", f"{L('WH-01')} بيروت"), L("420 → 380"), "num"), (t("In transit", "قيد النقل"), t("on the road", "عالطريق"), L("40"), "okc"), (t("Received", "تسلّمت"), t("WH-02 Sidon", f"{L('WH-02')} صيدا"), L("85 → 125"), "okc")], lab=L("TRF-00014"), top_=0)
        other = status_rows(l, [(L("TRF-00016"), t("not submitted yet", "بعدها ما انبعتت"), "draft"), (L("ADJ-00026"), t("reason: count again first", "السبب: عِدّ مرّة تانية أوّل"), "rej")])
        slides = [dict(bg=PII("OB-36"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=[pend, stock, EX(t("A move changes stock only once it's approved. Until then, the 150 stays 150.", f"الحركة بتغيّر الرصيد بس لمّا تنوافق. لهون، الـ{L(150)} بتضلّ {L(150)}."))], col_top=440),
                  dict(bg=B, h=sl[1][l == "ar"], col=[rules, EX(t("Which moves need a second person is set per company, by type, location and quantity.", "أيّا حركات بدّها شخص تاني بيتحدّد لكل شركة، حسب النوع والموقع والكمية."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[two, EX(t("Out of Beirut on dispatch, into Sidon only when it's received.", "بتطلع من بيروت وقت الشحن، وبتفوت عصيدا بس لمّا تتسلّم."))], col_top=440),
                  dict(bg=B, h=sl[3][l == "ar"], col=[other, EX(t("A draft hasn't been sent. A rejected move never changes stock, and the reason stays with it.", "المسودة بعدها ما انبعتت. والحركة المرفوضة ما بتغيّر شي، والسبب بيضلّ معها."))], col_top=450),
                  fin(l, sl[4][l == "ar"], t("Every transaction shows its status, so \"why didn't it change?\" has an answer one tap away.", "كل حركة بتبيّن حالتها، فـ«ليش ما تغيّر؟» إلها جواب بكبسة وحدة."), "light")]
        car(pid, l, slides, "why the number didn't change", theme="light", css=R4_CSS)


def story4(pid, l, i, n, h, s, inner):
    """A 1080×1920 story frame (build_page_kit layout) with the round-4 card styles."""
    lines = h.count("<br>") + 1
    hs = r3_lib.fit(h, 86 if l == "en" else 74, l)
    st = int((270 + lines * hs * 1.06 + 26) if l == "en" else (262 + lines * hs * 1.32 + 14))
    fn = (f'<div class="fn">{i} / {n}</div>' if l == "en" else f'<div class="fn">{i} من {n}</div>') if n > 1 else ""
    body = f'{PK.STORY_BG}<h1 class="h1" style="font-size:{hs}px">{h}</h1><p class="sub" style="top:{st}px">{s}</p>{inner}{top(l)}{fn}{FOOT[l]}'
    nm = name(pid, l, i)
    write(pid, nm, page(l, f"{nm} · {r3_lib.clean(h)}", body, PK.ST_CSS + R4_CSS + JR_CSS + ".stk .wc{padding:30px 36px}.stk .rw2{font-size:32px}.stk .rw2 .sp{font-size:28px}", size=(1080, 1920)))


STK = lambda top_, *xs: f'<div class="stk" style="top:{top_}px">' + "".join(xs) + "</div>"


# ---------------------------------------------------------------- UED-05
def ued05():
    pid = "UED-05"
    h = ("Same product,<br><em>two names.</em>", "نفس الصنف،<br><em>اسمين.</em>")
    s = ("Why supplier descriptions never match your catalog.", "ليش وصف المورّد ما بيطابق أصنافك أبداً.")
    sl = [("Your supplier never<br><em>uses your code.</em>", "المورّد عمرو<br><em>ما بيستعمل رمزك.</em>"),
          ("Without a match,<br><em>it's created twice.</em>", "بلا ربط،<br><em>بينعمل مرّتين.</em>"),
          ("AI suggests the match.<br><em>A person confirms it.</em>", "الذكاء الاصطناعي بيقترح.<br><em>وشخص بيأكّد.</em>"),
          ("Confirm once,<br><em>remembered after.</em>", "أكّد مرّة،<br><em>وبينحفظ.</em>"),
          ("With Stacko,<br><em>one product, one item.</em>", "مع ستاكو،<br><em>صنف واحد، رمز واحد.</em>")]
    cap = ("Your supplier will never use your SKU. Matching their description to your item, and remembering it, is what stops the same product appearing twice in your stock.\n\n"
           "In Stacko, when an invoice is read, each line is matched to an item you already have. You confirm it once, the supplier's name for it is saved, and the next invoice matches on its own.",
           "المورّد عمرو ما رح يستعمل رمز الصنف تبعك. إنك تربط وصفه بالصنف عندك، وتحفظه، هوّي اللي بيمنع نفس الصنف يطلع مرّتين بمخازنك.\n\n"
           "بستاكو، لمّا تنقرا الفاتورة، كل سطر بينربط بصنف موجود عندك. بتأكّده مرّة، اسم المورّد إلو بينحفظ، والفاتورة الجايي بتنربط لحالها.")
    reg(pid, "supplier-aliases", None, "Carousel", h, s, cap, slides=[h] + sl,
        note="User-education post. Supplier aliases are built (item_aliases / partner_aliases, documents learn aliases on draft creation; app/docs/PLAN.md tasks 4 and 8). Manual page not written here.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        inv = card(f'<div class="lab">{t("Supplier invoice · Gulf Link", "فاتورة المورّد · Gulf Link")}</div>' + "".join(
            f'<div class="rw2" style="direction:ltr"><b>{a}</b><span class="sp"></span><span class="num">{b}</span></div>' for a, b in (("LED STRIP 5M WW 12V", "40 CTN"), ("USB TYPE-C CBL 1M", "120 PCS"))), 0)
        mine = U.rowscard([(L("LED-5M"), t("LED Strip 5m", "لمبات LED"), "", "sp"), (L("USBC-1M"), t("USB-C Cable", "كابل USB-C"), "", "sp")], lab=t("Your items", "أصنافك"), top_=0)
        twice = U.rowscard([(t("LED Strip 5m", "لمبات LED"), L("LED-5M"), L("500"), "num"), (L("LED STRIP 5M WW 12V"), t("new item?", "صنف جديد؟"), L("40"), "zero")], top_=0)
        match = card(f'<div class="lab">{t("Invoice line", "سطر الفاتورة")}</div><b class="t" style="direction:ltr;text-align:start">LED STRIP 5M WW 12V</b>'
                     f'<div class="rw2" style="margin-top:10px"><span class="sp">{t("Matches", "بيطابق")}</span><b>{t("LED Strip 5m · LED-5M", f"لمبات LED · {L('LED-5M')}")}</b><span class="okc">✓ {t("Confirm", "أكّد")}</span></div>', 0)
        alias = U.rowscard([(L("LED STRIP 5M WW 12V"), "Gulf Link", "✓", "okc"), (L("LED-STR-5-WW"), "Shenzhen Lights", "✓", "okc")], lab=t("LED Strip 5m · supplier names", "لمبات LED · أسامي الموردين"), top_=0)
        slides = [dict(bg=PII("OB-45"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=[inv, mine], col_top=430),
                  dict(bg=B, h=sl[1][l == "ar"], col=[twice, EX(t("Same product, two items, and neither count is right.", "نفس الصنف، صنفين بالسيستم، وولا رقم صحيح."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[match, EX(t("Nothing is created until someone confirms the match.", "ما في شي بينعمل قبل ما حدا يأكّد الربط."))], col_top=450),
                  dict(bg=B, h=sl[3][l == "ar"], col=[alias, EX(t("The next invoice from that supplier matches on its own.", "الفاتورة الجايي من نفس المورّد بتنربط لحالها."))], col_top=450),
                  fin(l, sl[4][l == "ar"], t("Invoice lines are matched to your items, you confirm once, and each supplier's names are remembered.", "سطور الفاتورة بتنربط بأصنافك، بتأكّد مرّة، وأسامي كل مورّد بتنحفظ."), "light")]
        car(pid, l, slides, "supplier aliases", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- UED-06
def ued06():
    pid = "UED-06"
    h = ("Approve every move,<br><em>or only the ones that matter?</em>", "توافق على كل حركة،<br><em>ولا بس عالمهمّين؟</em>")
    s = ("Approval rules decide which moves need a second person.", "قواعد الموافقة بتقرّر أيّا حركات بدّها شخص تاني.")
    sl = [("Approve everything:<br><em>the floor waits.</em>", "توافق على كل شي:<br><em>الأرض بتنطر.</em>"),
          ("Approve nothing:<br><em>no one checks.</em>", "ما توافق على شي:<br><em>ما حدا بيراجع.</em>"),
          ("Rules: by type,<br><em>place and size.</em>", "القواعد: حسب النوع،<br><em>الموقع والحجم.</em>"),
          ("Can people approve<br><em>their own moves?</em>", "فيك توافق<br><em>عحركاتك؟</em>"),
          ("With Stacko,<br><em>control without the queue.</em>", "مع ستاكو،<br><em>سيطرة بلا طابور.</em>")]
    cap = ("Approving everything slows the floor down. Approving nothing loses control.\n\n"
           "In Stacko, approval rules follow the move's type, location and quantity or value: small routine moves can be approved automatically, adjustments and big transfers wait for a manager, and your company decides whether people may approve their own moves.",
           "إذا وافقت على كل شي، الأرض بتبطّى. وإذا ما وافقت على شي، بتفلت الأمور.\n\n"
           "بستاكو، قواعد الموافقة بتمشي حسب نوع الحركة، الموقع، والكمية أو القيمة: الحركات الصغيرة والعادية بتنوافق لحالها، التسويات والتحويلات الكبيرة بتنطر المدير، وشركتك بتقرّر إذا الشخص فيه يوافق عحركاته.")
    reg(pid, "approve-every-move", None, "Carousel", h, s, cap, slides=[h] + sl,
        note="User-education post. Approval rules by type, location and qty/value threshold, auto-approve and the self-approval setting are built (app/docs/PLAN.md tasks 6 and management screens). Manual page not written here.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        queue = status_rows(l, [(L("TRF-00021"), t("2 × Desk Lamp", f"{L(2)} لمبة مكتب"), "pend"), (L("TRF-00022"), t("1 × USB-C Cable", f"{L(1)} كابل"), "pend"), (L("RCV-00011"), t("6 × LED Strip", f"{L(6)} لمبة LED"), "pend"), (L("TRF-00023"), t("3 × Desk Lamp", f"{L(3)} لمبة مكتب"), "pend")],
                            lab=t("Waiting for you · 14", f"ناطرين موافقتك · {L(14)}"))
        loose = status_rows(l, [(L("ADJ-00031"), t("−40 LED Strip · no reason", f"{L('−40')} لمبة LED · بلا سبب"), "done")])
        rules = U.rowscard([(t("Stock adjustments", "التسويات المخزنية"), t("any size", "أي كمية"), t("Manager", "المدير"), "okc"), (t("Transfers", "التحويلات"), t("over 100 units", f"فوق {L(100)} قطعة"), t("Manager", "المدير"), "okc"),
                            (t("Transfers", "التحويلات"), t("up to 100 units", f"لحدّ {L(100)} قطعة"), t("Automatic", "تلقائي"), "okc"), (t("Receipts", "الاستلام"), t("WH-03 only", f"{L('WH-03')} بس"), t("Manager", "المدير"), "okc")], lab=t("Approval rules", "قواعد الموافقة"), top_=0)
        sw = card(f'<div class="rw2"><b>{t("Self-approval", "الموافقة الذاتية")}</b><span class="sp">{t("people approve their own moves", "الشخص بيوافق عحركاته")}</span>'
                  f'<span class="pill" style="background:#E7ECF2;color:#41536A;font-size:22px">{t("Off", "مطفاية")}</span></div>', 0)
        slides = [dict(bg=PII("OB-14"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
                  dict(bg=B, h=sl[0][l == "ar"], col=[queue, EX(t("Fourteen small moves in the queue, and the truck is waiting.", f"{L(14)} حركة صغيرة ناطرة، والشاحنة ناطرة."))], col_top=430),
                  dict(bg=B, h=sl[1][l == "ar"], col=[loose, EX(t("A wrong adjustment changes stock, and nobody looked at it.", "تسوية غلط بتغيّر الرصيد، وما حدا تطلّع فيها."))], col_top=450),
                  dict(bg=B, h=sl[2][l == "ar"], col=[rules, EX(t("Small routine moves go through. The ones that matter wait for a manager.", "الحركات الصغيرة بتمرق. والمهمّة بتنطر المدير."))], col_top=430),
                  dict(bg=B, h=sl[3][l == "ar"], col=[sw, EX(t("Your company decides. With it off, the person who logs a move can't approve it.", "شركتك بتقرّر. إذا مطفاية، اللي بيسجّل الحركة ما فيه يوافق عليها."))], col_top=470),
                  fin(l, sl[4][l == "ar"], t("Rules follow the type, location and size of each move, so managers approve what matters and the rest keeps moving.", "القواعد بتمشي حسب نوع وموقع وحجم كل حركة، فالمدير بيوافق عالمهمّ والباقي بيمشي."), "light")]
        car(pid, l, slides, "approval rules", theme="light", css=R4_CSS)


# ---------------------------------------------------------------- D30-04 (story)
def d3004():
    pid = "D30-04"
    fr = [("When stock moves,<br><em>when does your system know?</em>", "لمّا البضاعة تتحرّك،<br><em>إيمتى السيستم بيعرف؟</em>", "09:10 · 40 boxes leave Beirut.", f"{L('09:10')} · {L(40)} كرتونة طلعوا من بيروت."),
          ("In a notebook:<br><em>17:30, maybe.</em>", "بالدفتر:<br><em>17:30، يمكن.</em>", "Eight hours of a wrong number.", "تمان ساعات والرقم غلط."),
          ("With Stacko:<br><em>09:10.</em>", "مع ستاكو:<br><em>09:10.</em>", "One message from the phone, as the truck leaves.", "رسالة وحدة من التلفون، وقت الشاحنة تطلع."),
          ("The record moves<br><em>with the stock.</em>", "التسجيل بيمشي<br><em>مع البضاعة.</em>", "And everyone sees it on the live map.", "والكل بيشوفها عالخريطة المباشرة.")]
    reg(pid, "stock-updated-when-moves", "2026-12-04", "Story", (fr[0][0], fr[0][1]), (fr[0][2], fr[0][3]), ("— (Stories)", "— (ستوريز)"), slides=[(a, b) for a, b, *_ in fr],
        note="Owner rule (12 Nov): no polls, quizzes or question stickers, so the four frames tell the story instead (when the system finds out, notebook vs Stacko). No Prototype label, no Telegram.")
    for l in LS:
        t = T(l)
        tl = card(f'<div class="tln">'
                  f'<div class="tlr"><span class="tm">09:10</span><span class="tx">{t("40 boxes leave Beirut", f"{L(40)} كرتونة طلعوا من بيروت")}</span></div>'
                  f'<div class="tlr"><span class="tm">13:00</span><span class="tx">{t("A customer is quoted the old number", "زبون أخد الرقم القديم")}</span></div>'
                  f'<div class="tlr"><span class="tm">17:30</span><span class="tx">{t("Someone writes it in the notebook", "حدا بيكتبها بالدفتر")}</span></div>'
                  f'<div class="tlr"><span class="tm bad">8h 20m</span><span class="tx bad">{t("of a wrong number", "والرقم غلط")}</span></div></div>', 0)
        inners = [STK(720, photo("SC-08", 760)),
                  STK(760, photo("SC-14", 420, "50% 78%"), tl),
                  PK.phone_chat(l, t(*CHAT_MOVE), t('<span class="okc">Logged ✓ 09:10</span> Beirut → Sidon is on the map', f'<span class="okc">تسجّلت ✓ {L("09:10")}</span> بيروت ← صيدا عالخريطة')),
                  PK.phone(CAP(f"{l}-ph-owner-map"), 560)]
        for i, (he, ha, se, sa) in enumerate(fr):
            story4(pid, l, i + 1, len(fr), t(he, ha), t(se, sa), inners[i])


# ---------------------------------------------------------------- D30-09 (story)
def d3009():
    pid = "D30-09"
    fr = [("Here's where stock tracking<br><em>breaks.</em>", "هون بينكسر<br><em>تتبّع البضاعة.</em>", "Supplier, port, warehouse, branch: three hand-offs.", "المورّد، المرفأ، المستودع، الفرع: تلات تسليمات."),
          ("Break 1:<br><em>the port.</em>", "الكسرة 1:<br><em>المرفأ.</em>", "With Stacko, every leg has a status and an ETA.", "مع ستاكو، كل مرحلة إلها حالة ووقت وصول."),
          ("Break 2:<br><em>between branches.</em>", "الكسرة 2:<br><em>بين الفروع.</em>", "With Stacko, stock on the road is in transit, not lost.", "مع ستاكو، البضاعة عالطريق قيد النقل، مش ضايعة."),
          ("Break 3:<br><em>moves logged later.</em>", "الكسرة 3:<br><em>حركات بتتسجّل بعدين.</em>", "With Stacko, one message logs it when it happens.", "مع ستاكو، رسالة وحدة بتسجّلها وقت تصير.")]
    reg(pid, "where-stock-tracking-breaks", "2026-12-09", "Story", (fr[0][0], fr[0][1]), (fr[0][2], fr[0][3]), ("— (Stories)", "— (ستوريز)"), slides=[(a, b) for a, b, *_ in fr],
        note="The plan's founder selfie and poll are replaced: no founder footage and no polls or question stickers (owner rule). Each break ends with the Stacko fix. CHECK: only talk about problems actually observed.")
    for l in LS:
        t = T(l)
        port = U.legcard(L("SHP-24021"), t("At customs · day 2", "بالجمرك · اليوم 2"), [(30, ""), (3, "t"), (2, "c")], [t("Sea ✓", "بحر ✓"), t("Customs", "جمرك"), t("Truck", "شاحنة")], top_=0)
        road = status_rows(l, [(L("TRF-00014"), t("40 × LED Strip · Beirut → Sidon", f"{L(40)} لمبة LED · بيروت ← صيدا"), "trans")])
        eta = U.rowscard([(t("On the road", "عالطريق"), t("ETA 1h 20m", "ساعة و20 دقيقة"), L("40"), "okc")], top_=0)
        inners = [STK(760, legs(l, ["fac", "sea", "cus", "wh", "road"], -1), photo("SC-11", 560)),
                  STK(760, photo("SC-17", 520), port),
                  STK(760, photo("SC-01", 520), road, eta),
                  PK.phone_chat(l, t("received 120 USB-C cables in Sidon", "استلمنا 120 كابل USB-C بصيدا"), t('<span class="okc">Logged ✓ 11:40</span> WH-02 Sidon +120', f'<span class="okc">تسجّلت ✓ {L("11:40")}</span> صيدا {L("+120")}'))]
        for i, (he, ha, se, sa) in enumerate(fr):
            story4(pid, l, i + 1, len(fr), t(he, ha), t(se, sa), inners[i])


FNS = [dec01, d3006, d3015, d3025, res03, res07, jan01, jan02, d3029, d3011, d3020, ued01, ued05, ued06, d3004, d3009]

if __name__ == "__main__":
    a = sys.argv[1:]
    only = a[a.index("--only") + 1].split(",") if "--only" in a else []
    for fn in FNS:
        if not only or fn.__name__ in only:
            fn()
    if "--dump" in a:
        dump(a[a.index("--dump") + 1])
    print("ok", list(REG))
