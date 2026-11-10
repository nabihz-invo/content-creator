"""Week of 15 Nov 2026, batch 1 (IDEA-015, IDEA-027, IDEA-030), EN + AR.

    python3 -I -X utf8 posts/2026-11/build_idea_week2.py          (from content/)
    then: node studio/post/render.mjs <post>/source/*.html --out <post>/preview

Copy comes from the CRM plan rows (source_metadata.content_plan); images from the visual library.
Helpers come from build_idea_week1.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_idea_week1 import FOOT, page, top, write  # noqa: E402


def L(s):
    return f'<span class="ltr">{s}</span>'


# ---------------------------------------------------------------- IDEA-015 · ask it like a colleague (static, light, BG-59)
def idea_015():
    css = """
.veil{position:absolute;left:0;right:0;top:0;height:560px;
  background:linear-gradient(180deg,rgba(244,248,250,.94),rgba(244,248,250,.7) 60%,rgba(244,248,250,0))}
.h1{color:var(--abyss)}
.sub{color:var(--deep)}
.thread{position:absolute;left:64px;right:64px;display:flex;flex-direction:column;gap:22px}
.q{align-self:flex-end;max-width:640px;background:#2F86B8;color:#fff;font-size:32px;line-height:1.3;padding:22px 30px;
  border-radius:30px 30px 10px 30px;box-shadow:0 14px 34px rgba(14,36,64,.18)}
.q.dim{background:rgba(255,255,255,.72);color:var(--deep);box-shadow:0 0 0 1.5px rgba(47,134,184,.45)}
[dir=rtl] .q{border-radius:30px 30px 30px 10px}
.ans{align-self:flex-start;display:flex;gap:18px;align-items:flex-start;margin-top:10px}
.av{width:64px;height:64px;border-radius:50%;background:var(--abyss);display:grid;place-items:center;flex:none;
  box-shadow:0 0 0 4px rgba(8,149,166,.25)}
.av img{width:46px;height:46px}
.card{width:620px;background:#fff;color:var(--abyss);border-radius:30px 30px 30px 10px;padding:26px 30px;
  box-shadow:0 22px 60px rgba(14,36,64,.28),0 0 0 2px rgba(8,149,166,.55)}
[dir=rtl] .card{border-radius:30px 30px 10px 30px}
.card b{display:block;font-size:34px;letter-spacing:-.02em}
.card .rw{margin-top:10px;font-size:28px;color:var(--deep);line-height:1.4}
.card .n{color:#0B7A87;font-weight:600}
.shade-b{background:linear-gradient(180deg,rgba(244,248,250,0),rgba(244,248,250,.92) 60%)}
"""
    T = {
        "en": dict(h="Ask it like<br><em>you'd ask a colleague.</em>",
                   s="“How much do we have, and where?” Answered in seconds.",
                   q=["How many desk lamps in Jounieh?", "How much LED strip in Dubai?",
                      "Where are the wireless earbuds?"],
                   item="Wireless Earbuds", rw='<span class="n">12 left</span>, all in WH-03 Tripoli.'),
        "ar": dict(h="اسأله <em>متل ما بتسأل زميلك.</em>",
                   s="«قدّيش عنّا، ووين؟» الجواب بثواني.",
                   q=[f"قدّيش في {L('Desk Lamp')} بجونيه؟", f"قدّيش في {L('LED Strip')} بدبي؟",
                      f"وين الـ{L('Wireless Earbuds')}؟"],
                   item=L("Wireless Earbuds"), rw=f'<span class="n">باقي 12</span>، كلّن بـ{L("WH-03")} طرابلس.'),
    }
    for lang, t in T.items():
        qs = "".join(f'<div class="q{" dim" if k < 2 else ""}">{q}</div>' for k, q in enumerate(t["q"]))
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-59.jpg" alt="">
<div class="veil"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 300}px">{t['s']}</p>
<div class="thread" style="top:{560 if lang == 'en' else 500}px">{qs}
  <div class="ans"><div class="av"><img src="/assets/brand/logo/mark-dark.svg" alt=""></div>
    <div class="card"><b>{t['item']}</b><div class="rw">{t['rw']}</div></div></div></div>
{top(lang, light=True)}
{FOOT[lang]}"""
        name = "IDEA-015" if lang == "en" else "IDEA-015-AR"
        write("IDEA-015_ask-like-a-colleague", name, page(lang, f"{name} · ask it like a colleague", body, css, theme="light"))


# ---------------------------------------------------------------- IDEA-027 · story slider (9:16, BG-61)
def idea_027():
    css = """
.bg{height:1920px}
.top{top:120px}
.h1{top:300px;font-size:80px;line-height:1.08}
[dir=rtl] .h1{font-size:76px;line-height:1.32}
.sub{top:520px;font-size:34px}
[dir=rtl] .sub{top:560px}
.ends{position:absolute;left:170px;right:170px;top:1110px;display:flex;justify-content:space-between;font-size:28px;color:var(--visor)}
.ends span{display:flex;align-items:center;gap:12px}
.ends i{font-style:normal;font-size:44px}
.shade-b{height:420px}
.foot{bottom:120px}
"""
    T = {
        "en": dict(h="How sure are you about<br><em>today's stock numbers?</em>", s="Slide to answer. Be honest.",
                   lo="Guessing", hi="Certain"),
        "ar": dict(h="قدّيش متأكّد <em>من أرقام مخزنك اليوم؟</em>", s="حرّك وجاوب. بصراحة.",
                   lo="عم خمّن", hi="متأكّد"),
    }
    for lang, t in T.items():
        # the Instagram emoji slider sticker goes in the empty band y 860–1080 (see notes.md)
        body = f"""<img class="bg" src="/assets/backgrounds/final/BG-61.jpg" alt="">
<div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub">{t['s']}</p>
<div class="ends"><span><i>😬</i>{t['lo']}</span><span>{t['hi']}<i>😎</i></span></div>
{top(lang)}
{FOOT[lang]}"""
        name = "IDEA-027" if lang == "en" else "IDEA-027-AR"
        write("IDEA-027_story-slider-how-sure", name, page(lang, f"{name} · story slider", body, css, size=(1080, 1920)))


# ---------------------------------------------------------------- IDEA-030 · Beirut → Zahle (static, dark, SC-01)
def idea_030():
    css = """
.shade-t{height:520px;background:linear-gradient(180deg,rgba(8,20,36,.85),rgba(8,20,36,.45) 60%,rgba(8,20,36,0))}
.van{position:absolute;left:556px;top:990px;width:22px;height:22px;margin:-11px;border-radius:50%;background:var(--glow);
  box-shadow:0 0 0 12px rgba(46,242,238,.22),0 0 44px 14px rgba(46,242,238,.5)}
.eta{position:absolute;left:330px;top:800px;background:#fff;color:var(--abyss);border-radius:22px;padding:18px 26px;
  box-shadow:0 18px 50px rgba(0,0,0,.45)}
.eta b{display:block;font-size:30px;letter-spacing:-.02em}
.eta .t{margin-top:4px;font-size:24px;color:#0B7A87;font-weight:600}
.eta .stem{position:absolute;left:226px;top:100%;width:2px;height:96px;background:linear-gradient(#fff,rgba(46,242,238,.8))}
.log{position:absolute;left:64px;top:1110px;display:flex;align-items:center;gap:14px;background:rgba(14,36,64,.8);
  border:1px solid rgba(201,216,228,.3);border-radius:18px;padding:14px 20px;font-size:23px;color:#fff;backdrop-filter:blur(6px)}
.log i{width:40px;height:40px;border-radius:50%;background:var(--dolphin);color:var(--abyss);display:grid;place-items:center;
  font-style:normal;font-weight:700;font-size:20px;flex:none}
.log small{display:block;color:var(--visor);font-size:20px}
[dir=rtl] .log{left:auto;right:64px}
"""
    T = {
        "en": dict(h="Beirut → Zahle.<br><em>You'll know when it lands.</em>",
                   s="Every transfer shows a live countdown on the map.",
                   r="Beirut → Zahle", t="ETA 1h 20m", ini="H", lg="Logged by Hadi", lgs="40 × LED Strip 5m"),
        "ar": dict(h="بيروت ← زحلة.<br><em>رح تعرف إيمتى بتوصل.</em>",
                   s="كل تحويل إلو عدّاد مباشر عالخريطة.",
                   r="بيروت ← زحلة", t="بتوصل خلال ساعة و20 دقيقة", ini="هـ", lg="سجّلها هادي",
                   lgs=L("40 × LED Strip 5m")),
    }
    for lang, t in T.items():
        body = f"""<img class="bg" src="/assets/post-images/final/SC-01.jpg" alt="">
<div class="shade-t"></div><div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sub" style="top:{356 if lang == 'en' else 392}px">{t['s']}</p>
<div class="van"></div>
<div class="eta"><b>{t['r']}</b><div class="t">{t['t']}</div><div class="stem"></div></div>
<div class="log"><i>{t['ini']}</i><div>{t['lg']}<small>{t['lgs']}</small></div></div>
{top(lang)}
{FOOT[lang]}"""
        name = "IDEA-030" if lang == "en" else "IDEA-030-AR"
        write("IDEA-030_beirut-zahle-eta", name, page(lang, f"{name} · Beirut to Zahle", body, css))


if __name__ == "__main__":
    idea_015()
    idea_027()
    idea_030()
    print("ok")
