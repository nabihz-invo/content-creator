"""January 2027, batch A (IDEA-084, IDEA-011, IDEA-085, IDEA-086, IDEA-063, IDEA-016), EN + AR.

    python3 -I -X utf8 posts/2027-01/build_idea_jan_a.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE.parent / "2026-12"))
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
import build_idea_dec_a as da  # noqa: E402

da.MONTH = HERE  # da.write / da.carousel now write into posts/2027-01
write = da.write
ROWS_CSS, BG57, MAPCARD = da.ROWS_CSS, da.BG57, da.MAPCARD


# ---------------------------------------------------------------- IDEA-084 · new year, clear stock (dark, SE-03)
def idea_084():
    css = """
.shade-t{height:560px}
.kick{top:166px;color:var(--glow)}
.h1{top:212px;font-size:96px;line-height:1.02}
[dir=rtl] .h1{top:206px;font-size:84px;line-height:1.3}
"""
    T = {
        "en": dict(k="1 January 2027", h="New year,<br><em>clear stock.</em>", s="Happy 2027 from the Stacko team."),
        "ar": dict(k="1 كانون التاني 2027", h="سنة جديدة،<br><em>مخازن واضحة.</em>", s="سنة 2027 سعيدة من فريق ستاكو."),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SE-03.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{430 if lang == 'en' else 450}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-084", lang)
        write("IDEA-084_new-year-clear-stock", nm, page(lang, f"{nm} · new year", body, css))


# ---------------------------------------------------------------- IDEA-011 · the spreadsheet vs Stacko (light, BG-59, table)
def idea_011():
    css = """
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,250,.9),rgba(244,248,250,.55))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.cmp{position:absolute;left:64px;right:64px;top:470px;background:rgba(255,255,255,.92);border-radius:30px;padding:16px 30px 10px;
  box-shadow:0 24px 60px rgba(14,36,64,.2);backdrop-filter:blur(10px)}
.cmp table{width:100%;border-collapse:collapse}
.cmp th{font-size:24px;text-align:start;padding:16px 10px;color:var(--deep);font-weight:600}
.cmp th.st{color:var(--signal)}
.cmp td{padding:20px 10px;border-top:1px solid #E1EAF0;font-size:26px;vertical-align:top;line-height:1.3}
.cmp td.k{font-weight:600;color:var(--abyss);width:24%}
.cmp td.a{color:var(--deep);width:36%}
.cmp td.b{color:#0B7A87;font-weight:600}
.cmp td.a::before{content:"✕ ";color:#B4233C;font-weight:700}
.cmp td.b::before{content:"✓ ";font-weight:700}
"""
    T = {
        "en": dict(h="The spreadsheet<br><em>vs Stacko.</em>", s="Same stock. Very different day.", c=("", "Spreadsheet", "Stacko"),
                   r=[("Updated", "When someone remembers", "When someone sends a message"),
                      ("Where is it?", "Call the branch", "Look at the map"),
                      ("Who changed it?", "No idea", "Name and time"),
                      ("Shipments", "In emails", "On the map, with ETA"),
                      ("Arabic", "Depends on the file", "Full RTL interface")]),
        "ar": dict(h="الجدول<br><em>أو ستاكو؟</em>", s="نفس المخازن. نهار مختلف كتير.", c=("", "الجدول", "ستاكو"),
                   r=[("التحديث", "لمّا حدا يتذكّر", "لمّا حدا يبعت رسالة"),
                      ("وينها؟", "اتّصل بالفرع", "اتطلّع عالخريطة"),
                      ("مين غيّرها؟", "ما حدا بيعرف", "اسم ووقت"),
                      ("الشحنات", "بالإيميلات", "عالخريطة، مع وقت الوصول"),
                      ("العربي", "حسب الملف", "واجهة عربية كاملة")]),
    }
    for lang, t in T.items():
        a, b, c = t["c"]
        rows = "".join(f'<tr><td class="k">{k}</td><td class="a">{x}</td><td class="b">{y}</td></tr>' for k, x, y in t["r"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-59.jpg" alt="">
<div class="veil"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="cmp" style="top:{450 if lang == 'en' else 470}px"><table><tr><th>{a}</th><th>{b}</th><th class="st">{c}</th></tr>{rows}</table></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-011", lang)
        write("IDEA-011_spreadsheet-vs-stacko", nm, page(lang, f"{nm} · spreadsheet vs Stacko", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-085 · 2027 resolutions (6 slides, light)
def idea_085():
    T = {
        "en": dict(
            cover=("2027 resolutions<br><em>for stock managers.</em>", "Pick one. Keep it."),
            k="Resolution {n} of 4",
            res=["Stop guessing.<br><em>Start seeing.</em>", "Log every move<br><em>the day it happens.</em>",
                 "One map,<br><em>not five files.</em>", "Fewer calls,<br><em>more sales.</em>"],
            log=("sent 40 LED strips from Beirut to Sidon", "Logged ✓ · on the map"),
            files=["stock_beirut.xlsx", "stock_sidon_v3.xlsx", "tripoli_count.xlsx", "imports_2026.xlsx", "dubai_stock (2).xlsx"],
            one="1 live map",
            calls=[("Before", "“Can you check if we still have…?”"), ("Now", "The answer is on the map")],
            end=("Which one<br><em>is yours?</em>", ["Stop guessing", "Log the same day", "One map", "Fewer calls"], "ABCD")),
        "ar": dict(
            cover=("قرارات 2027<br><em>لكل مدير مخازن.</em>", "اختار واحد. والتزم فيه."),
            k="قرار {n} من 4",
            res=["بطّل تخمّن.<br><em>وابدأ تشوف.</em>", "سجّل كل حركة<br><em>بنفس النهار.</em>",
                 "خريطة وحدة،<br><em>مش خمس ملفات.</em>", "تلفونات أقل،<br><em>مبيعات أكتر.</em>"],
            log=(f"بعتت 40 {L('LED Strip')} من بيروت لصيدا", "تسجّلت ✓ · عالخريطة"),
            files=["stock_beirut.xlsx", "stock_sidon_v3.xlsx", "tripoli_count.xlsx", "imports_2026.xlsx", "dubai_stock (2).xlsx"],
            one="خريطة وحدة مباشرة",
            calls=[("قبل", "«فيك تشيّك إذا بعد عنّا…؟»"), ("هلّق", "الجواب عالخريطة")],
            end=("أيّا واحد<br><em>إلك؟</em>", ["بطّل تخمّن", "سجّل بنفس النهار", "خريطة وحدة", "تلفونات أقل"], "أبجد")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SE-03.jpg" alt="" style="width:952px;left:0;top:-240px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        u, r = t["log"]
        fl = "".join(f'<div class="rw2" style="direction:ltr"><span class="sp" style="text-decoration:line-through">{f}</span></div>' for f in t["files"])
        cards = [MAPCARD,
                 f'<div class="wc pc"><div class="bu">{u}</div><div class="re"><span class="okc">{r}</span></div></div>',
                 f'<div class="wc pc"><div class="rws">{fl}</div><div class="t2 okc" style="margin-top:14px;font-weight:600">→ {t["one"]}</div></div>',
                 '<div class="wc pc"><div class="rws">' + "".join(
                     f'<div class="rw2"><b style="min-width:110px">{a}</b><span class="sp" style="font-size:28px">{b}</span></div>' for a, b in t["calls"]) + "</div></div>"]
        for i, (h, card) in enumerate(zip(t["res"], cards)):
            sl.append(("", f"""{BG57}
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
{card}"""))
        h, opts, letters = t["end"]
        li = "".join(f'<div class="li"><i>{letters[i]}</i>{x}</div>' for i, x in enumerate(opts))
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{h}</h1>
<div class="list" style="top:470px">{li}</div>"""))
        da.carousel("IDEA-085", "IDEA-085_2027-resolutions", lang, sl, "2027 resolutions")


# ---------------------------------------------------------------- IDEA-086 · Ramadan rush, order early (6 slides, dark)
def idea_086():
    css = CARD_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.h1{top:212px;font-size:58px;line-height:1.14}
[dir=rtl] .h1{top:206px;font-size:52px}
.cover .h1{top:190px;font-size:92px;line-height:1.02}
[dir=rtl] .cover .h1{font-size:80px;line-height:1.3}
.cover .sub{top:410px;font-size:34px}
[dir=rtl] .cover .sub{top:440px}
.cover .shade-t{height:620px}
.bg58{filter:brightness(.55)}
.tl{left:64px;right:64px;top:520px;padding:26px 36px}
.st{display:flex;align-items:center;gap:20px;padding:15px 0;font-size:28px;color:#8AA3B5;position:relative}
.st i{width:22px;height:22px;border-radius:50%;border:3px solid #C9D8E4;background:#fff;flex:none;z-index:1}
.st:not(:last-child)::after{content:"";position:absolute;left:10px;top:44px;height:36px;border-left:3px solid #E1EAF0}
[dir=rtl] .st:not(:last-child)::after{left:auto;right:10px}
.st span{flex:1}
.st small{font-size:24px}
.st.on{color:var(--abyss);font-weight:600}
.st.on i{background:var(--signal);border-color:var(--signal);box-shadow:0 0 0 6px rgba(8,149,166,.18)}
.st.on small{color:#0B7A87}
.shp{left:64px;right:64px;top:540px;padding:30px 36px}
.shp .bar2{height:14px;border-radius:7px;background:#E1EAF0;margin-top:18px;overflow:hidden}
.shp .bar2 i{display:block;height:100%;width:17%;background:linear-gradient(90deg,var(--signal),var(--glow))}
.shp .t2{font-size:28px;color:var(--deep);margin-top:8px}
"""
    T = {
        "en": dict(
            cover=("Ramadan rush?<br><em>Order early.</em>", "The import maths most businesses forget."),
            k="The import maths · {n}/4",
            steps=["Ramadan starts<br><em>around 8 February.</em>", "Sea freight from China takes<br><em>about 30 days, plus customs.</em>",
                   "Then a truck<br><em>to your warehouse.</em>", "So Ramadan stock should ship<br><em>in early January.</em>"],
            tl=[("Today", "6 January"), ("Sea · Shenzhen → Beirut", "~30 days"), ("Customs · Port of Beirut", "~2 days"),
                ("Truck → your warehouse", "a few hours"), ("On the shelf", ""), ("Ramadan", "~8 February")],
            on=[[5], [1, 2], [3], [0]],
            end=("Track every container<br><em>until it lands.</em>",
                 ("SHP-24021", "Shenzhen → Beirut · at sea", "Day 5 of ~30 · ETA on the map"))),
        "ar": dict(
            cover=("عجقة رمضان؟<br><em>اطلب بكّير.</em>", "حساب الاستيراد اللي كتار بينسوه."),
            k="حساب الاستيراد · {n}/4",
            steps=["رمضان بيبلّش<br><em>حوالي 8 شباط.</em>", "الشحن البحري من الصين بياخد<br><em>حوالي 30 يوم، وزيد الجمرك.</em>",
                   "وبعدين شاحنة<br><em>لمستودعك.</em>", "يعني بضاعة رمضان لازم تنشحن<br><em>أوائل كانون التاني.</em>"],
            tl=[("اليوم", "6 كانون التاني"), ("بحر · شنتشن ← بيروت", "حوالي 30 يوم"), ("جمرك · مرفأ بيروت", "حوالي يومين"),
                ("شاحنة ← مستودعك", "كم ساعة"), ("عالرف", ""), ("رمضان", "حوالي 8 شباط")],
            on=[[5], [1, 2], [3], [0]],
            end=("تابع كل حاوية<br><em>لحتى توصل.</em>",
                 (L("SHP-24021"), "شنتشن ← بيروت · بالبحر", "اليوم 5 من حوالي 30 · وقت الوصول عالخريطة"))),
    }
    for lang, t in T.items():
        sl = []
        h, s = t["cover"]
        sl.append(("cover", f"""<img class="bg" src="/assets/post-images/final/SE-04.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>"""))
        for i, h in enumerate(t["steps"]):
            st = "".join(f'<div class="st{" on" if k in t["on"][i] else ""}"><i></i><span>{a}</span><small>{b}</small></div>'
                         for k, (a, b) in enumerate(t["tl"]))
            sl.append(("", f"""<img class="bg bg58" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-b"></div>
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
<div class="wc tl">{st}</div>"""))
        h, (c, r, p) = t["end"]
        sl.append(("", f"""<img class="bg bg58" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1" style="top:190px;font-size:{72 if lang == 'en' else 64}px;line-height:1.1">{h}</h1>
<div class="wc shp" style="top:470px"><div class="lab">{c}</div><b class="t">{r}</b><div class="bar2"><i></i></div><div class="t2">{p}</div></div>"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-086", lang, i + 1)
            html = page(lang, f"{nm} · Ramadan order early", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-086_ramadan-order-early", nm, html)


# ---------------------------------------------------------------- IDEA-063 · which branch? (dark, OB-02 poll)
def idea_063():
    css = """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.h1{font-size:72px;line-height:1.08}
[dir=rtl] .h1{font-size:66px}
.opts{position:absolute;left:64px;right:64px;top:1000px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.o{display:flex;align-items:center;gap:18px;background:rgba(14,36,64,.85);border:1px solid rgba(201,216,228,.32);border-radius:20px;
  padding:20px 22px;font-size:30px;color:#fff;backdrop-filter:blur(8px)}
.o b{width:52px;height:52px;border-radius:14px;background:#fff;color:var(--abyss);display:grid;place-items:center;font-size:26px;flex:none}
"""
    T = {
        "en": dict(h="Which branch has<br><em>the last 12 earbuds?</em>", s="One box. Four branches. Guess in the comments.",
                   o=["Beirut", "Jounieh", "Tripoli", "Dubai"], L="ABCD"),
        "ar": dict(h="وين الكرتونة؟<br><em>وبأيّ فرع؟</em>", s=f"آخر 12 {L('Wireless Earbuds')} بكرتونة وحدة. خمّن بالكومنت.",
                   o=["بيروت", "جونيه", "طرابلس", "دبي"], L="أبجد"),
    }
    for lang, t in T.items():
        o = "".join(f'<div class="o"><b>{t["L"][i]}</b>{x}</div>' for i, x in enumerate(t["o"]))
        body = f"""<img class="bg" src="/assets/post-images/final/OB-02.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{360 if lang == 'en' else 392}px">{t['s']}</p>
<div class="opts">{o}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-063", lang)
        write("IDEA-063_which-branch-poll", nm, page(lang, f"{nm} · which branch", body, css))


# ---------------------------------------------------------------- IDEA-016 · Arabic or English, one tap (light, BG-59)
def idea_016():
    css = CARD_CSS + """
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,250,.92),rgba(244,248,250,.45))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.pair{position:absolute;left:40px;right:40px;top:560px;display:flex;align-items:center;gap:18px;direction:ltr}
.wh{flex:1;background:#fff;border-radius:28px;padding:34px 30px;box-shadow:0 22px 60px rgba(14,36,64,.22);color:var(--abyss)}
.wh .lab{font-size:22px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--signal)}
.wh.ar{direction:rtl;text-align:right}.wh.ar .lab{letter-spacing:0;text-transform:none;font-size:21px}
.wh b.t{display:block;font-size:36px;margin:6px 0 16px}
.wh .rr{display:flex;justify-content:space-between;padding:18px 0;border-top:1px solid #E1EAF0;font-size:27px}
.wh .rr span:last-child{font-weight:600}
.wh .low{color:#B4233C}
.tog{display:flex;flex-direction:column;gap:6px;background:var(--abyss);border-radius:999px;padding:8px;flex:none}
.tog span{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:22px}
.tog span.on{background:var(--glow);color:var(--abyss)}
"""
    en_card = """<div class="wh"><div class="lab">Warehouse</div><b class="t">WH-03 · Tripoli</b>
<div class="rr"><span>Wireless Earbuds</span><span>12</span></div><div class="rr"><span>Desk Lamp</span><span>45</span></div>
<div class="rr"><span>Low stock</span><span class="low">2 items</span></div></div>"""
    ar_card = f"""<div class="wh ar"><div class="lab">المستودع</div><b class="t">{L('WH-03')} · طرابلس</b>
<div class="rr"><span>{L('Wireless Earbuds')}</span><span>12</span></div><div class="rr"><span>{L('Desk Lamp')}</span><span>45</span></div>
<div class="rr"><span>ناقص</span><span class="low">صنفين</span></div></div>"""
    T = {
        "en": dict(h="Arabic or English.<br><em>One tap.</em>", s="Full Arabic interface, right to left, for every team."),
        "ar": dict(h="عربي أو إنكليزي.<br><em>بكبسة وحدة.</em>", s="واجهة عربية كاملة من اليمين للشمال، لكل فريق."),
    }
    for lang, t in T.items():
        tog = '<div class="tog"><span class="on">EN</span><span>ع</span></div>' if lang == "en" else '<div class="tog"><span>EN</span><span class="on">ع</span></div>'
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-59.jpg" alt="">
<div class="veil"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="pair">{en_card}{tog}{ar_card}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-016", lang)
        write("IDEA-016_arabic-or-english", nm, page(lang, f"{nm} · Arabic or English", body, css, theme="light"))


if __name__ == "__main__":
    idea_084()
    idea_011()
    idea_085()
    idea_086()
    idea_063()
    idea_016()
    print("ok")
