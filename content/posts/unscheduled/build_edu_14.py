"""EDU-14 · Most stock problems aren't stock problems (static, dark, website hero island), EN + AR.

Rebuilt on 2026-11-09 from the legacy template (tools/legacy/build2.js): solution line instead of the
"Book a meeting" button, standard footer instead of the "Illustration · demo data" label.

    python3 -I -X utf8 posts/unscheduled/build_edu_14.py          (from content/)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "2026-11"))
from build_idea_week1 import FOOT, page, top  # noqa: E402

CSS = """
.post.dark{background:radial-gradient(120% 90% at 30% 20%,#1B416B 0%,#0E2440 62%)}
.grid-d{position:absolute;inset:0;background-image:radial-gradient(rgba(201,216,228,.16) 1.3px,transparent 1.6px);background-size:30px 30px}
.isl{position:absolute;left:-40px;top:560px;width:1160px;
  -webkit-mask-image:linear-gradient(180deg,transparent 0,transparent 8%,#000 26%);mask-image:linear-gradient(180deg,transparent 0,transparent 8%,#000 26%)}
.shade-b{height:170px;background:linear-gradient(180deg,rgba(8,20,36,0),rgba(8,20,36,.88) 55%)}
.h1{top:186px;font-size:84px;line-height:1.06;letter-spacing:-.035em}
[dir=rtl] .h1{top:176px;font-size:64px;line-height:1.4}
.sol{position:absolute;left:64px;right:64px;top:570px;font-size:36px;line-height:1.38;color:#EEF6F9;max-width:900px}
.sol b{font-weight:600;color:#fff}
[dir=rtl] .sol{left:auto;top:600px;font-size:38px;line-height:1.55;margin-inline-start:auto}
"""

T = {
    "en": dict(h="Most stock problems aren't stock problems. <em>They're visibility problems.</em>",
               s="With <b>Stacko</b>, you see your stock: every warehouse, every shipment, live on one map.",
               img="en-hero-island.png"),
    "ar": dict(h="معظم مشاكل المستودعات ليست في مشكلات تتعلق بالمخازن، <em>بل مشكلات تتعلق بوضوح الرؤية.</em>",
               s="مع <b>ستاكو</b>، مخزنك دايماً قدّام عينك: كل مستودع وكل شحنة على خريطة وحدة مباشرة.",
               img="ar-hero-island.png"),
}


def main():
    out = HERE / "EDU-14_most-stock-problems-arent" / "source"
    out.mkdir(parents=True, exist_ok=True)
    for lang, t in T.items():
        nm = "EDU-14" if lang == "en" else "EDU-14-AR"
        body = f"""<div class="grid-d"></div>
<img class="isl" src="/assets/screens/website-v2/{t['img']}" alt="">
<div class="shade-b"></div>
<h1 class="h1">{t['h']}</h1>
<p class="sol">{t['s']}</p>
{top(lang)}
{FOOT[lang]}"""
        (out / f"{nm}.html").write_text(page(lang, f"{nm} · visibility problems", body, CSS), encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
