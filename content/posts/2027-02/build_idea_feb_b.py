"""February 2027, batch B (IDEA-074, 005, 043, 008, 060, 054, 024, 033), EN + AR.

    python3 -I -X utf8 posts/2027-02/build_idea_feb_b.py          (from content/)
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

# flat truck icon from assets/map-elements (StackoMap.render("ui_truck", {accent: Signal}, 2))
TRUCK = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="44" data-anchor-x="48" data-anchor-y="22" viewBox="0 0 48 22"><rect x="1" y="2" width="31" height="15" rx="2.5" fill="#FFFFFF" stroke="#0E2440" stroke-width="1.4"/><rect x="4" y="12" width="25" height="2.2" rx="1" fill="#0895A6"/><path d="M33 5 H40 L46 11 V17 H33 Z" fill="#0E2440"/><path d="M36 7 H39.5 L43.5 11 H36 Z" fill="#BCE5E0"/><circle cx="9" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="24" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="40" cy="18.5" r="2.6" fill="#0E2440"/></svg>'

GLOSS_CSS = CARD_CSS + ROWS_CSS + """
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
.how{left:64px;right:64px;top:680px;padding:36px 40px}
.how .say{font-size:31px;font-weight:600;color:var(--abyss);margin:6px 0 10px;line-height:1.35}
.see{position:absolute;left:64px;top:1130px;font-size:24px;color:var(--deep)}
[dir=rtl] .see{left:auto;right:64px}
"""


def glossary(pid, folder, T, title):
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><b>{a}</b><span class="sp">{b}</span><span class="{c}">{d}</span></div>' for a, b, d, c in t["r"])
        body = f"""<div class="grid-bg"></div>
<div class="kick">{t['k']}</div>
<div class="word2">{t['w']}</div>
<div class="ph">{t['ph']}</div>
<p class="def">{t['d']}</p>
<div class="wc how"><div class="lab">{t['lab']}</div><div class="say">{t['say']}</div><div class="rws">{rows}</div></div>
<p class="see">{t['see']}</p>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name(pid, lang)
        write(folder, nm, page(lang, f"{nm} · {title}", body, GLOSS_CSS, theme="light"))


# ---------------------------------------------------------------- IDEA-074 · meme: after the 3rd warehouse (OB-06)
def idea_074():
    css = """
.post.dark{background:#041328}
.bg{left:110px;top:380px;width:860px;height:1068px;object-fit:cover;
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 14%);mask-image:linear-gradient(180deg,transparent,#000 14%)}
.h1{top:180px;font-size:76px;line-height:1.08}
[dir=rtl] .h1{font-size:70px;line-height:1.35}
"""
    T = {"en": dict(h="Your stock system<br><em>after the 3rd warehouse:</em>"),
         "ar": dict(h="نظام المخازن<br><em>بعد المستودع التالت:</em>")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/OB-06.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-074", lang)
        write("IDEA-074_meme-third-warehouse", nm, page(lang, f"{nm} · meme", body, css))


# ---------------------------------------------------------------- IDEA-005 · test your stock IQ (7 slides, light)
def idea_005():
    T = {
        "en": dict(
            cover=("Test your<br><em>stock IQ.</em>", "5 questions. Answers on the last slide."), k="Q{n} of 5",
            q=[("What is<br><em>dead stock?</em>", ["Damaged items", "Items that haven't sold for months"]),
               ("A transfer on the road<br><em>should count…</em>", ["At the source", "At the destination", "As in transit"]),
               ("What is<br><em>a cycle count?</em>", ["Counting everything once a year", "Counting a small part of stock on a schedule"]),
               ("Sea freight Shenzhen → Beirut<br><em>takes about…</em>", ["2 weeks", "30 days"]),
               ("What does ETA<br><em>stand for?</em>", ["Estimated Time of Arrival", "Exact Transfer Amount"])],
            L="ABC", end=("Answers", "How many did you get?"),
            key=["1 · B", "2 · C", "3 · B", "4 · B", "5 · A"]),
        "ar": dict(
            cover=("اختبر معلوماتك<br><em>بالمخازن.</em>", "5 أسئلة. الأجوبة بآخر سلايد."), k="سؤال {n} من 5",
            q=[("شو يعني<br><em>بضاعة راكدة؟</em>", ["أصناف مكسورة", "أصناف ما انباعت من أشهر"]),
               ("التحويل اللي عالطريق<br><em>لازم ينحسب…</em>", ["بالمصدر", "بالوجهة", "إنّه عالطريق"]),
               ("شو يعني<br><em>جرد دوري؟</em>", ["تجرد كل شي مرّة بالسنة", "تجرد جزء صغير من المخازن حسب جدول"]),
               ("الشحن البحري شنتشن ← بيروت<br><em>بياخد حوالي…</em>", ["أسبوعين", "30 يوم"]),
               (f"شو يعني<br><em>{L('ETA')}؟</em>", ["وقت الوصول المتوقّع", "كمية التحويل بالزبط"])],
            L="أبج", end=("الأجوبة", "قدّيش جبت؟"),
            key=["1 · ب", "2 · ج", "3 · ب", "4 · ب", "5 · أ"]),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""{BG57}
<h1 class="h1" style="font-size:{110 if lang == 'en' else 92}px;line-height:1.05">{h}</h1>
<p class="sub" style="top:{440 if lang == 'en' else 470}px">{s}</p>
<div class="list" style="top:600px">{"".join(f'<div class="li"><i>{i + 1}</i>{q[0].replace("<br>", " ").replace("<em>", "").replace("</em>", "")}</div>' for i, q in enumerate(t["q"]))}</div>""")]
        for i, (h, opts) in enumerate(t["q"]):
            li = "".join(f'<div class="li" style="font-size:32px;padding:26px 28px"><i style="width:48px;height:48px;font-size:26px">{t["L"][k]}</i>{o}</div>' for k, o in enumerate(opts))
            sl.append(("", f"""{BG57}
<div class="kick">{t['k'].format(n=i + 1)}</div>
<h1 class="h1" style="font-size:{68 if lang == 'en' else 60}px">{h}</h1>
<div class="list" style="top:{520 if lang == 'en' else 540}px">{li}</div>"""))
        a, b = t["end"]
        li = "".join(f'<div class="li" style="font-size:32px"><i>✓</i>{x}</div>' for x in t["key"])
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{88 if lang == 'en' else 76}px">{a}</h1>
<p class="sub" style="top:{320 if lang == 'en' else 340}px">{b}</p>
<div class="list" style="top:430px">{li}</div>"""))
        da.carousel("IDEA-005", "IDEA-005_test-your-stock-iq", lang, sl, "stock IQ quiz")


# ---------------------------------------------------------------- IDEA-043 · the driver needs a message (light, SC-04 in a panel)
def idea_043():
    css = da.LIGHT_CSS + CARD_CSS + """
.post.light{background:#F4F8FA}
.panel{top:470px;height:750px}
.panel img{width:952px;left:0;top:-250px}
.say{position:absolute;left:100px;top:960px;width:560px;background:#F4F8FA;border-radius:26px;padding:22px 24px;
  box-shadow:0 22px 60px rgba(0,0,0,.4),0 0 0 2px rgba(46,242,238,.6)}
[dir=rtl] .say{left:auto;right:100px}
.say .bu{margin-inline-start:auto;width:fit-content;background:#2F86B8;color:#fff;font-size:30px;padding:14px 22px;border-radius:22px 22px 6px 22px}
[dir=rtl] .say .bu{border-radius:22px 22px 22px 6px}
.say .ok{margin-top:12px;font-size:26px;color:#0B7A87;font-weight:700}
"""
    T = {
        "en": dict(h="Your driver doesn't need training.<br><em>He needs a message.</em>", s="If he can text, he can log.",
                   u="Loaded 40 LED strips for Sidon", ok="Logged ✓ · on the map"),
        "ar": dict(h="السائق ما بدّو تدريب.<br><em>بدّو رسالة.</em>", s="إذا بيعرف يبعت رسالة، بيعرف يسجّل.",
                   u=f"حمّلت 40 {L('LED Strip')} لصيدا", ok="تسجّلت ✓ · عالخريطة"),
    }
    for lang, t in T.items():
        body = f"""<div class="panel"><img src="/assets/post-images/final/SC-04.jpg" alt=""></div>
<h1 class="h1" style="font-size:{60 if lang == 'en' else 58}px">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="say"><div class="bu">{t['u']}</div><div class="ok">{t['ok']}</div></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-043", lang)
        write("IDEA-043_driver-needs-a-message", nm, page(lang, f"{nm} · driver message", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-008 · Glossary #04: cycle count
def idea_008():
    T = {
        "en": dict(k="The stock manager's glossary · 04", w="Cycle count", ph="<i>noun</i> · /ˈsaɪ.kəl kaʊnt/",
                   d="Counting a small part of your stock on a schedule, instead of everything once a year.",
                   lab="In Stacko", say="Managers run counts; mismatches raise an alert before anyone approves.",
                   r=[("Mon", "WH-01 · Aisle A", "Counted ✓", "okc"), ("Wed", "WH-02 · Aisle C", "Mismatch: 38 vs 40", "zero"),
                      ("Fri", "WH-03 · Aisle B", "Next", "")],
                   see="See also: stocktake, mismatch, dead stock (#03)."),
        "ar": dict(k="قاموس مدير المخازن · 04", w="الجرد الدوري", ph=f"<i>اسم</i> · {L('Cycle count')}",
                   d="إنّك تجرد جزء صغير من مخزنك حسب جدول، بدل ما تجرد كل شي مرّة بالسنة.",
                   lab="بستاكو", say="المدراء بيعملوا الجرد، والفروقات بتطلّع تنبيه قبل ما حدا يوافق.",
                   r=[("الاتنين", f"{L('WH-01')} · الممر {L('A')}", "انجرد ✓", "okc"), ("الأربعا", f"{L('WH-02')} · الممر {L('C')}", "فرق: 38 مقابل 40", "zero"),
                      ("الجمعة", f"{L('WH-03')} · الممر {L('B')}", "بعدين", "")],
                   see=f"شوف كمان: الجرد السنوي، الفرق، البضاعة الراكدة ({L('#03')})."),
    }
    glossary("IDEA-008", "IDEA-008_glossary-04-cycle-count", T, "Glossary cycle count")


# ---------------------------------------------------------------- IDEA-060 · every hour counting (dark, OB-01)
def idea_060():
    css = """
.post.dark{background:#071425}
.bg{top:200px}
.shade-t{height:600px;background:linear-gradient(180deg,rgba(8,20,36,.98),rgba(8,20,36,.7) 60%,rgba(8,20,36,0))}
.h1{font-size:68px;line-height:1.1}
[dir=rtl] .h1{font-size:60px}
.sub b{color:var(--glow);font-weight:600}
.log{position:absolute;left:108px;right:108px;top:1000px;background:rgba(27,65,107,.86);border-radius:20px;padding:20px 26px 18px;
  border:1.5px solid rgba(46,242,238,.55);box-shadow:0 18px 50px rgba(0,0,0,.45);backdrop-filter:blur(6px);color:#fff}
.log .hd{display:flex;align-items:center;justify-content:space-between;gap:16px}
.log .hd b{font-size:24px;font-weight:600;color:#EEF6F9}
.log .ok{background:#BCE5E0;color:var(--abyss);border-radius:999px;padding:6px 16px;font-size:21px;font-weight:600;white-space:nowrap}
.log .rw{display:flex;align-items:center;gap:14px;padding:9px 0;border-top:1px solid rgba(201,216,228,.18);font-size:22px;color:var(--visor);
  font-variant-numeric:tabular-nums;direction:ltr}
[dir=rtl] .log .rw{direction:rtl}
.log .hd{padding-bottom:10px}
.log .rw .q{min-width:64px;font-weight:600;color:#fff}
.log .rw .it{flex:1;color:#fff}
.log .nt{margin-top:8px;font-size:21px;color:var(--visor)}
[dir=rtl] .log .hd b{font-size:25px} [dir=rtl] .log .rw,[dir=rtl] .log .nt{font-size:23px}
"""
    T = {
        "en": dict(h="Every hour spent counting<br><em>is an hour not selling.</em>",
                   s="With <b>Stacko</b>, every move is logged,<br>so the count becomes a quick check.",
                   lh="Stacko · live stock log", ok="Numbers match ✓",
                   rows=[("−25", "LED Strip 5m", "Rami · 4:12 PM"), ("+40", "Desk Lamp", "WH-02 Sidon · 3:40 PM")],
                   nt="Every move is logged. Counting is only a check."),
        "ar": dict(h="كل ساعة جرد<br><em>هي ساعة ما عم تبيع فيها.</em>",
                   s="مع <b>ستاكو</b>، كل حركة بتتسجّل،<br>فالجرد بيصير مجرّد تأكّد سريع.",
                   lh="ستاكو · سجل المخازن المباشر", ok="الأرقام مزبوطة ✓",
                   rows=[(L("−25"), L("LED Strip 5m"), f"رامي · {L('4:12 PM')}"), (L("+40"), "مصباح مكتب", f"{L('WH-02')} صيدا · {L('3:40 PM')}")],
                   nt="كل حركة مسجّلة. والجرد بس تأكّد."),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw"><span class="q">{q}</span><span class="it">{it}</span><span>{w}</span></div>' for q, it, w in t["rows"])
        body = f"""<img class="bg" src="/assets/post-images/final/OB-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{370 if lang == 'en' else 400}px">{t['s']}</p>
<div class="log"><div class="hd"><b>{t['lh']}</b><span class="ok">{t['ok']}</span></div>{rows}<div class="nt">{t['nt']}</div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-060", lang)
        write("IDEA-060_hour-counting-not-selling", nm, page(lang, f"{nm} · hour counting", body, css))


# ---------------------------------------------------------------- IDEA-054 · end the "which file is right?" meeting (light, SC-07)
def idea_054():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:620px;
  background:linear-gradient(180deg,rgba(244,248,250,.98),rgba(244,248,250,.92) 70%,rgba(244,248,250,0))}
.h1{color:var(--abyss);font-size:60px} .sub{color:var(--deep)}
.scr{width:420px;height:534px;transform:matrix3d(0.594321,0,0,0,-0.009438,0.577437,0,-0.000017,0,0,1,0,416.9621,675.0144,0,1)}
.scr img{width:100%;height:100%;object-fit:cover;object-position:50% 55%}
.files{position:absolute;left:64px;right:64px;top:470px;display:flex;gap:12px;direction:ltr}
[dir=rtl] .files{justify-content:flex-end}
.files span{background:#fff;border-radius:999px;padding:10px 18px;font-size:22px;color:var(--deep);text-decoration:line-through;opacity:.75;
  box-shadow:0 6px 18px rgba(14,36,64,.12)}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 62%)}
.smap{position:absolute;left:694px;right:24px;top:640px;background:#fff;border-radius:22px;padding:18px 20px 22px;
  box-shadow:0 10px 34px rgba(22,59,98,.16);color:var(--abyss)}
.smap .th{position:relative;height:150px;border-radius:14px;overflow:hidden;background:#EEF6F9}
.smap .th img{position:absolute;width:480px;left:-18px;top:-100px}
.smap .trk{position:absolute;left:16px;top:44px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;direction:ltr}
.smap .trk svg{width:46px;height:auto;filter:drop-shadow(0 3px 6px rgba(14,36,64,.25))}
.smap .eta{background:var(--abyss);color:#fff;border-radius:999px;padding:3px 10px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
.smap .eta i{width:7px;height:7px;border-radius:50%;background:#2F86B8}
.smap h3{margin:16px 0 6px;font-size:28px;font-weight:600;color:var(--abyss);letter-spacing:-.01em}
[dir=rtl] .smap h3{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-weight:700;font-size:28px}
.smap .rw{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid #E1EAF0;font-size:22px;line-height:1.32;color:var(--deep)}
[dir=rtl] .smap .rw{font-size:24px;line-height:1.45}
.smap .rw svg{flex:none;width:28px;height:28px;margin-top:1px;stroke:var(--signal);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
"""
    ICO = [
        '<svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6v10H3z"/><path d="M8 20v-6h8v6"/></svg>',
        '<svg viewBox="0 0 24 24"><path d="M2 7h11v9H2z"/><path d="M13 10h4l4 3v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
        '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.2 3.2 0 010 6.3M18 14.3c1.8.8 3 2.6 3 4.7"/></svg>',
    ]
    T = {
        "en": dict(h="End the<br><em>“which file is right?” meeting.</em>", s="One source of truth, updated by every move.",
                   mt="The Stacko map", eta="50m",
                   rows=["Every warehouse, with its units and low-stock count", "Every shipment on its route, with an ETA",
                         "Every move logged, and seen by the whole team"]),
        "ar": dict(h="خلّصنا من اجتماع<br><em>«أيّ ملف هو الصح؟»</em>", s="مصدر واحد للحقيقة، بيتحدّث مع كل حركة.",
                   mt="خريطة ستاكو", eta="50m",
                   rows=["كل مخزن، مع وحداته وعدد الأصناف القليلة", "كل شحنة على مسارها، مع وقت الوصول",
                         "كل حركة مسجّلة، وكل الفريق بيشوفها"]),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-07.jpg" alt="">
<div class="scr"><img src="/assets/screens/live-map/map-zoom.jpg" alt=""></div>
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="files" style="top:{440 if lang == 'en' else 470}px"><span>stock_v5.xlsx</span><span>stock_FINAL.xlsx</span><span>stock_NEW.xlsx</span></div>
<div class="smap"><div class="th"><img src="/assets/screens/live-map/map-crop.jpg" alt="">
  <div class="trk">{TRUCK}<span class="eta"><i></i>{t['eta']}</span></div></div>
  <h3>{t['mt']}</h3>{''.join(f'<div class="rw">{ICO[i]}<span>{r}</span></div>' for i, r in enumerate(t['rows']))}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-054", lang)
        write("IDEA-054_which-file-is-right", nm, page(lang, f"{nm} · which file", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-024 · every box has a story (dark, BG-60, brand anchor)
def idea_024():
    css = """
.bg{filter:brightness(.7)}
.shade-t{height:800px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 70%,rgba(8,20,36,0))}
.h1{top:200px;font-size:64px;line-height:1.1}
[dir=rtl] .h1{font-size:64px;line-height:1.4}
.sub{font-size:40px;color:var(--glow);font-weight:600}
.route{position:absolute;left:64px;right:64px;top:780px;display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:26px;color:#fff}
.route span{background:rgba(14,36,64,.85);border:1px solid rgba(201,216,228,.35);border-radius:999px;padding:12px 20px}
.route i{font-style:normal;color:var(--glow)}
"""
    T = {
        "en": dict(h="Every box has a story.<br><em>Most are never written down.</em>", s="Stacko writes them down.",
                   r=["Shenzhen", "Port of Beirut", "WH-01 Beirut", "Sold"], a="→"),
        "ar": dict(h="كل كرتونة إلها قصة.<br><em>وأغلب القصص ما بتنكتب.</em>", s="ستاكو بيكتبها.",
                   r=["شنتشن", "مرفأ بيروت", f"{L('WH-01')} بيروت", "انباعت"], a="←"),
    }
    for lang, t in T.items():
        route = f' <i>{t["a"]}</i> '.join(f"<span>{x}</span>" for x in t["r"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{380 if lang == 'en' else 430}px">{t['s']}</p>
<div class="route" style="top:{560 if lang == 'en' else 560}px">{route}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-024", lang)
        write("IDEA-024_every-box-has-a-story", nm, page(lang, f"{nm} · every box", body, css))


# ---------------------------------------------------------------- IDEA-033 · how does the truck know? (5 slides, dark)
def idea_033():
    css = CARD_CSS + """
.kick{top:166px;color:var(--glow)}
.h1{top:212px;font-size:60px;line-height:1.14}
[dir=rtl] .h1{top:206px;font-size:54px}
.cover .h1{top:190px;font-size:62px;line-height:1.1}
[dir=rtl] .cover .h1{font-size:66px;line-height:1.35}
.cover .sub{top:400px}
[dir=rtl] .cover .sub{top:440px}
.cover .shade-t{height:600px}
.bg58{filter:brightness(.5)}
.pb{left:64px;right:64px;top:560px;padding:34px 40px}
.pb .rt{display:flex;justify-content:space-between;font-size:26px;color:var(--deep);font-weight:600}
.pb .tr{position:relative;height:16px;border-radius:8px;background:#E1EAF0;margin:40px 0 18px}
.pb .tr i{position:absolute;left:0;top:0;bottom:0;border-radius:8px;background:linear-gradient(90deg,var(--signal),var(--glow))}
[dir=rtl] .pb .tr i{left:auto;right:0}
.pb .tr b{position:absolute;top:50%;width:52px;height:52px;margin:-26px;border-radius:50%;background:var(--abyss);display:grid;place-items:center;
  box-shadow:0 0 0 6px rgba(46,242,238,.3)}
.pb .tr b svg{width:28px;height:28px;stroke:#fff;fill:none;stroke-width:1.8}
.pb .now{font-size:30px;font-weight:700;color:#0B7A87;text-align:center}
.ph2{left:64px;right:64px;top:560px;padding:30px 36px;display:flex;gap:18px;align-items:center;font-size:28px}
.ph2 .pill{font-size:22px}
"""
    truck = '<svg viewBox="0 0 24 24"><path d="M1 6h13v10H1zM14 9h4l4 4v3h-8z"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>'
    T = {
        "en": dict(
            cover=("How does the truck on the map<br><em>know where it is?</em>", "An honest look under the hood."),
            s=["It doesn't<br><em>need GPS.</em>", "It knows when the transfer left<br><em>and when it should arrive.</em>",
               "So it moves along the route as time passes,<br><em>with a live countdown.</em>", "GPS tracking comes later.<br><em>The logging habit starts now.</em>"],
            left="Left 9:00", eta="ETA 10:20", now="Now 9:48 · 32m left", ph=("Phase 2", "GPS on trucks for real positions")),
        "ar": dict(
            cover=("كيف الشاحنة عالخريطة<br><em>بتعرف وين صارت؟</em>", "نظرة صريحة لجوّا."),
            s=[f"ما بدها<br><em>{L('GPS')}.</em>", "بتعرف إيمتى طلع التحويل<br><em>وإيمتى لازم يوصل.</em>",
               "فبتمشي عالطريق مع الوقت،<br><em>مع عدّاد مباشر.</em>", f"تتبّع الـ{L('GPS')} جايي بعدين.<br><em>عادة التسجيل بتبلّش هلّق.</em>"],
            left="طلعت 9:00", eta="توصل 10:20", now="هلّق 9:48 · باقي 32 دقيقة", ph=("المرحلة 2", f"{L('GPS')} عالشاحنات لمواقع حقيقية")),
    }
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<img class="bg" src="/assets/post-images/final/SC-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        side = "right" if lang == "ar" else "left"
        for i, h in enumerate(t["s"]):
            pct = {1: 0, 2: 60}.get(i)
            if pct is None and i == 0:
                card = ""
            elif pct is not None:
                card = (f'<div class="wc pb"><div class="rt"><span>{t["left"]}</span><span>{t["eta"]}</span></div>'
                        f'<div class="tr"><i style="width:{pct}%"></i><b style="{side}:{max(pct, 2)}%">{truck}</b></div>'
                        f'<div class="now">{t["now"] if pct else "&nbsp;"}</div></div>')
            else:
                a, b = t["ph"]
                card = f'<div class="wc ph2"><span class="pill ok">{a}</span><span>{b}</span></div>'
            sl.append(("", f"""<img class="bg bg58" src="/assets/backgrounds/final/BG-58.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1" style="{'font-size:96px;top:300px' if i == 0 else ''}">{h}</h1>
{card}"""))
        n = len(sl)
        for i, (cls, art) in enumerate(sl):
            body = f"""{art}
{top(lang)}
{FOOT[lang] if i == n - 1 else bar(lang, n, i)}"""
            nm = name("IDEA-033", lang, i + 1)
            html = page(lang, f"{nm} · truck on the map", body, css)
            if cls:
                html = html.replace('<div class="post dark">', '<div class="post dark cover">')
            write("IDEA-033_how-the-truck-knows", nm, html)


if __name__ == "__main__":
    idea_074()
    idea_005()
    idea_043()
    idea_008()
    idea_060()
    idea_054()
    idea_024()
    idea_033()
    print("ok")
