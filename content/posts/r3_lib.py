"""Shared pieces for the round-3 builder (posts/build_idea_round3.py): layouts, cards and drawn illustrations.

Every post lands in posts/<YYYY-MM>/<ID>_<slug>/source/ by its suggested date.
Standing rules are in plans/Stacko design rules review comments and lessons.md.
"""
import json
import math
import re
import sys
from pathlib import Path

POSTS = Path(__file__).resolve().parent
sys.path.insert(0, str(POSTS / "unscheduled"))
import und_lib as U  # noqa: E402
from und_lib import FOOT, L, STATIC_CSS, card, name, page, top, bar  # noqa: E402
import build_idea_dec_a as da  # noqa: E402

PI = "/assets/post-images/final/{}.jpg".format
BG = "/assets/backgrounds/final/{}.jpg".format
CAP = "/assets/screens/app-captures/{}.png".format
MAP = "/assets/screens/live-map/{}.jpg".format
REG = {}

CSS = STATIC_CSS + """
.h1{line-height:1.1}
.tg{position:absolute;transform:translate(-50%,-50%);background:rgba(14,36,64,.88);color:#fff;border:1px solid rgba(201,216,228,.5);border-radius:999px;padding:10px 22px;font-size:26px;font-weight:600;white-space:nowrap;z-index:2;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.light .tg{background:#fff;color:var(--abyss);border:0;box-shadow:0 12px 32px rgba(14,36,64,.22)}
.strip{position:absolute;left:64px;right:64px;bottom:112px;display:flex;align-items:center;gap:22px;background:rgba(10,26,46,.9);border:1px solid rgba(201,216,228,.3);border-radius:24px;padding:20px 28px;z-index:3}
.light .strip{background:#fff;border:0;box-shadow:0 18px 50px rgba(14,36,64,.2)}
.strip>img{width:48px;height:48px;flex:none}
.strip .c{flex:1;min-width:0;padding-inline-start:22px;border-inline-start:1px solid rgba(201,216,228,.28)}
.strip b{display:block;font-size:31px;font-weight:600;color:#fff;line-height:1.15;white-space:nowrap}
.light .strip b{color:var(--abyss)}
.strip .c>span{display:block;font-size:22px;color:var(--visor);margin-top:4px;white-space:nowrap}
.light .strip .c>span{color:var(--deep)}
.col{position:absolute;left:64px;right:64px;bottom:128px;display:flex;flex-direction:column;justify-content:center;gap:26px}
.col .wc{position:static}
.ex{font-size:33px;line-height:1.32;color:#fff;background:rgba(10,26,46,.84);border-radius:18px;padding:18px 26px}
.light .ex{color:var(--abyss);background:rgba(255,255,255,.92)}
.light .bar{color:var(--deep)} .light .bar b{color:var(--abyss)}
.light .dots i{background:rgba(44,89,116,.25)} .light .dots i.on{background:var(--abyss)}
.veil{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.86) 68%,rgba(244,248,250,0))}
.kick{top:166px}
.dark .kick{color:var(--dolphin)}
[dir=rtl] .kick{top:158px}
.crop{display:block;border-radius:16px;background-repeat:no-repeat}
.tile{display:flex;align-items:center;gap:30px}
.tile svg{width:120px;height:120px;flex:none;stroke:var(--signal);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.tile b{display:block;font-size:44px;line-height:1.15;font-weight:600}
.tile small{display:block;font-size:27px;color:var(--deep);margin-top:6px;line-height:1.3}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid2 .wc{padding:26px}
.grid2 .tile{flex-direction:column;align-items:flex-start;gap:14px}
.grid2 .tile svg{width:76px;height:76px}
.grid2 .tile b{font-size:34px}
.pn{position:absolute;left:64px;right:64px;border-radius:30px;background:rgba(10,26,46,.72);border:1px solid rgba(201,216,228,.22);overflow:hidden}
.pn svg{display:block;width:100%;height:100%}
.bub{position:absolute;left:64px;top:170px;width:820px;background:#fff;color:var(--abyss);border-radius:40px;padding:38px 46px;font-size:56px;line-height:1.16;font-weight:600;letter-spacing:-.02em;box-shadow:0 26px 70px rgba(0,0,0,.45)}
.bub em{font-style:normal;color:var(--signal)}
.bub:after{content:"";position:absolute;right:120px;bottom:-46px;border:26px solid transparent;border-top:30px solid #fff;border-right:30px solid #fff}
[dir=rtl] .bub{left:auto;right:64px;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-size:47px;line-height:1.5;font-weight:700;letter-spacing:0}
[dir=rtl] .bub:after{right:auto;left:120px;border-right:26px solid transparent;border-left:30px solid #fff}
"""

CAR = CSS + """
.h1{top:212px;font-size:62px}
[dir=rtl] .h1{top:204px;font-size:54px;line-height:1.36}
.cover .h1{top:186px;font-size:84px;line-height:1.05}
[dir=rtl] .cover .h1{font-size:70px;line-height:1.3}
.cover .kick{display:none}
"""

ST_ICON = {
    "store": '<path d="M9 21h30v21H9zM6 21l4-13h28l4 13M6 21c0 3 3 5 6 5s6-2 6-5c0 3 3 5 6 5s6-2 6-5c0 3 3 5 6 5s6-2 6-5M20 42V30h8v12"/>',
    "erp": '<rect x="9" y="6" width="30" height="36" rx="3"/><path d="M15 15h18M15 23h18M15 31h10"/>',
    "truck": '<path d="M4 13h24v22H4zM28 20h9l7 8v7H28z"/><circle cx="13" cy="37" r="4"/><circle cx="35" cy="37" r="4"/>',
    "phone": '<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M21 37h6"/>',
    "app": '<rect x="7" y="7" width="14" height="14" rx="3"/><rect x="27" y="7" width="14" height="14" rx="3"/><rect x="7" y="27" width="14" height="14" rx="3"/><rect x="27" y="27" width="14" height="14" rx="3"/>',
}
ICON = lambda k: f'<svg viewBox="0 0 48 48">{ST_ICON[k]}</svg>'
tile = lambda k, b, s="": f'<div class="tile">{ICON(k)}<div><b>{b}</b>' + (f"<small>{s}</small>" if s else "") + "</div></div>"
WX = {
    "sun": '<circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/>',
    "rain": '<path d="M14 30a8 8 0 0 1 0-16 11 11 0 0 1 21 2 7 7 0 0 1-1 14z"/><path d="M17 36l-2 6M25 36l-2 6M33 36l-2 6"/>',
    "part": '<circle cx="16" cy="15" r="6"/><path d="M16 3v3M4 15h3M7 6l2 2"/><path d="M18 38a7 7 0 0 1 0-14 10 10 0 0 1 19 2 6 6 0 0 1-1 12z"/>',
}


def reg(pid, slug, date, fmt, h, s, cap, slides=None, note=""):
    """h, s, cap are (en, ar). slides: list of (en, ar). Writes the caption files and notes; records the copy for the CRM."""
    month = date[:7]
    folder = f"{pid}_{slug}"
    REG[pid] = dict(slug=slug, date=date, month=month, fmt=fmt, h=h, s=s, cap=cap, slides=slides, note=note, folder=folder)
    d = POSTS / month / folder
    d.mkdir(parents=True, exist_ok=True)
    (d / "caption_en.txt").write_text(cap[0] + "\n", encoding="utf8")
    (d / "caption_ar.txt").write_text(cap[1] + "\n", encoding="utf8")
    (d / "notes.md").write_text(f"# {pid} · round 3\n\nBuilt by posts/build_idea_round3.py from plans/Stacko_New_Ideas_Round3.xlsx (HTML only for now).\n\n{note}\n", encoding="utf8")
    return folder


def write(pid, nm, html):
    r = REG[pid]
    da.MONTH = POSTS / r["month"]
    da.write(r["folder"], nm, html)


def clean(x):
    return x.replace("<br>", " ").replace("<em>", "").replace("</em>", "")


def tag(x, y, txt):
    return f'<div class="tg" style="left:{x}px;top:{y}px">{txt}</div>'


def strip(l, cells, light=False):
    m = "mark-light" if light else "mark-dark"
    cs = "".join(f'<div class="c"><b>{a}</b><span>{b}</span></div>' for a, b in cells)
    return f'<div class="strip"><img src="/assets/brand/logo/{m}.svg" alt="">{cs}</div>'


def fit(h, base, l):
    """Largest size up to base that keeps each headline line on one line."""
    n = max(len(re.sub(r"<[^>]+>", "", x)) for x in h.split("<br>"))
    return min(base, int(940 / (n * (0.53 if l == "en" else 0.6))))


def sub_top(l, h, hs):
    n = h.count("<br>") + 1
    return int(170 + n * hs * (1.1 if l == "en" else 1.38) + (22 if l == "en" else 12))


def static(pid, l, img, h, s, extra="", css="", hs=None, theme="dark", shade=None):
    """One post on a full image: logo, headline, a "With Stacko" line, the proof, footer."""
    hs = fit(h, hs or (66 if l == "en" else 54), l)
    st = sub_top(l, h, hs)
    light = theme == "light"
    layer = '<div class="veil"></div>' if light else '<div class="shade-t"></div><div class="shade-b"></div>'
    body = f"""<img class="bg" src="{img}" alt="">
{layer}
<h1 class="h1" style="font-size:{hs}px">{h}</h1>
<p class="sub" style="top:{st}px">{s}</p>
{extra}
{top(l, light=light)}
{FOOT[l]}"""
    nm = name(pid, l)
    write(pid, nm, page(l, f"{nm} · {clean(h)}", body, CSS + css, theme=theme))


def car(pid, l, slides, title, theme="dark", css=""):
    """slides: dicts with bg, h, optional s, col (list of html), kick, extra, cover (bool), col_top."""
    n = len(slides)
    light = theme == "light"
    for i, sd in enumerate(slides):
        k = f'<div class="kick">{sd["kick"]}</div>' if sd.get("kick") else ""
        cover = sd.get("cover")
        lines = sd["h"].count("<br>") + 1
        hs = fit(sd["h"], (84 if l == "en" else 70) if cover else (62 if l == "en" else 54), l)
        sub = ""
        if sd.get("s"):
            if cover:
                t = 186 + lines * hs * (1.05 if l == "en" else 1.3) + 22
            else:
                t = (212 + lines * hs * 1.1 + 18) if l == "en" else (204 + lines * hs * 1.36 + 10)
            sub = f'<p class="sub" style="top:{int(t)}px">{sd["s"]}</p>'
        if sd.get("col"):
            ct = sd.get("col_top") or (200 + lines * (88 if cover else 72) + (66 if sd.get("s") else 0) + 40)
            col = f'<div class="col" style="top:{ct}px">' + "".join(sd["col"]) + "</div>"
        else:
            col = ""
        shade = sd.get("shade", '<div class="veil"></div>' if light else '<div class="shade-t"></div><div class="shade-b"></div>')
        body = f"""{sd['bg']}
{shade}
{k}
<h1 class="h1" style="font-size:{hs}px">{sd['h']}</h1>
{sub}
{col}
{sd.get('extra', '')}
{top(l, light=light)}
{FOOT[l] if i == n - 1 else bar(l, n, i)}"""
        nm = name(pid, l, i + 1)
        html = page(l, f"{nm} · {title}", body, CAR + css, theme=theme)
        if cover:
            html = html.replace(f'<div class="post {theme}">', f'<div class="post {theme} cover">')
        write(pid, nm, html)


def story(pid, l, img, h, s, inner, theme="dark", n=None):
    css = CSS + """.bg{height:1920px}.top{top:130px}
.h1{top:300px;font-size:92px;line-height:1.06}[dir=rtl] .h1{font-size:78px;line-height:1.32;top:290px}
.sub{top:560px;font-size:42px}.shade-t{height:900px}.shade-b{height:380px}
.veil{height:880px}
.foot{bottom:130px}
.opts{position:absolute;left:96px;right:96px;top:760px;display:flex;flex-direction:column;gap:26px}
.opt{display:flex;align-items:center;gap:30px;background:#fff;color:var(--abyss);border-radius:34px;padding:34px 44px;font-size:52px;font-weight:600;box-shadow:0 22px 60px rgba(14,36,64,.3)}
.opt span{font-size:66px;line-height:1}
.sl{position:absolute;left:96px;right:96px;top:820px;background:#fff;border-radius:40px;padding:60px 50px;box-shadow:0 22px 60px rgba(14,36,64,.3)}
.sl .tr{height:18px;border-radius:9px;background:linear-gradient(90deg,var(--signal),var(--visor));margin:44px 0 0;position:relative;direction:ltr}
.sl .kn{position:absolute;left:16%;top:-46px;font-size:96px;line-height:1}
.sl .ends{display:flex;justify-content:space-between;font-size:66px;margin-top:34px;direction:ltr}
"""
    light = theme == "light"
    layer = '<div class="veil"></div>' if light else '<div class="shade-t"></div><div class="shade-b"></div>'
    body = f"""<img class="bg" src="{img}" alt="">{layer}
<h1 class="h1">{h}</h1><p class="sub">{s}</p>{inner}{top(l, light=light)}{FOOT[l]}"""
    nm = name(pid, l)
    write(pid, nm, page(l, f"{nm} · {clean(h)}", body, css, theme=theme, size=(1080, 1920)))


def crop(src, img_w, x, y, w, h, disp=892):
    k = disp / w
    return (f'<div class="wc pc mapc"><div class="crop" style="width:{disp}px;height:{int(h * k)}px;background-image:url({src});'
            f'background-size:{int(img_w * k)}px auto;background-position:{int(-x * k)}px {int(-y * k)}px"></div></div>')


def phone_html(inner, s=0.9, left=122, top_=330):
    """UI-01 hand and phone with drawn HTML (a chat) on its real screen (source px 307.5–632 × 265–955, r 37)."""
    x, y, w, h, r = left + 307.5 * s, top_ + 265 * s, 324.5 * s, 690 * s, 37 * s
    k = w / 300
    return (f'<img src="{PI("UI-01")}" alt="" style="position:absolute;left:{left}px;top:{top_}px;width:{928 * s:.0f}px;'
            f'-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 82%,transparent),linear-gradient(180deg,transparent,#000 16%);-webkit-mask-composite:source-in">'
            f'<div style="position:absolute;left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h:.0f}px;border-radius:{r:.0f}px;overflow:hidden;background:#F4F8FA">'
            f'<div style="width:300px;height:{h / k:.0f}px;transform:scale({k:.3f});transform-origin:0 0">{inner}</div></div>')


def phone_shot(src, img_w, s=0.9, left=122, top_=330):
    x, y, w, h, r = left + 307.5 * s, top_ + 265 * s, 324.5 * s, 690 * s, 37 * s
    pct = img_w / 1075 * 100
    return (f'<img src="{PI("UI-01")}" alt="" style="position:absolute;left:{left}px;top:{top_}px;width:{928 * s:.0f}px;'
            f'-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 82%,transparent),linear-gradient(180deg,transparent,#000 16%);-webkit-mask-composite:source-in">'
            f'<div style="position:absolute;left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{h:.0f}px;border-radius:{r:.0f}px;overflow:hidden;background:#fff">'
            f'<img src="{src}" alt="" style="display:block;width:{pct:.1f}%;max-width:none"></div>')


def chat(l, u, r):
    sub = "مساعد المخازن" if l == "ar" else "Stock assistant"
    nm = "ستاكو" if l == "ar" else "Stacko"
    return (f'<div class="chat" style="height:100%"><div class="hd"><div class="av"><img src="/assets/brand/logo/mark-dark.svg" alt=""></div>'
            f'<div><b>{nm}</b><small>{sub}</small></div></div><div class="u">{u}</div><div class="r">{r}</div></div>')


# ------------------------------------------------------------------ drawn illustrations
def subway(l):
    road, sea, air = "#79C0DE", "#2F86B8", "#0895A6"
    st = [("WH-02", 90, 430, "s"), ("WH-01", 390, 300, "n"), ("WH-04", 620, 300, "n"), ("WH-03", 860, 180, "n"), ("WH-05", 130, 130, "n"), ("DXB-01", 860, 430, "s")]
    pts = {"road": "90,430 250,430 390,300 620,300 740,180 860,180", "sea": "130,130 290,130 390,230 390,300", "air": "390,300 530,430 860,430"}
    out = "".join(f'<polyline points="{p}" fill="none" stroke="{c}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>'
                  for p, c in ((pts["sea"], sea), (pts["air"], air), (pts["road"], road)))
    for code, x, y, pos in st:
        ty = y + 62 if pos == "s" else y - 40
        out += f'<circle cx="{x}" cy="{y}" r="24" fill="#0E2440" stroke="#fff" stroke-width="9"/><text x="{x}" y="{ty}" text-anchor="middle" fill="#fff" font-size="33" font-weight="600" direction="ltr">{code}</text>'
    out += '<circle cx="510" cy="300" r="20" fill="#fff"/>'
    leg = (("Road", "طريق", road), ("Sea", "بحر", sea), ("Air", "جوّ", air))
    x = 90
    for en, ar, c in leg:
        out += f'<rect x="{x}" y="534" width="58" height="12" rx="6" fill="{c}"/><text x="{x + 74}" y="550" fill="#C9D8E4" font-size="30" text-anchor="start">{ar if l == "ar" else en}</text>'
        x += 230
    return f'<svg viewBox="0 0 952 590" style="direction:ltr">{out}</svg>'


def stars(l):
    p = {"WH-01": (250, 330), "WH-02": (120, 520), "WH-03": (430, 110), "WH-04": (610, 300), "WH-05": (480, 540), "DXB-01": (830, 180)}
    links = [("WH-03", "WH-01"), ("WH-01", "WH-02"), ("WH-01", "WH-04"), ("WH-04", "WH-05"), ("WH-04", "DXB-01"), ("WH-02", "WH-05")]
    out = "".join(f'<line x1="{p[a][0]}" y1="{p[a][1]}" x2="{p[b][0]}" y2="{p[b][1]}" stroke="#79C0DE" stroke-width="3" opacity=".8"/>' for a, b in links)
    for k, (x, y) in p.items():
        out += (f'<circle cx="{x}" cy="{y}" r="32" fill="#79C0DE" opacity=".22"/><circle cx="{x}" cy="{y}" r="12" fill="#fff"/>'
                f'<text x="{x}" y="{y - 44}" text-anchor="middle" fill="#fff" font-size="31" font-weight="600">{k}</text>')
    mx, my = (250 + 610) / 2, (330 + 300) / 2
    out += f'<circle cx="{mx}" cy="{my}" r="9" fill="#fff"/><circle cx="{mx}" cy="{my}" r="22" fill="none" stroke="#fff" stroke-width="2"/>'
    return f'<svg viewBox="0 0 952 650" style="position:absolute;left:64px;top:470px;width:952px;height:650px;direction:ltr">{out}</svg>'


def routes(l, solid=0, tags=()):
    n = {"a": (170, 610), "b": (520, 510), "c": (880, 640), "d": (330, 930), "e": (770, 980)}
    order = [("a", "b"), ("b", "c"), ("a", "d"), ("d", "e")]
    names = {"a": ("Tripoli", "طرابلس"), "b": ("Jounieh", "جونية"), "c": ("Zahle", "زحلة"), "d": ("Beirut", "بيروت"), "e": ("Sidon", "صيدا")}
    out = ""
    for i, (a, b) in enumerate(order):
        x1, y1 = n[a]; x2, y2 = n[b]
        if i < solid:
            out += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'
        else:
            out += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#C9D8E4" stroke-width="7" stroke-linecap="round" stroke-dasharray="3 24" opacity=".85"/>'
    for k, (x, y) in n.items():
        out += f'<circle cx="{x}" cy="{y}" r="17" fill="#0E2440" stroke="#fff" stroke-width="6"/><text x="{x}" y="{y + 58}" text-anchor="middle" fill="#fff" font-size="31" font-weight="600">{names[k][1 if l == "ar" else 0]}</text>'
    extra = "".join(tag(x, y, t) for x, y, t in tags)
    return f'<svg viewBox="0 0 1080 1350" style="position:absolute;left:0;top:0;width:1080px;height:1350px;direction:ltr">{out}</svg>{extra}'


def invoice_to_pin(l):
    t = (lambda a, b: a if l == "en" else b)
    rows = "".join(f'<div style="display:flex;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #E1EAF0;font-size:25px"><span>{a}</span><b style="font-weight:600">{b}</b></div>'
                   for a, b in ((t("LED Strip 5m", "لمبات LED"), "400"), (t("USB-C Cable", "كابل USB-C"), "1,200"), (t("Desk Lamp", "لمبة مكتب"), "150")))
    inv = (f'<div class="wc" style="left:64px;top:600px;width:430px;transform:rotate(-2deg)"><div class="lab">{t("Supplier invoice", "فاتورة المورّد")}</div>'
           f'<b class="t" style="margin-bottom:10px">{L("INV-2291")}</b>{rows}</div>')
    line = ('<svg viewBox="0 0 1080 1350" style="position:absolute;left:0;top:0;width:1080px;height:1350px">'
            '<path d="M480 800 C 640 800, 640 660, 800 660" fill="none" stroke="#2EF2EE" stroke-width="9" stroke-linecap="round"/>'
            '<path d="M836 512c-50 0-90 40-90 90 0 66 90 150 90 150s90-84 90-150c0-50-40-90-90-90z" fill="#fff"/><circle cx="836" cy="602" r="33" fill="#0E2440"/></svg>')
    tg = tag(820, 820, f'{L("SHP-24021")}') + tag(820, 886, t(f'{L("Shenzhen → Beirut")}', "شنزن ← بيروت"))
    return inv + line + tg


def lebanon(l):
    def P(lon, lat, x0, y0, k, lat0):
        return x0 + (lon - lat0[0]) * k * math.cos(math.radians(33.8)), y0 + (lat0[1] - lat) * k
    leb = [(35.10, 33.09), (35.19, 33.27), (35.37, 33.56), (35.47, 33.90), (35.62, 33.98), (35.65, 34.12), (35.64, 34.27), (35.82, 34.44), (35.97, 34.64), (36.29, 34.63), (36.45, 34.60), (36.38, 34.50), (36.62, 34.20), (36.35, 33.83), (36.07, 33.59), (35.82, 33.40), (35.62, 33.25), (35.50, 33.09)]
    O = (35.0, 34.75)
    pts = " ".join(f"{P(a, b, 30, 40, 370, O)[0]:.0f},{P(a, b, 30, 40, 370, O)[1]:.0f}" for a, b in leb)
    uae = [(51.6, 24.1), (52.6, 24.2), (53.6, 24.05), (54.4, 24.3), (55.0, 25.0), (55.3, 25.3), (56.0, 25.9), (56.4, 26.35), (56.25, 25.6), (56.35, 24.9), (56.0, 24.8), (55.8, 24.2), (55.5, 23.9), (55.2, 22.7), (52.6, 22.95)]
    O2 = (51.3, 26.6)
    upts = " ".join(f"{P(a, b, 590, 150, 60, O2)[0]:.0f},{P(a, b, 590, 150, 60, O2)[1]:.0f}" for a, b in uae)
    pin = lambda x, y: f'<path transform="translate({x - 18:.0f},{y - 46:.0f})" d="M18 0C8 0 0 8 0 18c0 13 18 28 18 28s18-15 18-28C36 8 28 0 18 0z" fill="none" stroke="#fff" stroke-width="4"/>'
    cities = [("Tripoli", "طرابلس", 35.84, 34.43), ("Beirut", "بيروت", 35.50, 33.89), ("Sidon", "صيدا", 35.38, 33.56), ("Tyre", "صور", 35.20, 33.27), ("Zahle", "زحلة", 35.90, 33.85)]
    uc = [("Abu Dhabi", "أبو ظبي", 54.37, 24.45), ("Dubai", "دبي", 55.27, 25.2)]
    uae_box = '<rect x="560" y="60" width="370" height="420" rx="22" fill="none" stroke="#79C0DE" stroke-width="2" opacity=".5"/>'
    out = uae_box + f'<polygon points="{pts}" fill="#1B416B" stroke="#79C0DE" stroke-width="3" stroke-linejoin="round"/><polygon points="{upts}" fill="#1B416B" stroke="#79C0DE" stroke-width="3" stroke-linejoin="round"/>'
    for en, ar, a, b in cities:
        x, y = P(a, b, 30, 40, 370, O)
        out += pin(x, y) + f'<text x="{x - 30 if en != "Zahle" else x + 26:.0f}" y="{y - 12:.0f}" text-anchor="{"end" if en != "Zahle" else "start"}" fill="#fff" font-size="29" font-weight="600">{ar if l == "ar" else en}</text>'
    for en, ar, a, b in uc:
        x, y = P(a, b, 590, 150, 60, O2)
        left = en == "Abu Dhabi"
        out += pin(x, y) + f'<text x="{x - 26 if left else x + 26:.0f}" y="{y - 14:.0f}" text-anchor="{"end" if left else "start"}" fill="#fff" font-size="29" font-weight="600">{ar if l == "ar" else en}</text>'
    return f'<svg viewBox="0 0 952 640" style="direction:ltr">{out}</svg>'


def dump(path):
    Path(path).write_text(json.dumps(REG, ensure_ascii=False, indent=1), encoding="utf8")
