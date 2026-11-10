"""Week of 22 Nov 2026 (IDEA-077, IDEA-029, IDEA-049, IDEA-057, IDEA-052, IDEA-004, IDEA-079), EN + AR.

    python3 -I -X utf8 posts/2026-11/build_idea_week4.py          (from content/)

Copy comes from the CRM plan rows (source_metadata.content_plan); images from the visual library.
Helpers come from build_idea_week1.py / build_idea_week3.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_idea_week1 import FOOT, bar, page, top, write  # noqa: E402
from build_idea_week3 import CARD_CSS, STORY_CSS, L, name  # noqa: E402

ROWS_CSS = """
.rws{margin-top:10px}
.rw2{display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid #E1EAF0;font-size:28px}
.rw2:last-child{border-bottom:0}
.rw2 .sp{flex:1;color:var(--deep);font-size:25px}
.rw2 b{font-weight:600}
"""


# ---------------------------------------------------------------- IDEA-077 · White Friday checklist (6 slides, dark)
def idea_077():
    css = CARD_CSS + ROWS_CSS + """
.kick{top:166px;display:flex;align-items:center;gap:14px}
.kick i{width:30px;height:30px;border:3px solid var(--glow);border-radius:8px;box-shadow:0 0 14px rgba(46,242,238,.5)}
[dir=rtl] .kick{top:160px}
.h1{top:220px;font-size:64px;line-height:1.1}
[dir=rtl] .h1{top:214px;font-size:58px}
.cover .h1{top:190px;font-size:96px;line-height:1.02}
[dir=rtl] .cover .h1{font-size:84px;line-height:1.3}
.cover .sub{top:420px;font-size:36px}
[dir=rtl] .cover .sub{top:460px}
.cover .shade-t{height:640px}
.cover .bg{transform:translateY(70px)}
.cover .sub2{position:absolute;left:64px;right:64px;top:480px;font-size:28px;color:var(--visor)}
[dir=rtl] .cover .sub2{top:530px;font-size:30px}
.why{position:absolute;left:64px;right:64px;top:380px;font-size:32px;line-height:1.4;color:#C9D8E4;font-weight:400}
[dir=rtl] .why{top:400px;font-size:34px;line-height:1.55}
.pc{left:64px;right:64px;top:560px;padding:34px 40px;border-radius:30px}
.pc b.t{font-size:44px}
.pc .t2{font-size:32px;color:var(--deep);margin-top:6px}
.pc .row{display:flex;gap:56px;margin-top:14px;font-size:28px;color:var(--deep)}
.pc .row div{text-align:center}.pc .row b{display:block;font-size:52px;color:var(--abyss)}
.pc .row b.zero{color:#B4233C}
.list{position:absolute;left:64px;right:64px;top:560px;display:flex;flex-direction:column;gap:16px}
.li{display:flex;align-items:center;gap:20px;background:rgba(14,36,64,.78);border:1px solid rgba(201,216,228,.3);border-radius:20px;
  padding:22px 26px;font-size:30px;color:#fff;backdrop-filter:blur(6px)}
.li i{width:40px;height:40px;border-radius:10px;background:var(--glow);color:var(--abyss);display:grid;place-items:center;
  font-style:normal;font-weight:700;font-size:26px;flex:none}
"""
    T = {
        "en": dict(
            cover=("White Friday<br><em>stock checklist.</em>", "4 checks before your busiest sales week.", "Save this for your peak week."),
            k="Check {n} of 4",
            items=["Know your best sellers' stock<br><em>in every branch.</em>",
                   "Move stock to the branches<br><em>that sell most, now.</em>",
                   "Check what's still<br><em>at sea or in customs.</em>",
                   "Watch low-stock alerts<br><em>on your top items.</em>"],
            why=["So you never promise what a branch doesn't have.", "Items sitting in the wrong branch don't sell.",
                 "Know what arrives in time and what won't.", "Catch a stock-out before the customer does."],
            best=("Best seller", "LED Strip 5m", [("Beirut", "1,380"), ("Tripoli", "210"), ("Sidon", "0")]),
            eta=("Transfer", "Beirut → Tripoli", "Arrives in 1h 30m"),
            ship=("Incoming", [("SHP-24021", "Shenzhen → Beirut", "At sea · day 24 of ~30"),
                               ("SHP-24035", "Port of Beirut", "In customs · ~2 days")]),
            low=("Low-stock alerts", [("Desk Lamp", "3 left in Jounieh"), ("USB-C Cable", "8 left in Sidon")], "Low"),
            end=("Good luck<br><em>this peak week.</em>", "See your stock live."),
            done=["Best sellers checked in every branch", "Stock moved to where it sells",
                  "Shipments at sea and in customs checked", "Low-stock alerts watched"]),
        "ar": dict(
            cover=("قائمة تجهيز<br><em>الوايت فرايداي.</em>", "4 شغلات تشيّكها قبل أعجق أسبوع مبيعات.", "احفظها لأسبوع الذروة."),
            k="خطوة {n} من 4",
            items=["اعرف مخزون الأكتر مبيعاً<br><em>بكل فرع.</em>",
                   "حرّك البضاعة للفروع<br><em>اللي بتبيع أكتر، هلّق.</em>",
                   "شيّك شو بعد<br><em>بالبحر أو بالجمرك.</em>",
                   "انتبه لتنبيهات النقص<br><em>عالأصناف الأساسية.</em>"],
            why=["حتى ما توعد بشي مش موجود بالفرع.", "البضاعة القاعدة بالفرع الغلط ما بتنباع.",
                 "اعرف شو رح يوصل عالوقت وشو لأ.", "الحق النقص قبل ما يلاحظه الزبون."],
            best=("الأكتر مبيعاً", L("LED Strip 5m"), [("بيروت", "1,380"), ("طرابلس", "210"), ("صيدا", "0")]),
            eta=("تحويل", "بيروت ← طرابلس", "بتوصل خلال ساعة ونص"),
            ship=("واردة", [(L("SHP-24021"), "شنتشن ← بيروت", "بالبحر · اليوم 24 من حوالي 30"),
                            (L("SHP-24035"), "مرفأ بيروت", "بالجمرك · حوالي يومين")]),
            low=("تنبيهات النقص", [(L("Desk Lamp"), "باقي 3 بجونيه"), (L("USB-C Cable"), "باقي 8 بصيدا")], "ناقص"),
            end=("بالتوفيق<br><em>بأسبوع الذروة.</em>", "شوف مخزونك مباشر."),
            done=["شيّكت الأكتر مبيعاً بكل فرع", "حرّكت البضاعة لوين بتنباع", "شيّكت الشحنات بالبحر والجمرك", "تابعت تنبيهات النقص"]),
    }
    n = 6
    for lang, t in T.items():
        slides = []
        h, s, s2 = t["cover"]
        slides.append(("cover", f"""<img class="bg" src="/assets/post-images/final/SE-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p><p class="sub2">{s2}</p>"""))
        for i, h in enumerate(t["items"]):
            if i == 0:
                a, b, br = t["best"]
                row = "".join(f'<div><b class="num{" zero" if v == "0" else ""}">{v}</b>{x}</div>' for x, v in br)
                card = f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="row">{row}</div></div>'
            elif i == 1:
                a, b, e = t["eta"]
                card = f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2 okc">{e}</div></div>'
            elif i == 2:
                a, rows = t["ship"]
                rr = "".join(f'<div class="rw2"><b>{c}</b><span class="sp">{r}</span><span class="okc">{st}</span></div>' for c, r, st in rows)
                card = f'<div class="wc pc"><div class="lab">{a}</div><div class="rws">{rr}</div></div>'
            else:
                a, rows, p = t["low"]
                rr = "".join(f'<div class="rw2"><b>{c}</b><span class="sp">{r}</span><span class="pill low">{p}</span></div>' for c, r in rows)
                card = f'<div class="wc pc"><div class="lab">{a}</div><div class="rws">{rr}</div></div>'
            slides.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<div class="kick"><i></i>{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
<p class="why">{t['why'][i]}</p>
{card}"""))
        h, s = t["end"]
        li = "".join(f'<div class="li"><i>✓</i>{x}</div>' for x in t["done"])
        slides.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 420}px">{s}</p>
<div class="list">{li}</div>"""))
        for i, (cls, art) in enumerate(slides):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-077", lang, i + 1)
            html = page(lang, f"{nm} · White Friday checklist", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-077_white-friday-checklist", nm, html)


# ---------------------------------------------------------------- IDEA-029 · story Q&A box (BG-61)
def idea_029():
    css = STORY_CSS + """
.h1{top:300px;font-size:76px;line-height:1.08}
[dir=rtl] .h1{font-size:74px;line-height:1.32}
.sub{top:600px}
[dir=rtl] .sub{top:600px}
.ex{position:absolute;left:64px;right:64px;top:1120px;display:flex;flex-direction:column;gap:14px}
.ex small{font-size:24px;color:var(--visor)}
.ex div{width:fit-content;background:rgba(14,36,64,.72);border:1px solid rgba(201,216,228,.3);border-radius:22px;padding:16px 24px;
  font-size:28px;color:#fff;backdrop-filter:blur(6px)}
"""
    T = {
        "en": dict(h="Ask us anything about<br><em>running stock across branches.</em>",
                   s="Type your question in the box.<br>The best ones become posts.",
                   exl="For example:", ex=["How do you track transfers between branches?", "How often should we count?"]),
        "ar": dict(h="اسألنا أيّ شي<br><em>عن المخزون بين الفروع.</em>",
                   s="اكتب سؤالك بالمربّع.<br>أحلى الأسئلة بتصير بوستات.",
                   exl="مثلاً:", ex=["كيف بتتابعوا التحويلات بين الفروع؟", "كل قدّيش لازم نجرد؟"]),
    }
    for lang, t in T.items():
        ex = "".join(f"<div>{x}</div>" for x in t["ex"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
<div class="ex"><small>{t['exl']}</small>{ex}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-029", lang)
        write("IDEA-029_story-qa-box", nm, page(lang, f"{nm} · story Q&A", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-049 · empty shelves hurt twice (static, light, SC-05)
def idea_049():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:640px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.9) 55%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.gap{position:absolute;left:556px;top:606px;width:268px;height:190px;border:3px solid var(--signal);border-radius:10px;
  box-shadow:0 0 0 6px rgba(8,149,166,.16),0 0 30px rgba(46,242,238,.45)}
.cost{position:absolute;display:flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:14px 24px;
  font-size:28px;font-weight:600;box-shadow:0 14px 40px rgba(14,36,64,.3);white-space:nowrap}
.cost b{color:#B4233C;font-size:30px}
.c1{left:300px;top:830px}.c2{left:600px;top:900px}
.cd{position:absolute;left:64px;top:470px;display:inline-flex;align-items:center;gap:12px;background:var(--abyss);color:#fff;border-radius:999px;
  padding:12px 24px;font-size:26px;font-weight:600}
.cd i{width:12px;height:12px;border-radius:50%;background:var(--glow);box-shadow:0 0 10px var(--glow)}
[dir=rtl] .cd{left:auto;right:64px}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 60%)}
"""
    T = {
        "en": dict(h="Empty shelves<br><em>hurt twice.</em>", s="Once in lost sales. Once in lost customers.",
                   c1="Lost sale", c2="Lost customer"),
        "ar": dict(h="الرفّ الفاضي<br><em>بيوجع مرّتين.</em>", s="مرّة ببيعة راحت. ومرّة بزبون راح.",
                   c1="بيعة راحت", c2="زبون راح"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-05.jpg" alt="">
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{352 if lang == 'en' else 390}px">{t['s']}</p>
<div class="gap"></div>
<div class="cost c1"><b class="ltr">−1</b>{t['c1']}</div>
<div class="cost c2"><b class="ltr">−1</b>{t['c2']}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-049", lang)
        write("IDEA-049_empty-shelves-hurt-twice", nm, page(lang, f"{nm} · hurts twice", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-057 · know what's inside (static, dark, SC-08)
def idea_057():
    css = CARD_CSS + """
.shade-t{height:600px}
.inv{left:64px;top:600px;width:470px;padding:26px 30px;transform:rotate(-2deg)}
[dir=rtl] .inv{transform:rotate(2deg)}
.inv .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--visor);padding-bottom:14px}
.inv .hd b{font-size:28px;display:block}.inv .hd small{font-size:20px;color:var(--deep)}
.inv .pdf{font-size:16px;font-weight:700;color:#fff;background:var(--deep);border-radius:8px;padding:5px 9px;direction:ltr}
.inv .ln{display:flex;justify-content:space-between;font-size:23px;padding:11px 0;border-bottom:1px dashed var(--visor)}
.inv .ln span:last-child{color:var(--deep)}
.inv .more{font-size:20px;color:var(--deep);padding-top:10px}
.scan{position:absolute;left:0;right:0;top:46%;height:3px;background:var(--glow);box-shadow:0 0 18px 4px rgba(46,242,238,.7)}
.arrow{position:absolute;left:540px;top:820px;width:120px;border-top:4px dotted var(--glow)}
.arrow::after{content:"";position:absolute;right:-4px;top:-11px;border:9px solid transparent;border-left:14px solid var(--glow)}
[dir=rtl] .arrow{left:540px}
.res{position:absolute;right:64px;top:1110px;align-items:flex-end;display:flex;flex-direction:column;gap:12px}
.res div{display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:12px 22px;
  font-size:26px;font-weight:600;box-shadow:0 12px 34px rgba(0,0,0,.4);width:fit-content;white-space:nowrap}
.res i{width:30px;height:30px;border-radius:50%;background:#BCE5E0;color:#0B7A87;display:grid;place-items:center;font-style:normal;font-size:17px}

"""
    T = {
        "en": dict(h="Know what's inside<br><em>before the doors open.</em>", s="AI reads the supplier invoice and creates the items.",
                   inv="Supplier invoice", invs="Shenzhen · 12 lines",
                   lines=[("LED Strip 5m", "× 1,200"), ("Desk Lamp", "× 300"), ("USB-C Cable 1m", "× 2,000")], more="+ 9 more lines",
                   r1="12 items created", r2="Incoming shipment SHP-24021 added"),
        "ar": dict(h="اعرف شو جوّا<br><em>قبل ما تنفتح الأبواب.</em>", s="الذكاء الاصطناعي بيقرا فاتورة المورّد وبيعمل الأصناف.",
                   inv="فاتورة المورّد", invs="شنتشن · 12 سطر",
                   lines=[(L("LED Strip 5m"), L("× 1,200")), (L("Desk Lamp"), L("× 300")), (L("USB-C Cable 1m"), L("× 2,000"))],
                   more="+ 9 أسطر كمان", r1="انعملوا 12 صنف", r2=f"انضافت الشحنة الواردة {L('SHP-24021')}"),
    }
    for lang, t in T.items():
        ln = "".join(f'<div class="ln"><span>{a}</span><span>{b}</span></div>' for a, b in t["lines"])
        body = f"""<img class="bg" src="/assets/post-images/final/SC-08.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="wc inv"><div class="hd"><div><b>{t['inv']}</b><small>{t['invs']}</small></div><span class="pdf">PDF</span></div>
{ln}<div class="more">{t['more']}</div><div class="scan"></div></div>
<div class="arrow"></div>
<div class="res"><div><i>✓</i>{t['r1']}</div><div><i>✓</i>{t['r2']}</div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-057", lang)
        write("IDEA-057_know-whats-inside", nm, page(lang, f"{nm} · know what's inside", body, css))


# ---------------------------------------------------------------- IDEA-052 · story good morning (light, SC-06 in a 9:16 paper frame)
def idea_052():
    css = STORY_CSS + """
.post.light{background:#F4F8FA}
.h1{top:290px;font-size:76px;line-height:1.08;color:var(--abyss)}
[dir=rtl] .h1{font-size:72px;line-height:1.32}
.sub{top:580px;color:var(--deep)}
[dir=rtl] .sub{top:530px}
.photo{position:absolute;left:0;right:0;top:680px;height:1020px;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover;object-position:50% 70%}
.photo::before{content:"";position:absolute;left:0;right:0;top:0;height:180px;background:linear-gradient(#F4F8FA,rgba(244,248,250,0));z-index:1}
.photo::after{content:"";position:absolute;left:0;right:0;bottom:0;height:160px;background:linear-gradient(rgba(244,248,250,0),#F4F8FA);z-index:1}
"""
    T = {
        "en": dict(h="Good morning.<br><em>What's your first check<br>of the day?</em>", s="Answer in the box. We'll share the replies."),
        "ar": dict(h="صباح الخير.<br><em>شو أول شي بتشيّكه؟</em>", s="جاوب بالمربّع. ومنشارك الأجوبة."),
    }
    for lang, t in T.items():
        body = f"""<div class="photo"><img src="/assets/post-images/final/SC-06.jpg" alt=""></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-052", lang)
        write("IDEA-052_story-good-morning", nm, page(lang, f"{nm} · good morning", body, css, theme="light", size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-004 · your team isn't lazy (static, dark, BG-56, text-led)
def idea_004():
    css = CARD_CSS + """
.h1{top:200px;font-size:100px;line-height:1.02}
[dir=rtl] .h1{font-size:82px;line-height:1.32}
.sub{top:440px;font-size:34px}
[dir=rtl] .sub{top:480px}
.lg{left:64px;right:64px;top:700px;background:#F4F8FA;padding:30px 34px;border-radius:30px}
.bu{margin-inline-start:auto;width:fit-content;max-width:760px;background:#2F86B8;color:#fff;font-size:31px;padding:18px 26px;border-radius:26px 26px 8px 26px}
[dir=rtl] .bu{border-radius:26px 26px 26px 8px}
.ans{display:flex;align-items:center;gap:16px;margin-top:18px}
.ans .av{width:54px;height:54px;border-radius:50%;background:var(--abyss);display:grid;place-items:center;flex:none}.ans .av img{width:38px}
.ans div{background:#fff;border-radius:22px;padding:14px 22px;font-size:29px;box-shadow:0 6px 18px rgba(14,36,64,.1)}
.tm{position:absolute;left:64px;top:1060px;display:inline-flex;align-items:center;gap:12px;background:rgba(14,36,64,.8);border:2px solid var(--glow);
  color:#fff;border-radius:999px;padding:14px 26px;font-size:28px;font-weight:600;box-shadow:0 0 30px rgba(46,242,238,.35)}
[dir=rtl] .tm{left:auto;right:64px}
"""
    T = {
        "en": dict(h="Your team isn't lazy.<br><em>Your system is.</em>",
                   s="When logging takes 10 seconds and shows up on a map, people log.",
                   u="sent 40 LED strips from Beirut to Sidon", a='<span class="okc">Logged ✓</span> Beirut → Sidon is on the map',
                   tm="Logging time: 10 seconds"),
        "ar": dict(h="فريقك مش كسلان.<br><em>النظام هو المتعِب.</em>",
                   s="لمّا التسجيل ياخد 10 ثواني ويبيّن عالخريطة، الناس بتسجّل.",
                   u=f"بعتت 40 {L('LED Strip')} من بيروت لصيدا", a='<span class="okc">تسجّلت ✓</span> بيروت ← صيدا صارت عالخريطة',
                   tm="وقت التسجيل: 10 ثواني"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
<div class="wc lg"><div class="bu">{t['u']}</div>
  <div class="ans"><div class="av"><img src="/assets/brand/logo/mark-dark.svg" alt=""></div><div>{t['a']}</div></div></div>
<div class="tm">{t['tm']}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-004", lang)
        write("IDEA-004_team-isnt-lazy", nm, page(lang, f"{nm} · team isn't lazy", body, css))


# ---------------------------------------------------------------- IDEA-079 · the rush is over (static, dark, SE-01 dimmed)
def idea_079():
    css = CARD_CSS + ROWS_CSS + """
.bg{filter:brightness(.6) saturate(.8)}
.shade-t{height:600px}
.al{left:64px;right:64px;top:930px;padding:28px 34px}
.al .hd{display:flex;align-items:center;gap:16px}
.al .hd b{font-size:40px}
"""
    T = {
        "en": dict(h="The rush is over.<br><em>Do you know what's left?</em>", s="Now is the best time to see your real stock.",
                   lab="Alert", n="Low stock: 14 items", p="Low",
                   rows=[("Desk Lamp", "3 left in Jounieh"), ("Wireless Earbuds", "5 left in Tripoli")]),
        "ar": dict(h="خلصت العجقة.<br><em>بتعرف شو بقي؟</em>", s="هلّق أحسن وقت تشوف مخزونك الحقيقي.",
                   lab="تنبيه", n="نقص بـ14 صنف", p="ناقص",
                   rows=[(L("Desk Lamp"), "باقي 3 بجونيه"), (L("Wireless Earbuds"), "باقي 5 بطرابلس")]),
    }
    for lang, t in T.items():
        rr = "".join(f'<div class="rw2"><b>{c}</b><span class="sp">{r}</span><span class="pill low">{t["p"]}</span></div>' for c, r in t["rows"])
        body = f"""<img class="bg" src="/assets/post-images/final/SE-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="wc al"><div class="lab">{t['lab']}</div><div class="hd"><b>{t['n']}</b></div><div class="rws">{rr}</div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-079", lang)
        write("IDEA-079_rush-is-over", nm, page(lang, f"{nm} · the rush is over", body, css))


if __name__ == "__main__":
    idea_077()
    idea_029()
    idea_049()
    idea_057()
    idea_052()
    idea_004()
    idea_079()
    print("ok")
