"""December 2026, batch B (IDEA-053, IDEA-066, IDEA-034, IDEA-059, IDEA-006, IDEA-042), EN + AR.

    python3 -I -X utf8 posts/2026-12/build_idea_dec_b.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE))
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
from build_idea_dec_a import ROWS_CSS, write  # noqa: E402


# ---------------------------------------------------------------- IDEA-053 · everyone sees the same stock (light, SC-07 + map on the tablet)
def idea_053():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:560px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.9) 60%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.scr{width:420px;height:534px;transform:matrix3d(0.594321,0,0,0,-0.009438,0.577437,0,-0.000017,0,0,1,0,416.9621,675.0144,0,1)}
.scr img{width:100%;height:100%;object-fit:cover;object-position:50% 55%}
.role{position:absolute;display:flex;flex-direction:column;background:#fff;color:var(--abyss);border-radius:20px;padding:14px 22px;
  box-shadow:0 14px 40px rgba(14,36,64,.3);font-size:26px;font-weight:600}
.role small{font-size:21px;font-weight:400;color:var(--deep)}
.role::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--signal);margin-bottom:6px}
.r1{left:64px;top:560px}.r2{right:64px;top:600px}.r3{left:64px;top:1040px}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 62%)}
"""
    T = {
        "en": dict(h="Everyone sees<br><em>the same stock.</em>", s="Owner, manager, staff: one picture, no arguments.",
                   r=[("Owner", "watches the map"), ("Warehouse manager", "approves transfers"), ("Staff", "log from the phone")]),
        "ar": dict(h="الكل بيشوف<br><em>نفس المخزون.</em>", s="صاحب الشغل، المدير، والفريق: صورة وحدة، بلا نقاش.",
                   r=[("صاحب الشغل", "بيتابع الخريطة"), ("مدير المستودع", "بيوافق عالتحويلات"), ("الفريق", "بيسجّل من التلفون")]),
    }
    for lang, t in T.items():
        roles = "".join(f'<div class="role r{i + 1}">{a}<small>{b}</small></div>' for i, (a, b) in enumerate(t["r"]))
        body = f"""<img class="bg" src="/assets/post-images/final/SC-07.jpg" alt="">
<div class="scr"><img src="/assets/screens/live-map/map-zoom.jpg" alt=""></div>
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
{roles}
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-053", lang)
        write("IDEA-053_everyone-sees-same-stock", nm, page(lang, f"{nm} · same stock", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-066 · 3 stock moves before the new year (5 slides, dark)
def idea_066():
    css = CARD_CSS + ROWS_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.h1{top:212px;font-size:60px;line-height:1.12}
[dir=rtl] .h1{top:206px;font-size:54px}
.cover .h1{top:190px;font-size:84px;line-height:1.04}
[dir=rtl] .cover .h1{font-size:74px;line-height:1.3}
.cover .sub{top:390px;font-size:36px}
[dir=rtl] .cover .sub{top:440px}
.cover .shade-t{height:620px}
.pc{left:64px;right:64px;top:560px;padding:34px 40px;border-radius:30px}
.pc .go{margin-top:18px;display:inline-flex;align-items:center;gap:12px;background:var(--abyss);color:#fff;border-radius:999px;padding:12px 24px;font-size:26px;font-weight:600}
.pc .go i{width:12px;height:12px;border-radius:50%;background:var(--glow);box-shadow:0 0 10px var(--glow)}
.opts{position:absolute;left:64px;right:64px;top:560px;display:flex;flex-direction:column;gap:18px}
.o{display:flex;align-items:center;gap:20px;background:rgba(14,36,64,.78);border:1px solid rgba(201,216,228,.3);border-radius:22px;
  padding:24px 26px;font-size:32px;color:#fff;backdrop-filter:blur(8px)}
.o b{width:56px;height:56px;border-radius:14px;background:#fff;color:var(--abyss);display:grid;place-items:center;font-size:28px;flex:none}
"""
    T = {
        "en": dict(
            cover=("3 stock moves to make<br><em>before the new year.</em>", "Small moves, big Q1."),
            moves=[("Move 1 · Rebalance", "Move stock to the branch<br><em>that sells it.</em>"),
                   ("Move 2 · Clear", "Find what<br><em>hasn't moved in months.</em>"),
                   ("Move 3 · Plan imports", "Sea: about 5 weeks door to door.<br><em>Air: a couple of days.</em>")],
            reb=("Wireless Earbuds", [("WH-02 · Sidon", "120 in stock", "4 out this month"), ("WH-01 · Beirut", "8 in stock", "46 out this month")],
                 "Transfer 60 → Beirut"),
            clr=("Last move", [("USB-C Cable 1m", "WH-04 · Jounieh", "5 months ago"), ("Desk Lamp", "WH-02 · Sidon", "4 months ago")]),
            imp=("Lead times", [("Sea", "Shenzhen → Beirut", "~30 days + customs"), ("Air", "Guangzhou → Beirut", "~14 h + customs")]),
            end=("Which move<br><em>is first for you?</em>", ["Rebalance", "Clear", "Plan imports"], "ABC")),
        "ar": dict(
            cover=("3 حركات بالمخزون<br><em>قبل آخر السنة.</em>", "حركات صغيرة، وربع أوّل أقوى."),
            moves=[("حركة 1 · وزّع", "حرّك البضاعة للفرع<br><em>اللي بيبيعها.</em>"),
                   ("حركة 2 · صفّي", "لاقي الأصناف<br><em>اللي ما تحرّكت من أشهر.</em>"),
                   ("حركة 3 · خطّط للاستيراد", "البحر: حوالي 5 أسابيع للباب.<br><em>الجو: كم يوم.</em>")],
            reb=(L("Wireless Earbuds"), [(f"{L('WH-02')} · صيدا", "120 بالمخزون", "4 طلعوا هالشهر"),
                                         (f"{L('WH-01')} · بيروت", "8 بالمخزون", "46 طلعوا هالشهر")], "تحويل 60 ← بيروت"),
            clr=("آخر حركة", [(L("USB-C Cable 1m"), f"{L('WH-04')} · جونيه", "من 5 أشهر"), (L("Desk Lamp"), f"{L('WH-02')} · صيدا", "من 4 أشهر")]),
            imp=("مدة الشحن", [("بحر", "شنتشن ← بيروت", "حوالي 30 يوم + جمرك"), ("جو", "غوانجو ← بيروت", "حوالي 14 ساعة + جمرك")]),
            end=("أيّا حركة<br><em>أوّل شي عندك؟</em>", ["وزّع", "صفّي", "خطّط للاستيراد"], "أبج")),
    }
    for lang, t in T.items():
        sl = []
        h, s = t["cover"]
        sl.append(("cover", f"""<img class="bg" src="/assets/post-images/final/OB-03.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>"""))
        it, rows, go = t["reb"]
        c1 = (f'<div class="wc pc"><b class="t">{it}</b><div class="rws">' + "".join(
            f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span>{c}</span></div>' for a, b, c in rows)
            + f'</div><div class="go"><i></i>{go}</div></div>')
        lab, rows = t["clr"]
        c2 = f'<div class="wc pc"><div class="lab">{lab}</div><div class="rws">' + "".join(
            f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>' for a, b, c in rows) + "</div></div>"
        lab, rows = t["imp"]
        c3 = f'<div class="wc pc"><div class="lab">{lab}</div><div class="rws">' + "".join(
            f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>' for a, b, c in rows) + "</div></div>"
        for (k, h), card in zip(t["moves"], (c1, c2, c3)):
            sl.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<div class="kick">{k}</div>
<h1 class="h1">{h}</h1>
{card}"""))
        h, opts, letters = t["end"]
        o = "".join(f'<div class="o"><b>{letters[i]}</b>{x}</div>' for i, x in enumerate(opts))
        sl.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{h}</h1>
<div class="opts" style="top:500px">{o}</div>"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-066", lang, i + 1)
            html = page(lang, f"{nm} · 3 stock moves", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-066_3-moves-before-new-year", nm, html)


# ---------------------------------------------------------------- IDEA-034 · your Dubai branch on the same map (dark, SC-02 closer crop)
def idea_034():
    css = """
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;width:1320px;left:-200px;top:-60px;max-width:none}
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.65) 55%,rgba(8,20,36,0))}
.pin{position:absolute;display:flex;align-items:center;gap:14px;background:#fff;color:var(--abyss);border-radius:999px;padding:14px 24px;
  font-size:26px;font-weight:600;box-shadow:0 14px 40px rgba(0,0,0,.45);white-space:nowrap}
.pin small{font-weight:400;color:var(--deep);font-size:23px}
.pin b{background:#BCE5E0;color:#0B7A87;border-radius:999px;padding:2px 14px;font-size:24px}
.pin i{width:14px;height:14px;border-radius:50%;background:var(--signal);flex:none}
.p1{left:64px;top:1010px}.p2{left:560px;top:600px}
.p2 i{background:var(--glow);box-shadow:0 0 14px var(--glow)}
.arc{position:absolute;left:250px;top:660px;width:330px;height:350px;border-left:3px dashed rgba(46,242,238,.8);border-top:3px dashed rgba(46,242,238,.8);
  border-radius:60px 0 0 0}
"""
    T = {
        "en": dict(h="Your Dubai branch,<br><em>on the same map.</em>", s="Lebanon and the Gulf, one view of your stock.",
                   p1=("Beirut", "WH-01", "2,140"), p2=("Dubai", "DXB-01", "1,720")),
        "ar": dict(h="فرعك بدبي،<br><em>على نفس الخريطة.</em>", s="لبنان والخليج، بنظرة وحدة لمخزونك.",
                   p1=("بيروت", L("WH-01"), "2,140"), p2=("دبي", L("DXB-01"), "1,720")),
    }
    for lang, t in T.items():
        pins = "".join(f'<div class="pin p{i}"><i></i>{a}<small>{c}</small><b class="num">{n}</b></div>'
                       for i, (a, c, n) in ((1, t["p1"]), (2, t["p2"])))
        body = f"""<div class="zoom"><img src="/assets/post-images/final/SC-02.jpg" alt=""></div>
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="arc"></div>
{pins}
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-034", lang)
        write("IDEA-034_dubai-branch-same-map", nm, page(lang, f"{nm} · Dubai branch", body, css))


# ---------------------------------------------------------------- IDEA-059 · how many hours does your count take? (dark, OB-01 poll)
def idea_059():
    css = """
.shade-t{height:520px;background:linear-gradient(180deg,rgba(8,20,36,.95),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.h1{top:180px;font-size:70px;line-height:1.08}
[dir=rtl] .h1{font-size:62px}
.bg{top:150px}
.post.dark{background:#071425}
.opts{position:absolute;left:64px;right:64px;top:930px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.o{display:flex;align-items:center;gap:18px;background:rgba(14,36,64,.82);border:1px solid rgba(201,216,228,.32);border-radius:20px;
  padding:20px 22px;font-size:29px;color:#fff;backdrop-filter:blur(8px)}
.o b{width:52px;height:52px;border-radius:14px;background:#fff;color:var(--abyss);display:grid;place-items:center;font-size:26px;flex:none}
.o.d b{background:var(--glow)}
"""
    T = {
        "en": dict(h="How many hours does<br><em>your stock count take?</em>",
                   o=["Under 2 hours", "A full day", "A weekend", "We don't count"], L="ABCD"),
        "ar": dict(h="قدّيش بياخد<br><em>جرد المخزون عندك؟</em>",
                   o=["أقل من ساعتين", "نهار كامل", "ويك إند", "ما منجرد"], L="أبجد"),
    }
    for lang, t in T.items():
        o = "".join(f'<div class="o{" d" if i == 3 else ""}"><b>{t["L"][i]}</b>{x}</div>' for i, x in enumerate(t["o"]))
        body = f"""<img class="bg" src="/assets/post-images/final/OB-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<div class="opts">{o}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-059", lang)
        write("IDEA-059_count-hours-poll", nm, page(lang, f"{nm} · count hours poll", body, css))


# ---------------------------------------------------------------- IDEA-006 · Glossary #02: ETA (light, STK-03 layout)
def idea_006():
    css = CARD_CSS + """
.post.light{background:#F4F8FA}
.grid-bg{position:absolute;inset:0;background-image:radial-gradient(rgba(44,89,116,.13) 1.4px,transparent 1.6px);background-size:28px 28px}
.kick{top:156px;color:var(--signal)}
[dir=rtl] .kick{top:150px}
.word2{position:absolute;left:64px;top:206px;font-size:150px;font-weight:600;letter-spacing:-.04em;line-height:1;color:var(--abyss)}
[dir=rtl] .word2{left:auto;right:64px;direction:ltr}
.ph{position:absolute;left:68px;top:376px;font-size:28px;color:var(--deep)} .ph i{color:var(--signal);font-weight:600;font-style:normal}
[dir=rtl] .ph{left:auto;right:64px}
.def{position:absolute;left:64px;top:450px;width:930px;font-size:40px;line-height:1.35;color:var(--abyss)}
[dir=rtl] .def{left:auto;right:64px;font-size:38px;line-height:1.5}
.how{left:64px;right:64px;top:620px;padding:36px 40px}
.how .lab{margin-bottom:6px}
.how .say{font-size:32px;font-weight:600;color:var(--abyss);margin-bottom:12px}
.how .rw2{display:flex;align-items:center;gap:16px;padding:16px 0;border-top:1px solid #E1EAF0;font-size:28px}
.how .rw2 .sp{flex:1;color:var(--deep);font-size:25px}
.how .ic{width:50px;height:50px;border-radius:14px;background:#E6F2F6;display:grid;place-items:center;flex:none}
.how svg{width:30px;height:30px;fill:none;stroke:var(--abyss);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.see{position:absolute;left:64px;top:1120px;font-size:24px;color:var(--deep)}
[dir=rtl] .see{left:auto;right:64px}
"""
    truck = '<svg viewBox="0 0 24 24"><path d="M1 6h13v10H1zM14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>'
    plane = '<svg viewBox="0 0 24 24"><path d="M2 13l8-1 5-8h2l-2 8 5 1 1-2h2l-1 4 1 4h-2l-1-2-5 1 2 8h-2l-5-8-8-1z"/></svg>'
    ship = '<svg viewBox="0 0 24 24"><path d="M3 15l2 5h14l2-5z"/><path d="M6 15V8h12v7M12 8V4"/></svg>'
    T = {
        "en": dict(k="The stock manager's glossary · 02", w="ETA", ph="<i>noun</i> · /ˌiː.tiːˈeɪ/",
                   d="Estimated Time of Arrival: when a shipment or transfer is expected to land.",
                   lab="In Stacko", say="Every transfer shows a live countdown on the map.",
                   r=[(truck, "Beirut → Sidon", "Transfer", "ETA 1h 05m"), (ship, "SHP-24021", "Sea shipment", "ETA 6 days"), (plane, "SHP-24035", "Air shipment", "ETA 14 h")],
                   see="See also: in transit, lead time, stock transfer (#01)."),
        "ar": dict(k="قاموس مدير المخزون · 02", w="ETA", ph="<i>اختصار</i> · وقت الوصول المتوقّع",
                   d="الوقت اللي متوقّع توصل فيه الشحنة أو التحويل.",
                   lab="بستاكو", say="كل تحويل إلو عدّاد مباشر عالخريطة.",
                   r=[(truck, "بيروت ← صيدا", "تحويل", "بتوصل خلال ساعة و5 دقايق"), (ship, L("SHP-24021"), "شحنة بحرية", "بتوصل خلال 6 أيام"), (plane, L("SHP-24035"), "شحنة جوّية", "بتوصل خلال 14 ساعة")],
                   see=f"شوف كمان: عالطريق، مدة التوريد، التحويل المخزني ({L('#01')})."),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><span class="ic">{ic}</span><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>'
                       for ic, a, b, c in t["r"])
        body = f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<div class="word2">{t['w']}</div>
<div class="ph">{t['ph']}</div>
<p class="def">{t['d']}</p>
<div class="wc how"><div class="lab">{t['lab']}</div><div class="say">{t['say']}</div>{rows}</div>
<p class="see">{t['see']}</p>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-006", lang)
        write("IDEA-006_glossary-02-eta", nm, page(lang, f"{nm} · Glossary ETA", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-042 · logged before the engine starts (dark, SC-04 + chat on the phone)
def idea_042():
    css = """
.shade-t{height:520px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.scr{transform:matrix3d(0.540841,-0.012979,0,0.000158,0.047315,0.374861,0,-0.000156,0,0,1,0,446.2596,514.4641,0,1)}
.scr .chat{height:600px}
.call{position:absolute;left:64px;top:860px;width:600px;background:#F4F8FA;border-radius:28px;padding:24px 26px;
  box-shadow:0 22px 60px rgba(0,0,0,.5),0 0 0 2px rgba(46,242,238,.6)}
[dir=rtl] .call{left:auto;right:64px}
.call .bu{margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:28px;padding:14px 22px;border-radius:22px 22px 6px 22px}
[dir=rtl] .call .bu{border-radius:22px 22px 22px 6px}
.call .re{display:flex;gap:14px;align-items:flex-start;margin-top:14px}
.call .av{width:46px;height:46px;border-radius:50%;background:var(--abyss);display:grid;place-items:center;flex:none}.call .av img{width:32px}
.call .re > div:last-child{background:#fff;border-radius:22px;padding:14px 20px;font-size:26px;line-height:1.35;color:var(--abyss);box-shadow:0 4px 14px rgba(14,36,64,.1)}
.call .re small{display:block;color:#0B7A87;font-weight:600}
.halo{position:absolute;left:400px;top:440px;width:340px;height:440px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(46,242,238,.25),rgba(46,242,238,0))}
"""
    T = {
        "en": dict(h="Logged<br><em>before the engine starts.</em>", s="One message from the driver. The whole team sees it.",
                   who="Stacko", st="online", u="Loaded 40 LED strips for Sidon",
                   r='<span class="ok">Logged ✓</span><br>40 × LED Strip 5m<br>Beirut → Sidon<small>ETA 50m · on the map</small>',
                   c='<small>Logged ✓</small>40 × LED Strip 5m · Beirut → Sidon<br>ETA 50m · on the map'),
        "ar": dict(h="انسجّلت<br><em>قبل ما يدوّر المحرّك.</em>", s="رسالة وحدة من الشوفير. والفريق كلّه بيشوفها.",
                   who="ستاكو", st="متّصل", u=f"حمّلت 40 {L('LED Strip')} لصيدا",
                   r=f'<span class="ok">تسجّلت ✓</span><br>{L("40 × LED Strip 5m")}<br>بيروت ← صيدا<small>بتوصل خلال 50 دقيقة · عالخريطة</small>',
                   c=f'<small>تسجّلت ✓</small>{L("40 × LED Strip 5m")} · بيروت ← صيدا<br>بتوصل خلال 50 دقيقة · عالخريطة'),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-04.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="halo"></div>
<div class="scr"><div class="chat"><div class="hd"><div class="av"><img src="/assets/brand/logo/mark-dark.svg" alt=""></div><div><b>{t['who']}</b><small>{t['st']}</small></div></div>
<div class="u">{t['u']}</div><div class="r">{t['r']}</div></div></div>
<div class="call"><div class="bu">{t['u']}</div>
  <div class="re"><div class="av"><img src="/assets/brand/logo/mark-dark.svg" alt=""></div><div>{t['c']}</div></div></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-042", lang)
        write("IDEA-042_logged-before-engine-starts", nm, page(lang, f"{nm} · logged before the engine", body, css))


if __name__ == "__main__":
    idea_053()
    idea_066()
    idea_034()
    idea_059()
    idea_006()
    idea_042()
    print("ok")
