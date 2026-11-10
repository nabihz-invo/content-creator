"""March 2027, batch B (IDEA-055, 071, 009, 067, 037, 045, 023, 022), EN + AR.

    python3 -I -X utf8 posts/2027-03/build_idea_mar_b.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE.parent / "2026-12"))
sys.path.insert(0, str(HERE.parent / "2027-02"))
from build_idea_week1 import FOOT, bar, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
import build_idea_dec_a as da  # noqa: E402
import build_idea_feb_b as fb  # noqa: E402

da.MONTH = HERE
write = da.write
ROWS_CSS, BG57, MAPCARD = da.ROWS_CSS, da.BG57, da.MAPCARD


def toggle(lang):
    on = "background:var(--glow);color:var(--abyss)"
    return (f'<div class="wc pc" style="top:560px;display:flex;align-items:center;justify-content:space-around;direction:ltr;font-size:40px;font-weight:600">'
            f'<span>Warehouse</span><span style="display:flex;gap:8px;background:var(--abyss);border-radius:999px;padding:8px">'
            f'<i style="font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:22px;color:#fff;{on if lang == "en" else ""}">EN</i>'
            f'<i style="font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:26px;color:#fff;{on if lang == "ar" else ""}">ع</i></span>'
            f'<span style="font-family:\'Noto Kufi Arabic\'">المستودع</span></div>')


def chat(u, r):
    return f'<div class="wc pc" style="top:560px"><div class="bu">{u}</div><div class="re"><span class="okc" style="font-weight:600">{r}</span></div></div>'


def rows_card(lab, rows, top_=560):
    rr = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>' for a, b, c in rows)
    return f'<div class="wc pc" style="top:{top_}px">{f"<div class=lab>{lab}</div>" if lab else ""}<div class="rws">{rr}</div></div>'


def tips(pid, folder, lang, cover_img, cover_top, cover, k, items, end, title):
    h, s = cover
    sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/{cover_img}" alt="" style="width:952px;left:0;top:{cover_top}px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
    for i, (h, card) in enumerate(items):
        sl.append(("", f"""{BG57}
<div class="kick">{k.format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
{card}"""))
    h, s = end
    sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 420}px">{s}</p>
{MAPCARD.replace('class="wc pc mapc"', 'class="wc pc mapc" style="top:500px"')}"""))
    da.carousel(pid, folder, lang, sl, title)


# ---------------------------------------------------------------- IDEA-055 · get your team to actually log (7 slides, light)
def idea_055():
    E = dict(cover=("How to get your team<br><em>to actually log stock.</em>", "5 things that work."), k="Tip {n} of 5",
             end=("What works<br><em>in your team?</em>", "Tell us in the comments."))
    A = dict(cover=("كيف تخلّي فريقك<br><em>يسجّل المخزون فعلاً.</em>", "5 شغلات بتزبط."), k="نصيحة {n} من 5",
             end=("شو بيزبط<br><em>مع فريقك؟</em>", "خبّرنا بالكومنت."))
    for lang, t in (("en", E), ("ar", A)):
        en = lang == "en"
        items = [
            ("Make it fast:<br><em>a message, not a form.</em>" if en else "خلّيها سريعة:<br><em>رسالة، مش فورم.</em>",
             chat("sent 40 LED strips from Beirut to Sidon" if en else f"بعتت 40 {L('LED Strip')} من بيروت لصيدا",
                  "Logged ✓ · about 10 seconds" if en else "تسجّلت ✓ · حوالي 10 ثواني")),
            ("Make it visible:<br><em>every log moves something on the map.</em>" if en else "خلّيها تبيّن:<br><em>كل تسجيل بيحرّك شي عالخريطة.</em>",
             MAPCARD.replace('class="wc pc mapc"', 'class="wc pc mapc" style="top:560px"')),
            ("Make it fair:<br><em>every move has a name and a time.</em>" if en else "خلّيها عادلة:<br><em>كل حركة إلها اسم ووقت.</em>",
             rows_card("", [("Rami", "−25 · LED Strip 5m", "Today, 4:12 PM"), ("Lina", "+40 · USB-C Cable", "Today, 2:05 PM")] if en else
                       [("رامي", f"{L('−25')} · {L('LED Strip 5m')}", "اليوم، 4:12 بعد الضهر"), ("لينا", f"{L('+40')} · {L('USB-C Cable')}", "اليوم، 2:05 بعد الضهر")])),
            ("Speak their language:<br><em>Arabic and English.</em>" if en else "احكي لغتهن:<br><em>عربي وإنكليزي.</em>", toggle(lang)),
            ("Use the data<br><em>in your next meeting.</em>" if en else "استعمل الأرقام<br><em>باجتماعك الجاي.</em>",
             rows_card("Moves logged this week" if en else "حركات تسجّلت هالجمعة",
                       [("Beirut", "WH-01", "96"), ("Sidon", "WH-02", "71"), ("Tripoli", "WH-03", "47")] if en else
                       [("بيروت", L("WH-01"), "96"), ("صيدا", L("WH-02"), "71"), ("طرابلس", L("WH-03"), "47")])),
        ]
        tips("IDEA-055", "IDEA-055_get-your-team-to-log", lang, "SC-07.jpg", -160, t["cover"], t["k"], items, t["end"], "team logging")


# ---------------------------------------------------------------- IDEA-037 · Gulf branch, 5 stock lessons (7 slides, light)
def idea_037():
    E = dict(cover=("Opening a Gulf branch?<br><em>5 stock lessons.</em>", "Before the first shipment lands."), k="Lesson {n} of 5",
             end=("Planning a Gulf branch?<br><em>Tell us where.</em>", "Lebanon and the Gulf, on one map."))
    A = dict(cover=("فاتح فرع بالخليج؟<br><em>5 دروس بالمخزون.</em>", "قبل ما توصل أوّل شحنة."), k="درس {n} من 5",
             end=("عم تخطّط لفرع بالخليج؟<br><em>خبّرنا وين.</em>", "لبنان والخليج، على خريطة وحدة."))
    for lang, t in (("en", E), ("ar", A)):
        en = lang == "en"
        codes = '<div class="wc pc" style="top:560px"><div class="brs" style="direction:ltr">' + "".join(
            f'<span style="font-size:32px;padding:14px 26px">{c}</span>' for c in ("WH-01", "WH-02", "WH-03", "DXB-01")) + "</div></div>"
        items = [
            ("Decide what lives where<br><em>before the first shipment.</em>" if en else "قرّر شو بيقعد وين<br><em>قبل أوّل شحنة.</em>",
             rows_card("", [("Fast movers", "→", "DXB-01 · Dubai"), ("Bulk stock", "→", "WH-01 · Beirut")] if en else
                       [("الأصناف السريعة", "←", f"{L('DXB-01')} · دبي"), ("البضاعة الكبيرة", "←", f"{L('WH-01')} · بيروت")])),
            ("Give every location a code<br><em>(WH-01, DXB-01).</em>" if en else f"اعطي كل موقع رمز:<br><em>{L('WH-01')}، {L('DXB-01')}.</em>", codes),
            ("Log every move from day one,<br><em>not after the first mess.</em>" if en else "سجّل كل حركة من أوّل يوم،<br><em>مش بعد أوّل لخبطة.</em>",
             chat("received 200 USB-C cables at DXB-01" if en else f"استلمنا 200 {L('USB-C Cable')} بـ{L('DXB-01')}",
                  "Logged ✓ · DXB-01 Dubai" if en else f"تسجّلت ✓ · {L('DXB-01')} دبي")),
            ("Let each team work<br><em>in its own language.</em>" if en else "خلّي كل فريق يشتغل<br><em>بلغته.</em>", toggle(lang)),
            ("See both countries in one place,<br><em>not two files.</em>" if en else "شوف البلدين بمحل واحد،<br><em>مش بملفّين.</em>",
             rows_card("", [("Beirut", "WH-01", "2,140"), ("Dubai", "DXB-01", "1,720")] if en else
                       [("بيروت", L("WH-01"), "2,140"), ("دبي", L("DXB-01"), "1,720")])),
        ]
        tips("IDEA-037", "IDEA-037_gulf-branch-5-lessons", lang, "SC-02.jpg", -40, t["cover"], t["k"], items, t["end"], "Gulf lessons")


# ---------------------------------------------------------------- IDEA-071 · your first week with Stacko (6 slides, dark)
def idea_071():
    css = CARD_CSS + ROWS_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.h1{top:212px;font-size:60px;line-height:1.14}
[dir=rtl] .h1{top:206px;font-size:54px}
.cover .h1{top:190px;font-size:88px;line-height:1.04}
[dir=rtl] .cover .h1{font-size:76px;line-height:1.3}
.cover .sub{top:400px}
[dir=rtl] .cover .sub{top:440px}
.cover .shade-t{height:620px}
.days{position:absolute;left:64px;right:64px;top:440px;display:flex;gap:10px;direction:ltr}
.days span{flex:1;height:56px;border-radius:14px;background:rgba(14,36,64,.8);border:1px solid rgba(201,216,228,.3);color:var(--visor);
  display:grid;place-items:center;font-size:22px;font-weight:600}
.days span.on{background:var(--glow);color:var(--abyss);border-color:var(--glow)}
.days span.done{color:#fff}
.pc{left:64px;right:64px;top:560px;padding:30px 36px}
.pc.mapc{padding:14px}.pc.mapc img{display:block;width:100%;border-radius:18px}
.bu{margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:28px;padding:14px 22px;border-radius:22px 22px 6px 22px}
[dir=rtl] .bu{border-radius:22px 22px 22px 6px}
.ok2{margin-top:12px;font-size:26px;color:#0B7A87;font-weight:600}
.pill.mis{background:#FFF1D6;color:#8A5A00}
"""
    T = {
        "en": dict(cover=("Your first week<br><em>with Stacko.</em>", "From notebook to a full picture in seven days."), dl="Day",
                   s=[(1, "Put your warehouses<br><em>on the map.</em>"), (2, "Upload supplier invoices;<br><em>items get created.</em>"),
                      (3, "The team starts logging<br><em>from their phones.</em>"), (5, "The first low-stock<br><em>and mismatch alerts.</em>"),
                      (7, "The full<br><em>picture.</em>")],
                   inv=(["LED Strip 5m × 1,200", "Desk Lamp × 300", "USB-C Cable 1m × 2,000"], "12 items created ✓"),
                   log=("sent 40 LED strips from Beirut to Sidon", "Logged ✓ · on the map"),
                   al=[("Low stock", "Desk Lamp · 3 left in Jounieh", "low"), ("Mismatch", "WH-02 · counted 38, system 40", "mis")],
                   q="What would you want to see on day 1?"),
        "ar": dict(cover=("أوّل أسبوع<br><em>مع ستاكو.</em>", "من الدفتر لصورة كاملة بسبع أيام."), dl="يوم",
                   s=[(1, "حط مستودعاتك<br><em>عالخريطة.</em>"), (2, "حمّل فواتير المورّد،<br><em>والأصناف بتنعمل.</em>"),
                      (3, "الفريق بيبلّش يسجّل<br><em>من تلفوناتهن.</em>"), (5, "أوّل تنبيهات<br><em>النقص والفروقات.</em>"),
                      (7, "الصورة<br><em>كاملة.</em>")],
                   inv=([L("LED Strip 5m × 1,200"), L("Desk Lamp × 300"), L("USB-C Cable 1m × 2,000")], "انعملوا 12 صنف ✓"),
                   log=(f"بعتت 40 {L('LED Strip')} من بيروت لصيدا", "تسجّلت ✓ · عالخريطة"),
                   al=[("نقص", f"{L('Desk Lamp')} · باقي 3 بجونيه", "low"), ("فرق", f"{L('WH-02')} · انعدّ 38، بالنظام 40", "mis")],
                   q="شو بدّك تشوف بأوّل يوم؟"),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<img class="bg" src="/assets/post-images/final/OB-05.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        il, done = t["inv"]
        u, r = t["log"]
        cards = ['<div class="wc pc mapc"><img src="/assets/screens/live-map/map-crop.jpg" alt=""></div>',
                 '<div class="wc pc"><div class="rws">' + "".join(f'<div class="rw2"><span class="sp">{x}</span></div>' for x in il) + f'</div><div class="ok2">{done}</div></div>',
                 f'<div class="wc pc"><div class="bu">{u}</div><div class="ok2">{r}</div></div>',
                 '<div class="wc pc"><div class="rws">' + "".join(f'<div class="rw2"><span class="pill {c}">{a}</span><span class="sp">{b}</span></div>' for a, b, c in t["al"]) + "</div></div>",
                 f'<div class="wc pc mapc"><img src="/assets/screens/live-map/map-zoom.jpg" alt=""></div><p class="sub" style="top:1140px">{t["q"]}</p>']
        for (d, h), card in zip(t["s"], cards):
            days = "".join(f'<span class="{"on" if k == d else "done" if k < d else ""}">{k}</span>' for k in range(1, 8))
            sl.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<div class="kick">{t['dl']} {d}</div>
<h1 class="h1">{h}</h1>
<div class="days">{days}</div>
{card.replace('class="wc pc', 'style="top:540px" class="wc pc', 1)}"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-071", lang, i + 1)
            html = page(lang, f"{nm} · first week", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-071_first-week-with-stacko", nm, html)


# ---------------------------------------------------------------- IDEA-009 · Glossary #05: SKU
def idea_009():
    mug = lambda c: (f'<svg viewBox="0 0 64 64" style="width:110px;height:110px"><path d="M12 14h32v30a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="{c}"/>'
                     f'<path d="M44 22h6a8 8 0 0 1 0 16h-6" fill="none" stroke="{c}" stroke-width="6"/></svg>')
    mugs = (f'<div style="display:flex;gap:40px;justify-content:center;direction:ltr;margin:6px 0 10px">'
            f'<div style="text-align:center">{mug("#163B62")}<div style="font-size:24px;font-weight:700;color:var(--abyss)">SKU-1042</div></div>'
            f'<div style="text-align:center">{mug("#79C0DE")}<div style="font-size:24px;font-weight:700;color:var(--abyss)">SKU-1043</div></div></div>')
    T = {
        "en": dict(k="The stock manager's glossary · 05", w="SKU", ph="<i>noun</i> · Stock Keeping Unit",
                   d="One code per product variant. A navy mug and a light-blue mug are two SKUs.",
                   lab="In Stacko", say=mugs + "Search across 10,000+ SKUs, low stock first.", r=[],
                   see="See also: variant, item code, cycle count (#04)."),
        "ar": dict(k="قاموس مدير المخزون · 05", w=L("SKU"), ph=f"<i>رمز الصنف</i> · {L('Stock Keeping Unit')}",
                   d="رمز واحد لكل نوع من المنتج. كوب كحلي وكوب أزرق فاتح هنّي صنفين.",
                   lab="بستاكو", say=mugs + f"دوّر بين أكتر من {L('10,000')} صنف، والناقص أوّل شي.", r=[],
                   see=f"شوف كمان: النوع، رمز الصنف، الجرد الدوري ({L('#04')})."),
    }
    fb.glossary("IDEA-009", "IDEA-009_glossary-05-sku", T, "Glossary SKU")


# ---------------------------------------------------------------- IDEA-067 · checkmate, stockouts (dark, OB-03)
def idea_067():
    css = """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.95),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.h1{font-size:100px;line-height:1.02}
[dir=rtl] .h1{font-size:88px;line-height:1.3}
.crown{position:absolute;left:478px;top:560px;width:130px;height:110px;filter:drop-shadow(0 0 22px rgba(46,242,238,.7))}
"""
    crown = ('<svg class="crown" viewBox="0 0 64 54"><path d="M4 16l14 12 14-22 14 22 14-12-6 30H10z" fill="#2EF2EE" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>'
             '<rect x="10" y="46" width="44" height="6" rx="2" fill="#2EF2EE"/></svg>')
    T = {"en": dict(h="Checkmate,<br><em>stockouts.</em>", s="Know your stock, win the sale."),
         "ar": dict(h="كش ملك<br><em>للنواقص.</em>", s="اعرف مخزونك، واربح البيعة.")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/OB-03.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 450}px">{t['s']}</p>
{crown}
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-067", lang)
        write("IDEA-067_checkmate-stockouts", nm, page(lang, f"{nm} · checkmate", body, css))


# ---------------------------------------------------------------- IDEA-045 · the people who move your stock (dark, SC-04)
def idea_045():
    css = """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.h1{font-size:66px;line-height:1.1}
[dir=rtl] .h1{font-size:60px}
.roles{position:absolute;left:64px;right:64px;top:1110px;display:flex;gap:14px;justify-content:center}
.roles span{background:#fff;color:var(--abyss);border-radius:999px;padding:16px 30px;font-size:30px;font-weight:700;box-shadow:0 14px 40px rgba(0,0,0,.45)}
"""
    T = {"en": dict(h="The people who really<br><em>move your stock.</em>", s="Drivers, storekeepers, buyers.<br>Stacko is built for their 10 seconds.",
                    r=["Driver", "Storekeeper", "Buyer"]),
         "ar": dict(h="الناس اللي فعلاً<br><em>بيحرّكوا مخزونك.</em>", s="الشوفيرية، أمناء المخازن، والمشترين.<br>ستاكو مبني لعشر ثواني تبعهن.",
                    r=["الشوفير", "أمين المخزن", "المشتري"])}
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-04.jpg" alt="">
<div class="shade-t"></div><div class="shade-b" style="height:420px"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{380 if lang == 'en' else 400}px">{t['s']}</p>
<div class="roles">{"".join(f"<span>{x}</span>" for x in t['r'])}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-045", lang)
        write("IDEA-045_people-who-move-stock", nm, page(lang, f"{nm} · people", body, css))


# ---------------------------------------------------------------- IDEA-023 · things stock managers never say (6 slides, dark)
def idea_023():
    css = """
.bg{filter:brightness(.6)}
.cover .h1{top:200px;font-size:84px;line-height:1.06}
[dir=rtl] .cover .h1{font-size:72px;line-height:1.35}
.cover .sub{top:420px}
[dir=rtl] .cover .sub{top:460px}
.q{position:absolute;left:64px;right:64px;top:360px;font-size:84px;line-height:1.1;font-weight:600;letter-spacing:-.03em;color:#fff}
[dir=rtl] .q{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;letter-spacing:0;font-size:72px;line-height:1.45;text-align:right}
.stamp{position:absolute;left:520px;top:760px;transform:rotate(-12deg);border:6px solid var(--glow);color:var(--glow);border-radius:16px;
  padding:10px 34px;font-size:70px;font-weight:800;letter-spacing:.08em;box-shadow:0 0 30px rgba(46,242,238,.35)}
[dir=rtl] .stamp{left:auto;right:520px;letter-spacing:0;font-family:'Noto Kufi Arabic',sans-serif}
"""
    T = {
        "en": dict(cover=("Things stock managers<br><em>never say.</em>", "Swipe if you've never said them either."),
                   q=["“The spreadsheet is up to date.”", "“I know exactly what's in Tripoli.”", "“Everyone logged their moves today.”",
                      "“The count matched the first time.”"], st="NEVER",
                   end=("With Stacko,<br><em>you might start.</em>", "Your stock, always in sight.")),
        "ar": dict(cover=("جمل ما بتسمعها<br><em>من مدير مستودع.</em>", "اسحب إذا إنت كمان عمرك ما قلتها."),
                   q=["«الجدول محدّث.»", "«بعرف بالزبط شو في بطرابلس.»", "«الكل سجّل حركاته اليوم.»", "«الجرد طابق من أوّل مرّة.»"], st="أبداً",
                   end=("مع ستاكو،<br><em>يمكن تبلّش تقولها.</em>", "مخزونك دايماً قدّام عينك.")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f'<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt=""><div class="shade-b"></div><h1 class="h1">{h}</h1><p class="sub">{s}</p>')]
        for q in t["q"]:
            sl.append(("", f'<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt=""><div class="shade-b"></div><p class="q">{q}</p><div class="stamp">{t["st"]}</div>'))
        h, s = t["end"]
        sl.append(("", f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt=""><div class="shade-b"></div>
<h1 class="h1" style="top:200px;font-size:{84 if lang == 'en' else 72}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 460}px">{s}</p>
<div style="position:absolute;left:64px;right:64px;top:560px;background:#fff;border-radius:28px;padding:14px;box-shadow:0 22px 60px rgba(0,0,0,.4)">
<img src="/assets/screens/live-map/map-crop.jpg" alt="" style="display:block;width:100%;border-radius:18px"></div>"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-023", lang, i + 1)
            html = page(lang, f"{nm} · never say", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-023_things-managers-never-say", nm, html)


# ---------------------------------------------------------------- IDEA-022 · Sound familiar? #4 (dark, BG-60)
def idea_022():
    css = CARD_CSS + ROWS_CSS + """
.bg{filter:brightness(.75)}
.shade-t{height:760px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.6) 70%,rgba(8,20,36,0))}
.shade-b{height:900px;background:linear-gradient(180deg,rgba(8,20,36,0),rgba(8,20,36,.82) 40%)}
.kick{top:180px;color:var(--glow)}
[dir=rtl] .kick{top:174px}
.h1{top:230px;font-size:72px;line-height:1.08}
[dir=rtl] .h1{top:224px;font-size:66px}
.sub{color:var(--visor)}
.sc{left:64px;right:64px;top:510px;padding:14px 34px}
[dir=rtl] .sc{top:536px}
.sc .rw2,.ss .rw2{padding:15px 0}
.sc .rws,.ss .rws{margin-top:0}
.ss{position:absolute;left:64px;right:64px;top:850px;padding:14px 34px;border-radius:24px;background:rgba(27,65,107,.9);
  border:2px solid rgba(46,242,238,.55);box-shadow:0 22px 60px rgba(0,0,0,.45),0 0 30px rgba(46,242,238,.12);color:#fff}
[dir=rtl] .ss{top:876px}
.ss .rw2{border-bottom-color:rgba(201,216,228,.18)}
.ss .rw2 b{color:#fff} .ss .rw2 .sp{color:var(--visor)}
.ss .ok2{color:#BCE5E0;font-weight:600}
.with{position:absolute;left:64px;right:64px;top:778px;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:600;color:#fff}
[dir=rtl] .with{top:804px}
.with em{font-style:normal;color:var(--glow)}
.with svg{width:34px;height:34px;stroke:var(--visor);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.with i{flex:1;height:2px;background:linear-gradient(90deg,rgba(201,216,228,.5),rgba(201,216,228,0))}
[dir=rtl] .with i{background:linear-gradient(270deg,rgba(201,216,228,.5),rgba(201,216,228,0))}
.mgr{position:absolute;left:64px;right:64px;top:1112px;font-size:30px;line-height:1.35;color:var(--visor)}
[dir=rtl] .mgr{top:1136px;font-size:32px}
"""
    ARROW = '<svg viewBox="0 0 24 24"><path d="M12 4v16M5 13l7 7 7-7"/></svg>'
    T = {
        "en": dict(k="Sound familiar? #4", h="The container arrived.<br><em>The stock didn't.</em>", s="Arrived in the port, missing in the system.",
                   r=[("Port of Beirut", "SHP-24021", "Unloaded ✓", "okc"), ("WH-01 Beirut", "Received", "0", "zero"), ("The system", "", "“Where is it?”", "zero")],
                   w='With <em>Stacko</em>',
                   r2=[("Port of Beirut", "SHP-24021", "Unloaded ✓"), ("On the way", "to WH-01", "ETA 50m"), ("WH-01 Beirut", "Received", "40 ✓")],
                   m="Managers see where every container is, from port to shelf."),
        "ar": dict(k="مألوفة؟ #4", h="الحاوية وصلت.<br><em>المخزون؟ لأ.</em>", s="وصلت عالمرفأ، ومش موجودة بالنظام.",
                   r=[("مرفأ بيروت", L("SHP-24021"), "انفضّت ✓", "okc"), (f"{L('WH-01')} بيروت", "استلمنا", "0", "zero"), ("النظام", "", "«وينها؟»", "zero")],
                   w='مع <em>ستاكو</em>',
                   r2=[("مرفأ بيروت", L("SHP-24021"), "انفضّت ✓"), ("عالطريق", f"لـ{L('WH-01')}", "بتوصل خلال 50 دقيقة"),
                       (f"{L('WH-01')} بيروت", "استلمنا", "40 ✓")],
                   m="المدير بيشوف وين كل حاوية، من المرفأ للرفّ."),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="{c}">{d}</span></div>' for a, b, d, c in t["r"])
        rows2 = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="ok2">{d}</span></div>' for a, b, d in t["r2"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{420 if lang == 'en' else 450}px">{t['s']}</p>
<div class="wc sc"><div class="rws">{rows}</div></div>
<div class="with">{ARROW}<span>{t['w']}</span><i></i></div>
<div class="ss"><div class="rws">{rows2}</div></div>
<p class="mgr">{t['m']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-022", lang)
        write("IDEA-022_sound-familiar-04", nm, page(lang, f"{nm} · Sound familiar #4", body, css))


if __name__ == "__main__":
    idea_055()
    idea_037()
    idea_071()
    idea_009()
    idea_067()
    idea_045()
    idea_023()
    idea_022()
    print("ok")
