"""January 2027, batch B (IDEA-056, IDEA-003, IDEA-073, IDEA-061, IDEA-047, IDEA-048), EN + AR.

    python3 -I -X utf8 posts/2027-01/build_idea_jan_b.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE.parent / "2026-12"))
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
import build_idea_dec_a as da  # noqa: E402

da.MONTH = HERE
write = da.write
ROWS_CSS, BG57, MAPCARD = da.ROWS_CSS, da.BG57, da.MAPCARD


# ---------------------------------------------------------------- IDEA-056 · 30 days at sea, logged in seconds (dark, SC-08)
def idea_056():
    css = CARD_CSS + """
.shade-t{height:600px}
.h1{font-size:62px}
[dir=rtl] .h1{font-size:58px}
.arr{left:290px;top:760px;width:500px;padding:26px 30px;box-shadow:0 22px 60px rgba(0,0,0,.5),0 0 0 2px rgba(46,242,238,.6)}
.arr .rw{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:27px}
.arr .rw span{color:var(--deep)}
"""
    T = {
        "en": dict(h="30 days at sea.<br><em>Logged in seconds on arrival.</em>", s="From the port to the right warehouse, without retyping.",
                   c="SHP-24021", st="Arrived ✓", r=[("Items", "12"), ("To", "WH-01 · Beirut")]),
        "ar": dict(h="30 يوم بالبحر.<br><em>بتنسجّل بثواني لمّا توصل.</em>", s="من المرفأ للمستودع الصح، بلا ما تعيد الكتابة.",
                   c=L("SHP-24021"), st="وصلت ✓", r=[("الأصناف", "12"), ("لـ", f"{L('WH-01')} · بيروت")]),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw"><span>{a}</span><b>{b}</b></div>' for a, b in t["r"])
        body = f"""<img class="bg" src="/assets/post-images/final/SC-08.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="wc arr"><div class="lab">{t['c']}</div><b class="t okc">{t['st']}</b>{rows}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-056", lang)
        write("IDEA-056_30-days-at-sea", nm, page(lang, f"{nm} · 30 days at sea", body, css))


# ---------------------------------------------------------------- IDEA-003 · Stacko by the numbers (6 slides, dark, BG-56)
def idea_003():
    css = CARD_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.cover .h1{top:190px;font-size:100px;line-height:1.02}
[dir=rtl] .cover .h1{font-size:88px;line-height:1.3}
.cover .sub{top:430px;font-size:36px}
[dir=rtl] .cover .sub{top:470px}
.big{position:absolute;left:64px;right:64px;top:210px;display:flex;align-items:baseline;gap:24px;color:var(--glow);direction:ltr}
[dir=rtl] .big{justify-content:flex-end}
.big b{font-size:240px;font-weight:600;letter-spacing:-.05em;line-height:1;text-shadow:0 0 50px rgba(46,242,238,.35)}
.big span{font-size:60px;font-weight:600;color:#fff}
[dir=rtl] .big span{font-family:'Noto Kufi Arabic',sans-serif;font-size:54px}
.lbl{position:absolute;left:64px;right:64px;top:480px;font-size:40px;line-height:1.3;color:var(--visor)}
[dir=rtl] .lbl{text-align:right;font-size:36px;line-height:1.5}
.pf{left:64px;right:64px;top:700px;padding:28px 34px}
.bu{margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:28px;padding:14px 22px;border-radius:22px 22px 6px 22px}
[dir=rtl] .bu{border-radius:22px 22px 22px 6px}
.ok2{margin-top:12px;font-size:26px;color:#0B7A87;font-weight:600}
.srch{display:flex;align-items:center;gap:14px;border:2px solid #E1EAF0;border-radius:999px;padding:14px 22px;font-size:28px}
.srch svg{width:28px;height:28px;stroke:var(--deep);fill:none;stroke-width:2.5}
.hit{display:flex;justify-content:space-between;padding:14px 6px 0;font-size:26px}
.chips2{display:flex;flex-wrap:wrap;gap:12px}
.chips2 span{background:#EEF4F7;border-radius:999px;padding:12px 22px;font-size:26px;font-weight:600}
.tg{display:flex;justify-content:center;gap:12px}
.tg span{min-width:110px;text-align:center;border-radius:999px;padding:14px 22px;font-size:30px;font-weight:700;background:#EEF4F7}
.tg span.on{background:var(--abyss);color:#fff}
.mapc{padding:14px}.mapc img{display:block;width:100%;border-radius:18px}
"""
    search = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>'
    T = {
        "en": dict(
            cover=("Stacko,<br><em>by the numbers.</em>", "Five numbers that explain what it does."),
            n=[("10", "seconds", "to log a move from your phone."), ("1", "map", "for every warehouse, branch and shipment."),
               ("10,000+", "SKUs", "searchable, low stock first."), ("4", "roles", "Owner, manager, staff, purchasing. Every move traced."),
               ("2", "languages", "Arabic and English, one tap apart.")],
            p1=("sent 40 LED strips from Beirut to Sidon", "Logged ✓ · on the map"),
            p3=("LED Strip", "LED Strip 5m · WH-01 Beirut", "1,380"),
            p4=["Owner", "Warehouse manager", "Staff", "Purchasing"]),
        "ar": dict(
            cover=("ستاكو<br><em>بالأرقام.</em>", "خمس أرقام بتشرح شو بيعمل."),
            n=[("10", "ثواني", "لتسجّل حركة من تلفونك."), ("1", "خريطة", "لكل مستودع وفرع وشحنة."),
               ("10,000+", "صنف", "بتلاقيهن بالبحث، والناقص أوّل شي."), ("4", "أدوار", "صاحب الشغل، المدير، الفريق، والمشتريات. وكل حركة إلها أثر."),
               ("2", "لغتين", "عربي وإنكليزي، بكبسة وحدة.")],
            p1=(f"بعتت 40 {L('LED Strip')} من بيروت لصيدا", "تسجّلت ✓ · عالخريطة"),
            p3=(L("LED Strip"), f"{L('LED Strip 5m')} · {L('WH-01')} بيروت", "1,380"),
            p4=["صاحب الشغل", "مدير المستودع", "الفريق", "المشتريات"]),
    }
    for lang, t in T.items():
        sl = []
        h, s = t["cover"]
        sl.append(("cover", f'<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt=""><h1 class="h1">{h}</h1><p class="sub">{s}</p>'))
        u, r = t["p1"]
        q, it, n = t["p3"]
        proofs = [f'<div class="bu">{u}</div><div class="ok2">{r}</div>',
                  None,
                  f'<div class="srch">{search}{q}</div><div class="hit"><span>{it}</span><b>{n}</b></div>',
                  '<div class="chips2">' + "".join(f"<span>{x}</span>" for x in t["p4"]) + "</div>",
                  '<div class="tg"><span class="on">EN</span><span>ع</span></div>' if lang == "en" else '<div class="tg"><span>EN</span><span class="on">ع</span></div>']
        for i, ((num, unit, lbl), pf) in enumerate(zip(t["n"], proofs)):
            card = MAPCARD.replace('class="wc pc mapc"', 'class="wc pf mapc"') if pf is None else f'<div class="wc pf">{pf}</div>'
            sl.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<div class="big"><b style="{'font-size:170px' if len(num) > 4 else ''}">{num}</b><span>{unit}</span></div>
<p class="lbl">{lbl}</p>
{card}"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-003", lang, i + 1)
            html = page(lang, f"{nm} · by the numbers", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-003_stacko-by-the-numbers", nm, html)


# ---------------------------------------------------------------- IDEA-073 · growing fast? (OB-06; dark image, so white type)
def idea_073():
    css = """
.post.dark{background:#041328}
.bg{left:-40px;top:300px;width:820px;height:1018px;object-fit:cover;
  -webkit-mask-image:linear-gradient(90deg,#000 75%,transparent),linear-gradient(180deg,transparent,#000 18%);-webkit-mask-composite:source-in;
  mask-image:linear-gradient(90deg,#000 75%,transparent),linear-gradient(180deg,transparent,#000 18%);mask-composite:intersect}
.col{position:absolute;left:560px;right:64px;top:430px}
[dir=rtl] .col{left:540px;text-align:right}
.col h1{font-size:62px;line-height:1.1;font-weight:600;letter-spacing:-.03em}
[dir=rtl] .col h1{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;letter-spacing:0;font-size:52px;line-height:1.45}
.col h1 em{font-style:normal;color:var(--glow)}
.col p{margin-top:30px;font-size:36px;line-height:1.38;color:#EEF6F9}
.col p b{font-weight:600;color:#fff}
[dir=rtl] .col p{font-size:38px;line-height:1.6}
.q{position:absolute;left:40px;top:620px;direction:ltr;display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--abyss);border-radius:999px;
  padding:10px 20px;font-size:26px;font-weight:700;box-shadow:0 12px 34px rgba(0,0,0,.45)}
.q i{width:12px;height:12px;border-radius:50%;background:#B4233C}
.q.ok{font-weight:600;box-shadow:0 10px 26px rgba(0,0,0,.4)}
.q.ok i{background:#0B7A87}
"""
    T = {
        "en": dict(h="Growing fast?<br><em>Your stock system shouldn't wobble.</em>", s="<b>Stacko</b> is the stock management system built for several warehouses."),
        "ar": dict(h="عم تكبر بسرعة؟<br><em>نظام المخزون ما لازم يهتزّ.</em>", s="<b>ستاكو</b> هو نظام إدارة المخازن المصمّم لعدّة مستودعات."),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/OB-06.jpg" alt="">
<div class="shade-b"></div>
<div class="col"><h1>{t['h']}</h1><p>{t['s']}</p></div>
<div class="q"><i></i>WH-03?</div>
<div class="q ok" style="top:880px"><i></i>WH-02</div>
<div class="q ok" style="top:1010px"><i></i>WH-01</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-073", lang)
        write("IDEA-073_growing-fast-wobble", nm, page(lang, f"{nm} · growing fast", body, css))


# ---------------------------------------------------------------- IDEA-061 · where do the hours go? (6 slides, light)
def idea_061():
    T = {
        "en": dict(
            cover=("Where do<br><em>the hours go?</em>", "The hidden time cost of running stock by hand."),
            k="Hour sink {n} of 4", w="With Stacko",
            tasks=[("Calling branches<br><em>to check stock.</em>", "Look at the map."), ("Merging<br><em>three spreadsheets.</em>", "One source."),
                   ("Typing supplier invoices<br><em>line by line.</em>", "AI reads them."), ("Asking<br><em>who moved it.</em>", "A name and a time.")],
            files=(["stock_beirut.xlsx", "stock_sidon.xlsx", "stock_tripoli.xlsx"], "One live picture"),
            inv=(["LED Strip 5m × 1,200", "Desk Lamp × 300", "USB-C Cable 1m × 2,000"], "12 items created ✓"),
            aud=("LED Strip 5m · −25", [("By", "Rami"), ("When", "Today, 4:12 PM"), ("Where", "WH-01 · Beirut")]),
            end=("Get those<br><em>hours back.</em>", "Which one takes most of your week?", ["Calls", "Merging files", "Typing invoices", "Chasing who moved it"], "ABCD")),
        "ar": dict(
            cover=("لوين بتروح<br><em>الساعات؟</em>", "كلفة الوقت المخفيّة لإدارة المخزون باليد."),
            k="مضيعة وقت {n} من 4", w="مع ستاكو",
            tasks=[("تتّصل بالفروع<br><em>لتشيّك المخزون.</em>", "اتطلّع عالخريطة."), ("تدمج<br><em>تلات جداول ببعض.</em>", "مصدر واحد."),
                   ("تكتب فواتير المورّد<br><em>سطر سطر.</em>", "الذكاء الاصطناعي بيقراها."), ("تسأل<br><em>مين حرّكها.</em>", "اسم ووقت.")],
            files=(["stock_beirut.xlsx", "stock_sidon.xlsx", "stock_tripoli.xlsx"], "صورة وحدة مباشرة"),
            inv=([L("LED Strip 5m × 1,200"), L("Desk Lamp × 300"), L("USB-C Cable 1m × 2,000")], "انعملوا 12 صنف ✓"),
            aud=(f"{L('LED Strip 5m')} · {L('−25')}", [("مين", "رامي"), ("إيمتى", "اليوم، 4:12 بعد الضهر"), ("وين", f"{L('WH-01')} · بيروت")]),
            end=("رجّع <em>هالساعات.</em>", "أيّا وحدة بتاخد أكتر وقت من جمعتك؟", ["التلفونات", "دمج الملفات", "كتابة الفواتير", "تلاحق مين حرّك"], "أبجد")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/OB-01.jpg" alt="" style="width:952px;left:0;top:-160px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        fl, one = t["files"]
        il, done = t["inv"]
        it, rows = t["aud"]
        vis = [MAPCARD.replace('style="top:600px"', ""),
               '<div class="wc pc"><div class="rws">' + "".join(f'<div class="rw2" style="direction:ltr"><span class="sp">{f}</span></div>' for f in fl)
               + f'</div><div class="t2 okc" style="font-weight:600;margin-top:10px">→ {one}</div></div>',
               '<div class="wc pc"><div class="rws">' + "".join(f'<div class="rw2"><span class="sp">{x}</span></div>' for x in il)
               + f'</div><div class="t2 okc" style="font-weight:600;margin-top:10px">{done}</div></div>',
               f'<div class="wc pc"><b class="t">{it}</b><div class="rws">' + "".join(f'<div class="rw2"><span class="sp">{a}</span><b>{b}</b></div>' for a, b in rows) + "</div></div>"]
        for i, ((h, w), card) in enumerate(zip(t["tasks"], vis)):
            card = card.replace('class="wc pc', 'style="top:640px" class="wc pc', 1)
            sl.append(("", f"""{BG57}
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
<div class="ans" style="top:450px"><small>{t['w']}</small>{w}</div>
{card}"""))
        h, s, opts, letters = t["end"]
        li = "".join(f'<div class="li"><i>{letters[i]}</i>{x}</div>' for i, x in enumerate(opts))
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 330}px">{s}</p>
<div class="list" style="top:{490 if lang == 'en' else 440}px">{li}</div>"""))
        da.carousel("IDEA-061", "IDEA-061_where-do-the-hours-go", lang, sl, "where do the hours go")


# ---------------------------------------------------------------- IDEA-047 · what's wrong with this shelf? (light, SC-05 closer)
def idea_047():
    css = """
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;width:1360px;left:-210px;top:-60px;max-width:none}
.veil{position:absolute;left:0;right:0;top:0;height:560px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.9) 55%,rgba(244,248,250,0))}
.h1{color:var(--abyss);font-size:84px;line-height:1.04} .sub{color:var(--deep)}
[dir=rtl] .h1{font-size:76px}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 60%)}
"""
    T = {
        "en": dict(h="What's wrong<br><em>with this shelf?</em>", s="Answer in the comments. We'll reveal it tomorrow."),
        "ar": dict(h="شو الغلط<br><em>بهالرفّ؟</em>", s="جاوب بالكومنت. منكشف الجواب بكرا."),
    }
    for lang, t in T.items():
        body = f"""<div class="zoom"><img src="/assets/post-images/final/SC-05.jpg" alt=""></div>
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{400 if lang == 'en' else 440}px">{t['s']}</p>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-047", lang)
        write("IDEA-047_whats-wrong-shelf", nm, page(lang, f"{nm} · what's wrong", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-048 · out of stock or out of sight? (4 slides, light)
def idea_048():
    T = {
        "en": dict(
            cover=("Out of stock…<br><em>or out of sight?</em>", "Often the item exists. Just not on this shelf."),
            s2="The item isn't<br><em>on this shelf.</em>", tag="Desk Lamp · 0 here",
            s3="It's in your Jounieh branch:<br><em>45 units.</em>", pin="Desk Lamp · 45 in Jounieh",
            s4="Transfer it.<br><em>Keep the sale.</em>", tr=("Transfer", "Jounieh → Beirut", "10 × Desk Lamp · arrives in 35m")),
        "ar": dict(
            cover=("الصنف ناقص…<br><em>أو مش مبيّن؟</em>", "كتير مرّات الصنف موجود. بس مش عهالرف."),
            s2="الصنف<br><em>مش عهالرف.</em>", tag=f"{L('Desk Lamp')} · 0 هون",
            s3="موجود بفرع جونيه:<br><em>45 قطعة.</em>", pin=f"{L('Desk Lamp')} · 45 بجونيه",
            s4="حوّله.<br><em>وخلّي البيعة.</em>", tr=("تحويل", "جونيه ← بيروت", f"{L('10 × Desk Lamp')} · بتوصل خلال 35 دقيقة")),
    }
    gapcss = ('<div style="position:absolute;left:{l}px;top:{tp}px;width:{w}px;height:{h}px;border:3px solid var(--signal);border-radius:10px;'
              'box-shadow:0 0 0 6px rgba(8,149,166,.16),0 0 30px rgba(46,242,238,.45)"></div>')
    for lang, t in T.items():
        h, s = t["cover"]
        # SC-05 inside a panel (952 wide, scale 1.026): the gap sits at about x 490–725, y 530–696 of the panel image
        panel = '<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SC-05.jpg" alt="" style="width:952px;left:0;top:-80px"></div>'
        sl = [("cover", f"""{panel}
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        sl.append(("", f"""{panel}
{gapcss.format(l=64 + 490, tp=520 - 80 + 530, w=235, h=166)}
<div class="chip" style="left:{64 + 440}px;top:{520 - 80 + 700}px"><i style="background:#B4233C"></i>{t['tag']}</div>
<h1 class="h1">{t['s2']}</h1>"""))
        sl.append(("", f"""{BG57}
<h1 class="h1">{t['s3']}</h1>
<div class="wc pc mapc" style="top:520px"><img src="/assets/screens/live-map/map-zoom.jpg" alt=""></div>
<div class="chip" style="left:520px;top:640px;font-size:26px;padding:14px 22px;box-shadow:0 0 0 3px rgba(46,242,238,.7),0 12px 30px rgba(14,36,64,.3)"><i></i>{t['pin']}</div>"""))
        a, b, c = t["tr"]
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{t['s4']}</h1>
<div class="wc pc" style="top:480px"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2 okc">{c}</div></div>"""))
        da.carousel("IDEA-048", "IDEA-048_out-of-stock-or-sight", lang, sl, "out of sight")


if __name__ == "__main__":
    idea_056()
    idea_003()
    idea_073()
    idea_061()
    idea_047()
    idea_048()
    print("ok")
