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
PZ_PATH = "M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z"


def piece(state, size, label=""):
    """One puzzle piece: state 'on' (Signal), 'now' (Abyss, current), 'empty' (dashed)."""
    fill, stroke, dash, tc = {"on": ("#0895A6", "#0895A6", "", "#fff"), "now": ("#0E2440", "#0E2440", "", "#fff"),
                              "empty": ("rgba(255,255,255,.55)", "#79C0DE", ' stroke-dasharray="1.2 1"', "#2C5974")}[state]
    txt = (f'<text x="12" y="14.3" text-anchor="middle" font-family="Readex Pro" font-weight="600" font-size="2.6" fill="{tc}">{label}</text>'
           if label else "")
    return (f'<svg viewBox="1.5 1.5 21 21" width="{size}" height="{size}" style="overflow:visible;direction:ltr">'
            f'<path d="{PZ_PATH}" fill="{fill}" stroke="{stroke}" stroke-width=".45" stroke-linejoin="round"{dash}/>{txt}</svg>')


PZ_CSS = """<style>
.prog{position:absolute;left:64px;top:206px;display:flex;align-items:center;gap:10px}
[dir=rtl] .prog{left:auto;right:64px}
.k2{position:absolute;left:64px;top:300px;font-size:30px;font-weight:600;color:var(--signal);letter-spacing:.04em}
[dir=rtl] .k2{left:auto;right:64px}
.pz .h1{top:340px;font-size:62px;line-height:1.1}
[dir=rtl] .pz .h1{top:336px;font-size:56px}
.vis{position:absolute;left:64px;right:64px;top:500px;height:330px;display:flex;align-items:center;gap:34px}
.vis .big{flex:none;filter:drop-shadow(0 18px 30px rgba(14,36,64,.22))}
.ui{flex:1;background:#fff;border-radius:24px;padding:26px 30px;box-shadow:0 10px 34px rgba(22,59,98,.16);color:var(--abyss)}
.ui .lab{font-size:20px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--signal)}
[dir=rtl] .ui .lab{font-size:22px;letter-spacing:0}
.ui .v{display:flex;align-items:center;gap:16px;margin-top:12px;font-size:38px;font-weight:600;letter-spacing:-.02em}
[dir=rtl] .ui .v{font-size:36px}
.ui .v .av{width:58px;height:58px;border-radius:50%;background:#EEF6F9;color:var(--signal);display:grid;place-items:center;font-size:28px;flex:none}
.ui .v svg{width:44px;height:44px;flex:none;fill:none;stroke:var(--signal);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ui .s{margin-top:10px;font-size:24px;color:var(--deep)}
.ui .rt{display:flex;align-items:center;gap:12px;margin-top:16px;direction:ltr}
.ui .rt i{width:16px;height:16px;border-radius:50%;background:var(--abyss);flex:none}
.ui .rt i.d{background:var(--signal)}
.ui .rt b{flex:1;height:3px;background:repeating-linear-gradient(90deg,#0E2440 0 14px,transparent 14px 22px)}
.ex2{position:absolute;left:64px;right:64px;top:890px;background:#EEF6F9;border-radius:24px;padding:26px 32px;border:1px solid rgba(201,216,228,.8)}
.ex2 p{font-size:30px;line-height:1.4;color:var(--abyss)}
[dir=rtl] .ex2 p{font-size:30px;line-height:1.55}
.ex2 p + p{margin-top:16px}
.ex2 b{display:block;font-size:22px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
[dir=rtl] .ex2 b{font-size:24px;letter-spacing:0}
.ex2 .pb b{color:#2C5974} .ex2 .fx b{color:var(--signal)}
.grid4{position:absolute;display:grid;grid-template-columns:repeat(2,auto);direction:ltr}
.grid4 > svg:nth-child(odd){margin-right:calc(var(--o) * -1)}
.grid4 > svg:nth-child(-n+2){margin-bottom:calc(var(--o) * -1)}
.pzc .h1{top:190px;font-size:76px;line-height:1.08}
[dir=rtl] .pzc .h1{font-size:64px;line-height:1.35}
.pzc .sub{top:380px;font-size:32px;line-height:1.4;color:var(--deep);width:900px}
[dir=rtl] .pzc .sub{top:410px;font-size:34px}
.log{position:absolute;left:150px;right:150px;top:820px;background:#fff;border-radius:24px;padding:22px 30px;box-shadow:0 18px 50px rgba(14,36,64,.2)}
.log .lab{font-size:20px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--signal)}
[dir=rtl] .log .lab{letter-spacing:0;font-size:22px}
.log .lr{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-top:1px solid #E1EAF0;font-size:24px}
.log .lr span{color:var(--deep)} .log .lr b{font-weight:600}
.log .cta2{margin-top:14px;font-size:28px;font-weight:600;color:var(--signal)}
</style>"""


def idea_069():
    clock = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    box = '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>'
    T = {
        "en": dict(
            cover=("The 4 missing pieces<br><em>of stock data.</em>", "Most stock records have one or two. Here's what the full record looks like."),
            k="Piece {n} of 4", lab=["Who", "What", "When", "Where"], pl="The problem", fl="How Stacko fixes it",
            p=[("Every move<br><em>has a name.</em>", "Stock changes and nobody knows who did it.", "Stacko logs the person behind every move."),
               ("The exact item<br><em>and quantity.</em>", "Notes say “some LED strips moved”. How many? Which ones?", "Stacko records the exact item and quantity."),
               ("Date and time,<br><em>automatically.</em>", "Moves get logged days later, or never.", "Stacko stamps the time the moment you log it."),
               ("From which location,<br><em>to which.</em>", "Stock leaves one warehouse and nobody knows where it went.", "Stacko shows every move on the map, source to destination.")],
            ui=[("R", "Rami", "Logged the move"), (box, "−25 × LED Strip 5m", "Item · quantity"), (clock, "Today, 4:12 PM", "Stamped when logged"),
                ("", "WH-01 Beirut → WH-02 Sidon", "")],
            log=("Stock log", [("Who", "Rami"), ("What", "−25 × LED Strip 5m"), ("When", "Today, 4:12 PM"), ("Where", "WH-01 Beirut → WH-02 Sidon")]),
            end=("Complete<br><em>the puzzle.</em>", "Stacko answers all four, every time."), cta="See your stock live →"),
        "ar": dict(
            cover=("القطع الأربعة الناقصة<br><em>من بيانات مخزونك.</em>", "أغلب سجلات المخزون فيها قطعة أو تنتين. هيك بيكون السجل الكامل."),
            k="قطعة {n} من 4", lab=["مين", "شو", "إيمتى", "وين"], pl="المشكلة", fl="كيف ستاكو بيحلّها",
            p=[("كل حركة<br><em>إلها اسم.</em>", "المخزون بيتغيّر وما حدا بيعرف مين غيّره.", "ستاكو بيسجّل اسم الشخص ورا كل حركة."),
               ("الصنف والكمية<br><em>بالزبط.</em>", f"الملاحظة بتقول «انتقل شوية {L('LED strips')}». قدّيش؟ وأيّا؟", "ستاكو بيسجّل الصنف والكمية بالزبط."),
               ("التاريخ والوقت،<br><em>أوتوماتيك.</em>", "الحركات بتنسجّل بعد أيام، أو ما بتنسجّل أبداً.", "ستاكو بيختم الوقت لحظة ما تسجّل."),
               ("من أيّ موقع،<br><em>ولأيّ موقع.</em>", "البضاعة بتطلع من مستودع وما حدا بيعرف لوين راحت.", "ستاكو بيورجيك كل حركة عالخريطة، من المصدر للوجهة.")],
            ui=[("ر", "رامي", "سجّل الحركة"), (box, L("−25 × LED Strip 5m"), "الصنف · الكمية"), (clock, f"اليوم، {L('4:12 PM')}", "انختم وقت التسجيل"),
                ("", f"{L('WH-01')} بيروت ← {L('WH-02')} صيدا", "")],
            log=("سجل المخزون", [("مين", "رامي"), ("شو", L("−25 × LED Strip 5m")), ("إيمتى", f"اليوم، {L('4:12 PM')}"),
                                  ("وين", f"{L('WH-01')} بيروت ← {L('WH-02')} صيدا")]),
            end=("كمّل<br><em>البازل.</em>", "ستاكو بيجاوب عالأربعة، كل مرّة."), cta="شوف مخزونك مباشر ←"),
    }
    for lang, t in T.items():
        en_lab = ["WHO", "WHAT", "WHEN", "WHERE"] if lang == "en" else t["lab"]
        g = lambda size: f"--o:{round(size * 5 / 21)}px"  # noqa: E731  pieces overlap by their tabs
        h, s = t["cover"]
        order = [0, 1, 2, 3] if lang == "en" else [1, 0, 3, 2]
        empty = "".join(piece("empty", 250, en_lab[k]) for k in order)
        sl = [("pzc", f"""{BG57}{PZ_CSS}
<h1 class="h1">{h}</h1><p class="sub">{s}</p>
<div class="grid4" style="left:350px;top:540px;{g(250)}">{empty}</div>""")]
        for i, (h, pb, fx) in enumerate(t["p"]):
            prog = "".join(piece("on" if k < i else "now" if k == i else "empty", 54) for k in range(4))
            ic, v, sub = t["ui"][i]
            if i == 0:
                vv = f'<div class="v"><span class="av">{ic}</span>{v}</div><div class="s">{sub}</div>'
            elif i == 3:
                vv = f'<div class="v" style="font-size:{30 if lang == "en" else 30}px">{v}</div><div class="rt"><i></i><b></b><i class="d"></i></div>'
            else:
                vv = f'<div class="v">{ic}{v}</div><div class="s">{sub}</div>'
            sl.append(("pz", f"""{BG57}{PZ_CSS}
<div class="kick" style="display:flex;align-items:center;gap:12px">{PUZZLE}{t['k'].format(n=i + 1)}</div>
<div class="prog">{prog}</div>
<div class="k2">{t['lab'][i]}</div>
<h1 class="h1">{h}</h1>
<div class="vis"><div class="big">{piece("now", 250, en_lab[i])}</div>
  <div class="ui"><div class="lab">{t['lab'][i]}</div>{vv}</div></div>
<div class="ex2"><p class="pb"><b>{t['pl']}</b>{pb}</p><p class="fx"><b>{t['fl']}</b>{fx}</p></div>"""))
        h, s = t["end"]
        full = "".join(piece("on", 190, en_lab[k]) for k in order)
        lab, rows = t["log"]
        rr = "".join(f'<div class="lr"><span>{a}</span><b>{b}</b></div>' for a, b in rows)
        sl.append(("pzc", f"""{BG57}{PZ_CSS}
<h1 class="h1">{h}</h1><p class="sub">{s}</p>
<div class="grid4" style="left:395px;top:450px;{g(190)}">{full}</div>
<div class="log"><div class="lab">{lab}</div>{rr}<div class="cta2">{t['cta']}</div></div>"""))
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
def mini_map(w, h, eta, glow=True):
    """Flat mini map: two warehouses, a route, a truck with a Glow trail and an ETA tag (never mirrored)."""
    trail = ('<path d="M60 150 C 140 60, 230 60, 300 110" stroke="#2EF2EE" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#gl)"/>'
             '<path d="M60 150 C 140 60, 230 60, 300 110" stroke="#2EF2EE" stroke-width="3" fill="none" stroke-linecap="round"/>') if glow else ""
    return f"""<svg viewBox="0 0 400 260" width="{w}" height="{h}" style="direction:ltr;display:block">
<defs><filter id="gl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<pattern id="gd" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="rgba(121,192,222,.10)"/></pattern></defs>
<rect width="400" height="260" rx="20" fill="#16365A"/><rect width="400" height="260" rx="20" fill="url(#gd)"/>
<path d="M0 205 C 90 190, 150 230, 250 212 S 360 196, 400 205" stroke="rgba(121,192,222,.25)" stroke-width="2" fill="none"/>
<path d="M60 150 C 140 60, 230 60, 340 170" stroke="#2F86B8" stroke-width="3" stroke-dasharray="8 7" fill="none"/>
{trail}
<g transform="translate(276 94) rotate(18)"><rect x="-2" y="-11" width="30" height="18" rx="3" fill="#fff"/><path d="M28 -6h8l6 6v7h-14z" fill="#2EF2EE"/>
<circle cx="6" cy="9" r="3.2" fill="#0E2440"/><circle cx="32" cy="9" r="3.2" fill="#0E2440"/></g>
<circle cx="60" cy="150" r="17" fill="#0E2440" stroke="#79C0DE" stroke-width="3"/><path d="M51 154v-8l9-6 9 6v8z" fill="#79C0DE"/>
<circle cx="340" cy="170" r="17" fill="#0E2440" stroke="#79C0DE" stroke-width="3"/><path d="M331 174v-8l9-6 9 6v8z" fill="#79C0DE"/>
<text x="60" y="194" text-anchor="middle" font-family="Readex Pro" font-size="15" font-weight="600" fill="#C9D8E4">WH-01</text>
<text x="340" y="214" text-anchor="middle" font-family="Readex Pro" font-size="15" font-weight="600" fill="#C9D8E4">WH-02</text>
<g transform="translate(222 34)"><rect width="104" height="30" rx="15" fill="#0E2440" stroke="rgba(46,242,238,.6)"/>
<circle cx="17" cy="15" r="5" fill="#2EF2EE"/><text x="60" y="20" text-anchor="middle" font-family="Readex Pro" font-size="15" font-weight="600" fill="#fff">{eta}</text></g>
</svg>"""


IL_CSS = """
.ilp{position:absolute;left:64px;right:64px;top:580px;height:430px;border-radius:28px;padding:30px 24px 26px;
  background:radial-gradient(120% 120% at 30% 20%,rgba(27,65,107,.96),rgba(14,36,64,.97));border:1px solid rgba(121,192,222,.22);
  box-shadow:0 30px 80px rgba(0,0,0,.55);display:flex;align-items:center;gap:26px}
.ilc{position:absolute;left:64px;right:64px;top:1040px;font-size:32px;line-height:1.4;color:#C9D8E4}
[dir=rtl] .ilc{font-size:34px}
.ilc b{color:#fff;font-weight:600}
.col2{flex:1;display:flex;flex-direction:column;align-items:center;gap:16px}
.tag{font-size:22px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:6px 16px;border-radius:999px}
[dir=rtl] .tag{letter-spacing:0;font-size:24px}
.tag.st{color:#8197AA;border:1px solid rgba(201,216,228,.25)}
.tag.mv{color:#79C0DE;border:1px solid rgba(121,192,222,.5)}
.tbl{width:100%;border-collapse:collapse;direction:ltr;font-size:21px;color:rgba(201,216,228,.62);background:rgba(201,216,228,.05);border-radius:12px;overflow:hidden}
.tbl th{font-weight:600;text-align:left;padding:12px 12px;border-bottom:1px solid rgba(201,216,228,.2);color:rgba(201,216,228,.5)}
.tbl td{padding:12px 12px;border-bottom:1px solid rgba(201,216,228,.1)}
.tbl .q{text-align:right;font-variant-numeric:tabular-nums}
.vs{width:1px;align-self:stretch;background:rgba(201,216,228,.15)}
.st3{flex:1;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.st3 .tile{width:190px;height:190px;border-radius:26px;background:rgba(121,192,222,.08);border:1px solid rgba(121,192,222,.25);display:grid;place-items:center;position:relative}
.st3 .tile svg{width:110px;height:110px;fill:none;stroke:#79C0DE;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.st3 .tile.dull{background:rgba(201,216,228,.04);border:1px dashed rgba(201,216,228,.2)}
.st3 .tile.dull svg{stroke:rgba(201,216,228,.25)}
.st3 p{font-size:24px;color:#C9D8E4;line-height:1.3}
[dir=rtl] .st3 p{font-size:26px}
.st3 p.dim{color:rgba(201,216,228,.38)}
.later{position:absolute;right:-18px;top:-20px;background:rgba(201,216,228,.12);color:rgba(201,216,228,.5);border-radius:16px 16px 16px 4px;padding:6px 14px;font-size:20px}
[dir=rtl] .later{right:auto;left:-18px;border-radius:16px 16px 4px 16px}
.arr{font-size:36px;color:rgba(201,216,228,.45);flex:none}
.ilp{gap:18px}
.bub{background:#2F86B8;color:#fff;border-radius:22px 22px 6px 22px;padding:18px 20px;font-size:27px;line-height:1.3;max-width:250px}
[dir=rtl] .bub{border-radius:22px 22px 22px 6px;font-size:28px}
.sc3{background:#fff;color:#0E2440;border-radius:20px;padding:18px 20px;text-align:start;width:250px}
.sc3 b{display:block;color:#0B7A87;font-size:30px}
.sc3 span{display:block;font-size:27px;margin-top:4px;font-weight:600}
.sc3 .tm{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:12px;font-size:21px;line-height:1.25;color:#2C5974}
.sc3 .tm i{width:24px;height:24px;border-radius:50%;background:#C9D8E4;border:2px solid #fff;margin-inline-end:-12px}
.sc3 .tm em{font-style:normal;margin-inline-start:16px}
.cta3{position:absolute;left:64px;right:64px;top:1130px;font-size:32px;font-weight:600;color:#fff}
"""


def idea_013():
    css = CARD_CSS + IL_CSS + """
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
.il .h1{top:270px;font-size:64px}
[dir=rtl] .il .h1{font-size:54px}
"""
    worker = '<svg viewBox="0 0 48 48"><circle cx="16" cy="9" r="4.5"/><path d="M16 14v13l-5 13M16 27l5 13M16 18l9 5"/><rect x="26" y="18" width="16" height="13" rx="1.5"/><path d="M26 23h16"/></svg>'
    sheet = '<svg viewBox="0 0 48 48"><rect x="6" y="8" width="36" height="32" rx="3"/><path d="M6 16h36M6 24h36M6 32h36M18 8v32"/><path d="M38 34v8M34 38h8" stroke="#2F86B8" stroke-width="2.4"/></svg>'
    check = '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15"/><path d="M17 24l5 5 9-10"/></svg>'
    T = {
        "en": dict(k="From the founder",
                   cover=("Why we put stock on a map,<br><em>not a table.</em>", "A note from the team behind Stacko."),
                   s=["Tables don't show movement.<br><em>Stock moves every day.</em>", "Teams skip logging<br><em>when nothing visible happens.</em>",
                      "On a map, every log moves a truck.<br><em>That's the payoff.</em>", "Logging becomes the reward,<br><em>not the chore.</em>"],
                   st="static", mv="moving", c2="A table shows a number. <b>A map shows the move.</b>",
                   steps3=["Moves the boxes", "Adds a row", "Nothing happens"], later="Later…",
                   c3="No feedback, no habit. <b>So the log gets skipped.</b>",
                   bub="Loaded 40 LED strips for Sidon", lg="Logged ✓", eta="ETA 50m", team="the whole team sees it",
                   c5="Every log moves a truck. <b>That's the reward.</b>", cta="See your stock live →",
                   arr="→", rows=[("LED Strip 5m", "1,380", "Beirut"), ("Desk Lamp", "45", "Jounieh"), ("USB-C Cable", "220", "Sidon")]),
        "ar": dict(k="من المؤسّس",
                   cover=("ليش حطّينا المخزون<br><em>على خريطة، مش جدول؟</em>", "كلمة من الفريق اللي ورا ستاكو."),
                   s=["الجداول ما بتبيّن الحركة.<br><em>والمخزون بيتحرّك كل يوم.</em>", "الفرق بتنسى تسجّل<br><em>لمّا ما في شي بيبيّن.</em>",
                      "عالخريطة، كل تسجيل بيحرّك شاحنة.<br><em>هيدي هي المكافأة.</em>", "التسجيل بيصير مكافأة،<br><em>مش شغلة تقيلة.</em>"],
                   st="ثابت", mv="متحرّك", c2="الجدول بيعطيك رقم. <b>الخريطة بتورّيك الحركة.</b>",
                   steps3=["بينقل الكراتين", "بيزيد سطر", "وما بيصير شي"], later="بعدين…",
                   c3="من غير ردّ فعل، ما في عادة. <b>فبيتخطّوا التسجيل.</b>",
                   bub=f"حمّلت 40 {L('LED Strip')} لصيدا", lg="تسجّلت ✓", eta="ETA 50m", team="الفريق كلّه شايفها",
                   c5="كل تسجيل بيحرّك شاحنة. <b>هيدي المكافأة.</b>", cta="شوف مخزونك مباشر ←",
                   arr="←", rows=[("LED Strip 5m", "1,380", "Beirut"), ("Desk Lamp", "45", "Jounieh"), ("USB-C Cable", "220", "Sidon")]),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<img class="bg" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-t" style="height:700px"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        a = f'<span class="arr">{t["arr"]}</span>'
        tbl = ('<table class="tbl"><tr><th>Item</th><th class="q">Qty</th><th>Location</th></tr>'
               + "".join(f'<tr><td>{x}</td><td class="q">{q}</td><td>{l}</td></tr>' for x, q, l in t["rows"]) + "</table>")
        ill = {
            0: f"""<div class="ilp"><div class="col2">{tbl}<span class="tag st">{t['st']}</span></div><div class="vs"></div>
<div class="col2">{mini_map(400, 260, t['eta'])}<span class="tag mv">{t['mv']}</span></div></div>
<p class="ilc">{t['c2']}</p>""",
            1: f"""<div class="ilp"><div class="st3"><div class="tile">{worker}</div><p>{t['steps3'][0]}</p></div>{a}
<div class="st3"><div class="tile">{sheet}</div><p>{t['steps3'][1]}</p></div>{a}
<div class="st3"><div class="tile dull">{check}<span class="later">{t['later']}</span></div><p class="dim">{t['steps3'][2]}</p></div></div>
<p class="ilc">{t['c3']}</p>""",
            3: f"""<div class="ilp"><div class="st3"><div class="bub">{t['bub']}</div></div>{a}
<div class="st3" style="flex:none">{mini_map(270, 176, t['eta'])}</div>{a}
<div class="st3"><div class="sc3"><b>{t['lg']}</b><span>{L(t['eta'])}</span><div class="tm"><i></i><i></i><i></i><em>{t['team']}</em></div></div></div></div>
<p class="ilc">{t['c5']}</p>
<div class="cta3">{t['cta']}</div>""",
        }
        for i, h in enumerate(t["s"]):
            if i in ill:
                extra = ill[i]
                cls = "il"
                bg = '<img class="bg bg60" src="/assets/backgrounds/final/BG-60.jpg" alt="" style="filter:brightness(.4)">'
            else:
                extra = '<div class="wc pc"><img src="/assets/screens/live-map/map-crop.jpg" alt=""></div>' if i == 2 else ""
                cls = ""
                bg = '<img class="bg bg60" src="/assets/backgrounds/final/BG-60.jpg" alt="">'
            sl.append((cls, f"""{bg}
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
                html = html.replace('<div class="post dark">', f'<div class="post dark {cls}">')
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
