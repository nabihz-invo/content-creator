"""February 2027, batch A (IDEA-020, IDEA-051, IDEA-069, IDEA-087, IDEA-013, IDEA-014), EN + AR.

    python3 -I -X utf8 posts/2027-02/build_idea_feb_a.py          (from content/)
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

PUZZLE = ('<svg viewBox="0 0 24 24" style="width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round">'
          '<path d="M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z"/></svg>')


# ---------------------------------------------------------------- IDEA-020 · Sound familiar? #2 (dark, BG-60)
def idea_020():
    css = CARD_CSS + ROWS_CSS + """
.bg{filter:brightness(.75)}
.shade-t{height:760px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.6) 70%,rgba(8,20,36,0))}
.kick{top:180px;color:var(--glow)}
[dir=rtl] .kick{top:174px}
.h1{top:230px;font-size:66px;line-height:1.1}
[dir=rtl] .h1{top:224px;font-size:60px}
.sub{color:var(--visor)}
.sc{left:64px;right:64px;top:640px;padding:30px 36px}
.sc .ph{width:44px;height:44px;border-radius:50%;background:#EEF4F7;display:grid;place-items:center;font-size:22px;flex:none}
"""
    T = {
        "en": dict(k="Sound familiar? #2", h="The customer waits.<br><em>You call three branches.</em>", s="Or you look at one map.",
                   r=[("Jounieh", "No answer"), ("Sidon", "“Hold on, let me check…”"), ("Tripoli", "“We have 4, I think.”")]),
        "ar": dict(k="مألوفة؟ #2", h="الزبون ناطر،<br><em>وإنت عم تتّصل بتلات فروع.</em>", s="أو بتتطلّع على خريطة وحدة.",
                   r=[("جونيه", "ما حدا ردّ"), ("صيدا", "«لحظة، خلّيني شوف…»"), ("طرابلس", "«عنّا 4، بظنّ.»")]),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><span class="ph">☎</span><b>{a}</b><span class="sp" style="text-align:end">{b}</span></div>' for a, b in t["r"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{410 if lang == 'en' else 440}px">{t['s']}</p>
<div class="wc sc">{rows}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-020", lang)
        write("IDEA-020_sound-familiar-02", nm, page(lang, f"{nm} · Sound familiar #2", body, css))


# ---------------------------------------------------------------- IDEA-051 · morning routine (5 slides, light)
def idea_051():
    T = {
        "en": dict(
            cover=("Morning routine<br><em>of a stock-smart owner.</em>", "4 minutes. One coffee."),
            s=[("8:00", "Open the map.<br><em>Every location, one view.</em>"), ("8:01", "Check alerts:<br><em>low stock and mismatches.</em>"),
               ("8:02", "See what's on the road,<br><em>with ETAs.</em>"), ("8:03", "Coffee's<br><em>still hot.</em>")],
            al=[("Low stock", "Desk Lamp · 3 left in Jounieh", "low"), ("Mismatch", "LED Strip 5m · WH-02 · counted 38, system 40", "mis")],
            road=[("Beirut → Sidon", "40 × LED Strip 5m", "in 35m"), ("Tripoli → Jounieh", "12 × Desk Lamp", "in 1h 10m")],
            end="What does your morning look like?"),
        "ar": dict(
            cover=("روتين الصبح<br><em>لصاحب مصلحة مرتاح.</em>", "4 دقايق. فنجان قهوة واحد."),
            s=[("8:00", "افتح الخريطة.<br><em>كل المواقع، بنظرة وحدة.</em>"), ("8:01", "شيّك التنبيهات:<br><em>النقص والفروقات.</em>"),
               ("8:02", "شوف شو عالطريق،<br><em>مع أوقات الوصول.</em>"), ("8:03", "القهوة<br><em>بعدها سخنة.</em>")],
            al=[("نقص", f"{L('Desk Lamp')} · باقي 3 بجونيه", "low"), ("فرق", f"{L('LED Strip 5m')} · {L('WH-02')} · انعدّ 38، بالنظام 40", "mis")],
            road=[("بيروت ← صيدا", L("40 × LED Strip 5m"), "خلال 35 دقيقة"), ("طرابلس ← جونيه", L("12 × Desk Lamp"), "خلال ساعة و10")],
            end="كيف صبحيّتك هلّق؟"),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/SC-06.jpg" alt="" style="width:952px;left:0;top:-300px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        alerts = '<div class="wc pc"><div class="rws">' + "".join(
            f'<div class="rw2"><span class="pill {c}">{a}</span><span class="sp">{b}</span></div>' for a, b, c in t["al"]) + "</div></div>"
        road = '<div class="wc pc"><div class="rws">' + "".join(
            f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="okc">{c}</span></div>' for a, b, c in t["road"]) + "</div></div>"
        cards = [MAPCARD.replace('class="wc pc mapc"', 'class="wc pc mapc" style="top:560px"'), alerts.replace('class="wc pc"', 'class="wc pc" style="top:560px"'),
                 road.replace('class="wc pc"', 'class="wc pc" style="top:560px"'), None]
        for i, ((clock, h), card) in enumerate(zip(t["s"], cards)):
            kick = f'<div class="kick" style="font-size:34px;letter-spacing:0;font-weight:700;direction:ltr">{clock}</div>'
            if card is None:
                sl.append(("", f"""<div class="panel" style="top:560px;height:660px"><img src="/assets/post-images/final/SC-06.jpg" alt="" style="width:952px;left:0;top:-420px"></div>
{kick}
<h1 class="h1" style="font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{430 if lang == 'en' else 460}px">{t['end']}</p>"""))
            else:
                sl.append(("", f"""{BG57}
{kick}
<h1 class="h1" style="top:224px">{h}</h1>
{card}"""))
        da.carousel("IDEA-051", "IDEA-051_morning-routine", lang, sl, "morning routine")


# ---------------------------------------------------------------- IDEA-069 · the 4 missing pieces (6 slides, light)
def idea_069():
    T = {
        "en": dict(
            cover=("The 4 missing pieces<br><em>of stock data.</em>", "Complete the puzzle."), k="Piece {n} of 4",
            p=[("Who:<br><em>every move has a name.</em>", "Rami"), ("What:<br><em>the exact item and quantity.</em>", "−25 · LED Strip 5m"),
               ("When:<br><em>date and time, automatically.</em>", "Today, 4:12 PM"), ("Where:<br><em>from which location, to which.</em>", "WH-01 Beirut → WH-02 Sidon")],
            lab=["Who", "What", "When", "Where"],
            end=("Complete<br><em>the puzzle.</em>", "Which piece is missing in your system?")),
        "ar": dict(
            cover=("القطع الأربعة الناقصة<br><em>من بيانات مخزونك.</em>", "كمّل البازل."), k="قطعة {n} من 4",
            p=[("مين:<br><em>كل حركة إلها اسم.</em>", "رامي"), ("شو:<br><em>الصنف والكمية بالزبط.</em>", f"{L('−25')} · {L('LED Strip 5m')}"),
               ("إيمتى:<br><em>التاريخ والوقت، أوتوماتيك.</em>", "اليوم، 4:12 بعد الضهر"), ("وين:<br><em>من أيّ موقع، ولأيّ موقع.</em>", f"{L('WH-01')} بيروت ← {L('WH-02')} صيدا")],
            lab=["مين", "شو", "إيمتى", "وين"],
            end=("كمّل<br><em>البازل.</em>", "أيّا قطعة ناقصة بنظامك؟")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/OB-04.jpg" alt="" style="width:952px;left:0;top:-200px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        for i, (h, v) in enumerate(t["p"]):
            rows = "".join(f'<div class="rw2" style="{"" if k == i else "opacity:.35"}"><span class="sp">{t["lab"][k]}</span><b>{t["p"][k][1]}</b></div>' for k in range(4))
            sl.append(("", f"""{BG57}
<div class="kick" style="display:flex;align-items:center;gap:12px">{PUZZLE}{t['k'].format(n=i + 1)}</div>
<h1 class="h1">{h}</h1>
<div class="wc pc" style="top:560px"><div class="lab">{t['lab'][i]}</div><b class="t" style="font-size:44px;margin-bottom:10px">{v}</b><div class="rws">{rows}</div></div>"""))
        h, s = t["end"]
        rows = "".join(f'<div class="rw2"><span class="sp">{t["lab"][k]}</span><b>{t["p"][k][1]}</b></div>' for k in range(4))
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{80 if lang == 'en' else 70}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 420}px">{s}</p>
<div class="wc pc" style="top:500px"><div class="rws">{rows}</div></div>"""))
        da.carousel("IDEA-069", "IDEA-069_4-missing-pieces", lang, sl, "4 missing pieces")


# ---------------------------------------------------------------- IDEA-087 · Ramadan Kareem (dark, SE-04 lantern crop)
def idea_087():
    css = """
.zoom{position:absolute;inset:0;overflow:hidden}
.zoom img{position:absolute;width:1400px;left:-240px;top:-40px;max-width:none}
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.5) 60%,rgba(8,20,36,0))}
.h1{top:200px;font-size:110px;line-height:1.05}
[dir=rtl] .h1{font-size:100px;line-height:1.3}
"""
    T = {
        "en": dict(h="Ramadan <em>Kareem.</em>", s="From the Stacko team."),
        "ar": dict(h="رمضان <em>كريم.</em>", s="من فريق ستاكو."),
    }
    for lang, t in T.items():
        body = f"""<div class="zoom"><img src="/assets/post-images/final/SE-04.jpg" alt=""></div>
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{340 if lang == 'en' else 360}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-087", lang)
        write("IDEA-087_ramadan-kareem", nm, page(lang, f"{nm} · Ramadan Kareem", body, css))


# ---------------------------------------------------------------- IDEA-013 · why a map, not a table (5 slides, dark, founder)
def idea_013():
    css = CARD_CSS + """
.kick{top:166px;color:var(--glow)}
[dir=rtl] .kick{top:160px}
.h1{top:300px;font-size:70px;line-height:1.12}
[dir=rtl] .h1{font-size:54px;line-height:1.45}
.cover .h1{top:212px;font-size:64px}
.cover .sub{top:420px}
[dir=rtl] .cover .sub{top:460px}
.bg60{filter:brightness(.55)}
.n{position:absolute;left:64px;top:220px;font-size:28px;font-weight:700;color:var(--dolphin)}
[dir=rtl] .n{left:auto;right:64px}
.pc{left:64px;right:64px;top:640px;padding:14px}
.pc img{display:block;width:100%;border-radius:18px}
"""
    T = {
        "en": dict(k="From the founder",
                   cover=("Why we put stock on a map,<br><em>not a table.</em>", "A note from the team behind Stacko."),
                   s=["Tables don't show movement.<br><em>Stock moves every day.</em>", "Teams skip logging<br><em>when nothing visible happens.</em>",
                      "On a map, every log moves a truck.<br><em>That's the payoff.</em>", "Logging becomes the reward,<br><em>not the chore.</em>"],
                   q="What would make your team log?"),
        "ar": dict(k="من المؤسّس",
                   cover=("ليش حطّينا المخزون<br><em>على خريطة، مش جدول؟</em>", "كلمة من الفريق اللي ورا ستاكو."),
                   s=["الجداول ما بتبيّن الحركة.<br><em>والمخزون بيتحرّك كل يوم.</em>", "الفرق بتنسى تسجّل<br><em>لمّا ما في شي بيبيّن.</em>",
                      "عالخريطة، كل تسجيل بيحرّك شاحنة.<br><em>هيدي هي المكافأة.</em>", "التسجيل بيصير مكافأة،<br><em>مش شغلة تقيلة.</em>"],
                   q="شو بيخلّي فريقك يسجّل؟"),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-t" style="height:700px"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        for i, h in enumerate(t["s"]):
            extra = ('<div class="wc pc"><img src="/assets/screens/live-map/map-crop.jpg" alt=""></div>' if i == 2 else
                     f'<p class="sub" style="top:{620 if lang == "en" else 660}px">{t["q"]}</p>' if i == 3 else "")
            sl.append(("", f"""<img class="bg bg60" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="kick">{t['k']}</div>
<div class="n">0{i + 1}</div>
<h1 class="h1">{h}</h1>
{extra}"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-013", lang, i + 1)
            html = page(lang, f"{nm} · why a map", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-013_why-a-map-not-a-table", nm, html)


# ---------------------------------------------------------------- IDEA-014 · two alerts (light, BG-59)
def idea_014():
    css = CARD_CSS + """
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,250,.92),rgba(244,248,250,.4))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.nt{left:64px;right:64px;display:flex;gap:22px;align-items:flex-start;padding:28px 32px;border-radius:28px}
.nt .ic{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;flex:none;font-size:32px;font-weight:700}
.nt .ic.low{background:#FBE3E7;color:#B4233C}.nt .ic.mis{background:#FFF1D6;color:#8A5A00}
.nt b{display:block;font-size:34px}
.nt .d{display:block;font-size:27px;color:var(--deep);margin-top:6px}
.nt small{display:block;font-size:20px;color:var(--signal);font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
[dir=rtl] .nt small{letter-spacing:0;font-size:22px}
"""
    T = {
        "en": dict(h="Two alerts<br><em>that save your week.</em>", s="Low stock and count mismatches, before they become problems.",
                   a=[("low", "!", "Alert", "Low stock · WH-02 Sidon", "3 items below minimum"),
                      ("mis", "≠", "Alert", "Count mismatch · WH-01 Beirut", "Counted 38, system 40")]),
        "ar": dict(h="تنبيهين<br><em>بيوفّروا عليك أسبوع.</em>", s="النقص وفروقات الجرد، قبل ما يصيروا مشكلة.",
                   a=[("low", "!", "تنبيه", f"نقص · {L('WH-02')} صيدا", "3 أصناف تحت الحدّ الأدنى"),
                      ("mis", "≠", "تنبيه", f"فرق بالجرد · {L('WH-01')} بيروت", "انعدّ 38، بالنظام 40")]),
    }
    for lang, t in T.items():
        cards = "".join(f'<div class="wc nt" style="top:{560 + i * 230}px"><span class="ic {c}">{ic}</span><div><small>{lb}</small><b>{a}</b><span class="d">{b}</span></div></div>'
                        for i, (c, ic, lb, a, b) in enumerate(t["a"]))
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-59.jpg" alt="">
<div class="veil"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
{cards}
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-014", lang)
        write("IDEA-014_two-alerts", nm, page(lang, f"{nm} · two alerts", body, css, theme="light"))


if __name__ == "__main__":
    idea_020()
    idea_051()
    idea_069()
    idea_087()
    idea_013()
    idea_014()
    print("ok")
