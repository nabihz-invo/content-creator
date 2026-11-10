"""Undated batch 3 (IDEA-105, 106, 107, 109, 110, 111, 112, 113, 114), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_03.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import (CARD_CSS, FOOT, L, STATIC_CSS, T_, codescard, dark_static, light_car, name, page, rowscard, togglecard,  # noqa: E402
                     top, write)

OB = "/assets/post-images/final/{}.jpg".format

LIGHT_CSS = STATIC_CSS + """
.veil{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.85) 60%,rgba(244,248,250,0))}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.num1{position:absolute;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);border-radius:999px;padding:12px 22px 12px 12px;
  font-size:26px;font-weight:600;white-space:nowrap;box-shadow:0 12px 34px rgba(14,36,64,.25)}
[dir=rtl] .num1{padding:12px 12px 12px 22px}
.num1 b{width:42px;height:42px;border-radius:50%;background:var(--signal);color:#fff;display:grid;place-items:center;font-size:22px}
"""


def light_static(pid, folder, lang, img, h, s, extra="", css="", sub_top=None, title=""):
    st = sub_top or (356 if lang == "en" else 392)
    body = f"""<img class="bg" src="{img}" alt="">
<div class="veil"></div>
<h1 class="h1">{h}</h1>
<p class="sub" style="top:{st}px">{s}</p>
{extra}
{top(lang, light=True)}
{FOOT[lang]}"""
    nm = name(pid, lang)
    write(folder, nm, page(lang, f"{nm} · {title}", body, LIGHT_CSS + css, theme="light"))


def idea_105():
    for lang in ("en", "ar"):
        chip = T_(lang, "Wireless Earbuds · 12 · WH-03 Tripoli", f"{L('Wireless Earbuds')} · 12 · {L('WH-03')} طرابلس")
        light_static("IDEA-105", "IDEA-105_stop-running-around", lang, OB("OB-15"),
                     T_(lang, "Stop running around<br><em>the warehouse.</em>", "وقّف لفّ<br><em>بالمستودع.</em>"),
                     T_(lang, "Ask once. Go straight to it.", "اسأل مرّة. وروح عليها دغري."),
                     extra=f'<div class="chipx" style="left:50%;transform:translateX(-50%);top:660px"><i></i>{chip}</div>', title="stop running around")


def idea_106():
    for lang in ("en", "ar"):
        steps = T_(lang, ["Add your warehouses", "Upload an invoice", "Send the first message"], ["زيد مستودعاتك", "حمّل فاتورة", "ابعت أوّل رسالة"])
        pos = [(60, 1110), (230, 920), (420, 740)]
        extra = "".join(f'<div class="num1" style="left:{x}px;top:{y}px"><b>{i + 1}</b>{t}</div>' for i, (t, (x, y)) in enumerate(zip(steps, pos)))
        light_static("IDEA-106", "IDEA-106_getting-started-maze", lang, OB("OB-15"),
                     T_(lang, "Getting started<br><em>shouldn't feel like a maze.</em>", "البداية<br><em>ما لازم تكون متاهة.</em>"),
                     T_(lang, "Add your warehouses, upload an invoice, send the first message.", "زيد مستودعاتك، حمّل فاتورة، وابعت أوّل رسالة."),
                     extra=extra, title="getting started")


def idea_107():
    css = """.say{position:absolute;left:480px;top:690px;width:540px;background:#F4F8FA;border-radius:26px;padding:20px 22px;box-shadow:0 22px 60px rgba(0,0,0,.45)}
.say .bu{font-size:27px}"""
    for lang in ("en", "ar"):
        u = T_(lang, "Sent 40 LED strips to Sidon", f"بعتت 40 {L('LED Strip')} لصيدا")
        r = T_(lang, "Logged ✓", "تسجّلت ✓")
        dark_static("IDEA-107", "IDEA-107_send-it-its-logged", lang, OB("OB-16"),
                    T_(lang, "Send it.<br><em>It's logged.</em>", "ابعتها.<br><em>انسجّلت.</em>"),
                    T_(lang, "A message from your phone is all it takes.", "رسالة من تلفونك، وبس."),
                    extra=f'<div class="say"><div class="bu">{u}</div><div class="ok2">{r}</div></div>', css=css, h_size=T_(lang, 88, 76),
                    sub_top=T_(lang, 400, 430), title="send it")


def idea_109():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("+40 · Sidon", "−12 · Beirut"), (f"{L('+40')} · صيدا", f"{L('−12')} · بيروت"))
        extra = (f'<div class="chipx" style="left:64px;top:760px"><i></i>{a}</div>'
                 f'<div class="chipx" style="right:64px;top:760px"><i style="background:#B4233C"></i>{b}</div>')
        dark_static("IDEA-109", "IDEA-109_stock-has-a-pulse", lang, OB("OB-17"),
                    T_(lang, "Your stock<br><em>has a pulse.</em>", "مخزنك<br><em>إلو نبض.</em>"),
                    T_(lang, "Every move shows up the moment it's logged.", "كل حركة بتبيّن أوّل ما تتسجّل."),
                    extra=extra, h_size=T_(lang, 88, 76), sub_top=T_(lang, 400, 430), title="pulse")


def idea_110():
    css = """.flat{position:absolute;left:0;width:300px;top:820px;height:110px;background:linear-gradient(90deg,#0B1D33,#0B1D33 80%,rgba(11,29,51,0))}
.flat::after{content:"";position:absolute;left:0;right:30px;top:52px;border-top:4px solid #8AA3B5}"""
    for lang in ("en", "ar"):
        a, b = T_(lang, ("Spreadsheet · last updated 3 Mar", "Stacko · live"), ("الجدول · آخر تحديث 3 آذار", "ستاكو · مباشر"))
        extra = (f'<div class="flat"></div><div class="chipd" style="left:40px;top:720px"><i style="background:#8AA3B5"></i>{a}</div>'
                 f'<div class="chipx" style="right:64px;top:960px"><i></i>{b}</div>')
        dark_static("IDEA-110", "IDEA-110_alive-or-snapshot", lang, OB("OB-17"),
                    T_(lang, "Is your stock data alive,<br><em>or a snapshot?</em>", "بيانات مخزنك حيّة،<br><em>ولا صورة قديمة؟</em>"),
                    T_(lang, "A spreadsheet is a photo. Stacko is a live feed.", "الجدول صورة. ستاكو بثّ مباشر."),
                    extra=extra, css=css, h_size=T_(lang, 64, 60), title="alive or snapshot")


def idea_111():
    css = """.q4{position:absolute;display:flex;flex-direction:column;background:#fff;color:var(--abyss);border-radius:18px;padding:12px 20px;
  box-shadow:0 14px 40px rgba(0,0,0,.45);font-size:24px;font-weight:600;white-space:nowrap}
.q4 small{font-size:18px;color:var(--signal);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
[dir=rtl] .q4 small{letter-spacing:0;font-size:20px}"""
    for lang in ("en", "ar"):
        q = T_(lang, [("Who", "Rami"), ("What", "−25 · LED Strip 5m"), ("When", "Today, 4:12 PM"), ("Where", "WH-01 · Beirut")],
               [("مين", "رامي"), ("شو", f"{L('−25')} · {L('LED Strip 5m')}"), ("إيمتى", "اليوم، 4:12 بعد الضهر"), ("وين", f"{L('WH-01')} · بيروت")])
        pos = [(150, 1000), (560, 1000), (150, 1110), (560, 1110)]
        extra = "".join(f'<div class="q4" style="left:{x}px;top:{y}px"><small>{a}</small><span>{b}</span></div>' for (a, b), (x, y) in zip(q, pos))
        dark_static("IDEA-111", "IDEA-111_see-inside-every-move", lang, OB("OB-18"),
                    T_(lang, "See inside<br><em>every move.</em>", "شوف كل حركة<br><em>من جوّا.</em>"),
                    T_(lang, "Who, what, when and where, for every change.", "مين، شو، إيمتى ووين، لكل تغيير."),
                    extra=extra, css=css, h_size=T_(lang, 88, 76), sub_top=T_(lang, 400, 430), title="see inside")


def idea_112():
    css = """.role{position:absolute;display:flex;flex-direction:column;background:#fff;color:var(--abyss);border-radius:20px;padding:14px 22px;
  box-shadow:0 14px 40px rgba(0,0,0,.45);font-size:27px;font-weight:700;max-width:330px}
.role small{font-size:21px;font-weight:400;color:var(--deep)}"""
    for lang in ("en", "ar"):
        r = T_(lang, [("Owner", "watches the map"), ("Manager", "approves transfers"), ("Staff", "log from the phone"), ("Purchasing", "tracks imports")],
               [("صاحب الشغل", "بيتابع الخريطة"), ("المدير", "بيوافق عالتحويلات"), ("الفريق", "بيسجّل من التلفون"), ("المشتريات", "بتتابع الاستيراد")])
        pos = ["left:64px;top:560px", "right:64px;top:560px", "left:64px;top:900px", "right:64px;top:900px"]
        extra = "".join(f'<div class="role" style="{p}">{a}<small>{b}</small></div>' for (a, b), p in zip(r, pos))
        dark_static("IDEA-112", "IDEA-112_right-view-every-role", lang, OB("OB-18"),
                    T_(lang, "The right view<br><em>for every role.</em>", "لكل دور،<br><em>النظرة المناسبة.</em>"),
                    T_(lang, "Owner, manager, staff, purchasing.", "صاحب الشغل، المدير، الفريق، والمشتريات."),
                    extra=extra, css=css, h_size=T_(lang, 84, 76), sub_top=T_(lang, 400, 430), title="every role")


def idea_113():
    css = CARD_CSS + """
.post.light{background:#F4F8FA}
.h1{color:var(--abyss)} .sub{color:var(--deep)}
.panel{position:absolute;left:64px;right:64px;top:470px;height:750px;border-radius:30px;overflow:hidden;box-shadow:0 24px 60px rgba(14,36,64,.22)}
.panel img{position:absolute;width:952px;left:0;top:-270px}
.pins{position:absolute;left:0;right:0;top:1110px;display:flex;justify-content:center;gap:18px}
.pins span{display:inline-flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:12px 24px;font-size:28px;font-weight:700;color:var(--abyss);
  box-shadow:0 12px 30px rgba(14,36,64,.25)}
.pins i{width:14px;height:14px;border-radius:50%;background:var(--signal)}
"""
    for lang in ("en", "ar"):
        pins = T_(lang, ["Beirut", "Dubai"], ["بيروت", "دبي"])
        body = f"""<div class="panel"><img src="{OB('OB-19')}" alt=""></div>
<h1 class="h1">{T_(lang, "Ready to grow?<br><em>Bring your stock with you.</em>", "جاهز تكبر؟<br><em>خود مخزنك معك.</em>")}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{T_(lang, "New branch, new city, new country. Same map.", "فرع جديد، مدينة جديدة، بلد جديد. نفس الخريطة.")}</p>
<div class="pins">{"".join(f"<span><i></i>{p}</span>" for p in pins)}</div>
{top(lang, light=True)}
{FOOT[lang]}"""
        nm = name("IDEA-113", lang)
        write("IDEA-113_ready-to-grow", nm, page(lang, f"{nm} · ready to grow", body, css, theme="light"))


def idea_114():
    for lang in ("en", "ar"):
        sl = [(T_(lang, "A new country means<br><em>new warehouses and new teams.</em>", "بلد جديد يعني<br><em>مستودعات وفرق جديدة.</em>"),
               rowscard([(T_(lang, "Beirut", "بيروت"), "WH-01 · WH-02", T_(lang, "Running", "شغّال"), "okc"),
                         (T_(lang, "Dubai", "دبي"), "DXB-01", T_(lang, "New", "جديد"), "")])),
              (T_(lang, "Give each location a code<br><em>and put it on the map.</em>", "اعطي كل موقع رمز<br><em>وحطّه عالخريطة.</em>"),
               codescard(["WH-01", "WH-02", "DXB-01"])),
              (T_(lang, "Each team works<br><em>in Arabic or English.</em>", "كل فريق بيشتغل<br><em>بالعربي أو بالإنكليزي.</em>"), togglecard(lang)),
              (T_(lang, "You see everything<br><em>in one place.</em>", "بتشوف كل شي<br><em>بمحل واحد.</em>"),
               rowscard([(T_(lang, "Beirut", "بيروت"), "WH-01", "2,140", ""), (T_(lang, "Dubai", "دبي"), "DXB-01", "1,720", "")]))]
        light_car("IDEA-114", "IDEA-114_beirut-to-dubai", lang, "OB-19.jpg", -330,
                  (T_(lang, "From Beirut<br><em>to Dubai.</em>", "من بيروت<br><em>لدبي.</em>"),
                   T_(lang, "Expanding to the Gulf, without losing sight of your stock.", "تتوسّع عالخليج، بلا ما يغيب مخزنك عن عينك.")), sl, "Beirut to Dubai")


if __name__ == "__main__":
    for f in (idea_105, idea_106, idea_107, idea_109, idea_110, idea_111, idea_112, idea_113, idea_114):
        f()
    print("ok")
