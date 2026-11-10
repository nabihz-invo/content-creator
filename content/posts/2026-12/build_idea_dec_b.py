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
from build_idea_dec_a import LIGHT_CSS, ROWS_CSS, write  # noqa: E402


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
        "ar": dict(h="الكل بيشوف<br><em>نفس المخازن.</em>", s="صاحب الشغل، المدير، والفريق: صورة وحدة، بلا نقاش.",
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
            cover=("3 حركات بالمخازن<br><em>قبل آخر السنة.</em>", "حركات صغيرة، وربع أوّل أقوى."),
            moves=[("حركة 1 · وزّع", "حرّك البضاعة للفرع<br><em>اللي بيبيعها.</em>"),
                   ("حركة 2 · صفّي", "لاقي الأصناف<br><em>اللي ما تحرّكت من أشهر.</em>"),
                   ("حركة 3 · خطّط للاستيراد", "البحر: حوالي 5 أسابيع للباب.<br><em>الجو: كم يوم.</em>")],
            reb=(L("Wireless Earbuds"), [(f"{L('WH-02')} · صيدا", "120 بالمخازن", "4 طلعوا هالشهر"),
                                         (f"{L('WH-01')} · بيروت", "8 بالمخازن", "46 طلعوا هالشهر")], "تحويل 60 ← بيروت"),
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
        "ar": dict(h="فرعك بدبي،<br><em>على نفس الخريطة.</em>", s="لبنان والخليج، بنظرة وحدة لمخزنك.",
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
        "ar": dict(h="قدّيش بياخد<br><em>جرد المخازن عندك؟</em>",
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
# isometric warehouse from assets/map-elements (StackoMap.render("warehouse", {size: "s"}))
WAREHOUSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46.3 -19 96.07 69" width="96.07" height="69" data-anchor-x="51.5" data-anchor-y="38"><polygon points="-43.3,19 5.2,47 5.2,46.4 -43.3,18.4" fill="#AEBDCA"/><polygon points="46.77,23 5.2,47 5.2,46.4 46.77,22.4" fill="#9FB0BF"/><polygon points="-1.73,-5.6 46.77,22.4 5.2,46.4 -43.3,18.4" fill="#D3DEE7"/><polygon points="0,-16 38.11,6 24.25,7 -13.86,-15" fill="#70A2BF"/><polygon points="-27.71,16 10.39,38 10.39,22 -27.71,0" fill="#2F86B8"/><line x1="-25.55" y1="16.65" x2="-25.55" y2="1.25" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-23.38" y1="17.9" x2="-23.38" y2="2.5" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-21.22" y1="19.15" x2="-21.22" y2="3.75" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-19.05" y1="20.4" x2="-19.05" y2="5" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-16.89" y1="21.65" x2="-16.89" y2="6.25" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-14.72" y1="22.9" x2="-14.72" y2="7.5" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-12.56" y1="24.15" x2="-12.56" y2="8.75" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-10.39" y1="25.4" x2="-10.39" y2="10" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-8.23" y1="26.65" x2="-8.23" y2="11.25" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-6.06" y1="27.9" x2="-6.06" y2="12.5" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-3.9" y1="29.15" x2="-3.9" y2="13.75" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="-1.73" y1="30.4" x2="-1.73" y2="15" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="0.43" y1="31.65" x2="0.43" y2="16.25" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="2.6" y1="32.9" x2="2.6" y2="17.5" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="4.76" y1="34.15" x2="4.76" y2="18.75" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="6.93" y1="35.4" x2="6.93" y2="20" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><line x1="9.09" y1="36.65" x2="9.09" y2="21.25" stroke="#4C97C2" stroke-width="0.35" stroke-linecap="round"/><polygon points="38.11,22 10.39,38 10.39,22 24.25,7 38.11,6" fill="#28709C"/><line x1="35.94" y1="22.65" x2="35.94" y2="6.56" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="33.77" y1="23.9" x2="33.77" y2="6.71" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="31.61" y1="25.15" x2="31.61" y2="6.87" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="29.44" y1="26.4" x2="29.44" y2="7.02" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="27.28" y1="27.65" x2="27.28" y2="7.18" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="25.11" y1="28.9" x2="25.11" y2="7.34" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="22.95" y1="30.15" x2="22.95" y2="8.81" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="20.78" y1="31.4" x2="20.78" y2="11.15" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="18.62" y1="32.65" x2="18.62" y2="13.49" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="16.45" y1="33.9" x2="16.45" y2="15.84" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="14.29" y1="35.15" x2="14.29" y2="18.18" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><line x1="12.12" y1="36.4" x2="12.12" y2="20.53" stroke="#3E7EA6" stroke-width="0.3" stroke-linecap="round"/><polygon points="-24.55,17.83 -15.72,22.93 -15.72,12.73 -24.55,7.63" fill="#24668F"/><polygon points="-24.03,18.13 -16.24,22.63 -16.24,13.03 -24.03,8.53" fill="#C9D8E4"/><line x1="-24.03" y1="16.93" x2="-16.24" y2="21.43" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="15.73" x2="-16.24" y2="20.23" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="14.53" x2="-16.24" y2="19.02" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="13.33" x2="-16.24" y2="17.83" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="12.13" x2="-16.24" y2="16.63" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="10.93" x2="-16.24" y2="15.43" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-24.03" y1="9.73" x2="-16.24" y2="14.23" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><polygon points="-25.94,16.83 -25.24,17.22 -25.24,14.82 -25.94,14.43" fill="#0E2440"/><polygon points="-24.55,16.83 -25.24,17.22 -25.24,14.82 -24.55,14.43" fill="#0D223C"/><polygon points="-25.24,14.03 -24.55,14.43 -25.24,14.82 -25.94,14.43" fill="#43546A"/><polygon points="-16.41,22.33 -15.72,22.73 -15.72,20.33 -16.41,19.93" fill="#0E2440"/><polygon points="-15.03,22.33 -15.72,22.73 -15.72,20.33 -15.03,19.93" fill="#0D223C"/><polygon points="-15.72,19.53 -15.03,19.93 -15.72,20.33 -16.41,19.93" fill="#43546A"/><polygon points="-26.8,19.73 -19.01,24.23 -19.01,23.13 -26.8,18.63" fill="#9FB0BF"/><polygon points="-16.24,22.63 -19.01,24.23 -19.01,23.13 -16.24,21.53" fill="#8C9DAD"/><polygon points="-24.03,17.02 -16.24,21.53 -19.01,23.13 -26.8,18.63" fill="#AEBDCA"/><polygon points="-24.9,6.43 -15.37,11.93 -17.28,13.43 -26.8,7.93" fill="#C9D8E4"/><polygon points="-13.08,24.45 -4.24,29.55 -4.24,19.35 -13.08,14.25" fill="#24668F"/><polygon points="-12.56,24.75 -4.76,29.25 -4.76,19.65 -12.56,15.15" fill="#C9D8E4"/><line x1="-12.56" y1="23.55" x2="-4.76" y2="28.05" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="22.35" x2="-4.76" y2="26.85" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="21.15" x2="-4.76" y2="25.65" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="19.95" x2="-4.76" y2="24.45" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="18.75" x2="-4.76" y2="23.25" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="17.55" x2="-4.76" y2="22.05" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><line x1="-12.56" y1="16.35" x2="-4.76" y2="20.85" stroke="#A9B9C7" stroke-width="0.3" stroke-linecap="round"/><polygon points="-14.46,23.45 -13.77,23.85 -13.77,21.45 -14.46,21.05" fill="#0E2440"/><polygon points="-13.08,23.45 -13.77,23.85 -13.77,21.45 -13.08,21.05" fill="#0D223C"/><polygon points="-13.77,20.65 -13.08,21.05 -13.77,21.45 -14.46,21.05" fill="#43546A"/><polygon points="-4.94,28.95 -4.24,29.35 -4.24,26.95 -4.94,26.55" fill="#0E2440"/><polygon points="-3.55,28.95 -4.24,29.35 -4.24,26.95 -3.55,26.55" fill="#0D223C"/><polygon points="-4.24,26.15 -3.55,26.55 -4.24,26.95 -4.94,26.55" fill="#43546A"/><polygon points="-15.33,26.35 -7.53,30.85 -7.53,29.75 -15.33,25.25" fill="#9FB0BF"/><polygon points="-4.76,29.25 -7.53,30.85 -7.53,29.75 -4.76,28.15" fill="#8C9DAD"/><polygon points="-12.56,23.65 -4.76,28.15 -7.53,29.75 -15.33,25.25" fill="#AEBDCA"/><polygon points="-13.42,13.05 -3.9,18.55 -5.8,20.05 -15.33,14.55" fill="#C9D8E4"/><polygon points="-1.6,31.08 7.23,36.17 7.23,25.98 -1.6,20.88" fill="#24668F"/><polygon points="-1.08,31.38 6.71,35.88 6.71,26.28 -1.08,21.78" fill="#0B1A2E"/><polygon points="1.95,31.13 5.41,33.13 5.41,29.63 1.95,27.63" fill="#CDA672"/><polygon points="8.88,31.13 5.41,33.13 5.41,29.63 8.88,27.63" fill="#B58E5A"/><polygon points="5.41,25.63 8.88,27.63 5.41,29.63 1.95,27.63" fill="#E6CB9E"/><line x1="7.14" y1="26.63" x2="3.68" y2="28.63" stroke="#B58E5A" stroke-width="0.8" stroke-linecap="round"/><polygon points="-2.99,30.08 -2.29,30.48 -2.29,28.08 -2.99,27.68" fill="#0E2440"/><polygon points="-1.6,30.08 -2.29,30.48 -2.29,28.08 -1.6,27.68" fill="#0D223C"/><polygon points="-2.29,27.28 -1.6,27.68 -2.29,28.08 -2.99,27.68" fill="#43546A"/><polygon points="6.54,35.58 7.23,35.97 7.23,33.57 6.54,33.18" fill="#0E2440"/><polygon points="7.92,35.58 7.23,35.97 7.23,33.57 7.92,33.18" fill="#0D223C"/><polygon points="7.23,32.78 7.92,33.18 7.23,33.57 6.54,33.18" fill="#43546A"/><polygon points="-3.85,32.98 3.94,37.48 3.94,36.38 -3.85,31.88" fill="#9FB0BF"/><polygon points="6.71,35.88 3.94,37.48 3.94,36.38 6.71,34.78" fill="#8C9DAD"/><polygon points="-1.08,30.28 6.71,34.78 3.94,36.38 -3.85,31.88" fill="#AEBDCA"/><polygon points="-1.95,19.68 7.58,25.18 5.67,26.68 -3.85,21.18" fill="#C9D8E4"/><polygon points="-19.33,8.24 2.01,20.56 2.01,18.16 -19.33,5.84" fill="#0E2440"/><polygon points="20.92,31.92 16.59,34.42 16.59,26.42 20.92,23.92" fill="#C9D8E4"/><polygon points="20.58,32.12 16.94,34.22 16.94,26.62 20.58,24.52" fill="#D9E4EC"/><polygon points="34.64,14.08 13.86,26.08 13.86,23.84 34.64,11.84" fill="#8FC9D6"/><polygon points="-13.86,-15 24.25,7 9.01,23.5 -29.1,1.5" fill="#9AC5DD"/><line x1="-12.12" y1="-14" x2="-27.37" y2="2.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-10.39" y1="-13" x2="-25.63" y2="3.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-8.66" y1="-12" x2="-23.9" y2="4.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-6.93" y1="-11" x2="-22.17" y2="5.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-5.2" y1="-10" x2="-20.44" y2="6.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-3.46" y1="-9" x2="-18.71" y2="7.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-1.73" y1="-8" x2="-16.97" y2="8.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="0" y1="-7" x2="-15.24" y2="9.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="1.73" y1="-6" x2="-13.51" y2="10.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="3.46" y1="-5" x2="-11.78" y2="11.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="5.2" y1="-4" x2="-10.05" y2="12.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="6.93" y1="-3" x2="-8.31" y2="13.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="8.66" y1="-2" x2="-6.58" y2="14.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="10.39" y1="-1" x2="-4.85" y2="15.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="12.12" y1="0" x2="-3.12" y2="16.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="13.86" y1="1" x2="-1.39" y2="17.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="15.59" y1="2" x2="0.35" y2="18.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="17.32" y1="3" x2="2.08" y2="19.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="19.05" y1="4" x2="3.81" y2="20.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="20.78" y1="5" x2="5.54" y2="21.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="22.52" y1="6" x2="7.27" y2="22.5" stroke="#9EC7DE" stroke-width="0.35" stroke-linecap="round"/><line x1="-13.86" y1="-15" x2="24.25" y2="7" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round"/><polygon points="9.01,23.5 24.25,7 24.77,7.3 9.53,23.8" fill="#618EAA"/><circle cx="-18.19" cy="10.7" r="0.5" fill="#FFF7D6"/><circle cx="-8.66" cy="16.2" r="0.5" fill="#FFF7D6"/><circle cx="0.87" cy="21.7" r="0.5" fill="#FFF7D6"/></svg>'


def idea_006():
    """Glossary #02 as a 7-slide carousel (revised 2026-11-09): cover, ETA (the original card), ETD, SKU, WH, MOQ, closing."""
    css = LIGHT_CSS + CARD_CSS + """
.post.light{background:#F4F8FA}
.grid-bg{position:absolute;inset:0;background-image:radial-gradient(rgba(44,89,116,.13) 1.4px,transparent 1.6px);background-size:28px 28px}
.kick{top:156px;color:var(--signal)}
[dir=rtl] .kick{top:150px}
.nw{white-space:nowrap}
.word2{position:absolute;left:64px;top:206px;font-size:150px;font-weight:600;letter-spacing:-.04em;line-height:1;color:var(--abyss)}
[dir=rtl] .word2{left:auto;right:64px;direction:ltr}
.ph{position:absolute;left:68px;top:376px;font-size:28px;color:var(--deep)} .ph i{color:var(--signal);font-weight:600;font-style:normal}
[dir=rtl] .ph{left:auto;right:64px;font-size:31px}
.def{position:absolute;left:64px;top:450px;width:930px;font-size:40px;line-height:1.35;color:var(--abyss)}
[dir=rtl] .def{left:auto;right:64px;font-size:38px;line-height:1.5}
.how{left:64px;right:64px;top:620px;padding:36px 40px}
.how .lab{margin-bottom:6px}
.how .say{font-size:32px;font-weight:600;color:var(--abyss);margin-bottom:12px}
[dir=rtl] .how .say{font-size:33px}
.how .rw2{display:flex;align-items:center;gap:16px;padding:16px 0;border-top:1px solid #E1EAF0;font-size:28px}
.how .rw2 .sp{flex:1;color:var(--deep);font-size:25px}
.how .rw2 .num{font-variant-numeric:tabular-nums}
.how .ic{width:50px;height:50px;border-radius:14px;background:#E6F2F6;display:grid;place-items:center;flex:none}
.how svg{width:30px;height:30px;fill:none;stroke:var(--abyss);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.how .pill.low{background:#F0AAAA;color:var(--abyss);border-radius:999px;padding:4px 14px;font-size:22px;font-weight:600}
.how .pill.in{background:#BCE5E0;color:var(--abyss);border-radius:999px;padding:4px 14px;font-size:22px;font-weight:600}
.whs{display:flex;gap:18px;margin-top:14px}
.whs .w{flex:1;background:#EEF6F9;border-radius:18px;padding:12px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
.whs .w svg{width:190px;height:138px;stroke:none;fill:initial}
.whs .w{padding-top:18px}
.whs .chip{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #C9D8E4;border-radius:999px;padding:6px 8px 6px 14px;font-size:20px;font-weight:600;direction:ltr;white-space:nowrap}
.whs .chip span{background:#EEF6F9;border-radius:999px;padding:2px 9px;font-size:18px}
.whs .chip em{font-style:normal;background:#C2334A;color:#fff;border-radius:999px;min-width:24px;text-align:center;padding:2px 7px;font-size:16px}
.cv .h1{top:200px;font-size:104px;line-height:1.02}
[dir=rtl] .cv .h1{font-size:76px;line-height:1.35}
.cv .sub{top:440px;font-size:36px;color:var(--deep)}
[dir=rtl] .cv .sub{top:470px}
.terms{position:absolute;left:64px;right:64px;top:560px;display:flex;flex-direction:column;gap:16px}
.terms div{display:flex;align-items:center;gap:28px;background:#fff;border-radius:22px;padding:20px 30px;box-shadow:0 10px 34px rgba(22,59,98,.12)}
.terms b{width:170px;flex:none;font-size:58px;font-weight:600;letter-spacing:-.03em;color:var(--abyss);line-height:1;direction:ltr}
[dir=rtl] .terms b{text-align:right}
.terms span{font-size:30px;color:var(--deep)}
[dir=rtl] .terms span{font-size:32px}
.terms div b{color:var(--signal)}
.end .h1{top:200px;font-size:96px;line-height:1.04}
[dir=rtl] .end .h1{font-size:80px;line-height:1.3}
.end .sub{top:420px;font-size:36px;color:var(--deep)}
[dir=rtl] .end .sub{top:440px}
.end .terms{top:520px;gap:12px}
.end .terms div{padding:14px 30px}
.end .terms b{font-size:48px}
.end .cta{position:absolute;left:64px;right:64px;top:1140px;font-size:36px;font-weight:600;color:var(--signal)}
"""
    truck = '<svg viewBox="0 0 24 24"><path d="M1 6h13v10H1zM14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>'
    plane = '<svg viewBox="0 0 24 24"><path d="M2 13l8-1 5-8h2l-2 8 5 1 1-2h2l-1 4 1 4h-2l-1-2-5 1 2 8h-2l-5-8-8-1z"/></svg>'
    ship = '<svg viewBox="0 0 24 24"><path d="M3 15l2 5h14l2-5z"/><path d="M6 15V8h12v7M12 8V4"/></svg>'
    box = '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>'
    house = '<svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6v10H3z"/><path d="M8 20v-6h8v6"/></svg>'
    tag = '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>'
    wh = WAREHOUSE_SVG
    T = {
        "en": dict(
            k="The stock manager's glossary · 02",
            cover=("Glossary #02", "5 short terms every warehouse team should know."),
            terms=[("ETA", "Estimated Time of Arrival"), ("ETD", "Estimated Time of Departure"), ("SKU", "Stock Keeping Unit"),
                   ("WH", "Warehouse"), ("MOQ", "Minimum Order Quantity")],
            ph="<i>{w}</i> · {full}", lab="In Stacko",
            slides=[
                ("ETA", "Estimated Time of Arrival", "When a shipment or transfer is expected to land.",
                 "Every transfer shows a live countdown on the map.",
                 [(truck, "Beirut → Sidon", "Transfer", "ETA 1h 05m", "okc"), (ship, "SHP-24021", "Sea shipment", "ETA 6 days", "okc"),
                  (plane, "SHP-24035", "Air shipment", "ETA 14 h", "okc")]),
                ("ETD", "Estimated Time of Departure", "When a shipment is expected to leave.",
                 "Each shipment shows its route and when it's due.",
                 [(ship, "SHP-24021", "Shenzhen → Port of Beirut", "Day 24 of ~30", "okc"), (plane, "SHP-24035", "Guangzhou → Beirut", "ETA 14 h", "okc"),
                  (truck, "Port of Beirut → WH-01", "Truck", "After customs", "")]),
                ("SKU", "Stock Keeping Unit", 'The unique code of one item, such as <span class="nw">LED Strip 5m</span>.',
                 "Every item has one record across all your warehouses.",
                 [(tag, "LED Strip 5m", "One item, one record", "", ""), (house, "WH-01 Beirut", "", "1,380", "num"),
                  (house, "WH-02 Sidon", "", "210", "num")]),
                ("WH", "Warehouse", 'A storage location, usually with a code like <span class="nw">WH-01</span>.',
                 "Every warehouse shows its code, units and low-stock count on the map.", "WH"),
                ("MOQ", "Minimum Order Quantity", "The smallest amount a supplier will sell you per order.",
                 "See what you already have before you reorder.",
                 [(box, "Desk Lamp", "Supplier MOQ", "100", "num"), (house, "WH-01 Beirut", "In stock", "45", "num"),
                  (house, "BR-01 Jounieh", "In stock", "60", "num")]),
            ],
            wh=[("WH-01 · Beirut", "7,250", "4"), ("WH-02 · Sidon", "1,210", "")],
            end=("Save this<br><em>glossary.</em>", "More terms coming in the series."),
            cta="See your stock live →"),
        "ar": dict(
            k="قاموس مدير المخازن · 02",
            cover=(f"القاموس {L('#02')}<br><em>5 مصطلحات</em>", "5 مصطلحات قصيرة لازم يعرفها كل فريق مخزن."),
            terms=[("ETA", "وقت الوصول المتوقّع"), ("ETD", "وقت المغادرة المتوقّع"), ("SKU", "رمز الصنف"),
                   ("WH", "مخزن"), ("MOQ", "الحد الأدنى للطلب")],
            ph="<i>{w}</i> · {full}", lab="بستاكو",
            slides=[
                ("ETA", "وقت الوصول المتوقّع", "الوقت اللي متوقّع توصل فيه الشحنة أو التحويل.",
                 "كل تحويل إلو عدّاد مباشر عالخريطة.",
                 [(truck, "بيروت ← صيدا", "تحويل", "بتوصل خلال ساعة و5 دقايق", "okc"), (ship, L("SHP-24021"), "شحنة بحرية", "بتوصل خلال 6 أيام", "okc"),
                  (plane, L("SHP-24035"), "شحنة جوّية", "بتوصل خلال 14 ساعة", "okc")]),
                ("ETD", "وقت المغادرة المتوقّع", "الوقت اللي متوقّع تفلّ فيه الشحنة.",
                 "كل شحنة بتبيّن مسارها وإيمتى لازم توصل.",
                 [(ship, L("SHP-24021"), "شنتشن ← مرفأ بيروت", "اليوم 24 من حوالي 30", "okc"), (plane, L("SHP-24035"), "غوانزو ← بيروت", "بتوصل خلال 14 ساعة", "okc"),
                  (truck, f"مرفأ بيروت ← {L('WH-01')}", "شاحنة", "بعد الجمرك", "")]),
                ("SKU", "رمز الصنف", f"الرمز الخاص بصنف واحد، متل {L('LED Strip 5m')}.",
                 "كل صنف إلو سجل واحد بكل مخازنك.",
                 [(tag, L("LED Strip 5m"), "صنف واحد، سجل واحد", "", ""), (house, f"{L('WH-01')} بيروت", "", "1,380", "num"),
                  (house, f"{L('WH-02')} صيدا", "", "210", "num")]),
                ("WH", "مخزن", f"مكان تخزين، عادةً إلو رمز متل {L('WH-01')}.",
                 "كل مخزن بيبيّن رمزه ووحداته وعدد الأصناف القليلة عالخريطة.", "WH"),
                ("MOQ", "الحد الأدنى للطلب", "أقل كمية بيقبل المورّد يبيعك ياها بالطلبية.",
                 "شوف شو عندك قبل ما تعيد تطلب.",
                 [(box, "مصباح مكتب", "الحد الأدنى عند المورّد", "100", "num"), (house, f"{L('WH-01')} بيروت", "بالمخزن", "45", "num"),
                  (house, f"{L('BR-01')} جونيه", "بالمخزن", "60", "num")]),
            ],
            wh=[("WH-01 · Beirut", "7,250", "4"), ("WH-02 · Sidon", "1,210", "")],
            end=("احفظ<br><em>القاموس.</em>", "في مصطلحات أكتر جايي بالسلسلة."),
            cta="شوف مخزنك مباشر ←"),
    }
    for lang, t in T.items():
        n = 7
        terms = "".join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in t["terms"])
        arts = [("cv", f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['cover'][0]}</h1>
<p class="sub">{t['cover'][1]}</p>
<div class="terms">{terms}</div>""")]
        for w, full, d, say, rows in t["slides"]:
            if rows == "WH":
                chips = "".join(f'<div class="w"><div class="chip">{c}<span>{u}</span>{f"<em>{lo}</em>" if lo else ""}</div>{wh}</div>' for c, u, lo in t["wh"])
                inner = f'<div class="whs">{chips}</div>'
            else:
                inner = "".join(f'<div class="rw2"><span class="ic">{ic}</span><b>{a}</b><span class="sp">{b}</span><span class="{c2}">{c}</span></div>'
                                for ic, a, b, c, c2 in rows)
            arts.append(("", f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<div class="word2">{w}</div>
<div class="ph">{t['ph'].format(w=w, full=full)}</div>
<p class="def">{d}</p>
<div class="wc how"><div class="lab">{t['lab']}</div><div class="say">{say}</div>{inner}</div>"""))
        arts.append(("end", f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['end'][0]}</h1>
<p class="sub">{t['end'][1]}</p>
<div class="terms">{terms}</div>
<div class="cta">{t['cta']}</div>"""))
        for k, (cls, art) in enumerate(arts):
            body = f"""{art}
{top(lang, light=True)}
{FOOT[lang] if k == n - 1 else bar(lang, n, k)}"""
            nm = name("IDEA-006", lang, k + 1)
            html = page(lang, f"{nm} · Glossary #02", body, css, theme="light")
            if cls:
                html = html.replace('<div class="post light">', f'<div class="post light {cls}">')
            write("IDEA-006_glossary-02-eta", nm, html)


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
        "ar": dict(h="الطلبية تسجّلت<br><em>قبل ما يدوّر المحرّك.</em>", s="رسالة وحدة من الشوفير. والفريق كلّه بيشوفها.",
                   who="ستاكو", st="متّصل", u=f"حمّلت 40 {L('LED Strip')} لصيدا",
                   r=f'<span class="ok">الطلبية تسجّلت ✓</span><br>{L("40 × LED Strip 5m")}<br>بيروت ← صيدا<small>بتوصل خلال 50 دقيقة · عالخريطة</small>',
                   c=f'<small>الطلبية تسجّلت ✓</small>{L("40 × LED Strip 5m")} · بيروت ← صيدا<br>بتوصل خلال 50 دقيقة · عالخريطة'),
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
