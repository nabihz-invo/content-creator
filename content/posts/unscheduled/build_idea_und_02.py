"""Undated batch 2 (IDEA-097 … 104), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_02.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (FOOT, L, T_, card, dark_static, light_car, mapcard, name, page, rowscard, top, write)  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format


def idea_097():
    for lang in ("en", "ar"):
        dark_static("IDEA-097", "IDEA-097_warehouse-in-your-hand", lang, OB("OB-11"),
                    T_(lang, "Your whole warehouse,<br><em>in the palm of your hand.</em>", "كل مستودعك،<br><em>بإيدك.</em>"),
                    T_(lang, "On your phone, wherever you are this season.", "على تلفونك، وين ما كنت بهالموسم."), title="in your hand")


def idea_098():
    css = ".bg{transform:scale(1.25);transform-origin:50% 62%}"
    for lang in ("en", "ar"):
        dark_static("IDEA-098", "IDEA-098_calm-holidays", lang, OB("OB-11"),
                    T_(lang, "Calm holidays,<br><em>clear stock.</em>", "أعياد هادية،<br><em>ومخزون واضح.</em>"),
                    T_(lang, "Season's greetings from the Stacko team.", "أعياد مجيدة من فريق ستاكو."),
                    css=css, h_size=T_(lang, 88, 76), sub_top=T_(lang, 400, 430), title="calm holidays")


def idea_099():
    for lang in ("en", "ar"):
        chip = T_(lang, "SHP-24023 · at sea · day 21 of 30", f"{L('SHP-24023')} · بالبحر · اليوم 21 من 30")
        dark_static("IDEA-099", "IDEA-099_see-your-container", lang, OB("OB-12"),
                    T_(lang, "See your container<br><em>before the port does.</em>", "شوف حاويتك<br><em>قبل ما يشوفها المرفأ.</em>"),
                    T_(lang, "Every import, leg by leg, from the supplier to your shelf.", "كل استيراد، مرحلة مرحلة، من المورّد لرفّك."),
                    extra=f'<div class="chipx" style="right:64px;top:610px"><i></i>{chip}</div>', title="see your container")


def idea_100():
    css = """
.bg{height:1920px;object-fit:cover;object-position:75% 50%}
.top{top:120px}
.h1{top:300px;font-size:84px;line-height:1.06}
[dir=rtl] .h1{font-size:76px;line-height:1.32}
.sub{top:540px;font-size:34px}
[dir=rtl] .sub{top:580px}
.shade-t{height:760px}
.shade-b{height:420px}
.foot{bottom:120px}
"""
    T = {"en": dict(h="Where is your container<br><em>right now?</em>", s="Vote below."),
         "ar": dict(h="وين حاويتك<br><em>هلّق؟</em>", s="صوّت تحت.")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="{OB('OB-12')}" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-100", lang)
        write("IDEA-100_story-where-is-your-container", nm, page(lang, f"{nm} · story poll", body, css, size=(1080, 1920)))


def idea_101():
    for lang in ("en", "ar"):
        dark_static("IDEA-101", "IDEA-101_one-solved-picture", lang, OB("OB-13"),
                    T_(lang, "Many warehouses.<br><em>One solved picture.</em>", "مستودعات كتير.<br><em>صورة وحدة محلولة.</em>"),
                    T_(lang, "Stacko puts every location on one live map.", "ستاكو بيحط كل المواقع على خريطة وحدة مباشرة."), title="solved picture")


def idea_102():
    css = """.six{position:absolute;left:64px;right:64px;top:1000px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.six span{display:flex;align-items:center;gap:10px;justify-content:center;background:rgba(14,36,64,.88);border:1px solid rgba(46,242,238,.45);color:#fff;
  border-radius:16px;padding:16px 10px;font-size:26px;font-weight:600;backdrop-filter:blur(6px)}
.six span i{width:12px;height:12px;border-radius:3px;border:2px solid var(--glow)}
.shade-b{height:520px}"""
    for lang in ("en", "ar"):
        six = T_(lang, ["Counts", "Transfers", "Imports", "Who moved it", "Low stock", "Arabic"],
                 ["الجرد", "التحويلات", "الاستيراد", "مين حرّكها", "النقص", "العربي"])
        dark_static("IDEA-102", "IDEA-102_sides-solved", lang, OB("OB-13"),
                    T_(lang, "How many sides of your stock<br><em>are solved?</em>", "قدّيش وجه من مخزونك<br><em>محلول؟</em>"),
                    T_(lang, "Comment your number, out of 6.", "كتبلنا رقمك، من 6."),
                    extra='<div class="six">' + "".join(f"<span><i></i>{x}</span>" for x in six) + "</div>", css=css,
                    h_size=T_(lang, 64, 60), title="sides solved")


def idea_103():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.85) 60%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.pan{position:absolute;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:20px;padding:14px 26px;
  box-shadow:0 14px 40px rgba(14,36,64,.25);font-size:26px;color:var(--deep)}
.pan b{font-size:42px;color:var(--abyss)}
.mv{position:absolute;left:50%;top:560px;transform:translateX(-50%);display:inline-flex;align-items:center;gap:12px;background:var(--abyss);color:#fff;
  border-radius:999px;padding:14px 26px;font-size:28px;font-weight:600;white-space:nowrap}
.mv i{width:12px;height:12px;border-radius:50%;background:var(--glow);box-shadow:0 0 10px var(--glow)}
"""
    T = {"en": dict(h="Keep every branch<br><em>in balance.</em>", s="See where stock is piling up, and move it where it sells.",
                    a=("Beirut", "320"), b=("Jounieh", "45"), mv="Move 100 → Jounieh"),
         "ar": dict(h="خلّي كل الفروع<br><em>بتوازن.</em>", s="شوف وين المخزون عم يتكدّس، وحرّكه لوين بينباع.",
                    a=("بيروت", "320"), b=("جونيه", "45"), mv="حرّك 100 لجونيه")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="{OB('OB-14')}" alt="">
<div class="veil"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="mv"><i></i>{t['mv']}</div>
<div class="pan" style="left:140px;top:650px"><b class="num">{t['a'][1]}</b>{t['a'][0]}</div>
<div class="pan" style="left:740px;top:650px"><b class="num">{t['b'][1]}</b>{t['b'][0]}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-103", lang)
        write("IDEA-103_branches-in-balance", nm, page(lang, f"{nm} · balance", body, css, theme="light"))


def idea_104():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "One branch says “out of stock”<br><em>while another has plenty.</em>", "فرع بيقول «خلصان»<br><em>وفرع تاني عنده كتير.</em>"),
               rowscard([(T_(lang, "Beirut", "بيروت"), L("Desk Lamp"), "0", "zero"), (T_(lang, "Jounieh", "جونيه"), L("Desk Lamp"), "45", "okc")]),
               T_(lang, "Sign 1 of 3", "علامة 1 من 3")),
              (T_(lang, "You re-order items<br><em>you already have elsewhere.</em>", "بتطلب أصناف<br><em>موجودة عندك بمحل تاني.</em>"),
               rowscard([(T_(lang, "New order", "طلبية جديدة"), L("200 × USB-C Cable"), T_(lang, "Supplier", "المورّد"), ""),
                         (T_(lang, "Already in stock", "موجود بالمخزون"), L("640 × USB-C Cable"), T_(lang, "WH-03 · Tripoli", f"{L('WH-03')} · طرابلس"), "okc")]),
               T_(lang, "Sign 2 of 3", "علامة 2 من 3")),
              (T_(lang, "Transfers happen only<br><em>after a customer complains.</em>", "التحويل ما بيصير<br><em>إلّا بعد ما يشتكي زبون.</em>"),
               rowscard([(T_(lang, "2:10 PM", "2:10 بعد الضهر"), T_(lang, "Customer asks for earbuds", "زبون بيسأل عن السمّاعات"), T_(lang, "Not here", "مش هون"), "zero"),
                         (T_(lang, "4:45 PM", "4:45 بعد الضهر"), T_(lang, "Transfer logged", "تسجّل التحويل"), T_(lang, "Too late", "متأخّر"), "")]),
               T_(lang, "Sign 3 of 3", "علامة 3 من 3")),
              (T_(lang, "Fix: one map for every branch.<br><em>Move stock early.</em>", "الحل: خريطة وحدة لكل الفروع.<br><em>وحرّك البضاعة بكّير.</em>"),
               mapcard(), "")]
        light_car("IDEA-104", "IDEA-104_out-of-balance-3-signs", lang, "OB-14.jpg", -200,
                  (T_(lang, "3 signs your stock<br><em>is out of balance.</em>", "3 علامات إنّ مخزونك<br><em>مش متوازن.</em>"),
                   T_(lang, "And what to do about each.", "وشو تعمل بكل وحدة.")), sl, "out of balance")


if __name__ == "__main__":
    for f in (idea_097, idea_098, idea_099, idea_100, idea_101, idea_102, idea_103, idea_104):
        f()
    print("ok")
