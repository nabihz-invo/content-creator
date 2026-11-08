"""Undated batch 8 (IDEA-153 … 158, statics), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_08.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import CARD_CSS, FOOT, L, STATIC_CSS, T_, dark_static, name, page, top, write  # noqa: E402
from build_idea_und_03 import LIGHT_CSS, light_static  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format
CAP = "/assets/screens/app-captures/{}".format
SB = '<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 60%)"></div>'


def idea_153():
    css = """.post.light{background:#D6E7EF}
.post.light{background:linear-gradient(180deg,#D6E7EF,#E2EDF2)}
.bg{left:230px;top:420px;width:640px;height:795px;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 10%);-webkit-mask-composite:source-in;
  mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(180deg,transparent,#000 10%);mask-composite:intersect}
.veil{display:none}
.h1{font-size:56px;line-height:1.12}[dir=rtl] .h1{font-size:46px}
.ab{position:absolute;left:560px;top:1150px;z-index:2;display:inline-flex;align-items:center;gap:10px;background:#fff;color:var(--abyss);border-radius:999px;padding:10px 20px;
  font-size:26px;font-weight:700;box-shadow:0 10px 26px rgba(14,36,64,.25)}
.ab::before{content:"";width:40px;border-top:2px solid var(--signal);position:absolute;right:100%;top:50%}"""
    for lang in ("en", "ar"):
        light_static("IDEA-153", "IDEA-153_one-person-not-a-system", lang, OB("OB-39"),
                     T_(lang, "If one person knows<br>where everything is,<br><em>that's not a system.</em>", "إذا شخص واحد بيعرف وين كل شي،<br><em>هيدا مش نظام.</em>"),
                     T_(lang, "What happens when they're sick, on leave, or gone?", "شو بيصير لمّا يمرض، أو ياخد إجازة، أو يفلّ؟"),
                     extra=SB.replace("height:300px","height:180px") + f'<div class="ab">{T_(lang, "Abu Ali", "أبو علي")}</div>', css=css, sub_top=T_(lang, 400, 360), title="one person")


def idea_154():
    css = """.up{position:absolute;left:64px;top:560px;width:560px;background:#fff;border-radius:24px;padding:22px 26px;box-shadow:0 18px 50px rgba(14,36,64,.3)}
.up .a{display:flex;align-items:center;gap:12px;font-size:27px;font-weight:600;color:var(--abyss)}
.up .a span{font-size:16px;background:var(--deep);color:#fff;border-radius:6px;padding:3px 8px;direction:ltr}
.up .b{margin-top:12px;font-size:28px;font-weight:700;color:#0B7A87}"""
    for lang in ("en", "ar"):
        card = (f'<div class="up"><div class="a"><span>PDF</span>{T_(lang, "Upload invoice", "حمّل الفاتورة")}</div>'
                f'<div class="b">→ {T_(lang, "120 items created ✓", "انعملوا 120 صنف ✓")}</div></div>')
        light_static("IDEA-154", "IDEA-154_3-invoices-120-lines", lang, OB("SC-12"),
                     T_(lang, "3 invoices. 120 lines.<br><em>1 keyboard.</em>", "3 فواتير. 120 سطر.<br><em>كيبورد واحد.</em>"),
                     T_(lang, "The buyer's Monday, before AI invoice reading.", "نهار الاتنين عند المشتري، قبل قراءة الفواتير بالذكاء الاصطناعي."),
                     extra=card + SB, css=css, title="3 invoices")


def idea_155():
    css = """.scr2{position:absolute;left:665px;top:700px;width:218px;height:303px;overflow:hidden;border-radius:6px;background:#fff}
.scr2 img{width:100%;display:block;margin-top:-150px}
.qb{position:absolute;background:rgba(255,255,255,.88);color:var(--deep);border-radius:22px 22px 22px 6px;padding:12px 20px;font-size:25px;font-weight:600;
  box-shadow:0 10px 26px rgba(14,36,64,.2);white-space:nowrap}"""
    for lang in ("en", "ar"):
        qs = T_(lang, ["“Is it there?”", "“When does it arrive?”", "“Who moved it?”"], ["«موجود؟»", "«إيمتى بيوصل؟»", "«مين حرّكه؟»"])
        pos = [(64, 560), (64, 680), (64, 800)]
        extra = (f'<div class="scr2"><img src="{CAP(T_(lang, "en-ph-owner-map.png", "ar-ph-owner-map.png"))}" alt=""></div>'
                 + "".join(f'<div class="qb" style="left:{x}px;top:{y}px;opacity:{1 - i * 0.15}">{q}</div>' for i, (q, (x, y)) in enumerate(zip(qs, pos))) + SB)
        light_static("IDEA-155", "IDEA-155_manager-every-call", lang, OB("SC-13"),
                     T_(lang, "The manager who gets<br><em>every phone call.</em>", "المديرة اللي بتوصلها<br><em>كل التلفونات.</em>"),
                     T_(lang, "The map can answer for her.", "الخريطة فيها تجاوب عنها."),
                     extra=extra, css=css, title="manager calls")


def idea_156():
    for lang in ("en", "ar"):
        light_static("IDEA-156", "IDEA-156_daftar-one-shop", lang, OB("SC-14"),
                     T_(lang, "The daftar worked<br><em>for one shop.</em>", "الدفتر كان كافي<br><em>لمحل واحد.</em>"),
                     T_(lang, "Three warehouses need something more.", "تلات مستودعات بدّها شي أكتر."),
                     extra=SB, css=".h1{font-size:84px;line-height:1.05}[dir=rtl] .h1{font-size:76px}.veil{height:640px}", sub_top=T_(lang, 400, 430),
                     title="daftar")


def idea_157():
    for lang in ("en", "ar"):
        light_static("IDEA-157", "IDEA-157_receiving-bottleneck", lang, OB("OB-36"),
                     T_(lang, "Receiving is where<br><em>stock data gets stuck.</em>", "الاستلام هو المكان<br><em>اللي بتعلق فيه بيانات المخزون.</em>"),
                     T_(lang, "The container arrives. The typing takes days.", "الحاوية بتوصل. والكتابة بتاخد أيام."),
                     extra=f'<div class="chipx" style="right:64px;top:700px"><i style="background:#B4233C"></i>{T_(lang, "Not logged yet: 3 days", "بعد مش مسجّلة: 3 أيام")}</div>',
                     css="[dir=rtl] .h1{font-size:56px}", title="receiving")


def idea_158():
    css = """.big{position:absolute;left:64px;right:64px;top:250px;font-size:210px;font-weight:600;letter-spacing:-.05em;line-height:1;color:var(--glow);
  text-shadow:0 0 50px rgba(46,242,238,.35);direction:ltr}
[dir=rtl] .big{text-align:right}
.lb{position:absolute;left:64px;right:64px;top:480px;font-size:40px;line-height:1.3;color:#fff;font-weight:600}
[dir=rtl] .lb{text-align:right;font-family:'Noto Kufi Arabic',sans-serif;font-size:36px;line-height:1.5}
.src{position:absolute;left:64px;right:64px;top:620px;font-size:22px;color:var(--visor)}
[dir=rtl] .src{text-align:right}"""
    for lang in ("en", "ar"):
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-56.jpg" alt="">
<div class="big">$1.7T</div>
<p class="lb">{T_(lang, "What out-of-stocks and overstocks cost retailers worldwide.", "كلفة النقص والتكديس على تجّار المفرّق بالعالم.")}</p>
<p class="src">{T_(lang, "Source: IHL Group, reported by the BRC, October 2025.", f"المصدر: {L('IHL Group')}، نقلاً عن {L('BRC')}، تشرين الأول 2025.")}</p>
{top(lang)}
{FOOT[lang]}"""
        nm = name("IDEA-158", lang)
        write("IDEA-158_1-7-trillion", nm, page(lang, f"{nm} · 1.7 trillion", body, STATIC_CSS + css))


if __name__ == "__main__":
    for f in (idea_153, idea_154, idea_155, idea_156, idea_157, idea_158):
        f()
    print("ok")
