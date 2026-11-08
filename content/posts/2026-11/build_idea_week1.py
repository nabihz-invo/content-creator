"""Builds the source HTML for the content-bank posts of 9–14 Nov 2026 (IDEA-002, IDEA-025, IDEA-001), EN + AR.

    python -I -X utf8 posts/2026-11/build_idea_week1.py          (from content/)
    then: node studio/post/render.mjs <post>/source/*.html --out <post>/preview

Copy comes from assets/IMG/Stacko_Content_Bank_New_Images.xlsx (Ideas sheet); images from the visual library.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MONTH = ROOT / "posts" / "2026-11"

FOOT = {
    "en": '<div class="foot"><div class="by">A product by <b><span>AI</span>PHIN</b></div><div>www.stacko-lb.com</div></div>',
    "ar": '<div class="foot"><div class="by">منتج من <b><span>AI</span>PHIN</b></div><div dir="ltr">www.stacko-lb.com</div></div>',
}


def top(lang, light=False):
    mark = "mark-light" if light else "mark-dark"
    word = '<div class="aword">ستاك<i>و</i></div>' if lang == "ar" else '<div class="word">stack<i>o</i></div>'
    return f'<div class="top"><div class="lockup"><img src="/assets/brand/logo/{mark}.svg" alt="">{word}</div></div>'


def bar(lang, n, i):
    dots = "".join(f'<i class="on"></i>' if k == i else "<i></i>" for k in range(n))
    swipe = "<div><b>اسحب</b> ←</div>" if lang == "ar" else "<div><b>Swipe</b> →</div>"
    return f'<div class="bar"><div class="dots">{dots}</div>{swipe}</div>'


def page(lang, title, body, css="", theme="dark", size=(1080, 1350)):
    w, h = size
    d = ' dir="rtl"' if lang == "ar" else ""
    return f"""<!doctype html><html lang="{lang}"{d}><head><meta charset="utf-8"><title>{title}</title>
<link rel="stylesheet" href="/assets/brand/brand.css">
<link rel="stylesheet" href="/studio/post/templates/post.css">
<style>
html,body{{width:{w}px;height:{h}px}} .post{{width:{w}px;height:{h}px}}
[dir=rtl] .h1,[dir=rtl] .sub{{left:auto;right:64px;text-align:right}}
.num{{font-variant-numeric:tabular-nums}}
{css}
</style></head><body>
<div class="post {theme}">
{body}
</div></body></html>
"""


def write(folder, name, html):
    p = MONTH / folder / "source" / f"{name}.html"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding="utf-8")


# ---------------------------------------------------------------- IDEA-002 · list vs map (static, BG-58)
def idea_002():
    css = """
.shade-t{height:620px}
.lab{font-size:20px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
[dir=rtl] .lab{letter-spacing:0;text-transform:none;font-size:22px}
.list{position:absolute;left:64px;top:770px;width:350px}
.list .lab{color:var(--visor);margin-bottom:12px}
.row{display:flex;justify-content:space-between;align-items:center;background:rgba(14,36,64,.72);border:1px solid rgba(201,216,228,.22);
  color:rgba(238,246,249,.85);font-size:26px;padding:18px 22px;border-radius:14px}
.row+.row{margin-top:10px;opacity:.5}
.pin{position:absolute;left:560px;top:640px;width:456px;background:#fff;color:var(--abyss);border-radius:20px;padding:18px 24px 20px;
  box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 2px rgba(46,242,238,.7)}
.pin .lab{color:var(--signal);margin-bottom:6px}
.pin b{display:block;font-size:30px;letter-spacing:-.02em}
.pin .meta{display:flex;gap:14px;margin-top:6px;font-size:22px;color:var(--deep)}
.pin .low{color:#0B7A87;font-weight:600}
.stem{position:absolute;left:202px;top:100%;width:2px;height:80px;background:linear-gradient(var(--glow),rgba(46,242,238,.3))}
[dir=rtl] .stem{left:auto;right:252px}
.dotp{position:absolute;left:762px;top:862px;width:26px;height:26px;margin:-13px;border-radius:50%;background:var(--glow);
  box-shadow:0 0 0 10px rgba(46,242,238,.22),0 0 40px 10px rgba(46,242,238,.55)}
"""
    T = {
        "en": dict(h='A list tells you what.<br><em>A map tells you where.</em>',
                   s="Stacko shows every warehouse, item and shipment<br>on one live map.",
                   ll="In a list", ml="On the map", item="LED Strip 5m", item2="Desk Lamp", place="WH-02 · Sidon",
                   low="3 low"),
        "ar": dict(h='القائمة بتقلّك شو.<br><em>الخريطة بتقلّك وين.</em>',
                   s="ستاكو بيفرجيك كل مستودع وكل صنف وكل شحنة<br>على خريطة وحدة مباشرة.",
                   ll="بالقائمة", ml="عالخريطة", item='<span class="ltr">LED Strip 5m</span>',
                   item2='<span class="ltr">Desk Lamp</span>', place='<span class="ltr">WH-02</span> · صيدا', low="3 ناقصين"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 400}px">{t['s']}</p>
<div class="list"><div class="lab">{t['ll']}</div>
  <div class="row"><span>{t['item']}</span><span class="num">1,380</span></div>
  <div class="row"><span>{t['item2']}</span><span class="num">420</span></div></div>
<div class="dotp"></div>
<div class="pin"><div class="lab">{t['ml']}</div><b>{t['item']}</b>
  <div class="meta"><span>{t['place']}</span><span class="num">1,380</span><span class="low">{t['low']}</span></div>
  <div class="stem"></div></div>
{top(lang)}
{FOOT[lang]}"""
        name = "IDEA-002" if lang == "en" else "IDEA-002-AR"
        write("IDEA-002_list-vs-map", name, page(lang, f"{name} · list vs map", body, css))


# ---------------------------------------------------------------- IDEA-025 · story poll (9:16, BG-61)
def idea_025():
    css = """
html,body{height:1920px} .post{height:1920px}
.bg{height:1920px}
.top{top:120px}
.h1{top:300px;font-size:92px;line-height:1.02}
[dir=rtl] .h1{font-size:80px;line-height:1.3}
.sub{top:560px;font-size:34px}
[dir=rtl] .sub{top:600px}
.zone{position:absolute;left:150px;right:150px;top:820px;height:330px;border:2px dashed rgba(201,216,228,.0)}
.shade-b{height:420px}
.hint{position:absolute;left:0;right:0;top:1180px;text-align:center;font-size:30px;color:var(--visor)}
.hint b{color:var(--glow);font-weight:600}
.foot{bottom:120px}
"""
    T = {
        "en": dict(h='How do you <em>track stock</em> today?', s="Vote below. We read every answer.",
                   hint="Tell us in a reply: <b>what's the hardest part?</b>"),
        "ar": dict(h='كيف عم <em>تتابع مخزونك</em> اليوم؟', s="صوّت تحت. منقرا كل الأجوبة.",
                   hint="خبّرنا بالرد: <b>شو أصعب شي؟</b>"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
<div class="zone"></div><div class="shade-b"></div>
<p class="hint">{t['hint']}</p>
{top(lang)}
{FOOT[lang]}"""
        name = "IDEA-025" if lang == "en" else "IDEA-025-AR"
        write("IDEA-025_story-poll-track-stock", name, page(lang, f"{name} · story poll", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-001 · Life of a Box (7-slide carousel)
CAROUSEL_CSS = """
.kick{top:166px}
[dir=rtl] .kick{top:162px}
.h1{top:212px}
.sub{top:396px}
[dir=rtl] .h1{top:206px}
[dir=rtl] .sub{top:420px}
.cover .h1{top:190px;font-size:112px;line-height:1}
[dir=rtl] .cover .h1{font-size:96px;line-height:1.3}
.cover .sub{top:430px;font-size:36px}
[dir=rtl] .cover .sub{top:470px}
.box{position:absolute;border:3px solid var(--glow);border-radius:8px;box-shadow:0 0 0 6px rgba(46,242,238,.18),0 0 34px rgba(46,242,238,.55)}
.tag{position:absolute;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;
  padding:12px 22px;font-size:24px;font-weight:600;white-space:nowrap;box-shadow:0 12px 34px rgba(0,0,0,.35)}
.tag i{width:12px;height:12px;border-radius:50%;background:var(--signal);flex:none}
.tag small{font-weight:400;color:var(--deep);font-size:22px}
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;max-width:none}
.inv{position:absolute;left:150px;top:560px;width:780px;background:#fff;color:var(--abyss);border-radius:26px;padding:34px 38px;
  box-shadow:0 30px 80px rgba(0,0,0,.45)}
.inv .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--visor);padding-bottom:18px}
.inv .hd b{font-size:30px;letter-spacing:-.02em;display:block}.inv .hd small{font-size:20px;color:var(--deep)}
.inv .pdf{font-size:18px;font-weight:700;color:#fff;background:var(--deep);border-radius:8px;padding:6px 10px;direction:ltr}
.inv .ln{display:flex;justify-content:space-between;font-size:24px;padding:14px 0;border-bottom:1px dashed var(--visor)}
.inv .ln span:last-child{color:var(--deep)}
.inv .ok{margin-top:22px;display:flex;align-items:center;gap:12px;font-size:24px;font-weight:600;color:#0B7A87}
.inv .ok i{width:30px;height:30px;border-radius:50%;background:#BCE5E0;display:grid;place-items:center;font-style:normal;font-size:18px}
.opts{position:absolute;left:64px;right:64px;top:540px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
.q{position:absolute;left:64px;right:64px;top:466px;font-size:32px;font-weight:600;color:var(--visor)}
.o{display:flex;align-items:center;gap:18px;background:rgba(14,36,64,.72);border:1px solid rgba(201,216,228,.28);border-radius:20px;
  padding:20px 22px;font-size:28px;backdrop-filter:blur(8px)}
.o b{width:52px;height:52px;border-radius:14px;background:#fff;color:var(--abyss);display:grid;place-items:center;font-size:26px;flex:none}
"""

CAROUSEL = {
    "en": [
        dict(h="Follow <em>one box.</em>", s="From a factory in Shenzhen to your customer's hands."),
        dict(k="Day 0 · Shenzhen", h="The supplier's <em>invoice arrives.</em>", s="Stacko reads it and creates the items."),
        dict(k="Day 30 · Port of Beirut", h="The doors <em>open.</em>", s="The box is already in the system."),
        dict(k="Day 32 · On the road", h="A transfer <em>to Zahle.</em>", s="Everyone sees when it arrives."),
        dict(k="Day 32 · On the shelf", h="Stock lands <em>on arrival.</em>", s="Nobody types it twice."),
        dict(k="Day 33 · Sold", h="The right item, in the right branch, <em>at the right time.</em>", s=""),
        dict(h="Every box has a story. <em>Stacko writes it down.</em>", s=""),
    ],
    "ar": [
        dict(h="تابع <em>كرتونة وحدة.</em>", s="من معمل بشنتشن لإيدين زبونك."),
        dict(k="اليوم 0 · شنتشن", h="بتوصل <em>فاتورة المورّد.</em>", s="ستاكو بيقراها وبيعمل الأصناف لحالو."),
        dict(k="اليوم 30 · مرفأ بيروت", h="بتنفتح <em>البواب.</em>", s="والكرتونة مسجّلة من قبل."),
        dict(k="اليوم 32 · عالطريق", h="تحويل مخزني <em>لزحلة.</em>", s="والكل شايف إيمتى بتوصل."),
        dict(k="اليوم 32 · عالرف", h="المخزون بينزل <em>أول ما يوصل.</em>", s="وما حدا بيكتبه مرتين."),
        dict(k="اليوم 33 · انباعت", h="الصنف الصح، بالفرع الصح، <em>بالوقت الصح.</em>", s=""),
        dict(h="كل كرتونة إلها قصة. <em>ستاكو بيكتبها.</em>", s=""),
    ],
}
EXTRA = {
    "en": dict(inv="Supplier invoice", invs="Shenzhen · 3 lines", l1=("LED Strip 5m", "× 1,200"), l2=("Desk Lamp", "× 300"),
               l3=("USB-C Cable 1m", "× 2,000"), ok="3 items created · incoming shipment added",
               eta="Beirut → Zahle", etas="arrives in 1h 40m", rs="Restocked ✓", rss="+24 · Zahle",
               q="Which step costs you the most time?", o=["Paperwork", "At the port", "On the road", "On the shelf"],
               L="ABCD", sold="Sold ✓", solds="Zahle branch"),
    "ar": dict(inv="فاتورة المورّد", invs="شنتشن · 3 أسطر", l1=('<span class="ltr">LED Strip 5m</span>', '<span class="ltr">× 1,200</span>'),
               l2=('<span class="ltr">Desk Lamp</span>', '<span class="ltr">× 300</span>'),
               l3=('<span class="ltr">USB-C Cable 1m</span>', '<span class="ltr">× 2,000</span>'),
               ok="انعملوا 3 أصناف وانضافت الشحنة الواردة",
               eta="بيروت ← زحلة", etas="بتوصل خلال ساعة وأربعين دقيقة", rs="انعبّى الرف ✓", rss='<span class="ltr">+24</span> · زحلة',
               q="أيّا مرحلة بتاخدلك أكتر وقت؟", o=["الأوراق", "بالمرفأ", "عالطريق", "عالرف"], L="أبجد",
               sold="انباعت ✓", solds="فرع زحلة"),
}


def idea_001():
    n = 7
    for lang in ("en", "ar"):
        S, X = CAROUSEL[lang], EXTRA[lang]
        rtl = lang == "ar"
        for i, s in enumerate(S):
            kick = f'<div class="kick">{s["k"]}</div>' if s.get("k") else ""
            sub = f'<p class="sub">{s["s"]}</p>' if s.get("s") else ""
            last = i == n - 1
            theme = "dark"
            cls = " cover" if i == 0 else ""
            if i == 0:
                art = """<img class="bg" src="/assets/post-images/final/SC-08.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="box" style="left:498px;top:748px;width:86px;height:84px"></div>"""
            elif i == 1:
                art = f"""<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="" style="filter:brightness(.55) saturate(.9)">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="inv"><div class="hd"><div><b>{X['inv']}</b><small>{X['invs']}</small></div><span class="pdf">PDF</span></div>
<div class="ln"><span>{X['l1'][0]}</span><span>{X['l1'][1]}</span></div>
<div class="ln"><span>{X['l2'][0]}</span><span>{X['l2'][1]}</span></div>
<div class="ln"><span>{X['l3'][0]}</span><span>{X['l3'][1]}</span></div>
<div class="ok"><i>✓</i>{X['ok']}</div></div>"""
            elif i == 2:
                # same container, closer: scale 1.6 around the glowing box
                art = """<div class="zoom"><img src="/assets/post-images/final/SC-08.jpg" alt="" style="width:1740px;left:-420px;top:-560px"></div>
<div class="shade-t"></div><div class="shade-b"></div>
<div class="box" style="left:381px;top:647px;width:140px;height:136px"></div>"""
            elif i == 3:
                side = "left:330px"
                art = f"""<img class="bg" src="/assets/post-images/final/SC-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="box" style="left:486px;top:918px;width:136px;height:132px;border-radius:14px"></div>
<div class="tag" style="{side};top:830px"><i></i>{X['eta']} <small>{X['etas']}</small></div>"""
            elif i == 4:
                art = f"""<img class="bg" src="/assets/post-images/final/SC-05.jpg" alt="">
<div class="shade-t" style="height:600px"></div><div class="shade-b"></div>
<div class="box" style="left:560px;top:612px;width:258px;height:178px;border-style:dashed;background:rgba(46,242,238,.10)"></div>
<div class="tag" style="left:{580 if not rtl else 548}px;top:806px"><i></i>{X['rs']} <small>{X['rss']}</small></div>"""
            elif i == 5:
                art = f"""<img class="bg" src="/assets/post-images/final/LCH-09.jpg" alt="">
<div class="shade-t" style="height:640px;background:linear-gradient(180deg,rgba(14,36,64,.95),rgba(14,36,64,.75) 60%,rgba(14,36,64,0))"></div>
<div class="shade-b"></div>
<div class="box" style="left:420px;top:962px;width:276px;height:170px"></div>
<div class="tag" style="left:{430 if not rtl else 420}px;top:880px"><i></i>{X['sold']} <small>{X['solds']}</small></div>"""
            else:
                opts = "".join(f'<div class="o"><b>{X["L"][k]}</b>{X["o"][k]}</div>' for k in range(4))
                art = f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<p class="q">{X['q']}</p><div class="opts">{opts}</div>"""
            h_style = ' style="font-size:66px"' if i == 5 else ""
            body = f"""{art}
{kick}
<h1 class="h1"{h_style}>{s['h']}</h1>
{sub}
{top(lang)}
{FOOT[lang] if last else bar(lang, n, i)}"""
            name = f"IDEA-001-{'AR-' if rtl else ''}{i + 1:02d}"
            html = page(lang, f"{name} · Life of a Box", body, CAROUSEL_CSS, theme)
            html = html.replace(f'<div class="post {theme}">', f'<div class="post {theme}{cls}">')
            write("IDEA-001_follow-one-box", name, html)


if __name__ == "__main__":
    idea_002()
    idea_025()
    idea_001()
    print("ok")
