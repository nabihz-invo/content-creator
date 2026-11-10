"""Week of 15 Nov 2026, batch 2 (IDEA-076, IDEA-028, IDEA-010, IDEA-031, IDEA-078), EN + AR.

    python3 -I -X utf8 posts/2026-11/build_idea_week3.py          (from content/)

Copy comes from the CRM plan rows (source_metadata.content_plan); images from the visual library.
Helpers come from build_idea_week1.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_idea_week1 import FOOT, bar, page, top, write  # noqa: E402


def L(s):
    return f'<span class="ltr">{s}</span>'


def name(pid, lang, n=None):
    s = pid + ("-AR" if lang == "ar" else "")
    return s if n is None else f"{s}-{n:02d}"


# shared white cards (light text on dark posts, or on paper)
CARD_CSS = """
.wc{position:absolute;background:#fff;color:var(--abyss);border-radius:24px;padding:24px 30px;
  box-shadow:0 22px 60px rgba(14,36,64,.30)}
.wc .lab{font-size:20px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--signal)}
[dir=rtl] .wc .lab{letter-spacing:0;text-transform:none;font-size:22px}
.wc b.t{display:block;font-size:32px;letter-spacing:-.02em;margin-top:4px}
.num{font-variant-numeric:tabular-nums}
.zero{color:#B4233C;font-weight:600}
.okc{color:#0B7A87;font-weight:600}
.pill{display:inline-block;border-radius:999px;padding:4px 14px;font-size:20px;font-weight:700}
.pill.low{background:#FBE3E7;color:#B4233C}
.pill.ok{background:#BCE5E0;color:#0B7A87}
"""


# ---------------------------------------------------------------- IDEA-076 · ready for White Friday? (static, dark, SE-01)
def idea_076():
    css = CARD_CSS + """
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.cd{position:absolute;left:700px;top:500px;display:flex;align-items:baseline;gap:12px;background:rgba(14,36,64,.85);
  border:2px solid var(--glow);border-radius:22px;padding:14px 24px;color:#fff;
  box-shadow:0 0 0 6px rgba(46,242,238,.16),0 0 40px rgba(46,242,238,.45)}
.cd b{font-size:56px;line-height:1;letter-spacing:-.03em}
.cd span{font-size:24px;color:var(--visor)}
[dir=rtl] .cd{left:auto;right:64px}
.stk{left:64px;right:64px;top:1030px;display:flex;align-items:center;gap:30px}
.stk .who{flex:1}
.stk .br{display:flex;gap:34px;font-size:24px;color:var(--deep)}
.stk .br div{text-align:center}
.stk .br b{display:block;font-size:34px;color:var(--abyss)}
.stk .br b.zero{color:#B4233C}
"""
    T = {
        "en": dict(h="Is your stock ready<br><em>for White Friday?</em>", s="Know what you have, and where, before the rush.",
                   cd="8", cds="days to go", lab="Best seller", item="Wireless Earbuds",
                   br=[("Beirut", "120"), ("Tripoli", "40"), ("Sidon", "0")]),
        "ar": dict(h="مخزنك جاهز<br><em>للوايت فرايداي؟</em>", s="اعرف شو عندك ووين، قبل الزحمة.",
                   cd="8", cds="أيام باقيين", lab="الأكتر مبيعاً", item=L("Wireless Earbuds"),
                   br=[("بيروت", "120"), ("طرابلس", "40"), ("صيدا", "0")]),
    }
    for lang, t in T.items():
        br = "".join(f'<div><b class="num{" zero" if v == "0" else ""}">{v}</b>{k}</div>' for k, v in t["br"])
        body = f"""<img class="bg" src="/assets/post-images/final/SE-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="cd"><b class="num">{t['cd']}</b><span>{t['cds']}</span></div>
<div class="wc stk"><div class="who"><div class="lab">{t['lab']}</div><b class="t">{t['item']}</b></div><div class="br">{br}</div></div>
{top(lang)}
{FOOT[lang]}"""
        n = name("IDEA-076", lang)
        write("IDEA-076_white-friday-ready", n, page(lang, f"{n} · White Friday ready", body, css))


# ---------------------------------------------------------------- IDEA-028 · story this-or-that, 3 frames (BG-61)
STORY_CSS = """
.bg{height:1920px}
.top{top:120px}
.kick{top:300px;font-size:24px}
[dir=rtl] .kick{top:290px;font-size:26px}
.h1{top:350px;font-size:104px;line-height:1.02}
[dir=rtl] .h1{font-size:86px;line-height:1.3}
.sub{top:600px;font-size:34px}
.shade-b{height:420px}
.foot{bottom:120px}
"""


def idea_028():
    css = STORY_CSS + """
.vs{position:absolute;left:0;right:0;top:1110px;text-align:center;font-size:28px;color:var(--visor)}
"""
    T = {
        "en": dict(k="This or that? · {n}/3", s="Vote in the poll. We'll share the results.",
                   q=["Map <em>or</em> list?", "Count weekly<br><em>or</em> yearly?", "Ship by sea <em>or</em> air?"],
                   o=[("Map", "List"), ("Weekly", "Yearly"), ("Sea", "Air")]),
        "ar": dict(k="هيدا ولا هيدا؟ · {n}/3", s="صوّت بالاستفتاء. ومنشارككن النتيجة.",
                   q=["خريطة <em>ولا</em> قائمة؟", "بتجرد كل جمعة<br><em>ولا</em> كل سنة؟", "بتشحن بحر <em>ولا</em> جو؟"],
                   o=[("خريطة", "قائمة"), ("كل جمعة", "كل سنة"), ("بحر", "جو")]),
    }
    for lang, t in T.items():
        for i, q in enumerate(t["q"]):
            k = t["k"].format(n=i + 1)
            if lang == "ar":
                k = k.replace(f"{i + 1}/3", L(f"{i + 1}/3"))
            top_sub = 600 if lang == "en" else 630
            body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<div class="kick">{k}</div>
<h1 class="h1">{q}</h1>
<p class="sub" style="top:{top_sub}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
            n = name("IDEA-028", lang, i + 1)
            write("IDEA-028_story-this-or-that", n, page(lang, f"{n} · this or that", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-010 · 5 signs you've outgrown your spreadsheet (7 slides, light, BG-57)
C10_CSS = CARD_CSS + """
.light .bar{color:var(--deep)} .light .bar b{color:var(--abyss)}
.light .dots i{background:rgba(44,89,116,.25)} .light .dots i.on{background:var(--abyss)}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.kick{top:166px}
.h1{top:212px;font-size:62px;line-height:1.1}
[dir=rtl] .h1{top:206px;font-size:58px}
.cover .h1{top:190px;font-size:80px;line-height:1.05}
[dir=rtl] .cover .h1{font-size:84px;line-height:1.3}
.cover .sub{top:390px;font-size:36px}
[dir=rtl] .cover .sub{top:450px}
.big{position:absolute;right:64px;top:930px;font-size:260px;font-weight:700;line-height:1;color:rgba(8,149,166,.10);letter-spacing:-.05em}
[dir=rtl] .big{right:auto;left:64px}
.ill{left:64px;top:520px;width:952px;padding:34px 40px}
[dir=rtl] .ill{left:auto;right:64px}
.sheet{width:100%;border-collapse:collapse;font-size:30px;margin-top:10px}
.sheet th{font-size:22px;color:var(--deep);font-weight:600;text-align:start;padding:10px 12px;border-bottom:2px solid var(--visor)}
.sheet td{padding:14px 12px;border-bottom:1px solid #E1EAF0}
.sheet td.q{color:var(--signal);font-weight:700;background:rgba(8,149,166,.08)}
.file{display:flex;align-items:center;gap:16px;padding:14px 4px;border-bottom:1px solid #E1EAF0;font-size:31px;direction:ltr}
[dir=rtl] .file{justify-content:flex-end}
.file i{width:34px;height:40px;border-radius:5px;background:#DCEBF2;position:relative;flex:none}
.file i::after{content:"";position:absolute;right:0;top:0;border-style:solid;border-width:0 10px 10px 0;border-color:transparent #fff transparent transparent}
.file.hot{color:var(--signal);font-weight:600}.file.hot i{background:#BCE5E0}
.call{display:flex;align-items:center;gap:18px;padding-bottom:16px;border-bottom:1px solid #E1EAF0}
.call .av{width:60px;height:60px;border-radius:50%;background:var(--deep);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:700;flex:none}
.call b{display:block;font-size:34px}.call small{font-size:24px;color:var(--signal)}
.bub{max-width:700px;width:fit-content;margin-top:20px;padding:20px 28px;border-radius:26px;font-size:31px;line-height:1.35}
.bub.me{background:#2F86B8;color:#fff;margin-inline-start:auto}
.bub.them{background:#EEF4F7;color:var(--abyss)}
.cal{display:flex;gap:24px;margin-top:12px}
.cal div{flex:1;border:2px solid var(--visor);border-radius:18px;padding:18px 20px}
.cal div.now{border-color:var(--signal)}
.cal small{display:block;font-size:24px;color:var(--deep)}.cal b{font-size:44px}
.gap{margin-top:26px;font-size:31px;color:var(--deep)} .gap b{color:var(--signal)}
.edit{font-size:40px;margin-top:10px;display:flex;align-items:center;gap:16px}
.edit s{color:var(--deep);text-decoration-thickness:2px}
.meta{margin-top:22px;display:grid;grid-template-columns:auto 1fr;gap:12px 26px;font-size:30px;color:var(--deep)}
.meta b{color:var(--signal);font-size:32px}
.mail{display:flex;gap:18px;padding:18px 0;border-bottom:1px solid #E1EAF0;font-size:29px;align-items:center}
.mail i{width:12px;height:12px;border-radius:50%;background:var(--signal);flex:none}
.mail b{min-width:190px}.mail span{color:var(--deep)}
.mapc{left:64px;right:64px;top:540px;padding:14px;border-radius:28px}
.mapc img{display:block;width:100%;border-radius:18px}
"""


def idea_010():
    T = {
        "en": dict(
            k="Sign {n} of 5",
            slides=[
                ("5 signs you've outgrown<br><em>your spreadsheet.</em>", "Count how many apply to you."),
                ("There's a v7 of the file.<br><em>And a v7 (1).</em>", ""),
                ("You call a branch<br><em>before every big order.</em>", ""),
                ("The numbers are right only<br><em>on the day someone counted.</em>", ""),
                ("Nobody knows<br><em>who changed a quantity.</em>", ""),
                ("Your imports live in emails,<br><em>not in your stock.</em>", ""),
                ("3 or more?<br><em>It's time for a map.</em>", "Stacko shows every warehouse, item and shipment on one live map."),
            ],
            sheet=(["Item", "Beirut", "Sidon", "Updated"],
                   [["LED Strip 5m", "1,380", "?", "3 Mar"], ["Desk Lamp", "45", "12", "?"], ["Wireless Earbuds", "?", "40", "12 Feb"]]),
            files=["stock_final.xlsx", "stock_final_v7.xlsx", "stock_final_v7 (1).xlsx", "stock_final_v7 (1) USE THIS.xlsx"],
            call=("Sidon branch", "Calling…", "Do we still have 200 LED strips?", "Hold on, let me go and check…"),
            cal=(("Last count", "3 March"), ("Today", "21 November"), "That's <b>263 days</b> of moves nobody checked."),
            edit=("LED Strip 5m · WH-02", "120", "95", [("Changed by", "?"), ("When", "?"), ("Why", "?")]),
            mail=[("Supplier", "Invoice SHP-24021.pdf"), ("Forwarder", "Re: Re: packing list"), ("Customs", "Fwd: container arrival?")],
            maillab="Inbox", sheetlab="stock.xlsx", fileslab="Shared folder", editlab="Quantity edited"),
        "ar": dict(
            k="العلامة {n} من 5",
            slides=[
                ("5 علامات إنّك<br><em>كبرت على الجدول.</em>", "عِدّ قدّيش منّن بينطبقوا عليك."),
                (f"في نسخة {L('v7')} من الملف.<br><em>وفي {L('v7 (1)')}.</em>", ""),
                ("بتتّصل بالفرع<br><em>قبل كل طلبية كبيرة.</em>", ""),
                ("الأرقام مزبوطة<br><em>بس بيوم الجرد.</em>", ""),
                ("ما حدا بيعرف<br><em>مين غيّر الكمية.</em>", ""),
                ("استيراداتك بالإيميلات،<br><em>مش بمخزنك.</em>", ""),
                ("3 أو أكتر؟<br><em>صار وقت الخريطة.</em>", "ستاكو بيفرجيك كل مستودع وكل صنف وكل شحنة على خريطة وحدة مباشرة."),
            ],
            sheet=(["الصنف", "بيروت", "صيدا", "آخر تحديث"],
                   [[L("LED Strip 5m"), "1,380", "؟", "3 آذار"], [L("Desk Lamp"), "45", "12", "؟"], [L("Wireless Earbuds"), "؟", "40", "12 شباط"]]),
            files=["stock_final.xlsx", "stock_final_v7.xlsx", "stock_final_v7 (1).xlsx", "stock_final_v7 (1) USE THIS.xlsx"],
            call=("فرع صيدا", "عم نتّصل…", f"بعدنا عنّا 200 {L('LED Strip')}؟", "لحظة، خلّيني روح شوف…"),
            cal=(("آخر جرد", "3 آذار"), ("اليوم", "21 تشرين الثاني"), "يعني <b>263 يوم</b> من الحركة ما حدا راجعها."),
            edit=(f"{L('LED Strip 5m')} · {L('WH-02')}", "120", "95", [("مين غيّرها", "؟"), ("إيمتى", "؟"), ("ليش", "؟")]),
            mail=[("المورّد", f"فاتورة {L('SHP-24021.pdf')}"), ("شركة الشحن", "رد: رد: لائحة التوضيب"), ("الجمرك", "تحويل: إيمتى بتوصل الحاوية؟")],
            maillab="البريد الوارد", sheetlab="stock.xlsx", fileslab="الملف المشترك", editlab="انعدّلت الكمية"),
    }
    n = 7
    for lang, t in T.items():
        for i, (h, s) in enumerate(t["slides"]):
            cls = " cover" if i == 0 else ""
            kick = "" if i in (0, 6) else f'<div class="kick">{t["k"].format(n=i)}</div><div class="big">{i}</div>'
            sub = f'<p class="sub">{s}</p>' if s else ""
            if i == 0:
                hd, rows = t["sheet"]
                th = "".join(f"<th>{x}</th>" for x in hd)
                tr = "".join("<tr>" + "".join(f'<td class="{"q" if c in ("?", "؟") else ""}">{c}</td>' for c in r) + "</tr>" for r in rows)
                art = f'<div class="wc ill" style="top:560px"><div class="lab" style="direction:ltr;text-align:start">{t["sheetlab"]}</div><table class="sheet">{th and "<tr>" + th + "</tr>"}{tr}</table></div>'
            elif i == 1:
                fl = "".join(f'<div class="file{" hot" if k == 2 else ""}"><i></i>{f}</div>' for k, f in enumerate(t["files"]))
                art = f'<div class="wc ill"><div class="lab">{t["fileslab"]}</div>{fl}</div>'
            elif i == 2:
                a, b, c, d = t["call"]
                art = f'<div class="wc ill"><div class="call"><div class="av">☎</div><div><b>{a}</b><small>{b}</small></div></div><div class="bub me">{c}</div><div class="bub them">{d}</div></div>'
            elif i == 3:
                (a1, a2), (b1, b2), g = t["cal"]
                art = f'<div class="wc ill"><div class="cal"><div><small>{a1}</small><b>{a2}</b></div><div class="now"><small>{b1}</small><b>{b2}</b></div></div><div class="gap">{g}</div></div>'
            elif i == 4:
                it, o, nw, meta = t["edit"]
                mt = "".join(f"<span>{k}</span><b>{v}</b>" for k, v in meta)
                art = f'<div class="wc ill"><div class="lab">{t["editlab"]}</div><b class="t">{it}</b><div class="edit"><s class="num">{o}</s><span>→</span><b class="num">{nw}</b></div><div class="meta">{mt}</div></div>'
            elif i == 5:
                ml = "".join(f'<div class="mail"><i></i><b>{a}</b><span>{b}</span></div>' for a, b in t["mail"])
                art = f'<div class="wc ill"><div class="lab">{t["maillab"]}</div>{ml}</div>'
            else:
                art = '<div class="wc mapc" style="top:600px"><img src="/assets/screens/live-map/map-crop.jpg" alt=""></div>'
                sub = f'<p class="sub" style="top:{420 if lang == "en" else 440}px">{s}</p>'
            last = i == n - 1
            body = f"""<img class="bg" src="/assets/backgrounds/final/BG-57.jpg" alt="">
{kick}
<h1 class="h1">{h}</h1>
{sub}
{art}
{top(lang, light=True)}
{FOOT[lang] if last else bar(lang, n, i)}"""
            nm = name("IDEA-010", lang, i + 1)
            html = page(lang, f"{nm} · 5 signs", body, C10_CSS, theme="light")
            html = html.replace('<div class="post light">', f'<div class="post light{cls}">')
            write("IDEA-010_outgrown-your-spreadsheet", nm, html)


# ---------------------------------------------------------------- IDEA-031 · Independence Day (static, dark, SC-01 closer crop)
def idea_031():
    css = """
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;width:1240px;left:-80px;top:-120px;max-width:none}
.shade-t{height:620px;background:linear-gradient(180deg,rgba(8,20,36,.85),rgba(8,20,36,.5) 60%,rgba(8,20,36,0))}
.kick{top:166px;color:var(--glow)}
.h1{top:212px;font-size:58px;line-height:1.12}
[dir=rtl] .h1{top:206px;font-size:62px}
"""
    T = {
        "en": dict(k="22 November", h="From the coast to the mountains,<br><em>every road leads home.</em>",
                   s="Happy Independence Day, Lebanon."),
        "ar": dict(k="22 تشرين الثاني", h="من البحر للجبل،<br><em>كل الطرقات بتوصّل عالبيت.</em>",
                   s="عيد استقلال سعيد يا لبنان."),
    }
    for lang, t in T.items():
        body = f"""<div class="zoom"><img src="/assets/post-images/final/SC-01.jpg" alt=""></div>
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{370 if lang == 'en' else 420}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        n = name("IDEA-031", lang)
        write("IDEA-031_independence-day", n, page(lang, f"{n} · Independence Day", body, css))


# ---------------------------------------------------------------- IDEA-078 · story countdown, 5 frames (SE-01 + BG-61)
def idea_078():
    css = STORY_CSS + CARD_CSS + """
.h1{font-size:84px}
[dir=rtl] .h1{font-size:76px}
.cover .h1{font-size:96px}
.tip{padding:34px 40px;border-radius:30px}
.tip .lab{font-size:24px}
.tip b.t{font-size:46px}
.tip .row{gap:44px;font-size:28px}.tip .row b{font-size:50px}
.tip .t2{font-size:34px}
.tip .pill{font-size:24px;vertical-align:middle}
.bubu{font-size:34px!important}
.done{font-size:30px!important}
.cover .bg{object-fit:cover;object-position:18% 50%}
.cover .shade-t{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(180deg,rgba(8,20,36,.95),rgba(8,20,36,.7) 60%,rgba(8,20,36,0))}
.tip{left:64px;right:64px;top:1000px}
.tip .row{display:flex;gap:44px;margin-top:10px;font-size:28px;color:var(--deep)}
.tip .row div{text-align:center}.tip .row b{display:block;font-size:50px;color:var(--abyss)}
.tip .row b.zero{color:#B4233C}
.tip .t2{font-size:34px;color:var(--deep);margin-top:6px}
.bubu{margin-inline-start:auto;width:fit-content;max-width:640px;background:#2F86B8;color:#fff;font-size:28px;padding:16px 24px;border-radius:24px 24px 8px 24px;margin-top:6px}
[dir=rtl] .bubu{border-radius:24px 24px 24px 8px}
.done{margin-top:16px;display:flex;align-items:center;gap:14px;font-size:26px}
"""
    T = {
        "en": dict(
            c=dict(k="White Friday · 27 November", h="5 days<br><em>to White Friday.</em>",
                   s="Tap the countdown for a reminder.<br>One stock tip a day until then."),
            tips=[
                ("3 days to go · Tip 1", "Check your best sellers<br><em>in every branch.</em>", "Not just the main warehouse. The rush hits everywhere.",
                 "best"),
                ("2 days to go · Tip 2", "Move stock<br><em>before the rush.</em>", "A transfer logged today shows a live ETA until it lands.", "eta"),
                ("1 day to go · Tip 3", "Watch your<br><em>low&#8209;stock alerts.</em>", "Restock what's running out while you still can.", "low"),
                ("Today · Tip 4", "It's today.<br><em>Log every move.</em>", "About 10 seconds each, from your phone. Tonight you'll know what's left.", "log"),
            ],
            best=("Best seller", "LED Strip 5m", [("Beirut", "1,380"), ("Sidon", "210"), ("Tripoli", "0")]),
            eta=("Transfer", "Beirut → Sidon", "Arrives in 1h 05m"),
            low=("Alert", "Desk Lamp", "3 left in Jounieh", "Low stock"),
            log=("sold 24 earbuds in Tripoli", "Logged · Wireless Earbuds −24 · Tripoli")),
        "ar": dict(
            c=dict(k="الوايت فرايداي · 27 تشرين الثاني", h="5 أيام<br><em>للوايت فرايداي.</em>",
                   s="كبوس عالعدّاد لتوصلك تذكرة.<br>وكل يوم نصيحة للمخازن لهونيك."),
            tips=[
                ("باقي 3 أيام · نصيحة 1", "شيك عالأكتر مبيعاً<br><em>بكل فرع.</em>", "مش بس بالمستودع الرئيسي. الزحمة بتوصل عالكل.", "best"),
                ("باقي يومين · نصيحة 2", "حرّك البضاعة<br><em>قبل الزحمة.</em>", "التحويل اللي بتسجّله اليوم بيبيّن وقت وصوله مباشرة لحتى يوصل.", "eta"),
                ("باقي يوم · نصيحة 3", "انتبه<br><em>لتنبيهات النقص.</em>", "عبّي اللي عم يخلص طالما بعد في وقت.", "low"),
                ("اليوم · نصيحة 4", "اليوم هو.<br><em>سجّل كل حركة.</em>", "حوالي 10 ثواني للحركة، من تلفونك. وبالليل بتعرف شو ضلّ.", "log"),
            ],
            best=("الأكتر مبيعاً", L("LED Strip 5m"), [("بيروت", "1,380"), ("صيدا", "210"), ("طرابلس", "0")]),
            eta=("تحويل", "بيروت ← صيدا", "بتوصل خلال ساعة و5 دقايق"),
            low=("تنبيه", L("Desk Lamp"), "باقي 3 بجونيه", "ناقص"),
            log=(f"بعنا 24 {L('Wireless Earbuds')} بطرابلس", f"تسجّلت · {L('Wireless Earbuds −24')} · طرابلس")),
    }
    for lang, t in T.items():
        c = t["c"]
        body = f"""<img class="bg" src="/assets/post-images/final/SE-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{c['k']}</div>
<h1 class="h1">{c['h']}</h1>
<p class="sub" style="top:{580 if lang == 'en' else 620}px">{c['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-078", lang, 1)
        html = page(lang, f"{nm} · countdown", body, css, size=(1080, 1920)).replace('<div class="post dark">', '<div class="post dark cover">')
        write("IDEA-078_story-white-friday-countdown", nm, html)
        for i, (k, h, s, kind) in enumerate(t["tips"]):
            if kind == "best":
                a, b, br = t["best"]
                row = "".join(f'<div><b class="num{" zero" if v == "0" else ""}">{v}</b>{x}</div>' for x, v in br)
                card = f'<div class="wc tip"><div class="lab">{a}</div><b class="t">{b}</b><div class="row">{row}</div></div>'
            elif kind == "eta":
                a, b, e = t["eta"]
                card = f'<div class="wc tip"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2 okc">{e}</div></div>'
            elif kind == "low":
                a, b, e, p = t["low"]
                card = f'<div class="wc tip"><div class="lab">{a}</div><b class="t">{b} <span class="pill low">{p}</span></b><div class="t2">{e}</div></div>'
            else:
                a, b = t["log"]
                card = f'<div class="wc tip" style="background:#F4F8FA"><div class="bubu">{a}</div><div class="done"><span class="pill ok">✓</span>{b}</div></div>'
            body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<div class="kick">{k}</div>
<h1 class="h1">{h}</h1>
<p class="sub" style="top:{580 if lang == 'en' else 630}px">{s}</p>
{card}
{top(lang)}
{FOOT[lang]}"""
            nm = name("IDEA-078", lang, i + 2)
            write("IDEA-078_story-white-friday-countdown", nm, page(lang, f"{nm} · countdown tip", body, css, size=(1080, 1920)))


if __name__ == "__main__":
    idea_076()
    idea_028()
    idea_010()
    idea_031()
    idea_078()
    print("ok")
