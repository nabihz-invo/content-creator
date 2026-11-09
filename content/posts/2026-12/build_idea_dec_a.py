"""December 2026, batch A (IDEA-036, IDEA-080, IDEA-050, IDEA-062, IDEA-081, IDEA-039), EN + AR.

    python3 -I -X utf8 posts/2026-12/build_idea_dec_a.py          (from content/)

Copy comes from the CRM plan rows (source_metadata.content_plan); images from the visual library.
Helpers come from posts/2026-11/build_idea_week1.py and build_idea_week3.py.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
import build_idea_week1 as w1  # noqa: E402
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402

MONTH = HERE


def write(folder, nm, html):
    p = MONTH / folder / "source" / f"{nm}.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding="utf-8")


ROWS_CSS = """
.rws{margin-top:8px}
.rw2{display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #E1EAF0;font-size:28px}
.rw2:last-child{border-bottom:0}
.rw2 .sp{flex:1;color:var(--deep);font-size:25px}
.rw2 b{font-weight:600}
.pill.mis{background:#FFF1D6;color:#8A5A00}
"""

LIGHT_CSS = """
.light .bar{color:var(--deep)} .light .bar b{color:var(--abyss)}
.light .dots i{background:rgba(44,89,116,.25)} .light .dots i.on{background:var(--abyss)}
.light .h1{color:var(--abyss)} .light .sub{color:var(--deep)}
.panel{position:absolute;left:64px;right:64px;border-radius:30px;overflow:hidden;box-shadow:0 24px 60px rgba(14,36,64,.22)}
.panel img{position:absolute;max-width:none}
"""


# ---------------------------------------------------------------- IDEA-036 · Eid Al Etihad (static, dark, SC-02)
def idea_036():
    css = """
.shade-t{height:720px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.7) 55%,rgba(8,20,36,0))}
.kick{top:166px;color:var(--glow)}
.h1{top:212px;font-size:96px;line-height:1.02}
[dir=rtl] .h1{top:206px;font-size:88px;line-height:1.3}
"""
    T = {
        "en": dict(k="2 December", h="Happy<br><em>Eid Al Etihad.</em>", s="To every team keeping the UAE moving."),
        "ar": dict(k="2 كانون الأول", h="عيد <em>اتحاد سعيد.</em>", s="لكل فريق عم يخلّي الإمارات ماشية."),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-02.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{430 if lang == 'en' else 340}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-036", lang)
        write("IDEA-036_eid-al-etihad", nm, page(lang, f"{nm} · Eid Al Etihad", body, css))


# ---------------------------------------------------------------- IDEA-080 · year-end count (static, dark, SE-02)
def idea_080():
    css = CARD_CSS + """
.shade-t{height:620px}
.cnt{left:330px;top:880px;width:620px;padding:28px 34px;transform:rotate(-2deg)}
.cnt .rw{display:flex;gap:40px;margin-top:14px;align-items:flex-end}
.cnt .rw div{font-size:24px;color:var(--deep)}
.cnt .rw b{display:block;font-size:52px;color:var(--abyss);line-height:1.1}
.cnt .pill{margin-inline-start:auto;font-size:24px;padding:8px 18px;background:#FFF1D6;color:#8A5A00}
"""
    T = {
        "en": dict(h="Year-end count<br><em>without the all-nighter.</em>",
                   s="Keep the numbers right all month,<br>and the count is just a check.",
                   lab="Count · WH-02 Sidon", item="Desk Lamp", a="Counted", b="System", p="Mismatch"),
        "ar": dict(h="جرد آخر السنة،<br><em>بلا سهر للصبح.</em>",
                   s="خلّي الأرقام مزبوطة طول الشهر،<br>وبيصير الجرد مجرّد تشييك.",
                   lab=f"جرد · {L('WH-02')} صيدا", item=L("Desk Lamp"), a="انعدّ", b="بالنظام", p="فرق"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SE-02.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="wc cnt"><div class="lab">{t['lab']}</div><b class="t">{t['item']}</b>
  <div class="rw"><div><b class="num">38</b>{t['a']}</div><div><b class="num">40</b>{t['b']}</div><span class="pill">{t['p']}</span></div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-080", lang)
        write("IDEA-080_year-end-count", nm, page(lang, f"{nm} · year-end count", body, css))


# ---------------------------------------------------------------- IDEA-050 · 8 AM check (static, light, SC-06 + map on the phone)
def idea_050():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:600px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.88) 55%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.scr{width:300px;height:600px;background:#E6F2F6;transform:matrix3d(0.362037,0.120596,0,0.000214,0.16062,-0.085839,0,-0.000203,0,0,1,0,332.5853,1031.272,0,1)}
.scr img{width:100%;height:100%;object-fit:cover;object-position:52% 50%}
.chips{top:700px;flex-direction:column;align-items:flex-start;gap:14px}
.chips .chip{font-size:26px;padding:14px 24px}
[dir=rtl] .chips{align-items:flex-start}
.chip .n{color:var(--signal)}
.chip i.low{background:#B4233C}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 62%)}
.halo{position:absolute;left:300px;top:960px;width:320px;height:200px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(46,242,238,.35),rgba(46,242,238,0))}
"""
    T = {
        "en": dict(h="Your 8 AM check<br><em>takes 10 seconds now.</em>", s="Open the map. Done.",
                   c=["3 transfers on the road", "2 low-stock alerts"]),
        "ar": dict(h="تشييك الساعة 8 الصبح<br><em>صار ياخد 10 ثواني.</em>", s="افتح الخريطة. خلصنا.",
                   c=["3 تحويلات عالطريق", "تنبيهين نقص"]),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-06.jpg" alt="">
<div class="veil"></div><div class="shade-b"></div>
<div class="halo"></div>
<div class="scr"><img src="/assets/screens/live-map/map-full.jpg" alt=""></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="chips"><div class="chip"><i></i>{t['c'][0]}</div><div class="chip"><i class="low"></i>{t['c'][1]}</div></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-050", lang)
        write("IDEA-050_8am-check-10-seconds", nm, page(lang, f"{nm} · 8 AM check", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-062 · find any item (static, light, OB-02 in a panel on Paper)
def idea_062():
    css = LIGHT_CSS + CARD_CSS + """
.post.light{background:#F4F8FA}
.panel{top:480px;height:740px}
.panel img{width:952px;left:0;top:-250px}
.search{position:absolute;left:120px;right:120px;top:440px;display:flex;align-items:center;gap:18px;background:#fff;border-radius:999px;
  padding:20px 30px;font-size:32px;color:var(--abyss);box-shadow:0 18px 50px rgba(14,36,64,.25)}
.search svg{width:34px;height:34px;flex:none;stroke:var(--deep);fill:none;stroke-width:2.5}
.search .cur{width:2px;height:36px;background:var(--signal)}
.res{position:absolute;left:600px;top:860px;display:flex;align-items:center;gap:14px;background:#fff;border-radius:22px;padding:16px 24px;
  box-shadow:0 18px 50px rgba(14,36,64,.35),0 0 0 2px rgba(46,242,238,.7)}
.res b{font-size:44px;color:var(--abyss)}.res span{font-size:26px;color:var(--deep)}
[dir=rtl] .res{left:auto;right:150px}
"""
    T = {
        "en": dict(h="Find any item<br><em>in seconds.</em>", s="How much you have, and where. Across every location.",
                   q="Wireless Earbuds", n="12", where="WH-03 · Tripoli"),
        "ar": dict(h="لاقي أيّ صنف<br><em>بثواني.</em>", s="قدّيش عندك، ووين. بكل المواقع.",
                   q=L("Wireless Earbuds"), n="12", where=f"{L('WH-03')} · طرابلس"),
    }
    for lang, t in T.items():
        body = f"""<div class="panel"><img src="/assets/post-images/final/OB-02.jpg" alt=""></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>{t['q']}<span class="cur"></span></div>
<div class="res"><b class="num">{t['n']}</b><span>{t['where']}</span></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-062", lang)
        write("IDEA-062_find-any-item", nm, page(lang, f"{nm} · find any item", body, css, theme="light"))


# ---------------------------------------------------------------- shared light carousel (BG-57) for 081 and 039
CAR_CSS = LIGHT_CSS + CARD_CSS + ROWS_CSS + """
.post.light{background:#F4F8FA}
.kick{top:166px}
[dir=rtl] .kick{top:160px}
.h1{top:212px;font-size:62px;line-height:1.12}
[dir=rtl] .h1{top:206px;font-size:56px}
.cover .h1{top:190px;font-size:84px;line-height:1.04}
[dir=rtl] .cover .h1{font-size:76px;line-height:1.3}
.cover .sub{top:390px;font-size:34px}
[dir=rtl] .cover .sub{top:430px}
.pc{left:64px;right:64px;top:540px;padding:34px 40px;border-radius:30px}
.pc b.t{font-size:40px}
.pc .t2{font-size:30px;color:var(--deep);margin-top:6px}
.ans{position:absolute;left:64px;right:64px;top:430px;font-size:34px;color:var(--signal);font-weight:600}
.ans small{display:block;font-size:20px;letter-spacing:.1em;text-transform:uppercase;color:var(--deep);font-weight:600;margin-bottom:6px}
[dir=rtl] .ans small{letter-spacing:0;text-transform:none;font-size:22px}
.list{position:absolute;left:64px;right:64px;top:560px;display:flex;flex-direction:column;gap:14px}
.li{display:flex;align-items:center;gap:20px;background:#fff;border-radius:20px;padding:20px 26px;font-size:28px;color:var(--abyss);
  box-shadow:0 10px 30px rgba(14,36,64,.12)}
.li i{width:38px;height:38px;border-radius:10px;background:var(--signal);color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:24px;flex:none}
.brs{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
.brs span{background:#EEF4F7;border-radius:999px;padding:10px 20px;font-size:25px}
.brs span::after{content:" ✓";color:#0B7A87;font-weight:700}
.bu{margin-inline-start:auto;width:fit-content;max-width:760px;background:#2F86B8;color:#fff;font-size:29px;padding:16px 24px;border-radius:24px 24px 8px 24px}
[dir=rtl] .bu{border-radius:24px 24px 24px 8px}
.re{margin-top:14px;width:fit-content;background:#EEF4F7;border-radius:24px 24px 24px 8px;padding:16px 24px;font-size:29px}
[dir=rtl] .re{border-radius:24px 24px 8px 24px}
.mapc{padding:14px}
.mapc img{display:block;width:100%;border-radius:18px}
"""


def carousel(pid, folder, lang, slides, title):
    n = len(slides)
    for i, (cls, art) in enumerate(slides):
        body = f"""{art}
{top(lang, light=True)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
        nm = name(pid, lang, i + 1)
        html = page(lang, f"{nm} · {title}", body, CAR_CSS, theme="light")
        if cls:
            html = html.replace('<div class="post light">', f'<div class="post light {cls}">')
        write(folder, nm, html)


BG57 = '<img class="bg" src="/assets/backgrounds/final/BG-57.jpg" alt="">'
MAPCARD = '<div class="wc pc mapc"><img src="/assets/screens/live-map/map-crop.jpg" alt=""></div>'


# ---------------------------------------------------------------- IDEA-081 · year-end stocktake checklist (7 slides, light)
def idea_081():
    T = {
        "en": dict(
            cover=("Year-end<br><em>stocktake checklist.</em>", "Save it for the last week of December."),
            k="Step {n} of 5",
            steps=["Pick the date<br><em>and tell every branch.</em>", "Log every pending transfer<br><em>before you count.</em>",
                   "Count by location,<br><em>not all at once.</em>", "Check mismatches,<br><em>then approve adjustments.</em>",
                   "Close the year<br><em>with one set of numbers.</em>"],
            date=("Count day", "28 December", ["Beirut", "Jounieh", "Sidon", "Tripoli", "Dubai"]),
            tr=("Transfers", [("Beirut → Sidon", "40 × LED Strip 5m", "In 35m", "okc"), ("Tripoli → Jounieh", "12 × Desk Lamp", "Arrived ✓", "okc")]),
            loc=("Count by location", [("WH-01 · Beirut", "Counted ✓", "okc"), ("WH-02 · Sidon", "Counting…", ""), ("WH-03 · Tripoli", "Next", "")]),
            mis=("Mismatch · WH-02 Sidon", "Desk Lamp", "Counted 38 · System 40", "Adjustment −2 · approved by Lina"),
            end=("Save this<br><em>for December.</em>", "Your stock, always in sight."),
            done=["Date set, branches told", "Pending transfers logged", "Counted location by location",
                  "Mismatches checked, adjustments approved", "One set of numbers for the year"]),
        "ar": dict(
            cover=("قائمة جرد<br><em>آخر السنة.</em>", "احفظها لآخر جمعة بكانون الأول."),
            k="خطوة {n} من 5",
            steps=["اختار النهار<br><em>وخبّر كل الفروع.</em>", "سجّل كل تحويل معلّق<br><em>قبل ما تجرد.</em>",
                   "اجرد موقع موقع،<br><em>مش كلّن سوا.</em>", "شيّك الفروقات،<br><em>وبعدين وافق عالتعديل.</em>",
                   "سكّر السنة<br><em>بأرقام وحدة.</em>"],
            date=("نهار الجرد", "28 كانون الأول", ["بيروت", "جونيه", "صيدا", "طرابلس", "دبي"]),
            tr=("التحويلات", [("بيروت ← صيدا", L("40 × LED Strip 5m"), "خلال 35 دقيقة", "okc"),
                              ("طرابلس ← جونيه", L("12 × Desk Lamp"), "وصلت ✓", "okc")]),
            loc=("الجرد حسب الموقع", [(f"{L('WH-01')} · بيروت", "انجرد ✓", "okc"), (f"{L('WH-02')} · صيدا", "عم ينجرد…", ""),
                                      (f"{L('WH-03')} · طرابلس", "بعدين", "")]),
            mis=(f"فرق · {L('WH-02')} صيدا", L("Desk Lamp"), "انعدّ 38 · بالنظام 40", f"تعديل {L('−2')} · وافقت لينا"),
            end=("احفظ هالقائمة<br><em>لكانون الأول.</em>", "مخزونك دايماً قدّام عينك."),
            done=["حدّدت النهار وخبّرت الفروع", "سجّلت التحويلات المعلّقة", "جردت موقع موقع",
                  "شيّكت الفروقات ووافقت عالتعديلات", "سكّرت السنة بأرقام وحدة"]),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SE-02.jpg" alt="" style="width:952px;left:0;top:-200px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        a, b, brs = t["date"]
        cards = [f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="brs">{"".join(f"<span>{x}</span>" for x in brs)}</div></div>']
        a, rows = t["tr"]
        cards.append(f'<div class="wc pc"><div class="lab">{a}</div><div class="rws">' + "".join(
            f'<div class="rw2"><b>{r}</b><span class="sp">{q}</span><span class="{c}">{st}</span></div>' for r, q, st, c in rows) + "</div></div>")
        a, rows = t["loc"]
        cards.append(f'<div class="wc pc"><div class="lab">{a}</div><div class="rws">' + "".join(
            f'<div class="rw2"><b>{r}</b><span class="sp"></span><span class="{c}">{st}</span></div>' for r, st, c in rows) + "</div></div>")
        a, it, cnt, adj = t["mis"]
        cards.append(f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{it}</b><div class="t2">{cnt}</div>'
                     f'<div class="t2" style="margin-top:16px"><span class="pill ok">✓</span> {adj}</div></div>')
        cards.append(MAPCARD)
        for i, (h, card) in enumerate(zip(t["steps"], cards)):
            sl.append(("", f"""{BG57}
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
{card}"""))
        h, s = t["end"]
        li = "".join(f'<div class="li"><i>✓</i>{x}</div>' for x in t["done"])
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 420}px">{s}</p>
<div class="list" style="top:500px">{li}</div>"""))
        carousel("IDEA-081", "IDEA-081_year-end-stocktake-checklist", lang, sl, "year-end checklist")


# ---------------------------------------------------------------- IDEA-039 · 11 PM thoughts (6 slides, light)
def idea_039():
    T = {
        "en": dict(
            cover=("11 PM thoughts<br><em>of a business owner.</em>", "And how Stacko answers each one."),
            lab="Stacko",
            q=["“Did the Tripoli transfer<br>arrive?”", "“Do we have enough<br>for tomorrow's order?”",
               "“Why does the system say 40<br>and the shelf 38?”", "“Who changed<br>that count?”"],
            a=["It's on the map, with its ETA.", "Ask: how much, and where.", "A mismatch alert, before you ask.",
               "A name and a time, for every move."],
            c1=("Transfer", "Beirut → Tripoli", "Arrives in 20m"),
            c2=("How many USB-C cables do we have, and where?", "1,240 · Beirut 800 · Sidon 440"),
            c3=("Mismatch alert", "Desk Lamp · WH-02 Sidon", "System 40 · Counted 38", "Mismatch"),
            c4=("Audit trail", "LED Strip 5m · 120 → 95", [("By", "Rami"), ("When", "Today, 4:12 PM"), ("Where", "WH-01 · Beirut")]),
            end=("Good <em>night.</em>", "Your stock, always in sight.")),
        "ar": dict(
            cover=("أفكار<br><em>الساعة 11 بالليل.</em>", "وكيف ستاكو بيجاوب عكل وحدة."),
            lab="ستاكو",
            q=["«وصل التحويل<br>على طرابلس؟»", "«عنّا كفاية<br>لطلبية بكرا؟»", "«ليش النظام بيقول 40<br>والرف 38؟»", "«مين غيّر<br>هالعدد؟»"],
            a=["عالخريطة، مع وقت وصوله.", "اسأل: قدّيش، ووين.", "تنبيه فرق، قبل ما تسأل.", "اسم ووقت، لكل حركة."],
            c1=("تحويل", "بيروت ← طرابلس", "بتوصل خلال 20 دقيقة"),
            c2=(f"قدّيش عنّا {L('USB-C Cable')}، ووين؟", "1,240 · بيروت 800 · صيدا 440"),
            c3=("تنبيه فرق", f"{L('Desk Lamp')} · {L('WH-02')} صيدا", "بالنظام 40 · انعدّ 38", "فرق"),
            c4=("سجلّ الحركات", f"{L('LED Strip 5m')} · {L('120 → 95')}", [("مين", "رامي"), ("إيمتى", "اليوم، 4:12 بعد الضهر"),
                                                                          ("وين", f"{L('WH-01')} · بيروت")]),
            end=("تصبح <em>على خير.</em>", "مخزونك دايماً قدّام عينك.")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SC-03.jfif" alt="" style="width:952px;left:0;top:-160px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        a, b, c = t["c1"]
        cards = [f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2 okc">{c}</div></div>']
        u, r = t["c2"]
        cards.append(f'<div class="wc pc"><div class="bu">{u}</div><div class="re">{r}</div></div>')
        a, b, c, p = t["c3"]
        cards.append(f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2">{c} <span class="pill mis">{p}</span></div></div>')
        a, b, rows = t["c4"]
        cards.append(f'<div class="wc pc"><div class="lab">{a}</div><b class="t">{b}</b><div class="rws">' + "".join(
            f'<div class="rw2"><span class="sp">{k}</span><b>{v}</b></div>' for k, v in rows) + "</div></div>")
        for i, (q, a, card) in enumerate(zip(t["q"], t["a"], cards)):
            sl.append(("", f"""{BG57}
<h1 class="h1" style="top:180px">{q}</h1>
<div class="ans"><small>{t['lab']}</small>{a}</div>
{card.replace('class="wc pc"', 'class="wc pc" style="top:580px"')}"""))
        h, s = t["end"]
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{96 if lang == 'en' else 84}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{330 if lang == 'en' else 360}px">{s}</p>
{MAPCARD.replace('class="wc pc mapc"', 'class="wc pc mapc" style="top:480px"')}"""))
        carousel("IDEA-039", "IDEA-039_11pm-thoughts", lang, sl, "11 PM thoughts")


if __name__ == "__main__":
    idea_036()
    idea_080()
    idea_050()
    idea_062()
    idea_081()
    idea_039()
    print("ok")
