"""March 2027, batch A (IDEA-017, IDEA-064, IDEA-075, IDEA-021, IDEA-040, IDEA-088), EN + AR.

    python3 -I -X utf8 posts/2027-03/build_idea_mar_a.py          (from content/)
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
ROWS_CSS, BG57, MAPCARD = da.ROWS_CSS, da.BG57, da.MAPCARD


# ---------------------------------------------------------------- IDEA-017 · sea or air? (light, BG-59)
def idea_017():
    css = CARD_CSS + """
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,250,.92),rgba(244,248,250,.45))}
.h1{color:var(--abyss);font-size:100px;line-height:1.04} .sub{color:var(--deep)}
[dir=rtl] .h1{font-size:90px}
.md{left:64px;right:64px;padding:30px 36px;border-radius:28px}
.md .hd{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.md .hd b{font-size:36px}.md .hd span{font-size:26px;color:#0B7A87;font-weight:700}
.legs{display:flex;gap:6px;margin-top:20px}
.legs div{height:14px;border-radius:7px;background:var(--signal)}
.legs div.c{background:#C9D8E4}.legs div.t{background:var(--abyss)}
.ll{display:flex;justify-content:space-between;margin-top:12px;font-size:22px;color:var(--deep)}
"""
    T = {
        "en": dict(h="Sea <em>or air?</em>", s="Two ways your imports arrive.<br>Stacko tracks both, leg by leg.",
                   c=[("Sea", "~30 days + customs", [(70, ""), (8, "c"), (6, "t")], ["Shenzhen → Suez → Beirut", "Customs", "Truck"]),
                      ("Air", "~14 hours + customs", [(30, ""), (20, "c"), (12, "t")], ["Guangzhou → Beirut", "Customs", "Truck"])]),
        "ar": dict(h="بحر <em>ولا جو؟</em>", s="طريقتين بتوصل فيهن استيراداتك.<br>ستاكو بيتابع التنتين، مرحلة مرحلة.",
                   c=[("بحر", "حوالي 30 يوم + جمرك", [(70, ""), (8, "c"), (6, "t")], ["شنتشن ← السويس ← بيروت", "جمرك", "شاحنة"]),
                      ("جو", "حوالي 14 ساعة + جمرك", [(30, ""), (20, "c"), (12, "t")], ["غوانجو ← بيروت", "جمرك", "شاحنة"])]),
    }
    for lang, t in T.items():
        cards = ""
        for i, (a, d, legs, lab) in enumerate(t["c"]):
            lg = "".join(f'<div class="{c}" style="flex:{w}"></div>' for w, c in legs)
            ll = "".join(f"<span>{x}</span>" for x in lab)
            cards += f'<div class="wc md" style="top:{560 + i * 290}px"><div class="hd"><b>{a}</b><span>{d}</span></div><div class="legs">{lg}</div><div class="ll">{ll}</div></div>'
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-59.jpg" alt="">
<div class="veil"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{320 if lang == 'en' else 340}px">{t['s']}</p>
{cards}
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-017", lang)
        write("IDEA-017_sea-or-air", nm, page(lang, f"{nm} · sea or air", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-064 · 10,000 SKUs, one search box (dark, OB-02)
def idea_064():
    css = CARD_CSS + ROWS_CSS + """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.6) 60%,rgba(8,20,36,0))}
.h1{font-size:88px;line-height:1.04}
[dir=rtl] .h1{font-size:76px}
.sr{left:64px;right:64px;top:880px;padding:24px 30px}
.sr .f{display:flex;align-items:center;gap:14px;border:2px solid #E1EAF0;border-radius:999px;padding:12px 22px;font-size:28px}
.sr svg{width:28px;height:28px;stroke:var(--deep);fill:none;stroke-width:2.5}
"""
    search = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>'
    T = {
        "en": dict(h="10,000 SKUs.<br><em>One search box.</em>", s="Low stock first, in every location.", q="Wireless Earbuds",
                   r=[("WH-02 · Sidon", "3", "Low"), ("WH-03 · Tripoli", "12", ""), ("WH-01 · Beirut", "120", "")]),
        "ar": dict(h="10,000 صنف.<br><em>خانة بحث وحدة.</em>", s="والناقص أوّل شي، بكل المواقع.", q=L("Wireless Earbuds"),
                   r=[(f"{L('WH-02')} · صيدا", "3", "ناقص"), (f"{L('WH-03')} · طرابلس", "12", ""), (f"{L('WH-01')} · بيروت", "120", "")]),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><span class="sp">{a}</span>{f"<span class=pill style=background:#FBE3E7;color:#B4233C>{p}</span>" if p else ""}<b class="num">{n}</b></div>' for a, n, p in t["r"])
        body = f"""<img class="bg" src="/assets/post-images/final/OB-02.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{380 if lang == 'en' else 400}px">{t['s']}</p>
<div class="wc sr"><div class="f">{search}{t['q']}</div><div class="rws">{rows}</div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-064", lang)
        write("IDEA-064_10000-skus-one-search", nm, page(lang, f"{nm} · one search box", body, css))


# ---------------------------------------------------------------- IDEA-075 · every branch adds a box to the tower (5 slides, light)
TOWER_CSS = """
<style>
.tw{position:absolute;left:50%;bottom:200px;transform:translateX(-50%);display:flex;flex-direction:column-reverse;align-items:center;gap:8px}
.bx{width:600px;height:150px;border-radius:18px;background:#fff;border:3px solid var(--visor);display:flex;align-items:center;justify-content:center;
  gap:12px;font-size:36px;color:var(--deep);box-shadow:0 12px 30px rgba(14,36,64,.12);direction:ltr}
.bx b{color:var(--abyss)}
.bx.q{border-color:#B4233C;color:#B4233C;font-weight:700}
.calls{position:absolute;left:0;right:0;bottom:640px;display:flex;justify-content:center;gap:24px;font-size:72px;color:var(--signal)}
</style>"""


def idea_075():
    T = {
        "en": dict(
            cover=("Every new branch<br><em>adds a box to the tower.</em>", "Here's how it usually goes."),
            s=[("Branch 1", "One file.<br><em>Fine.</em>"), ("Branch 2", "Two files<br><em>and a lot of calls.</em>"), ("Branch 3", "Nobody's sure<br><em>anymore.</em>")],
            end=("Build on a map,<br><em>not on a tower.</em>", "Where are you on the tower?")),
        "ar": dict(
            cover=("كل فرع جديد<br><em>بيزيد كرتونة عالبرج.</em>", "هيك عادةً بتصير."),
            s=[("الفرع 1", "ملف واحد.<br><em>ماشي الحال.</em>"), ("الفرع 2", "ملفّين<br><em>وكتير تلفونات.</em>"), ("الفرع 3", "ما حدا<br><em>بقى متأكّد.</em>")],
            end=("ابني على خريطة،<br><em>مش على برج.</em>", "وين إنت عالبرج؟")),
    }
    stacks = [
        '<div class="tw"><div class="bx"><b>stock.xlsx</b></div></div>',
        '<div class="tw"><div class="bx"><b>stock_beirut.xlsx</b></div><div class="bx" style="transform:rotate(-2deg) translateX(14px)"><b>stock_sidon.xlsx</b></div></div><div class="calls">☎ ☎ ☎ ☎</div>',
        '<div class="tw"><div class="bx"><b>stock_beirut.xlsx</b></div><div class="bx" style="transform:rotate(-3deg) translateX(20px)"><b>stock_sidon_v4.xlsx</b></div>'
        '<div class="bx q" style="transform:rotate(5deg) translateX(-40px)">tripoli???.xlsx</div></div>',
    ]
    for lang, t in T.items():
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/OB-06.jpg" alt="" style="width:952px;left:0;top:-80px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        for (k, h), st in zip(t["s"], stacks):
            sl.append(("", f"""{BG57}{TOWER_CSS}
<div class="kick">{k}</div>
<h1 class="h1" style="font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
{st}"""))
        h, q = t["end"]
        sl.append(("", f"""{BG57}
<h1 class="h1" style="top:190px;font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
<p class="sub" style="top:{390 if lang == 'en' else 420}px">{q}</p>
{MAPCARD.replace('class="wc pc mapc"', 'class="wc pc mapc" style="top:500px"')}"""))
        da.carousel("IDEA-075", "IDEA-075_branch-adds-a-box", lang, sl, "tower")


# ---------------------------------------------------------------- IDEA-021 · Sound familiar? #3 (dark, BG-60)
def idea_021():
    css = CARD_CSS + ROWS_CSS + """
.bg{filter:brightness(.75)}
.shade-t{height:760px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.6) 70%,rgba(8,20,36,0))}
.kick{top:180px;color:var(--glow)}
[dir=rtl] .kick{top:174px}
.h1{top:230px;font-size:80px;line-height:1.08}
[dir=rtl] .h1{top:224px;font-size:70px}
.sub{color:var(--visor)}
.sc{left:64px;right:64px;top:600px;padding:26px 34px}
.sc .rw2 .who{width:150px;font-weight:700}
.sc .st{margin-top:12px;background:#E6F2F6;border-radius:16px;padding:16px 20px;font-size:26px;display:flex;gap:14px;align-items:center}
.sc .st img{width:34px}
"""
    T = {
        "en": dict(k="Sound familiar? #3", h="“Who moved it?”<br><em>“Not me.”</em>", s="Every move in Stacko has a name and a time.",
                   r=[("Rami", "Not me."), ("Hadi", "Not me either."), ("Lina", "I think Omar did?")],
                   st="<b>Omar</b> · Tue 3:40 PM · 20 × Desk Lamp → Sidon"),
        "ar": dict(k="مألوفة؟ #3", h="«مين حرّكها؟»<br><em>«مش أنا.»</em>", s="كل حركة بستاكو إلها اسم ووقت.",
                   r=[("رامي", "مش أنا."), ("هادي", "ولا أنا."), ("لينا", "بظنّ عمر؟")],
                   st=f"<b>عمر</b> · التلاتا 3:40 بعد الضهر · {L('20 × Desk Lamp')} ← صيدا"),
    }
    for lang, t in T.items():
        rows = "".join(f'<div class="rw2"><span class="who">{a}</span><span class="sp">{b}</span></div>' for a, b in t["r"])
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-60.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{430 if lang == 'en' else 460}px">{t['s']}</p>
<div class="wc sc"><div class="rws">{rows}</div><div class="st"><img src="/assets/brand/logo/mark-light.svg" alt="">{t['st']}</div></div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-021", lang)
        write("IDEA-021_sound-familiar-03", nm, page(lang, f"{nm} · Sound familiar #3", body, css))


# ---------------------------------------------------------------- IDEA-040 · peace of mind is a feature (dark, SC-03)
def idea_040():
    css = """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.92),rgba(8,20,36,.55) 60%,rgba(8,20,36,0))}
.h1{font-size:84px;line-height:1.05}
[dir=rtl] .h1{font-size:76px}
.z{position:absolute;left:600px;top:760px;display:inline-flex;align-items:center;gap:12px;background:rgba(14,36,64,.85);border:2px solid var(--glow);
  color:#fff;border-radius:999px;padding:14px 26px;font-size:30px;font-weight:700;box-shadow:0 0 30px rgba(46,242,238,.4)}
.z i{width:14px;height:14px;border-radius:50%;background:var(--glow);box-shadow:0 0 12px var(--glow)}
[dir=rtl] .z{direction:rtl}
"""
    T = {
        "en": dict(h="Peace of mind<br><em>is a feature.</em>", s="Know your stock without calling anyone.", c="0 surprises"),
        "ar": dict(h="راحة البال<br><em>كمان ميزة.</em>", s="اعرف مخزونك بلا ما تتّصل بحدا.", c="0 مفاجآت"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-03.jfif" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{380 if lang == 'en' else 420}px">{t['s']}</p>
<div class="z"><i></i>{t['c']}</div>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-040", lang)
        write("IDEA-040_peace-of-mind", nm, page(lang, f"{nm} · peace of mind", body, css))


# ---------------------------------------------------------------- IDEA-088 · Eid Mubarak (dark, SE-04)
def idea_088():
    css = """
.shade-t{height:560px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.5) 60%,rgba(8,20,36,0))}
.h1{top:200px;font-size:110px;line-height:1.05}
[dir=rtl] .h1{font-size:100px;line-height:1.3}
"""
    T = {"en": dict(h="Eid <em>Mubarak.</em>", s="From the Stacko team."), "ar": dict(h="عيد <em>مبارك.</em>", s="من فريق ستاكو.")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SE-04.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{340 if lang == 'en' else 360}px">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-088", lang)
        write("IDEA-088_eid-mubarak", nm, page(lang, f"{nm} · Eid Mubarak", body, css))


if __name__ == "__main__":
    idea_017()
    idea_064()
    idea_075()
    idea_021()
    idea_040()
    idea_088()
    print("ok")
