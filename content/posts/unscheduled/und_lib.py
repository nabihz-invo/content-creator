"""Shared helpers for the undated IDEA posts (posts/unscheduled/build_idea_und_*.py).

Cards (white, on dark or light slides), a dark carousel builder and the light carousel from build_idea_dec_a.
Every builder writes into posts/unscheduled/<ID>_<slug>/source/.

Careful: studio/post/templates/post.css already styles .chat, .u, .r, .chip, .scr, .panel, .bar for the phone chat and
frames. Never reuse those class names for other elements (they break layouts silently).
"""
import sys
from pathlib import Path

if Path(sys.argv[0]).name.startswith("build_idea_und_") and "--force" not in sys.argv:
    sys.exit("Stop: the posts these scripts build have been fixed by hand after the owner's reviews (since 2026-11-11), "
             "and running a builder overwrites those fixes. Edit the post's source/ pages instead, "
             "or pass --force to rebuild on purpose.")

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE.parent / "2026-12"))
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402,F401
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402,F401
import build_idea_dec_a as da  # noqa: E402

da.MONTH = HERE
write = da.write
ROWS_CSS, BG57 = da.ROWS_CSS, da.BG57
BG56 = '<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">'
SEARCH = '<svg viewBox="0 0 24 24" style="width:30px;height:30px;stroke:var(--deep);fill:none;stroke-width:2.5;flex:none"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>'

# extra card pieces, valid on dark and light slides
EXTRA_CSS = """
.pc{left:64px;right:64px;top:560px;padding:32px 38px;border-radius:30px}
.pc b.t{font-size:40px}
.pc .t2{font-size:30px;color:var(--deep);margin-top:6px}
.pc.mapc{padding:14px}.pc.mapc img{display:block;width:100%;border-radius:18px}
.bu{margin-inline-start:auto;width:fit-content;max-width:760px;background:#2F86B8;color:#fff;font-size:29px;padding:16px 24px;border-radius:24px 24px 8px 24px}
[dir=rtl] .bu{border-radius:24px 24px 24px 8px}
.ok2{margin-top:14px;font-size:27px;color:#0B7A87;font-weight:600}
.sf{display:flex;align-items:center;gap:14px;border:2px solid #E1EAF0;border-radius:999px;padding:14px 22px;font-size:30px}
.codes{display:flex;flex-wrap:wrap;gap:12px;direction:ltr}
.codes span{background:#EEF4F7;border-radius:999px;padding:14px 26px;font-size:30px;font-weight:600}
[dir=rtl] .codes{justify-content:flex-end}
.legs{display:flex;gap:6px;margin-top:18px}
.legs div{height:14px;border-radius:7px;background:var(--signal)}.legs div.c{background:#C9D8E4}.legs div.t{background:var(--abyss)}
.ll{display:flex;justify-content:space-between;margin-top:10px;font-size:22px;color:var(--deep)}
.pill.mis{background:#FFF1D6;color:#8A5A00}
.tg2{display:flex;align-items:center;justify-content:space-around;direction:ltr;font-size:40px;font-weight:600}
.tg2 .sw{display:flex;gap:8px;background:var(--abyss);border-radius:999px;padding:8px}
.tg2 .sw i{font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:24px;color:#fff}
.tg2 .sw i.on{background:var(--glow);color:var(--abyss)}
"""

DARK_CAR_CSS = CARD_CSS + ROWS_CSS + EXTRA_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.h1{top:212px;font-size:60px;line-height:1.14}
[dir=rtl] .h1{top:206px;font-size:54px}
.cover .h1{top:190px;font-size:84px;line-height:1.04}
[dir=rtl] .cover .h1{font-size:74px;line-height:1.3}
.cover .sub{top:400px;font-size:34px}
[dir=rtl] .cover .sub{top:440px}
.cover .shade-t{height:640px}
"""


def T_(lang, en, ar):
    return en if lang == "en" else ar


# ---------------------------------------------------------------- cards
def card(inner, top_=560, cls=""):
    return f'<div class="wc pc {cls}" style="top:{top_}px">{inner}</div>'


def mapcard(top_=560, img="map-crop.jpg"):
    return f'<div class="wc pc mapc" style="top:{top_}px"><img src="/assets/screens/live-map/{img}" alt=""></div>'


def chatcard(u, r, top_=560):
    return card(f'<div class="bu">{u}</div><div class="ok2">{r}</div>', top_)


def rowscard(rows, lab="", top_=560):
    """rows: (bold, middle, end, end_class)"""
    rr = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="{c}">{d}</span></div>' for a, b, d, c in rows)
    return card((f'<div class="lab">{lab}</div>' if lab else "") + f'<div class="rws">{rr}</div>', top_)


def searchcard(q, rows, top_=560):
    rr = "".join(f'<div class="rw2"><span class="sp">{a}</span>{p}<b class="num">{n}</b></div>' for a, n, p in rows)
    return card(f'<div class="sf">{SEARCH}{q}</div><div class="rws" style="margin-top:8px">{rr}</div>', top_)


def codescard(codes, top_=560):
    return card('<div class="codes">' + "".join(f"<span>{c}</span>" for c in codes) + "</div>", top_)


def alertscard(lang, rows, top_=560):
    """rows: (kind 'low'|'mis', text)"""
    lab = {"low": T_(lang, "Low stock", "نقص"), "mis": T_(lang, "Mismatch", "فرق")}
    rr = "".join(f'<div class="rw2"><span class="pill {k}">{lab[k]}</span><span class="sp">{x}</span></div>' for k, x in rows)
    return card(f'<div class="rws">{rr}</div>', top_)


def legcard(title, dur, legs, labels, top_=560):
    lg = "".join(f'<div class="{c}" style="flex:{w}"></div>' for w, c in legs)
    ll = "".join(f"<span>{x}</span>" for x in labels)
    return card(f'<div style="display:flex;justify-content:space-between;align-items:baseline"><b class="t">{title}</b><span class="okc" style="font-size:26px;font-weight:700">{dur}</span></div>'
                f'<div class="legs">{lg}</div><div class="ll">{ll}</div>', top_)


def togglecard(lang, top_=560):
    return card(f'<div class="tg2"><span>Warehouse</span><span class="sw"><i class="{"on" if lang == "en" else ""}">EN</i><i class="{"on" if lang == "ar" else ""}">ع</i></span>'
                f'<span style="font-family:\'Noto Kufi Arabic\'">المستودع</span></div>', top_)


# ---------------------------------------------------------------- carousels
def dark_car(pid, folder, lang, cover_img, cover, slides, title, kick=None, slide_bg=BG56):
    """slides: list of (headline_html, card_html); kick: format string with {n} (1-based) or None."""
    h, s = cover
    sl = [("cover", f"""<img class="bg" src="/assets/post-images/final/{cover_img}" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
    for i, sd in enumerate(slides):
        h, c = sd[0], sd[1]
        kt = sd[2] if len(sd) > 2 else (kick.format(n=i + 1) if kick else "")
        k = f'<div class="kick">{kt}</div>' if kt else ""
        sl.append(("", f"""{slide_bg}
{k}
<h1 class="h1">{h}</h1>
{c}"""))
    n = len(sl)
    for i, (cls, art) in enumerate(sl):
        body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
        nm = name(pid, lang, i + 1)
        html = page(lang, f"{nm} · {title}", body, DARK_CAR_CSS)
        if cls:
            html = html.replace('<div class="post dark">', '<div class="post dark cover">')
        write(folder, nm, html)


def light_car(pid, folder, lang, cover_img, cover_top, cover, slides, title, kick=None):
    h, s = cover
    sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/{cover_img}" alt="" style="width:952px;left:0;top:{cover_top}px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
    for i, sd in enumerate(slides):
        h, c = sd[0], sd[1]
        kt = sd[2] if len(sd) > 2 else (kick.format(n=i + 1) if kick else "")
        k = f'<div class="kick">{kt}</div>' if kt else ""
        sl.append(("", f"""{BG57}<style>{EXTRA_CSS}</style>
{k}
<h1 class="h1">{h}</h1>
{c}"""))
    da.carousel(pid, folder, lang, sl, title)


# ---------------------------------------------------------------- single dark/light static on a photo
STATIC_CSS = CARD_CSS + ROWS_CSS + EXTRA_CSS + """
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.94),rgba(8,20,36,.62) 60%,rgba(8,20,36,0))}
.chipx{position:absolute;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:14px 24px;
  font-size:27px;font-weight:600;white-space:nowrap;box-shadow:0 0 0 3px rgba(46,242,238,.6),0 14px 40px rgba(0,0,0,.45)}
.chipx i{width:12px;height:12px;border-radius:50%;background:var(--signal);flex:none}
.chipd{position:absolute;display:inline-flex;align-items:center;gap:12px;background:rgba(14,36,64,.85);border:1px solid rgba(201,216,228,.4);
  color:#fff;border-radius:999px;padding:12px 22px;font-size:26px;font-weight:600;white-space:nowrap;backdrop-filter:blur(6px)}
.chipd i{width:10px;height:10px;border-radius:50%;background:var(--glow)}
"""


def dark_static(pid, folder, lang, img, h, s, extra="", css="", sub_top=None, h_size=None, title=""):
    st = sub_top or (356 if lang == "en" else 392)
    hs = f' style="font-size:{h_size}px"' if h_size else ""
    body = f"""<img class="bg" src="{img}" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1"{hs}>{h}</h1>
<p class="sub" style="top:{st}px">{s}</p>
{extra}
{top(lang)}
{FOOT[lang]}"""
    nm = name(pid, lang)
    write(folder, nm, page(lang, f"{nm} · {title}", body, STATIC_CSS + css))
