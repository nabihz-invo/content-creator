"""Undated batch 10 (IDEA-168, 172, 174–179, 181, 182, 185, 186, 187: statics, stories, highlights), EN + AR.
    python3 -I -X utf8 posts/unscheduled/build_idea_und_10.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import CARD_CSS, FOOT, L, STATIC_CSS, T_, dark_static, name, page, top, write  # noqa: E402
from build_idea_und_03 import light_static  # noqa: E402
from build_idea_und_07 import phone  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format
CAP = "/assets/screens/app-captures/{}".format
SB = '<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 60%)"></div>'


def chip(x, txt, dot="var(--signal)", style=""):
    return f'<div class="chipx" style="{x};{style}"><i style="background:{dot}"></i>{txt}</div>'


def idea_168():
    for lang in ("en", "ar"):
        dark_static("IDEA-168", "IDEA-168_founding-partners-template", lang, OB("OB-38"),
                    T_(lang, "The first keys are going to<br><em>[NUMBER] businesses.</em>", "أول المفاتيح رايحة<br><em>لـ" + L("[NUMBER]") + " مصالح.</em>"),
                    T_(lang, "Founding partners get Stacko early and shape what we build.", "الشركاء المؤسّسين بياخدوا ستاكو بكّير وبيساهموا بشو منبني."),
                    extra=chip("left:420px;top:600px", T_(lang, "Founding partners", "شركاء مؤسّسين")), h_size=T_(lang, 70, 66), title="founding partners")


def idea_172():
    for lang in ("en", "ar"):
        dark_static("IDEA-172", "IDEA-172_chinese-new-year-6-feb", lang, OB("SC-10"),
                    T_(lang, "China closes for New Year<br><em>on 6 February.</em>", "الصين بتسكّر لرأس السنة الصينية<br><em>بـ6 شباط.</em>"),
                    T_(lang, "Is your next order already in production?", "طلبيتك الجاية صارت بالتصنيع؟"),
                    extra=chip("left:64px;top:560px", T_(lang, "Chinese New Year · 6 Feb 2027", "رأس السنة الصينية · 6 شباط 2027"), "#B4233C"),
                    h_size=T_(lang, 68, 58), title="Chinese New Year")


def idea_174():
    for lang in ("en", "ar"):
        light_static("IDEA-174", "IDEA-174_back-from-the-fair", lang, OB("SC-09"),
                     T_(lang, "Back from the fair<br><em>with 40 new products?</em>", "رجعت من المعرض<br><em>مع 40 منتج جديد؟</em>"),
                     T_(lang, "Upload the invoices. Stacko creates the items.", "حمّل الفواتير. وستاكو بيعمل الأصناف."),
                     extra=chip("left:600px;top:900px", T_(lang, "40 items created ✓", "انعملوا 40 صنف ✓"), "var(--glow)") + SB,
                     css=".veil{height:600px}", title="back from the fair")


def idea_175():
    css = """.eta{position:absolute;left:330px;top:800px;background:#fff;color:var(--abyss);border-radius:22px;padding:18px 26px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
.eta b{display:block;font-size:30px}.eta .t{margin-top:4px;font-size:24px;color:#0B7A87;font-weight:600}
.eta .stem{position:absolute;left:226px;top:100%;width:2px;height:96px;background:linear-gradient(#fff,rgba(46,242,238,.8))}
.vd{position:absolute;left:556px;top:990px;width:22px;height:22px;margin:-11px;border-radius:50%;background:var(--glow);box-shadow:0 0 0 12px rgba(46,242,238,.22),0 0 44px 14px rgba(46,242,238,.5)}"""
    for lang in ("en", "ar"):
        r, t = T_(lang, ("Beirut → Batroun", "ETA 55m"), ("بيروت ← البترون", "بتوصل خلال 55 دقيقة"))
        dark_static("IDEA-175", "IDEA-175_summer-right-branch", lang, OB("SC-01"),
                    T_(lang, "Summer brings the crowds.<br><em>Is your stock in the right branch?</em>", "الصيفية جايبة العجقة.<br><em>مخزونك بالفرع الصح؟</em>"),
                    T_(lang, "Move stock before the rush, not during it.", "حرّك البضاعة قبل العجقة، مش خلالها."),
                    extra=f'<div class="vd"></div><div class="eta"><b>{r}</b><div class="t">{t}</div><div class="stem"></div></div>', css=css,
                    h_size=T_(lang, 54, 60), title="summer")


def idea_176():
    for lang in ("en", "ar"):
        dark_static("IDEA-176", "IDEA-176_golden-week", lang, OB("SC-10"),
                    T_(lang, "China pauses again:<br><em>1–7 October.</em>", "الصين بتوقّف مرّة تانية:<br><em>1 لـ7 تشرين الأول.</em>"),
                    T_(lang, "Plan your Q4 orders around Golden Week.", f"خطّط طلبيات آخر السنة حول الأسبوع الذهبي."),
                    extra=chip("right:64px;top:600px", T_(lang, "Golden Week · 1–7 Oct", "الأسبوع الذهبي · 1–7 تشرين الأول"), "#B4233C"),
                    css=".bg{transform:scale(1.2);transform-origin:30% 70%}", h_size=T_(lang, 76, 64), title="Golden Week")


def idea_177():
    for lang in ("en", "ar"):
        dark_static("IDEA-177", "IDEA-177_ramadan-sahoor-check", lang, OB("SC-03"),
                    T_(lang, "Ramadan nights.<br><em>Stock checks move to sahoor.</em>", "ليالي رمضان.<br><em>تشييك المخزون صار عالسحور.</em>"),
                    T_(lang, "Check it from your phone, whenever your day ends.", "شيّكه من تلفونك، إيمتى ما خلص نهارك."),
                    extra=chip("left:560px;top:760px", T_(lang, "All transfers arrived ✓", "كل التحويلات وصلت ✓"), "var(--glow)"),
                    h_size=T_(lang, 62, 58), title="Ramadan nights")


STORY_CSS = """
.bg{height:1920px}
.top{top:120px}
.h1{top:300px;font-size:92px;line-height:1.04}
[dir=rtl] .h1{font-size:80px;line-height:1.32}
.sub{top:560px;font-size:34px}
[dir=rtl] .sub{top:600px}
.shade-b{height:420px}
.foot{bottom:120px}
"""


def story(pid, folder, lang, h, s, title):
    body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1">{h}</h1>
<p class="sub">{s}</p>
{top(lang)}
{FOOT[lang]}"""
    nm = name(pid, lang)
    write(folder, nm, page(lang, f"{nm} · {title}", body, STORY_CSS, size=(1080, 1920)))


def idea_178():
    for lang in ("en", "ar"):
        story("IDEA-178", "IDEA-178_story-show-us-your-warehouse", lang, T_(lang, "Show us<br><em>your warehouse.</em>", "فرجينا<br><em>مستودعك.</em>"),
              T_(lang, "Add yours below. The best ones get featured,<br>with your permission.", "زيد صورتك تحت. أحلاهن منعرضهن،<br>بإذنك."), "show us")


def idea_182():
    for lang in ("en", "ar"):
        story("IDEA-182", "IDEA-182_story-ask-us-anything", lang, T_(lang, "Ask us anything<br><em>about stock.</em>", "اسألنا أيّ شي<br><em>عن المخزون.</em>"),
              T_(lang, "Weekly question box.<br>The best answers become posts.", "صندوق أسئلة كل جمعة.<br>أحلى الأجوبة بتصير بوستات."), "ask us")


def idea_179():
    for lang in ("en", "ar"):
        light_static("IDEA-179", "IDEA-179_spot-3-problems", lang, OB("SC-16"),
                     T_(lang, "Spot 3 problems<br><em>in this stockroom.</em>", "لاقي 3 مشاكل<br><em>بهالمستودع.</em>"),
                     T_(lang, "Answers in the comments tomorrow.", "الأجوبة بالكومنت بكرا."), extra=SB,
                     css=".h1{font-size:84px;line-height:1.05}[dir=rtl] .h1{font-size:76px}.veil{height:600px}", sub_top=T_(lang, 400, 430), title="spot 3")


def idea_181():
    for lang in ("en", "ar"):
        dark_static("IDEA-181", "IDEA-181_invoice-120-boxes-112", lang, OB("SC-11"),
                    T_(lang, "The invoice says 120.<br><em>The boxes say 112.</em>", "الفاتورة بتقول 120.<br><em>الكراتين بتقول 112.</em>"),
                    T_(lang, "Every importer has had this conversation.", "كل مستورد مرق بهالحديث."), h_size=T_(lang, 80, 72), sub_top=T_(lang, 400, 430), title="120 vs 112")


def idea_185():
    css = ".post.dark{background:#081A30}"
    for lang in ("en", "ar"):
        ph = phone(CAP(T_(lang, "en-ph-owner-map.png", "ar-ph-owner-map.png")), s=0.82, left=170, top_=380)
        body = f"""<div style="position:absolute;inset:0;background:#081A30"></div>
{ph}
<div class="shade-b"></div>
<h1 class="h1" style="font-size:{T_(lang, 66, 60)}px">{T_(lang, "See your stock on a map<br><em>in 2 minutes.</em>", "شوف مخزونك على خريطة<br><em>بدقيقتين.</em>")}</h1>
<p class="sub" style="top:{T_(lang, 340, 380)}px">{T_(lang, "Send us “MAP”.", "ابعتلنا «" + L("MAP") + "».")}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-185", lang)
        write("IDEA-185_map-in-2-minutes", nm, page(lang, f"{nm} · map in 2 minutes", body, STATIC_CSS + css))


def idea_186():
    css = """
.post.dark{background:radial-gradient(circle at 50% 45%,#13355A,#081A30 70%)}
.ring{position:absolute;left:50%;top:860px;width:640px;height:640px;margin:-320px;border-radius:50%;background:#0E2440;
  box-shadow:0 0 0 6px var(--glow),0 0 80px rgba(46,242,238,.45);display:grid;place-items:center}
.ring b{font-size:230px;font-weight:700;color:#fff;line-height:1}
.ring img{width:300px}
.lab{position:absolute;left:0;right:0;top:1290px;text-align:center;font-size:60px;font-weight:600;color:#fff}
[dir=rtl] .lab{font-family:'Noto Kufi Arabic',sans-serif}
"""
    mark = '<img src="/assets/brand/logo/mark-dark.svg" alt="">'
    play = '<svg viewBox="0 0 24 24" style="width:260px"><path d="M7 4l13 8-13 8z" fill="#2EF2EE"/></svg>'
    gear = '<svg viewBox="0 0 24 24" style="width:260px;fill:none;stroke:#fff;stroke-width:1.6"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
    covers = [(mark, "What", "شو هو"), (gear, "How", "كيف"), ("<b>?</b>", "FAQ", "أسئلة"), (play, "Demo", "ديمو"), ("<b style='font-family:Noto Kufi Arabic'>ع</b>", "عربي", "عربي")]
    for lang in ("en", "ar"):
        for i, (g, en, ar) in enumerate(covers):
            body = f"""<div class="ring">{g}</div><div class="lab">{T_(lang, en, ar)}</div>"""
            nm = name("IDEA-186", lang, i + 1)
            write("IDEA-186_highlight-covers", nm, page(lang, f"{nm} · highlight cover", body, css, size=(1080, 1920)))


def idea_187():
    css = CARD_CSS + """
.veil{position:absolute;left:0;right:0;top:0;height:520px;background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.85) 70%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.lap{position:absolute;left:243px;top:550px;width:597px;height:380px;overflow:hidden;background:#fff}
.lap img{width:100%;height:100%;object-fit:cover;object-position:0 0}
.n{position:absolute;width:40px;height:40px;margin:-20px;border-radius:50%;background:var(--signal);color:#fff;display:grid;place-items:center;font-size:22px;font-weight:700;
  box-shadow:0 0 0 4px #fff,0 6px 16px rgba(14,36,64,.35)}
.lg{position:absolute;left:40px;right:40px;top:1000px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;background:#fff;border-radius:24px;padding:20px 24px;
  box-shadow:0 18px 50px rgba(14,36,64,.18)}
.lg div{display:flex;align-items:center;gap:12px;font-size:23px;color:var(--abyss)}
.lg b{width:34px;height:34px;border-radius:50%;background:var(--signal);color:#fff;display:grid;place-items:center;font-size:18px;flex:none}
"""
    P = {"en": [(266, 592), (426, 623), (695, 623), (365, 788), (284, 841), (713, 852)],
         "ar": [(814, 592), (657, 623), (390, 623), (570, 788), (501, 841), (373, 852)]}
    T = {"en": dict(h="The live map,<br><em>explained.</em>", s="Six things you see at a glance.",
                    items=["Live: updates as moves are logged", "Units in transit", "Low-stock lines", "A warehouse and its units",
                           "A shipment with its ETA", "Stock per warehouse, low first"]),
         "ar": dict(h="الخريطة الحيّة،<br><em>مشروحة.</em>", s="ست شغلات بتشوفها بنظرة وحدة.",
                    items=["مباشر: بيتحدّث مع كل تسجيل", "وحدات عالطريق", "أصناف ناقصة", "مستودع ووحداته", "شحنة مع وقت وصولها", "المخزون بكل مستودع، الناقص أوّل"])}
    for lang, t in T.items():
        nums = "".join(f'<div class="n" style="left:{x}px;top:{y}px">{i + 1}</div>' for i, (x, y) in enumerate(P[lang]))
        lg = "".join(f"<div><b>{i + 1}</b>{x}</div>" for i, x in enumerate(t["items"]))
        body = f"""<img class="bg" src="{OB('UI-02')}" alt="">
<div class="lap"><img src="../img/map-{lang}.png" alt=""></div>
<div class="veil"></div>
{nums}
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="lg">{lg}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-187", lang)
        write("IDEA-187_live-map-explained", nm, page(lang, f"{nm} · live map explained", body, css, theme="light"))


if __name__ == "__main__":
    for f in (idea_168, idea_172, idea_174, idea_175, idea_176, idea_177, idea_178, idea_179, idea_181, idea_182, idea_185, idea_186, idea_187):
        f()
    print("ok")
