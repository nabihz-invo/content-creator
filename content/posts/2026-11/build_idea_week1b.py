"""Batch 2 of the content-bank posts for 12–14 Nov 2026 (IDEA-046, IDEA-026, IDEA-038), EN + AR.

    python -I -X utf8 posts/2026-11/build_idea_week1b.py          (from content/)

Helpers come from build_idea_week1.py. The 11 PM post shows a real phone capture
(assets/screens/app-captures/*-ph-owner-map.png, map part only) in posts/…/IDEA-038_…/img/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_idea_week1 import FOOT, page, top, write  # noqa: E402


# ---------------------------------------------------------------- IDEA-046 · the empty spot (static, light, SC-05)
def idea_046():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:640px;
  background:linear-gradient(180deg,rgba(244,248,250,.97),rgba(244,248,250,.9) 55%,rgba(244,248,250,0))}
.gap{position:absolute;left:556px;top:606px;width:268px;height:190px;border:3px solid var(--signal);border-radius:10px;
  box-shadow:0 0 0 6px rgba(8,149,166,.16),0 0 30px rgba(46,242,238,.45)}
.card{position:absolute;left:470px;top:820px;background:#fff;color:var(--abyss);border-radius:22px;padding:20px 26px;
  box-shadow:0 18px 50px rgba(14,36,64,.30);min-width:420px}
.card b{display:block;font-size:30px;letter-spacing:-.02em}
[dir=rtl] .card b{font-size:32px}
.card .rw{display:flex;gap:16px;margin-top:8px;font-size:23px;color:var(--deep)}
[dir=rtl] .card .rw{font-size:25px}
.card .zero{color:#B4233C;font-weight:600}
.card .there{color:#0B7A87;font-weight:600}
.stem{position:absolute;left:216px;bottom:100%;width:2px;height:24px;background:var(--signal)}
[dir=rtl] .stem{left:216px;right:auto}
.alert{position:absolute;right:626px;top:852px;display:flex;align-items:center;gap:10px;background:#F0AAAA;color:var(--abyss);
  border-radius:999px;padding:10px 18px;font-size:22px;font-weight:600;box-shadow:0 10px 26px rgba(14,36,64,.22);white-space:nowrap}
[dir=rtl] .alert{font-size:23px}
.alert i{width:12px;height:12px;border-radius:50%;background:#B4233C}
.shade-b{height:520px;background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.95) 45%)}
.fix{position:absolute;left:64px;right:64px;top:986px;background:#fff;border-radius:24px;padding:20px 26px 22px;
  box-shadow:0 10px 34px rgba(22,59,98,.16);color:var(--abyss)}
.fix h3{font-size:24px;font-weight:600;color:var(--signal);letter-spacing:.02em;margin-bottom:12px}
[dir=rtl] .fix h3{font-size:26px}
.fix .st{display:grid;grid-template-columns:1.35fr 1fr 1fr;gap:24px}
[dir=rtl] .fix .st{grid-template-columns:1.22fr 1.12fr .96fr;gap:20px}
.fix .s{display:flex;flex-direction:column;gap:6px}
.fix .s .t{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:600;color:var(--abyss);line-height:1.2}
[dir=rtl] .fix .s .t{font-size:25px}
.fix .s .t span.n{flex:none;width:34px;height:34px;border-radius:50%;background:#EEF6F9;display:grid;place-items:center}
.fix .s svg{width:20px;height:20px;stroke:var(--signal);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.fix .s p{font-size:21px;line-height:1.35;color:var(--deep)}
[dir=rtl] .fix .s p{font-size:22px;line-height:1.5}
"""
    ICO = [
        '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
        '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>',
        '<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    ]
    T = {
        "en": dict(h="The empty spot costs<br><em>more than the stock.</em>",
                   s="Every gap is a sale walking out the door.",
                   item="Desk Lamp", zero="0 here", there="45 in Jounieh", al="Low stock · Desk Lamp",
                   fh="How Stacko fixes it",
                   steps=[("Stacko spots the gap", "Low-stock alert on Desk Lamp, before a customer asks."),
                          ("Finds the stock", "45 are in Jounieh."),
                          ("Move it", "Log the transfer, the empty spot gets filled.")]),
        "ar": dict(h="المكان الفاضي بيكلّف<br><em>أكتر من البضاعة.</em>",
                   s="كل فراغ هو بيعة طالعة من الباب.",
                   item="مصباح مكتب", zero="0 هون", there="45 بجونيه", al="نقص · مصباح مكتب",
                   fh="كيف ستاكو بيحلّها",
                   steps=[("ستاكو بيلحق الفراغ", "ستاكو بينبّهك إنو مصباح المكتب قليل، قبل ما يسأل الزبون."),
                          ("بيدلّك وين البضاعة", "في 45 مصباح بجونيه."),
                          ("انقلها", "سجّل التحويل، والمكان الفاضي بيتعبّى.")]),
    }
    for lang, t in T.items():
        steps = "".join(f'<div class="s"><div class="t"><span class="n">{ICO[k]}</span>{a}</div><p>{b}</p></div>' for k, (a, b) in enumerate(t["steps"]))
        body = f"""<img class="bg" src="/assets/post-images/final/SC-05.jpg" alt="">
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{352 if lang == 'en' else 390}px">{t['s']}</p>
<div class="gap"></div>
<div class="alert"><i></i>{t['al']}</div>
<div class="card"><div class="stem"></div><b>{t['item']}</b>
  <div class="rw"><span class="zero">{t['zero']}</span><span>·</span><span class="there">{t['there']}</span></div></div>
<div class="fix"><h3>{t['fh']}</h3><div class="st">{steps}</div></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        name = "IDEA-046" if lang == "en" else "IDEA-046-AR"
        write("IDEA-046_empty-spot-costs-more", name, page(lang, f"{name} · the empty spot", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-026 · story quiz, 2 frames (9:16, BG-61)
def idea_026():
    css = """
.bg{height:1920px}
.top{top:120px}
.h1{top:300px;font-size:88px;line-height:1.04}
[dir=rtl] .h1{font-size:76px;line-height:1.32}
.sub{top:560px;font-size:34px}
[dir=rtl] .sub{top:640px}
.big{position:absolute;left:64px;right:64px;top:300px;font-size:150px;font-weight:600;letter-spacing:-.04em;line-height:1}
[dir=rtl] .big{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-size:118px;line-height:1.3;letter-spacing:0;text-align:right}
.big em{font-style:normal;color:var(--glow)}
.legs{position:absolute;left:64px;right:64px;top:720px;display:flex;flex-direction:column;gap:16px}
.leg{display:flex;align-items:center;gap:20px;background:rgba(14,36,64,.72);border:1px solid rgba(201,216,228,.28);border-radius:20px;
  padding:22px 26px;font-size:30px}
.leg i{width:16px;height:16px;border-radius:50%;background:var(--dolphin);flex:none}
.leg.on i{background:var(--glow);box-shadow:0 0 16px var(--glow)}
.leg small{margin-inline-start:auto;color:var(--visor);font-size:26px}
.shade-b{height:420px}
.foot{bottom:120px}
"""
    T = {
        "en": [dict(h="Shenzhen → Beirut <em>by sea</em> takes about…", s="Take a guess. Answer in the quiz."),
               dict(big="About<br><em>30 days.</em>", s="Plus customs. Stacko tracks every leg.",
                    legs=[("Shenzhen port", "Day 0"), ("At sea", "≈ 30 days"), ("Customs, Beirut", "+ a few days"), ("Your warehouse", "logged on arrival")])],
        "ar": [dict(h="من شنتشن لبيروت <em>بالبحر</em>، قدّيش بتاخد؟", s="جرّب تخمّن. جاوب بالكويز."),
               dict(big="حوالي <em>30 يوم.</em>", s="وزيد عليهن الجمرك. ستاكو بيتابع كل مرحلة.",
                    legs=[("مرفأ شنتشن", "اليوم 0"), ("بالبحر", "حوالي 30 يوم"), ("الجمرك، بيروت", "كم يوم زيادة"), ("مستودعك", "بيتسجّل أول ما يوصل")])],
    }
    for lang, frames in T.items():
        for n, f in enumerate(frames, 1):
            if "big" in f:
                legs = "".join(f'<div class="leg{" on" if k == 3 else ""}"><i></i>{a}<small>{b}</small></div>'
                               for k, (a, b) in enumerate(f["legs"]))
                mid = f'<div class="big">{f["big"]}</div><p class="sub" style="top:{620 if lang == "en" else 560}px">{f["s"]}</p><div class="legs" style="top:{720 if lang == "en" else 700}px">{legs}</div>'
            else:
                mid = f'<h1 class="h1">{f["h"]}</h1><p class="sub">{f["s"]}</p>'
            body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
{mid}
{top(lang)}
{FOOT[lang]}"""
            name = f"IDEA-026-{'AR-' if lang == 'ar' else ''}{n:02d}"
            write("IDEA-026_story-quiz-sea-freight", name, page(lang, f"{name} · story quiz", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-038 · 11 PM (static, dark, SC-03 + real map)
def idea_038():
    css = """
.shade-t{height:520px;background:linear-gradient(180deg,rgba(8,20,36,.9),rgba(8,20,36,.55) 60%,rgba(8,20,36,0))}
.kick{top:166px}
[dir=rtl] .kick{top:150px}
.h1{top:210px}
[dir=rtl] .h1{top:186px;font-size:58px}
.screen{position:absolute;left:64px;top:520px;width:380px;border-radius:26px;overflow:hidden;background:#EEF4F7;
  box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 2px rgba(46,242,238,.55)}
.screen img{display:block;width:100%}
.ok{position:absolute;left:64px;top:900px;display:inline-flex;align-items:center;gap:12px;background:#fff;color:var(--abyss);
  border-radius:999px;padding:12px 22px;font-size:24px;font-weight:600;box-shadow:0 12px 34px rgba(0,0,0,.4)}
.ok i{width:28px;height:28px;border-radius:50%;background:#BCE5E0;color:#0B7A87;display:grid;place-items:center;font-style:normal;font-size:16px}
.link{position:absolute;left:444px;top:770px;width:44px;height:2px;background:linear-gradient(90deg,var(--glow),rgba(46,242,238,.2))}
.halo{position:absolute;left:452px;top:700px;width:180px;height:200px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(46,242,238,.22),rgba(46,242,238,0))}
"""
    T = {
        "en": dict(k="11 PM", h="Do you know<br><em>what's in stock?</em>", s="You shouldn't need to call anyone to find out.",
                   ok="All transfers arrived"),
        "ar": dict(k="الساعة 11 بالليل", h="بتعرف <em>شو عندك بالمخازن؟</em>", s="ما لازم تتّصل بحدا لتعرف.",
                   ok="كل التحويلات وصلت"),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-03.jfif" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<div class="halo"></div>
<div class="kick">{t['k']}</div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{384 if lang == 'en' else 292}px">{t['s']}</p>
<div class="screen"><img src="../img/map-{lang}.png" alt=""></div>
<div class="link"></div>
<div class="ok"><i>✓</i>{t['ok']}</div>
{top(lang)}
{FOOT[lang]}"""
        name = "IDEA-038" if lang == "en" else "IDEA-038-AR"
        write("IDEA-038_11pm-whats-in-stock", name, page(lang, f"{name} · 11 PM", body, css))


if __name__ == "__main__":
    idea_046()
    idea_026()
    idea_038()
    print("ok")
