"""Undated batch 6 (IDEA-133 … 140, no reel), EN + AR.   python3 -I -X utf8 posts/unscheduled/build_idea_und_06.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from und_lib import L, SEARCH, T_, dark_static  # noqa: E402

OB = "/assets/post-images/final/{}.jpg".format
MINI = """.mini{position:absolute;background:#fff;color:var(--abyss);border-radius:22px;padding:18px 22px;box-shadow:0 0 0 2px rgba(46,242,238,.6),0 18px 50px rgba(0,0,0,.5)}
.mini .sf{font-size:25px;padding:10px 18px}
.mini .rr2{display:flex;justify-content:space-between;gap:20px;margin-top:12px;font-size:25px}
.mini .rr2 b{font-size:30px}
.mini .lab2{font-size:18px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#B4233C}
[dir=rtl] .mini .lab2{letter-spacing:0;font-size:20px}
.tag2{position:absolute;display:inline-flex;align-items:center;gap:10px;background:rgba(14,36,64,.85);border:1px solid rgba(46,242,238,.55);color:#fff;
  border-radius:999px;padding:12px 24px;font-size:28px;font-weight:700;white-space:nowrap}
.tag2 i{width:12px;height:12px;border-radius:50%;background:var(--glow)}
.tag2.w{background:#fff;color:var(--abyss)}"""


def idea_133():
    for lang in ("en", "ar"):
        mini = (f'<div class="mini" style="right:64px;top:500px;width:470px"><div class="sf">{SEARCH}{L("USB-C Cable 1m")}</div>'
                f'<div class="rr2"><span>{T_(lang, "WH-01 · Beirut", L("WH-01") + " · بيروت")}</span><b class="num">140</b></div></div>')
        dark_static("IDEA-133", "IDEA-133_needle-in-a-haystack", lang, OB("OB-29"),
                    T_(lang, "Needle in a haystack?<br><em>Not anymore.</em>", "إبرة بكومة قش؟<br><em>مش بعد اليوم.</em>"),
                    T_(lang, "Search across 10,000+ SKUs, low stock first.", f"دوّر بين أكتر من {L('10,000')} صنف، والناقص أوّل شي."),
                    extra=mini, css=MINI, title="needle")


def idea_134():
    for lang in ("en", "ar"):
        dark_static("IDEA-134", "IDEA-134_hardest-item-to-find", lang, OB("OB-29"),
                    T_(lang, "What's the hardest item<br><em>to find in your warehouse?</em>", "شو أصعب صنف<br><em>بتلاقيه بمستودعك؟</em>"),
                    T_(lang, "Answer in the comments.", "جاوب بالكومنت."), css=".bg{transform:scale(1.15);transform-origin:70% 70%}",
                    h_size=T_(lang, 68, 66), title="hardest item")


def idea_135():
    for lang in ("en", "ar"):
        dark_static("IDEA-135", "IDEA-135_saddest-stage", lang, OB("OB-30"),
                    T_(lang, "The saddest stage<br><em>in retail.</em>", "أتعس مسرح<br><em>بالتجارة.</em>"),
                    T_(lang, "An empty pallet the day customers came for it.", "منصّة فاضية بالنهار اللي إجوا فيه الزباين."),
                    extra=f'<div class="tag2" style="left:50%;transform:translateX(-50%);top:930px"><i style="background:#B4233C"></i>{T_(lang, "Low-stock alert: 3 days ago", "تنبيه نقص: من 3 أيام")}</div>',
                    css=MINI + ".shade-t{height:640px}", h_size=T_(lang, 88, 80), sub_top=T_(lang, 400, 440), title="saddest stage")


def idea_136():
    for lang in ("en", "ar"):
        mini = (f'<div class="mini" style="left:50%;transform:translateX(-50%);top:640px;width:520px"><div class="lab2">{T_(lang, "Low stock", "نقص")}</div>'
                f'<div class="rr2" style="margin-top:4px"><b>{L("Desk Lamp")}</b><span>{T_(lang, "8 left · WH-02", "باقي 8 · " + L("WH-02"))}</span></div></div>')
        dark_static("IDEA-136", "IDEA-136_spotlight-empty-pallet", lang, OB("OB-30"),
                    T_(lang, "Don't let the spotlight<br><em>find an empty pallet.</em>", "ما تخلّي الضو<br><em>يلاقي منصّة فاضية.</em>"),
                    T_(lang, "Low-stock alerts warn you days before.", "تنبيهات النقص بتخبّرك قبل بأيام."),
                    extra=mini, css=MINI + ".shade-t{height:640px}", h_size=T_(lang, 66, 64), title="spotlight")


def idea_137():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("You", "Stacko"), ("إنت", "ستاكو"))
        extra = f'<div class="tag2" style="left:720px;top:560px">{a}</div><div class="tag2 w" style="left:64px;top:900px"><i></i>{b}</div>'
        dark_static("IDEA-137", "IDEA-137_what-stacko-sees", lang, OB("OB-31"),
                    T_(lang, "What you see.<br><em>What Stacko sees.</em>", "شو بتشوف إنت.<br><em>شو بيشوف ستاكو.</em>"),
                    T_(lang, "Boxes on one side. A live map on the other.", "كراتين من جهة. وخريطة مباشرة من الجهة التانية."),
                    extra=extra, css=MINI, h_size=T_(lang, 76, 70), title="what Stacko sees")


def idea_139():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("Before", "With Stacko"), ("قبل", "مع ستاكو"))
        extra = f'<div class="tag2" style="left:90px;top:860px">{a}</div><div class="tag2 w" style="right:70px;top:860px"><i></i>{b}</div>'
        dark_static("IDEA-139", "IDEA-139_switch-on-your-stock", lang, OB("OB-32"),
                    T_(lang, "Switch on<br><em>your stock.</em>", "شعّل الضو<br><em>على مخزنك.</em>"),
                    T_(lang, "From guessing in the dark to seeing every box.", "من التخمين بالعتمة، لتشوف كل كرتونة."),
                    extra=extra, css=MINI + ".shade-t{height:620px}", h_size=T_(lang, 88, 80), sub_top=T_(lang, 400, 440), title="switch on")


def idea_140():
    for lang in ("en", "ar"):
        a, b = T_(lang, ("Left", "Right"), ("شمال", "يمين"))
        extra = (f'<div class="tag2" style="left:90px;top:1060px;font-size:36px;padding:16px 34px">{a}</div>'
                 f'<div class="tag2 w" style="right:90px;top:1060px;font-size:36px;padding:16px 34px">{b}</div>')
        dark_static("IDEA-140", "IDEA-140_which-side-poll", lang, OB("OB-32"),
                    T_(lang, "Which side<br><em>is your warehouse on?</em>", "مستودعك<br><em>بأيّ جهة؟</em>"),
                    T_(lang, "Left or right? Be honest.", "شمال ولا يمين؟ بصراحة."),
                    extra=extra, css=MINI + ".shade-t{height:620px}", h_size=T_(lang, 80, 80), sub_top=T_(lang, 400, 440), title="which side")


if __name__ == "__main__":
    for f in (idea_133, idea_134, idea_135, idea_136, idea_137, idea_139, idea_140):
        f()
    print("ok")
