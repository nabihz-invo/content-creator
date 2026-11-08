"""Undated batch 5 (IDEA-125 … 132, no reel), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_05.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import FOOT, L, T_, dark_static, name, page, top, write  # noqa: E402
from build_idea_und_03 import light_static  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format


def idea_125():
    css = """.dial{position:absolute;left:550px;top:685px;transform:translate(-50%,-50%);display:flex;align-items:baseline;gap:4px;color:var(--abyss);
  font-weight:700;direction:ltr}
.dial b{font-size:110px;letter-spacing:-.04em;line-height:1}.dial span{font-size:40px;color:#0B7A87}"""
    for lang in ("en", "ar"):
        dark_static("IDEA-125", "IDEA-125_10-seconds", lang, OB("OB-25"),
                    T_(lang, "10 <em>seconds.</em>", "10 <em>ثواني.</em>"),
                    T_(lang, "That's how long it takes to log a move.", "هيدا الوقت اللي بياخده تسجيل حركة."),
                    extra=f'<div class="dial"><b>10</b><span>{T_(lang, "s", "ثا")}</span></div>', css=css,
                    h_size=T_(lang, 110, 100), sub_top=T_(lang, 320, 350), title="10 seconds")


def idea_126():
    css = """
.post.dark{background:#0A1A2E}
.bg{top:300px;left:-306px;width:1692px;height:2100px;object-fit:cover;
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 12%);mask-image:linear-gradient(180deg,transparent,#000 12%)}
.top{top:120px}
.h1{top:300px;font-size:68px;line-height:1.1}
[dir=rtl] .h1{font-size:70px;line-height:1.35}
.sub{top:560px;font-size:34px}
[dir=rtl] .sub{top:600px}
.shade-b{height:420px}
.foot{bottom:120px}
"""
    T = {"en": dict(h="How long does it take<br><em>your team to log a move?</em>", s="Vote below."),
         "ar": dict(h="قدّيش بياخد وقت فريقك<br><em>ليسجّل حركة؟</em>", s="صوّت تحت.")}
    for lang, t in T.items():
        body = f"""<img class="bg" src="{OB('OB-25')}" alt="">
<div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-126", lang)
        write("IDEA-126_story-how-long-to-log", nm, page(lang, f"{nm} · story poll", body, css, size=(1080, 1920)))


SB = '<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 60%)"></div>'
PIN_CSS = """.pinx{position:absolute;display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--abyss);border-radius:999px;padding:14px 26px;
  font-size:30px;font-weight:700;box-shadow:0 14px 40px rgba(14,36,64,.3);white-space:nowrap}
.pinx i{width:14px;height:14px;border-radius:50%;background:var(--signal)}"""


def idea_127():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("Lebanon", "UAE"), ("لبنان", "الإمارات"))
        light_static("IDEA-127", "IDEA-127_one-map-across-borders", lang, OB("OB-26"),
                     T_(lang, "One map,<br><em>across borders.</em>", "خريطة وحدة،<br><em>عبر الحدود.</em>"),
                     T_(lang, "Lebanon and the Gulf, connected.", "لبنان والخليج، موصولين."),
                     extra=f'<div class="pinx" style="left:40px;top:800px"><i></i>{a}</div><div class="pinx" style="right:40px;top:800px"><i></i>{b}</div>'+SB,
                     css=PIN_CSS, title="across borders")


def idea_128():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("Floor team", "Office"), ("فريق المستودع", "المكتب"))
        light_static("IDEA-128", "IDEA-128_bridge-the-gap", lang, OB("OB-26"),
                     T_(lang, "Bridge the gap between<br><em>the warehouse and the office.</em>", "وصّل بين<br><em>المستودع والمكتب.</em>"),
                     T_(lang, "The team logs on the floor. The owner sees it on the map.", "الفريق بيسجّل بالمستودع. وصاحب الشغل بيشوفها عالخريطة."),
                     extra=f'<div class="pinx" style="left:40px;top:800px"><i></i>{a}</div><div class="pinx" style="right:40px;top:800px"><i></i>{b}</div>'+SB,
                     css=PIN_CSS + ".h1{font-size:64px}[dir=rtl] .h1{font-size:60px}", title="bridge the gap")


def idea_129():
    css = """.inv{position:absolute;left:64px;top:1000px;width:380px;background:#fff;border-radius:20px;padding:20px 24px;box-shadow:0 18px 50px rgba(14,36,64,.25);
  transform:rotate(-3deg)}
.inv .hd{display:flex;justify-content:space-between;font-size:22px;font-weight:700;color:var(--abyss);margin-bottom:10px}
.inv .hd span{font-size:15px;background:var(--deep);color:#fff;border-radius:6px;padding:3px 8px;direction:ltr}
.inv i{display:block;height:10px;border-radius:5px;background:#E1EAF0;margin:12px 0}.inv i:nth-child(odd){width:70%}
.done{position:absolute;right:64px;top:1080px;display:inline-flex;align-items:center;gap:12px;background:var(--abyss);color:#fff;border-radius:999px;
  padding:16px 28px;font-size:30px;font-weight:700;box-shadow:0 0 0 3px rgba(46,242,238,.5)}
.done i{width:30px;height:30px;border-radius:50%;background:var(--glow);color:var(--abyss);display:grid;place-items:center;font-style:normal;font-size:18px}"""
    for lang in ("en", "ar"):
        inv = f'<div class="inv"><div class="hd">{T_(lang, "Supplier invoice", "فاتورة المورّد")}<span>PDF</span></div><i></i><i></i><i></i><i></i></div>'
        done = f'<div class="done"><i>✓</i>{T_(lang, "12 items created", "انعملوا 12 صنف")}</div>'
        light_static("IDEA-129", "IDEA-129_flat-invoice-real-items", lang, OB("OB-27"),
                     T_(lang, "From a flat invoice<br><em>to real items.</em>", "من فاتورة على ورق،<br><em>لأصناف حقيقية.</em>"),
                     T_(lang, "Upload a PDF, Excel or photo. AI creates the items.", f"حمّل {L('PDF')} أو {L('Excel')} أو صورة. والذكاء الاصطناعي بيعمل الأصناف."),
                     extra=inv + done, css=css, title="invoice to items")


def idea_131():
    for lang in ("en", "ar"):
        light_static("IDEA-131", "IDEA-131_made-it-through-2026", lang, OB("OB-28"),
                     T_(lang, "You made it<br><em>through 2026.</em>", "وصلت<br><em>لآخر 2026.</em>"),
                     T_(lang, "Every box, every shipment, every late night.", "كل كرتونة، كل شحنة، وكل سهرة."),
                     css=".bg{top:140px}.post.light{background:#EAF3F8}.h1{font-size:80px;line-height:1.05}[dir=rtl] .h1{font-size:76px}.veil{height:620px}", sub_top=T_(lang, 380, 420), title="made it")


def idea_132():
    for lang in ("en", "ar"):
        light_static("IDEA-132", "IDEA-132_milestone-template", lang, OB("OB-28"),
                     T_(lang, "1,000<br><em>moves logged.</em>", "1,000<br><em>حركة انسجّلت.</em>"),
                     T_(lang, "A milestone worth celebrating.", "إنجاز بيستاهل نحتفل فيه."),
                     css=".bg{top:160px}.post.light{background:#EAF3F8}.h1{font-size:110px;line-height:1.02}[dir=rtl] .h1{font-size:92px}.veil{height:660px}", sub_top=T_(lang, 430, 470),
                     title="milestone template")


if __name__ == "__main__":
    for f in (idea_125, idea_126, idea_127, idea_128, idea_129, idea_131, idea_132):
        f()
    print("ok")
