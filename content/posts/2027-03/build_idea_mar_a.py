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


# map-element sprites drawn in the page: <span class="spr" data-id="warehouse" data-w="120"></span>
SPRITES = """<script src="/assets/map-elements/stacko-map-elements.js"></script>
<script>document.querySelectorAll('.spr').forEach(e=>{e.innerHTML=StackoMap.render(e.dataset.id,{accent:e.dataset.a||'#0895A6'});
const v=e.querySelector('svg');v.removeAttribute('height');v.setAttribute('width',e.dataset.w);});</script>"""

EX_CSS = """<style>
.ex{position:absolute;left:64px;right:64px;top:1010px;background:#EEF6F9;border-radius:22px;padding:22px 28px;font-size:28px;line-height:1.4;
  color:var(--abyss);box-shadow:0 10px 34px rgba(22,59,98,.12);border:1px solid rgba(201,216,228,.7)}
[dir=rtl] .ex{font-size:32px;line-height:1.55}
.spr{position:absolute;display:block}
.box1{left:800px;top:300px}
[dir=rtl] .box1{left:150px}.spr svg{display:block;height:auto}
.xl{position:absolute;left:150px;right:150px;top:440px;background:#fff;border-radius:16px;overflow:hidden;direction:ltr;
  box-shadow:0 22px 60px rgba(14,36,64,.22);border:1px solid #D5E0E8;font-family:'Readex Pro',sans-serif}
.xl .tb{background:#1E6E43;color:#fff;font-size:20px;font-weight:600;padding:12px 18px;display:flex;align-items:center;gap:10px}
.xl .tb i{display:inline-flex;gap:6px}.xl .tb i b{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.55)}
.xl .tb span{margin-left:auto;opacity:.85;font-weight:400}
.xl table{width:100%;border-collapse:collapse;font-size:21px;color:#1F2D3A}
.xl th{background:#EEF3EF;color:#3B5547;font-weight:600;text-align:left;padding:9px 14px;border:1px solid #DCE5DE}
.xl td{padding:8px 14px;border:1px solid #E3E9EE}
.xl td.n,.xl th.n{text-align:right;font-variant-numeric:tabular-nums}
.xl td.rn,.xl th.rn{width:40px;text-align:center;color:#7A8B98;background:#F5F8F6;font-weight:400}
.mess{position:absolute;inset:0}
.ttw{position:absolute;left:50%;top:400px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.95}
.ttw div{width:250px;height:76px;border-radius:8px;background:linear-gradient(180deg,#D7B582,#C49A62);box-shadow:inset 0 -6px 0 rgba(0,0,0,.08),0 8px 18px rgba(14,36,64,.18);position:relative}
.ttw div::after{content:"";position:absolute;left:50%;top:0;bottom:0;width:26px;transform:translateX(-50%);background:rgba(255,255,255,.28)}
.mc{position:absolute;background:#fff;border-radius:16px;padding:14px 20px;box-shadow:0 16px 40px rgba(14,36,64,.22);color:var(--abyss);font-size:23px;line-height:1.3}
.mc b{display:block;font-size:22px;color:var(--deep);font-weight:600;direction:ltr}
[dir=rtl] .mc b{text-align:right}
.mc .v{font-size:26px;font-weight:600;direction:ltr;display:block}
[dir=rtl] .mc .v{text-align:right}
.mc.bad{border:2px solid #B4233C}.mc.bad b,.mc.bad .v{color:#B4233C}
.mc.bub{background:#2F86B8;color:#fff;border-radius:22px 22px 6px 22px;font-size:25px;font-weight:500}
.mc.bub.g{background:#fff;color:var(--abyss);border-radius:22px 22px 22px 6px}
.mc.note{background:#F4F1EA;font-family:'Readex Pro',sans-serif;font-style:italic;color:#4A4A4A;border-radius:4px}
[dir=rtl] .mc{font-size:25px}
.qm{position:absolute;font-size:84px;font-weight:700;color:#B4233C;opacity:.85}
.qm.s{color:var(--signal);font-size:64px}
.mp{position:absolute;left:64px;right:64px;top:370px;height:560px;border-radius:28px;overflow:hidden;background:#E9EEF1;
  box-shadow:0 22px 60px rgba(14,36,64,.22)}
.mp > img{position:absolute;width:1073px;left:-14px;top:-230px}
.mp .chip{position:absolute;display:flex;align-items:center;gap:10px;background:#fff;color:var(--abyss);border-radius:999px;padding:8px 10px 8px 16px;
  font-size:19px;font-weight:600;box-shadow:0 6px 18px rgba(14,36,64,.2);direction:ltr;white-space:nowrap}
.mp .chip span{background:#BCE5E0;border-radius:999px;padding:2px 10px;font-size:18px}
.mp .eta{position:absolute;display:flex;align-items:center;gap:7px;background:var(--abyss);color:#fff;border-radius:999px;padding:5px 12px;font-size:17px;font-weight:600;direction:ltr}
.mp .eta i{width:8px;height:8px;border-radius:50%;background:#2F86B8}
.ex .cta{display:block;margin-top:12px;font-size:30px;font-weight:600;color:var(--signal)}
</style>"""


def idea_075():
    T = {
        "en": dict(
            cover=("Every new branch<br><em>adds a box to the tower.</em>", "Here's how it usually goes."),
            s=[("Branch 1", "One file.<br><em>Fine.</em>"), ("Branch 2", "Two files<br><em>and a lot of calls.</em>"), ("Branch 3", "Nobody's sure<br><em>anymore.</em>")],
            ex=["One branch, one file. Easy to keep up to date.", "Two files to keep in step, and a call for every question.",
                "Different files, different numbers. Nobody trusts the stock count."],
            mess=["Which file is the latest?", "Can someone recount the LED strips?", "LED Strip 5m = 1,300?? ask Rami"],
            end=("Build on a map,<br><em>not on a tower.</em>",
                 "Stacko builds the map of all your warehouses and shipments, so every branch is in sight."),
            cta="See your stock live →", sidon="WH-02 · Sidon", eta="ETA 50m"),
        "ar": dict(
            cover=("كل فرع جديد<br><em>بيزيد كرتونة عالبرج.</em>", "هيك عادةً بتصير."),
            s=[("الفرع 1", "ملف واحد.<br><em>ماشي الحال.</em>"), ("الفرع 2", "ملفّين<br><em>وكتير تلفونات.</em>"), ("الفرع 3", "ما حدا<br><em>بقى متأكّد.</em>")],
            ex=["فرع واحد، ملف واحد. سهل تضلّو محدّث.", "ملفّين لازم يضلّوا متطابقين، وتلفون عن كل سؤال.",
                "ملفات مختلفة، أرقام مختلفة. ما حدا واثق بالجرد."],
            mess=["أيّ ملف هو الأخير؟", f"حدا يعيد جرد {L('LED Strip')} مرّة تانية؟", f"{L('LED Strip 5m = 1,300??')} اسأل رامي"],
            end=("ابني على خريطة،<br><em>مش على برج.</em>",
                 "ستاكو بيبني خريطة لكل مستودعاتك وشحناتك، وكل فرع قدّام عينك."),
            cta="شوف مخزونك مباشر ←", sidon="WH-02 · Sidon", eta="ETA 50m"),
    }
    rows = [("LED Strip 5m", "1,380"), ("Desk Lamp", "45"), ("USB-C Cable 1m", "220"), ("Power Bank 10k", "96"),
            ("Wall Socket 2-way", "310"), ("Extension Cord 3m", "140"), ("Smart Bulb E27", "260"), ("Ceiling Light 40W", "75")]
    sheet = ('<div class="xl"><div class="tb"><i><b></b><b></b><b></b></i>stock.xlsx<span>Sheet1</span></div><table>'
             '<tr><th class="rn"></th><th>Item</th><th class="n">Qty</th><th>Location</th></tr>'
             + "".join(f'<tr><td class="rn">{k + 1}</td><td>{a}</td><td class="n">{b}</td><td>Beirut</td></tr>' for k, (a, b) in enumerate(rows))
             + '</table></div><span class="spr box1" data-id="cartonStack" data-w="150"></span>')
    stacks = [
        sheet,
        '<div class="tw" style="bottom:380px"><div class="bx"><b>stock_beirut.xlsx</b></div><div class="bx" style="transform:rotate(-2deg) translateX(14px)"><b>stock_sidon.xlsx</b></div></div><div class="calls" style="bottom:820px">☎ ☎ ☎ ☎</div>',
        None,
    ]
    for lang, t in T.items():
        a, b, c = t["mess"]
        tower = "".join(f'<div style="transform:rotate({r}deg) translateX({x}px)"></div>' for r, x in
                        [(9, 60), (-7, -40), (6, 34), (-4, -24), (3, 16), (-2, -8), (1, 4), (0, 0)])
        stacks[2] = f"""<div class="ttw">{tower}</div>
<div class="mc" style="left:70px;top:430px;transform:rotate(-4deg)"><b>stock_beirut.xlsx</b><span class="v">LED Strip 5m · 1,380</span></div>
<div class="mc" style="right:70px;top:500px;transform:rotate(3deg)"><b>stock_sidon_v4.xlsx</b><span class="v">LED Strip 5m · 1,210</span></div>
<div class="mc bub" style="right:80px;top:690px;max-width:380px;transform:rotate(-2deg)">{a}</div>
<div class="mc bad" style="left:90px;top:640px;transform:rotate(5deg)"><b>tripoli???.xlsx</b><span class="v">LED Strip 5m · ?</span></div>
<div class="mc bub g" style="left:60px;top:850px;max-width:400px;transform:rotate(-3deg)">{b}</div>
<div class="mc note" style="right:90px;top:840px;transform:rotate(4deg)">{c}</div>
<div class="qm" style="left:470px;top:330px">?</div><div class="qm s" style="right:300px;top:600px">?</div><div class="qm" style="left:440px;top:760px;font-size:64px">?</div>"""
        h, s = t["cover"]
        sl = [("cover", f"""<div class="panel" style="top:520px;height:700px"><img src="/assets/post-images/final/OB-06.jpg" alt="" style="width:952px;left:0;top:-80px"></div>
<h1 class="h1">{h}</h1><p class="sub">{s}</p>""")]
        for k, ((kk, h), st) in enumerate(zip(t["s"], stacks)):
            sl.append(("", f"""{BG57}{TOWER_CSS}{EX_CSS}
<div class="kick">{kk}</div>
<h1 class="h1" style="font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
{st}
<div class="ex">{t['ex'][k]}</div>{SPRITES if k == 0 else ''}"""))
        h, q = t["end"]
        sl.append(("", f"""{BG57}{EX_CSS}
<h1 class="h1" style="top:170px;font-size:{76 if lang == 'en' else 66}px;line-height:1.1">{h}</h1>
<div class="mp"><img src="/assets/screens/live-map/map-full.jpg" alt="">
  <span class="spr" data-id="warehouse" data-w="120" style="left:668px;top:392px"></span>
  <div class="chip" style="left:646px;top:350px">{t['sidon']}<span>1,210</span></div>
  <span class="spr" data-id="ui_truck" data-w="56" style="left:746px;top:256px"></span>
  <div class="eta" style="left:808px;top:254px"><i></i>{t['eta']}</div></div>
<div class="ex" style="top:960px">{q}<span class="cta">{t['cta']}</span></div>{SPRITES}"""))
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
