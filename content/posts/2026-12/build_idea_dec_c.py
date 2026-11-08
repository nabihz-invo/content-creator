"""December 2026, batch C (IDEA-019, IDEA-083, IDEA-068, IDEA-082, IDEA-012, IDEA-070), EN + AR.

    python3 -I -X utf8 posts/2026-12/build_idea_dec_c.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE))
from build_idea_week1 import FOOT, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
from build_idea_dec_a import ROWS_CSS, write  # noqa: E402


# ---------------------------------------------------------------- IDEA-019 · Sound familiar? #1 (dark, BG-60, text-led)
def idea_019():
    css = CARD_CSS + ROWS_CSS + """
.bg{filter:brightness(.75)}
.shade-t{height:760px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.6) 70%,rgba(8,20,36,0))}
.kick{top:180px;color:var(--glow)}
[dir=rtl] .kick{top:174px}
.h1{top:230px;font-size:66px;line-height:1.1}
[dir=rtl] .h1{top:224px;font-size:66px}
.sub{color:var(--visor)}
.sc{left:64px;right:64px;top:700px;padding:30px 36px}
.sc .rw2 .d{width:110px;color:var(--signal);font-weight:700;font-size:24px}
"""
    T = {
        "en": dict(k="Sound familiar? #1", h="You order 200 units.<br><em>Then find 200 behind the door.</em>",
                   s="If it isn't logged, it doesn't exist.",
                   r=[("Mon", "Order placed", "200 × USB-C Cable"), ("Thu", "Found in the back room", "200 × USB-C Cable")]),
        "ar": dict(k="مألوفة؟ #1", h="بتطلب 200 قطعة…<br><em>وبتلاقي 200 ورا الباب.</em>",
                   s="إذا مش مسجّل، يعني مش موجود.",
                   r=[("الاتنين", "انطلبت", L("200 × USB-C Cable")), ("الخميس", "لقيناهن بالمخزن الخلفي", L("200 × USB-C Cable"))]),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><span class="d">{d}</span><b>{a}</b><span class="sp"></span><span>{b}</span></div>' for d, a, b in t["r"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 440}px">{t['s']}</p>
<div class="wc sc">{rows}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-019", lang)
        write("IDEA-019_sound-familiar-01", nm, page(lang, f"{nm} · Sound familiar #1", body, css))


# ---------------------------------------------------------------- IDEA-083 · season's greetings (dark, SE-02 window crop)
def idea_083():
    css = """
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;width:1500px;left:-380px;top:-40px;max-width:none}
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.5) 60%,rgba(8,20,36,0))}
.h1{top:200px;font-size:84px;line-height:1.06}
[dir=rtl] .h1{font-size:76px}
"""
    T = {
        "en": dict(h="Season's greetings<br><em>from the Stacko team.</em>", s="Rest well. Your stock will still be on the map."),
        "ar": dict(h="أعياد مجيدة<br><em>من فريق ستاكو.</em>", s="ارتاحوا منيح. مخزونكن رح يضلّ عالخريطة."),
    }
    for lang, t in T.items():
        body = f"""<div class="zoom"><img src="/assets/post-images/final/SE-02.jpg" alt=""></div>
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{400 if lang == 'en' else 430}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-083", lang)
        write("IDEA-083_seasons-greetings", nm, page(lang, f"{nm} · season's greetings", body, css))


# ---------------------------------------------------------------- IDEA-068 · no missing pieces (light, OB-04)
def idea_068():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:560px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.88) 60%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.q{position:absolute;display:flex;flex-direction:column;background:#fff;color:var(--abyss);border-radius:20px;padding:14px 22px;
  box-shadow:0 14px 40px rgba(14,36,64,.25);font-size:28px;font-weight:600;white-space:nowrap}
.q small{font-size:19px;letter-spacing:.1em;text-transform:uppercase;color:var(--signal);font-weight:700}
[dir=rtl] .q small{letter-spacing:0;font-size:21px}
.q1{left:120px;top:560px}.q2{left:700px;top:520px}.q3{left:120px;top:900px}.q4{left:700px;top:880px}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 62%)}
"""
    T = {
        "en": dict(h="Stock data<br><em>with no missing pieces.</em>", s="Who, what, when and where, for every move.",
                   q=[("Who", "Rami"), ("What", "−25 · LED Strip 5m"), ("When", "Today, 4:12 PM"), ("Where", "WH-01 · Beirut")]),
        "ar": dict(h="بيانات مخزون<br><em>بلا قطع ناقصة.</em>", s="مين، شو، إيمتى ووين، لكل حركة.",
                   q=[("مين", "رامي"), ("شو", f"{L('−25')} · {L('LED Strip 5m')}"), ("إيمتى", "اليوم، 4:12 بعد الضهر"), ("وين", f"{L('WH-01')} · بيروت")]),
    }
    for lang, t in T.items():
        q = "".join(f'<div class="q q{i + 1}"><small>{a}</small><span>{b}</span></div>' for i, (a, b) in enumerate(t["q"]))
        body = f"""<img class="bg" src="/assets/post-images/final/OB-04.jpg" alt="">
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
{q}
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-068", lang)
        write("IDEA-068_no-missing-pieces", nm, page(lang, f"{nm} · no missing pieces", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-082 · your 2026 in boxes (dark, SE-02)
def idea_082():
    css = """
.bg{filter:brightness(.85)}
.shade-t{height:620px}
.h1{top:190px;font-size:96px;line-height:1.02}
[dir=rtl] .h1{font-size:84px;line-height:1.3}
.fill{position:absolute;left:64px;top:720px;display:flex;flex-direction:column;gap:18px}
[dir=rtl] .fill{left:auto;right:64px}
.fill div{display:flex;align-items:baseline;gap:18px;background:rgba(14,36,64,.82);border:1px solid rgba(201,216,228,.32);border-radius:22px;
  padding:22px 30px;font-size:34px;color:#fff;backdrop-filter:blur(8px);width:fit-content}
.fill i{display:inline-block;width:120px;border-bottom:3px solid var(--glow);height:34px}
"""
    T = {
        "en": dict(h="Your 2026,<br><em>in boxes.</em>", s="How many warehouses, shipments and late nights?",
                   f=["warehouses", "shipments", "late nights"]),
        "ar": dict(h="سنة 2026<br><em>بالكراتين.</em>", s="كم مستودع، كم شحنة، وكم ليلة سهر؟",
                   f=["مستودعات", "شحنات", "ليالي سهر"]),
    }
    for lang, t in T.items():
        fl = "".join(f"<div><i></i>{x}</div>" for x in t["f"])
        body = f"""<img class="bg" src="/assets/post-images/final/SE-02.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 460}px">{t['s']}</p>
<div class="fill">{fl}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-082", lang)
        write("IDEA-082_2026-in-boxes", nm, page(lang, f"{nm} · 2026 in boxes", body, css))


# ---------------------------------------------------------------- IDEA-012 · every route in one view (dark, BG-58)
def idea_012():
    css = CARD_CSS + """
.shade-t{height:520px;background:linear-gradient(180deg,rgba(8,20,36,.85),rgba(8,20,36,.4) 60%,rgba(8,20,36,0))}
svg.rt{position:absolute;left:0;top:0;width:1080px;height:1350px}
.tag{position:absolute;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:12px 22px;
  font-size:25px;font-weight:600;white-space:nowrap;box-shadow:0 12px 34px rgba(0,0,0,.45)}
.tag i{width:12px;height:12px;border-radius:50%;background:var(--signal)}
.tag small{font-weight:400;color:#0B7A87;font-size:24px}
.t1{left:640px;top:760px}.t2{left:90px;top:560px}
.leg{left:64px;top:1010px;padding:22px 28px;display:flex;flex-direction:column;gap:10px;font-size:24px}
[dir=rtl] .leg{left:auto;right:64px}
.leg div{display:flex;align-items:center;gap:16px}
.leg i{width:64px;height:0;border-top:4px solid var(--signal)}
.leg i.sea{border-top-style:dashed}.leg i.air{border-top-style:dotted}
"""
    T = {
        "en": dict(h="Every route,<br><em>in one view.</em>", s="Road, sea and air: every move on one live map.",
                   t1=("Tripoli", "45m"), t2=("SHP-24021", "6 days"), leg=["Road", "Sea", "Air"]),
        "ar": dict(h="كل الطرقات،<br><em>بنظرة وحدة.</em>", s="برّ، بحر وجو: كل حركة على خريطة وحدة مباشرة.",
                   t1=("طرابلس", "45 دقيقة"), t2=(L("SHP-24021"), "6 أيام"), leg=["برّ", "بحر", "جو"]),
    }
    svg = """<svg class="rt" viewBox="0 0 1080 1350">
<path d="M-10 700 C 200 690, 420 640, 640 600" fill="none" stroke="#2EF2EE" stroke-width="5" stroke-dasharray="18 14" opacity=".9"/>
<path d="M-10 560 C 260 470, 520 480, 700 580" fill="none" stroke="#C9D8E4" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" opacity=".9"/>
<circle cx="640" cy="600" r="12" fill="#2EF2EE"/><circle cx="640" cy="600" r="28" fill="#2EF2EE" opacity=".25"/>
</svg>"""
    for lang, t in T.items():
        leg = "".join(f'<div><i class="{c}"></i>{x}</div>' for c, x in zip(("", "sea", "air"), t["leg"]))
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
{svg}
<h1 class="h1" style="font-size:84px;line-height:1.04">{t['h']}</h1>
<p class="sub" style="top:{370 if lang == 'en' else 410}px">{t['s']}</p>
<div class="tag t1"><i></i>{t['t1'][0]}<small>{t['t1'][1]}</small></div>
<div class="tag t2"><i></i>{t['t2'][0]}<small>{t['t2'][1]}</small></div>
<div class="wc leg">{leg}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-012", lang)
        write("IDEA-012_every-route-one-view", nm, page(lang, f"{nm} · every route", body, css))


# ---------------------------------------------------------------- IDEA-070 · from notebook to map (dark, OB-05)
def idea_070():
    css = """
.shade-t{height:520px}
.h1{top:190px;font-size:96px;line-height:1.02}
[dir=rtl] .h1{font-size:76px;line-height:1.3}
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.95),rgba(8,20,36,.75) 60%,rgba(8,20,36,0))}
.live{position:absolute;left:640px;top:760px;display:inline-flex;align-items:center;gap:12px;background:rgba(14,36,64,.85);
  border:2px solid var(--glow);color:#fff;border-radius:999px;padding:14px 26px;font-size:28px;font-weight:600;
  box-shadow:0 0 30px rgba(46,242,238,.4)}
.live i{width:14px;height:14px;border-radius:50%;background:var(--glow);box-shadow:0 0 12px var(--glow)}
"""
    T = {
        "en": dict(h="From notebook<br><em>to map.</em>", s="Same stock. Finally visible.", c="3 warehouses · live"),
        "ar": dict(h="من الدفتر<br><em>للخريطة.</em>", s="نفس المخزون. وأخيراً بيبيّن.", c="3 مستودعات · مباشر"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/OB-05.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 410}px">{t['s']}</p>
<div class="live"><i></i>{t['c']}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-070", lang)
        write("IDEA-070_notebook-to-map", nm, page(lang, f"{nm} · notebook to map", body, css))


if __name__ == "__main__":
    idea_019()
    idea_083()
    idea_068()
    idea_082()
    idea_012()
    idea_070()
    print("ok")
