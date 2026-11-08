"""January 2027, batch C (IDEA-018, IDEA-044, IDEA-007, IDEA-065, IDEA-035), EN + AR.

    python3 -I -X utf8 posts/2027-01/build_idea_jan_c.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
sys.path.insert(0, str(HERE.parent / "2026-12"))
from build_idea_week1 import FOOT, page, top  # noqa: E402
from build_idea_week3 import CARD_CSS, L, name  # noqa: E402
import build_idea_dec_a as da  # noqa: E402

da.MONTH = HERE
write = da.write
BG57, MAPCARD = da.BG57, da.MAPCARD


# ---------------------------------------------------------------- IDEA-018 · founder quote (dark, BG-60)
def idea_018():
    css = """
.bg{filter:brightness(.6)}
.qm{position:absolute;left:52px;top:160px;font-size:300px;line-height:1;color:var(--glow);font-weight:700;text-shadow:0 0 40px rgba(46,242,238,.45)}
[dir=rtl] .qm{left:auto;right:52px}
.quote{position:absolute;left:64px;right:64px;top:400px;font-size:60px;line-height:1.14;font-weight:600;letter-spacing:-.03em;color:#fff}
[dir=rtl] .quote{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;letter-spacing:0;font-size:64px;line-height:1.45;text-align:right}
.quote em{font-style:normal;color:var(--glow)}
.who{position:absolute;left:64px;top:620px;display:flex;align-items:center;gap:16px;font-size:30px;color:var(--visor)}
[dir=rtl] .who{left:auto;right:64px}
.who i{width:56px;height:3px;background:var(--glow)}
"""
    T = {
        "en": dict(q="“", t="We didn't build a stock system.<br><em>We built a reason to log.</em>", w="Nabih, founder"),
        "ar": dict(q="«", t="ما بنينا نظام مخزون.<br><em>بنينا سبب لنسجّل.</em>", w="نبيه، المؤسّس"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-b"></div>
<div class="qm">{t['q']}</div>
<p class="quote">{t['t']}</p>
<div class="who"><i></i>{t['w']}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-018", lang)
        write("IDEA-018_reason-to-log-quote", nm, page(lang, f"{nm} · founder quote", body, css))


# ---------------------------------------------------------------- IDEA-044 · how a driver logs a transfer (4 slides, light)
def idea_044():
    T = {
        "en": dict(
            cover=("How a driver<br><em>logs a transfer.</em>", "3 steps, about 10 seconds."), k="Step {n} of 3",
            s=["Type it<br><em>like you'd say it.</em>", "Stacko reads it<br><em>and puts the truck on the map.</em>",
               "The Sidon manager<br>sees the ETA. <em>No calls.</em>"],
            u="Loaded 40 LED strips for Sidon.",
            r="<b class=\"okc\">Logged ✓</b><br>40 × LED Strip 5m · −40 at WH-01 Beirut<br>Truck on the map: Beirut → Sidon",
            tr=("Incoming · WH-02 Sidon", "40 × LED Strip 5m", "From Beirut · arrives in 50m")),
        "ar": dict(
            cover=("كيف الشوفير<br><em>بيسجّل تحويل.</em>", "3 خطوات، حوالي 10 ثواني."), k="خطوة {n} من 3",
            s=["اكتبها<br><em>متل ما بتحكيها.</em>", "ستاكو بيقراها<br><em>وبيحط الشاحنة عالخريطة.</em>",
               "مدير صيدا بيشوف وقت الوصول.<br><em>بلا تلفونات.</em>"],
            u=f"حمّلت 40 {L('LED Strip')} لصيدا.",
            r=f"<b class=\"okc\">تسجّلت ✓</b><br>{L('40 × LED Strip 5m')} · {L('−40')} من {L('WH-01')} بيروت<br>الشاحنة عالخريطة: بيروت ← صيدا",
            tr=(f"واردة · {L('WH-02')} صيدا", L("40 × LED Strip 5m"), "من بيروت · بتوصل خلال 50 دقيقة")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SC-04.jpg" alt="" style="width:952px;left:0;top:-220px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        a, b, c = t["tr"]
        cards = [f'<div class="wc pc" style="top:560px"><div class="bu" style="font-size:36px;padding:22px 30px">{t["u"]}</div></div>',
                 f'<div class="wc pc" style="top:560px"><div class="re" style="font-size:28px;line-height:1.45">{t["r"]}</div>'
                 f'<img src="/assets/screens/live-map/map-crop.jpg" alt="" style="display:block;width:100%;border-radius:18px;margin-top:18px"></div>',
                 f'<div class="wc pc" style="top:560px"><div class="lab">{a}</div><b class="t">{b}</b><div class="t2 okc">{c}</div></div>']
        for i, (h, card) in enumerate(zip(t["s"], cards)):
            sl.append(("", f"""{BG57}
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
{card}"""))
        da.carousel("IDEA-044", "IDEA-044_driver-logs-transfer", lang, sl, "driver logs a transfer")


# ---------------------------------------------------------------- IDEA-007 · Glossary #03: dead stock (light, glossary layout)
def idea_007():
    css = CARD_CSS + da.ROWS_CSS + """
.post.light{background:#F4F8FA}
.grid-bg{position:absolute;inset:0;background-image:radial-gradient(rgba(44,89,116,.13) 1.4px,transparent 1.6px);background-size:28px 28px}
.kick{top:156px;color:var(--signal)}
[dir=rtl] .kick{top:150px}
.word2{position:absolute;left:64px;right:64px;top:206px;font-size:130px;font-weight:600;letter-spacing:-.04em;line-height:1;color:var(--abyss)}
[dir=rtl] .word2{font-family:'Noto Kufi Arabic',sans-serif;font-weight:700;letter-spacing:0;font-size:100px;line-height:1.3;text-align:right}
.ph{position:absolute;left:68px;top:360px;font-size:28px;color:var(--deep)} .ph i{color:var(--signal);font-weight:600;font-style:normal}
[dir=rtl] .ph{left:auto;right:64px;top:370px}
.def{position:absolute;left:64px;top:430px;width:930px;font-size:40px;line-height:1.35;color:var(--abyss)}
[dir=rtl] .def{left:auto;right:64px;top:440px;font-size:38px;line-height:1.5}
.how{left:64px;right:64px;top:660px;padding:36px 40px}
.how .say{font-size:31px;font-weight:600;color:var(--abyss);margin:6px 0 10px;line-height:1.35}
.see{position:absolute;left:64px;top:1120px;font-size:24px;color:var(--deep)}
[dir=rtl] .see{left:auto;right:64px}
"""
    T = {
        "en": dict(k="The stock manager's glossary · 03", w="Dead stock", ph="<i>noun</i> · /ded stɒk/",
                   d="Items that sit for months without selling. They take space and tie up cash.",
                   lab="In Stacko", say="Every move is logged with a date, so stock that hasn't moved is easy to spot.",
                   r=[("USB-C Cable 1m", "WH-04 · Jounieh", "Last move: 5 months ago"), ("Desk Lamp", "WH-02 · Sidon", "Last move: 4 months ago")],
                   see="See also: slow mover, stock age, ETA (#02)."),
        "ar": dict(k="قاموس مدير المخزون · 03", w="المخزون الراكد", ph=f"<i>اسم</i> · {L('Dead stock')}",
                   d="أصناف بتقعد أشهر بلا ما تنباع. بتاخد محل وبتجمّد مصاري.",
                   lab="بستاكو", say="كل حركة بتتسجّل مع تاريخها، فالمخزون اللي ما تحرّك بيبيّن بسهولة.",
                   r=[(L("USB-C Cable 1m"), f"{L('WH-04')} · جونيه", "آخر حركة: من 5 أشهر"), (L("Desk Lamp"), f"{L('WH-02')} · صيدا", "آخر حركة: من 4 أشهر")],
                   see=f"شوف كمان: صنف بطيء، عمر المخزون، {L('ETA (#02)')}."),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>' for a, b, c in t["r"])
        body = f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<div class="word2">{t['w']}</div>
<div class="ph">{t['ph']}</div>
<p class="def">{t['d']}</p>
<div class="wc how"><div class="lab">{t['lab']}</div><div class="say">{t['say']}</div><div class="rws">{rows}</div></div>
<p class="see">{t['see']}</p>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-007", lang)
        write("IDEA-007_glossary-03-dead-stock", nm, page(lang, f"{nm} · Glossary dead stock", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-065 · move stock like a strategy (dark, OB-03)
def idea_065():
    css = """
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.95),rgba(8,20,36,.65) 60%,rgba(8,20,36,0))}
.h1{font-size:56px;line-height:1.12}
[dir=rtl] .h1{font-size:60px}
.mv{position:absolute;left:470px;top:620px;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;
  padding:14px 24px;font-size:28px;font-weight:600;box-shadow:0 0 0 3px rgba(46,242,238,.7),0 14px 40px rgba(0,0,0,.5);white-space:nowrap}
.mv i{width:12px;height:12px;border-radius:50%;background:var(--signal)}
"""
    T = {
        "en": dict(h="Move your stock like a strategy,<br><em>not a guess.</em>", s="See every location before you make the next move.",
                   c="Move 30 → Jounieh"),
        "ar": dict(h="حرّك مخزونك بخطة،<br><em>مش بالتخمين.</em>", s="شوف كل موقع قبل ما تعمل الحركة الجاية.", c="حرّك 30 ← جونيه"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/OB-03.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{370 if lang == 'en' else 400}px">{t['s']}</p>
<div class="mv"><i></i>{t['c']}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-065", lang)
        write("IDEA-065_move-stock-strategy", nm, page(lang, f"{nm} · strategy", body, css))


# ---------------------------------------------------------------- IDEA-035 · two countries, one map (4 slides, light)
def idea_035():
    search = '<svg viewBox="0 0 24 24" style="width:30px;height:30px;stroke:var(--deep);fill:none;stroke-width:2.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>'
    T = {
        "en": dict(
            cover=("Two countries.<br><em>One map.</em>", "For businesses that grew past one border."),
            s=["Beirut, Tripoli, Dubai:<br><em>each one a pin with its stock.</em>", "Search any item<br><em>across all of them at once.</em>",
               "Arabic or English,<br><em>for every team.</em>"],
            pins=[("Beirut", "WH-01", "2,140"), ("Tripoli", "WH-03", "860"), ("Dubai", "DXB-01", "1,720")],
            q="LED Strip 5m", hits=[("Beirut", "1,380"), ("Tripoli", "210"), ("Dubai", "640")],
            lang=("Warehouse", "المستودع")),
        "ar": dict(
            cover=("بلدين.<br><em>خريطة وحدة.</em>", "للشركات اللي كبرت لبرّا الحدود."),
            s=["بيروت، طرابلس، دبي:<br><em>كل موقع دبّوس مع مخزونه.</em>", "دوّر على أيّ صنف<br><em>بكل المواقع سوا.</em>",
               "عربي أو إنكليزي،<br><em>لكل فريق.</em>"],
            pins=[("بيروت", L("WH-01"), "2,140"), ("طرابلس", L("WH-03"), "860"), ("دبي", L("DXB-01"), "1,720")],
            q=L("LED Strip 5m"), hits=[("بيروت", "1,380"), ("طرابلس", "210"), ("دبي", "640")],
            lang=("Warehouse", "المستودع")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SC-02.jpg" alt="" style="width:952px;left:0;top:-40px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        pins = "".join(f'<div class="rw2"><span class="pill ok" style="padding:6px 10px">●</span><b>{a}</b><span class="sp">{c}</span><b class="num">{n}</b></div>'
                       for a, c, n in t["pins"])
        hits = "".join(f'<div class="rw2"><span class="sp">{a}</span><b class="num">{n}</b></div>' for a, n in t["hits"])
        en, ar = t["lang"]
        cards = [f'<div class="wc pc" style="top:600px"><div class="rws">{pins}</div></div>',
                 f'<div class="wc pc" style="top:560px"><div style="display:flex;align-items:center;gap:14px;border:2px solid #E1EAF0;border-radius:999px;padding:14px 22px;font-size:30px">{search}{t["q"]}</div><div class="rws" style="margin-top:12px">{hits}</div></div>',
                 f'<div class="wc pc" style="top:560px;display:flex;align-items:center;justify-content:space-around;direction:ltr;font-size:40px;font-weight:600">'
                 f'<span>{en}</span><span style="display:flex;gap:8px;background:var(--abyss);border-radius:999px;padding:8px">'
                 f'<i style="font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:22px;{"background:var(--glow);color:var(--abyss)" if lang == "en" else "color:#fff"}">EN</i>'
                 f'<i style="font-style:normal;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:26px;{"background:var(--glow);color:var(--abyss)" if lang == "ar" else "color:#fff"}">ع</i></span>'
                 f'<span style="font-family:\'Noto Kufi Arabic\'">{ar}</span></div>']
        for h, card in zip(t["s"], cards):
            sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px">{h}</h1>
{card}"""))
        da.carousel("IDEA-035", "IDEA-035_two-countries-one-map", lang, sl, "two countries")


if __name__ == "__main__":
    idea_018()
    idea_044()
    idea_007()
    idea_065()
    idea_035()
    print("ok")
