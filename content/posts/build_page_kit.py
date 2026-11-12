"""Profile kit (11 Nov 2026): the posts the Instagram page plan needs that the content plan did not have yet.
    python -I -X utf8 posts/build_page_kit.py [out.json]

IDEA-232  See Stacko in action (reel, hand-written: unscheduled/IDEA-232_see-stacko-in-action/reel.html; only its captions are written here)
IDEA-233  On the way isn't in stock (carousel)
IDEA-234  All your stock, on one live map (static, the closing / always-on post)

Same layouts as round 3 (r3_lib). Terms from app/docs/TERMINOLOGY.md: On hand = الرصيد, In transit = قيد النقل,
Customs clearance = تخليص جمركي, Incoming shipment = شحنة واردة. Stacko has no purchase orders, so the plan's
"purchased ≠ received" becomes "on the way ≠ in stock" (stock in transit is never mixed with stock on hand).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import r3_lib  # noqa: E402
from r3_lib import BG, CAP, L, REG, U, car, card, dump, static, strip  # noqa: E402

T = lambda l: (lambda a, b: a if l == "en" else b)
LS = ("en", "ar")
BGI = lambda c: f'<img class="bg" src="{BG(c)}" alt="">'
EX = lambda x: f'<div class="ex">{x}</div>'
POSTS = r3_lib.POSTS
CSS = """
.amb{color:#B26B00;font-weight:600}
.wait{color:#2C5974;font-weight:600}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.two .wc{position:static;padding:30px 30px 26px}
.two .lab{font-size:24px}
.two .num{font-size:76px;font-weight:600;line-height:1.05;color:var(--abyss);margin-top:8px;direction:ltr;text-align:start}
.two .hint{font-size:25px;color:var(--deep);margin-top:6px;line-height:1.3}
.two .on .num{color:#0B7A87}
.jr{display:flex;justify-content:space-between;position:relative;background:rgba(10,26,46,.82);border:1px solid rgba(201,216,228,.25);border-radius:26px;padding:28px 26px 22px}
.jr:before{content:"";position:absolute;left:90px;right:90px;top:72px;height:3px;background:rgba(201,216,228,.3)}
.jn{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;width:150px;color:var(--visor);font-size:24px;font-weight:600;text-align:center}
.jn i{display:grid;place-items:center;width:88px;height:88px;border-radius:50%;background:#132F52;border:2px solid rgba(201,216,228,.35)}
.jn svg{width:46px;height:46px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.jn.done{color:#C9D8E4}.jn.done i{border-color:var(--signal)}
.jn.on{color:var(--glow)}.jn.on i{background:var(--signal);border-color:var(--glow);color:#fff;box-shadow:0 0 30px rgba(46,242,238,.45)}
"""
JI = {
    "inv": '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7M9 19h4"/>',
    "sea": '<path d="M3 15h18l-3 5H6z"/><path d="M6 15V9h12v6M10 9V5h4v4"/>',
    "cus": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h5M7 14h10M16 9.5l1.5 1.5L20 8.5"/>',
    "road": '<path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    "wh": '<path d="M3 10l9-6 9 6v10H3z"/><path d="M8 20v-6h8v6M8 17h8"/>',
}


def journey(l, on):
    """Invoice → sea → customs → truck → WH-01, with the steps before `on` done and `on` lit."""
    t = T(l)
    st = [("inv", t("Invoice", "الفاتورة")), ("sea", t("Sea", "البحر")), ("cus", t("Customs", "الجمرك")), ("road", t("Truck", "الشاحنة")), ("wh", L("WH-01"))]
    nodes = "".join(f'<div class="jn {"on" if i in on else "done" if i < min(on) else ""}"><i><svg viewBox="0 0 24 24">{JI[k]}</svg></i>{n}</div>' for i, (k, n) in enumerate(st))
    return f'<div class="jr">{nodes}</div>'



def reg(pid, slug, fmt, h, s, cap, slides=None, note=""):
    """r3_lib.reg, but the posts have no date yet: they live in posts/unscheduled/."""
    folder = f"{pid}_{slug}"
    REG[pid] = dict(slug=slug, date=None, month="unscheduled", fmt=fmt, h=h, s=s, cap=cap, slides=slides, note=note, folder=folder)
    d = POSTS / "unscheduled" / folder
    d.mkdir(parents=True, exist_ok=True)
    (d / "caption_en.txt").write_text(cap[0] + "\n", encoding="utf8")
    (d / "caption_ar.txt").write_text(cap[1] + "\n", encoding="utf8")
    (d / "notes.md").write_text(f"# {pid} · profile kit\n\nBuilt by posts/build_page_kit.py (Instagram page plan, 11 Nov 2026). HTML only for now.\n\n{note}\n", encoding="utf8")
    return folder


def i232():
    h = ("See Stacko<br><em>in action.</em>", "شوف ستاكو<br><em>وهو شغّال.</em>")
    s = ("With Stacko, the map, transfers and invoices in 30 seconds.", "مع ستاكو، الخريطة والتحويلات والفواتير بـ30 ثانية.")
    reg("IDEA-232", "see-stacko-in-action", "Reel", h, s,
        ("This is Stacko.\n\nEvery warehouse on one live map. Open a warehouse and low stock comes first. Staff log a move with one message from the phone, and the truck drives on the map with a live ETA. Upload a supplier invoice and AI drafts the incoming shipment; nothing is recorded until a person approves it.\n\nYour stock, always in sight.\nwww.stacko-lb.com",
         "هيدا ستاكو.\n\nكل مستودعاتك عخريطة وحدة مباشرة. بتفتح أي مستودع والناقص بيطلع أوّل. الفريق بيسجّل الحركة برسالة وحدة من التلفون، والشاحنة بتمشي عالخريطة مع وقت وصول مباشر. بترفع فاتورة المورّد والذكاء الاصطناعي بيحضّر الشحنة الواردة، وما في شي بيتسجّل قبل ما حدا يوافق عليه.\n\nمخزنك دايماً قدّام عينك.\nwww.stacko-lb.com"),
        note="Pinned post 2 (product demo). Motion page reel.html, built from the website product recordings in assets/clips/website (demo data, English interface in both versions). Cropped: old header logo, the website step cards (they name Telegram), the 'Illustration · demo data' badge, and the 'EXAMPLE' / 'demo data' labels. Music: Second_Cup_of_Coffee.mp3, no voice.")


def i233():
    h = ("On the way<br><em>isn't in stock.</em>", "اللي عالطريق<br><em>مش بالمخزن.</em>")
    s = ("With Stacko, stock in transit and stock on hand never mix.", "مع ستاكو، البضاعة قيد النقل ما بتنخلط مع الرصيد.")
    sl = [("The invoice arrives.<br><em>The goods don't.</em>", "الفاتورة وصلت.<br><em>البضاعة لأ.</em>"),
          ("At sea and in customs:<br><em>in transit.</em>", "بالبحر وبالجمرك:<br><em>قيد النقل.</em>"),
          ("The truck reaches WH-01.<br><em>Now it's stock.</em>", "الشاحنة وصلت عالمستودع.<br><em>هلّق صارت بالمخزن.</em>"),
          ("Two numbers.<br><em>Never mixed.</em>", "رقمين.<br><em>ما بيختلطوا.</em>")]
    reg("IDEA-233", "on-the-way-isnt-in-stock", "Carousel", h, s,
        ("A supplier invoice tells you what's coming. It doesn't put the goods on your shelf.\n\nIn Stacko, an uploaded invoice creates an incoming shipment. While it's at sea and in customs, it counts as in transit, with an ETA. When the truck reaches the warehouse, the units are added to on hand.\n\nYou sell from what's on the shelf and plan with what's on the way. Two numbers, never mixed.",
         "فاتورة المورّد بتقلّك شو جايي. بس ما بتحطّ البضاعة عالرف.\n\nبستاكو، الفاتورة اللي بترفعها بتعمل شحنة واردة. وهي بالبحر وبالجمرك، بتنحسب قيد النقل، مع وقت وصول. ولمّا توصل الشاحنة عالمستودع، بتنزاد الكمية عالرصيد.\n\nبتبيع من اللي عالرف، وبتخطط باللي عالطريق. رقمين، ما بيختلطوا."),
        slides=[h] + sl,
        note="Replaces the page plan's 'purchased doesn't mean received' (Stacko has no purchase orders). Sea and customs times from the product bible; 22,589 / 1,880 are the demo numbers shown on the live map.")
    for l in LS:
        t = T(l)
        A, D = BGI("BG-58") + '<div style="position:absolute;inset:0;background:rgba(10,26,46,.45)"></div>', BGI("BG-56")
        rows1 = [(L("INV-2291"), t("Supplier invoice uploaded", "انرفعت فاتورة المورّد"), "✓", "okc"),
                 (L("SHP-24021"), t("Incoming shipment created", "انعملت شحنة واردة"), L("1,200"), "wait")]
        rows2 = [(t("Shenzhen → Port of Beirut", "شنجن ← مرفأ بيروت"), t("About 30 days at sea", "حوالي 30 يوم بالبحر"), t("In transit", "قيد النقل"), "amb"),
                 (t("Port of Beirut", "مرفأ بيروت"), t("About 2 days", "حوالي يومين"), t("Customs clearance", "تخليص جمركي"), "amb")]
        rows3 = [(L("SHP-24021"), t("Received at WH-01 Beirut", f"استلمها {L('WH-01')} بيروت"), L("+1,200"), "okc"),
                 (L("LED Strip 5m"), t("On hand at WH-01", f"الرصيد بـ {L('WH-01')}"), L("640 → 1,240"), "okc")]
        two = (f'<div class="two"><div class="wc on"><div class="lab">{t("On hand", "الرصيد")}</div><div class="num">{L("22,589")}</div>'
               f'<div class="hint">{t("On the shelf. You sell from this.", "عالرف. منّه بتبيع.")}</div></div>'
               f'<div class="wc"><div class="lab">{t("In transit", "قيد النقل")}</div><div class="num">{L("1,880")}</div>'
               f'<div class="hint">{t("On the way, with an ETA. You plan with this.", "عالطريق، مع وقت وصول. فيه بتخطط.")}</div></div></div>')
        car("IDEA-233", l, [
            dict(bg=A, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[U.rowscard([rows2[0]], t("Incoming shipment", "شحنة واردة"))], col_top=620),
            dict(bg=D, h=sl[0][l == "ar"], kick=t("1 of 3", f"{L(1)} من {L(3)}"), col=[journey(l, {0}), U.rowscard(rows1, t("Uploaded today", "انرفعت اليوم")), EX(t("Uploading the invoice creates the shipment. It doesn't add stock yet.", "رفع الفاتورة بيعمل الشحنة. بس لسّا ما بيزيد الكمية."))], col_top=430),
            dict(bg=D, h=sl[1][l == "ar"], kick=t("2 of 3", f"{L(2)} من {L(3)}"), col=[journey(l, {1, 2}), U.rowscard(rows2, L("SHP-24021")), EX(t("Stacko counts it as in transit, with an ETA. Nobody sells it by mistake.", "ستاكو بيحسبها قيد النقل، مع وقت وصول. ما حدا بيبيعها بالغلط."))], col_top=430),
            dict(bg=D, h=sl[2][l == "ar"], kick=t("3 of 3", f"{L(3)} من {L(3)}"), col=[journey(l, {3, 4}), U.rowscard(rows3, t("Arrived", "وصلت")), EX(t("The units are added to on hand when the truck arrives, not before.", "الكمية بتنزاد عالرصيد لمّا توصل الشاحنة، مش قبل."))], col_top=430),
            dict(bg=D, h=sl[3][l == "ar"], col=[two, EX(t("Stacko: the stock management system built for several warehouses.", "ستاكو: نظام إدارة المخازن المعمول لأكتر من مستودع."))], col_top=430),
        ], "on the way isn't in stock", css=CSS)


def i234():
    h = ("Your warehouses. Your moves.<br><em>One live map.</em>", "مخازنك. حركتك.<br><em>خريطة وحدة مباشرة.</em>")
    s = ("With Stacko, every warehouse, transfer and shipment is in sight.", "مع ستاكو، كل مستودع وتحويلة وشحنة قدّام عينك.")
    reg("IDEA-234", "one-live-map", "Static", h, s,
        ("Stacko puts every warehouse, transfer and incoming shipment on one live map, so the whole team works from the same numbers.\n\nStaff log moves from the phone in about 10 seconds. Managers see what's on the shelf, what's on the road and what's running low.\n\nSee how it works: www.stacko-lb.com\nOr send us a message: info@stacko-lb.com",
         "ستاكو بيحطّ كل مستودع وتحويلة وشحنة واردة عخريطة وحدة مباشرة، لهيك كل الفريق بيشتغل عنفس الأرقام.\n\nالفريق بيسجّل الحركة من التلفون بحوالي 10 ثواني. والمدير بيشوف شو عالرف، شو عالطريق، وشو عم يخلص.\n\nشوف كيف بيشتغل: www.stacko-lb.com\nأو ابعتلنا: info@stacko-lb.com"),
        note="The closing / always-on post of the page plan (post 9). The plan's 'Ready to see your stock differently?' is a closing question, so it became a statement; no button, the website and email are in the caption. Demo map screenshot (live-map/map-crop.jpg) and demo numbers from the live map.")
    for l in LS:
        t = T(l)
        x = U.mapcard(top_=620) + strip(l, [(t("Live", "مباشر"), t("Every warehouse", "كل مستودع")), (t("ETA", "وقت الوصول"), t("Every transfer", "كل تحويلة")), (t("10 s", f"{L('10')} ثواني"), t("To log a move", "لتسجيل الحركة"))])
        static("IDEA-234", l, BG("BG-59"), h[l == "ar"], s[l == "ar"], x, css=".mapc{left:64px;right:64px}.mapc img{display:block;width:100%;border-radius:18px}", hs=t(60, 52))


COVERS = [  # (Instagram highlight name EN / AR, element)
    ("Start Here", "ابدأ هون", ("mark", None)),
    ("Demo", "ديمو", ("boxTruck", "White + accent stripe")),
    ("Features", "الميزات", ("warehouse", "Medium · brand blue")),
    ("Tips", "نصائح", ("racking", "3 levels · full")),
    ("FAQ", "أسئلة", ("forklift", "Teal · with pallet")),
    ("Contact", "تواصل", ("ui_warehousePin", "Default")),
    ("عربي", "عربي", ("tree", "Pine (Lebanese cedar style)")),
]


def i186():
    """Highlight covers, rebuilt 12 Nov 2026 (owner: icon only, the same in both languages, Stacko's own elements).
    One isometric live-map element per cover, no text: the highlight name is typed in Instagram."""
    import shutil
    from und_lib import page as upage
    d = POSTS / "unscheduled" / "IDEA-186_highlight-covers" / "source"
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir(parents=True)
    css = """
.post.dark{background:radial-gradient(circle at 50% 50%,#13355A,#081A30 72%)}
.ring{position:absolute;left:50%;top:50%;width:720px;height:720px;margin:-360px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#183F68,#0E2440 70%);
  box-shadow:0 0 0 7px var(--glow),0 0 90px rgba(46,242,238,.42);display:grid;place-items:center;overflow:hidden}
.ring>div{display:grid;place-items:center;width:470px;height:470px}
.ring svg,.ring img{max-width:470px;max-height:430px;width:auto;height:auto;filter:drop-shadow(0 26px 30px rgba(0,0,0,.45))}
"""
    for i, (en, ar, (el, var)) in enumerate(COVERS):
        if el == "mark":
            g = '<div><img src="/assets/brand/logo/mark-dark.svg" alt="" style="width:360px;max-height:none"></div>'
        else:
            g = (f'<div id="el"></div><script>(function(){{var o=StackoMap.variant({el!r},{var!r});var h=StackoMap.render({el!r},o,3);'
                 f'var e=document.getElementById("el");e.innerHTML=h;var s=e.querySelector("svg");var w=+s.getAttribute("width"),hh=+s.getAttribute("height");'
                 f'if(!s.getAttribute("viewBox"))s.setAttribute("viewBox","0 0 "+w+" "+hh);var k=Math.min(470/w,430/hh);s.setAttribute("width",Math.round(w*k));s.setAttribute("height",Math.round(hh*k));}})();</script>')
        body = f'<script src="/assets/map-elements/stacko-map-elements.js"></script><div class="ring">{g}</div>'
        for l in LS:
            nm = f"IDEA-186{'-AR' if l == 'ar' else ''}-{i + 1:02d}"
            (d / f"{nm}.html").write_text(upage(l, f"{nm} · highlight cover · {en}", body, css, size=(1080, 1920)), encoding="utf8")
    lines = [f"{i + 1:02d}. {en} / {ar}: {el}" + (f" ({var})" if var else "") for i, (en, ar, (el, var)) in enumerate(COVERS)]
    (d.parent / "notes.md").write_text("# IDEA-186 · highlight covers\n\nRebuilt 12 Nov 2026 by posts/build_page_kit.py: icon only, identical in EN and AR "
                                       "(owner's review note), one Stacko live-map element per cover.\n\n" + "\n".join(lines)
                                       + "\n\nUse the circle as the cover; type the highlight name in Instagram.\n", encoding="utf8")


ST_CSS = r3_lib.CSS + """
.bg{height:1920px}.top{top:120px}
.h1{top:270px;font-size:86px;line-height:1.06}[dir=rtl] .h1{font-size:74px;line-height:1.32;top:262px}
.sub{font-size:40px;line-height:1.3}
.shade-t{height:760px}.shade-b{height:340px}
.foot{bottom:110px}
.ph{position:absolute;left:50%;width:600px;margin-left:-300px;border-radius:64px;border:16px solid #0A1A2E;background:#fff;overflow:hidden;
  box-shadow:0 0 0 2px rgba(201,216,228,.35),0 40px 90px rgba(0,0,0,.55)}
.ph>img{display:block;width:100%;max-width:none}
.ph .fade{position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,rgba(255,255,255,0),#fff)}
.stk{position:absolute;left:96px;right:96px;display:flex;flex-direction:column;gap:24px}
.stk .wc{position:static}
.nt{background:#FFF6C9;color:#0E2440;font:500 46px 'Kalam','Readex Pro',cursive;padding:28px 34px;box-shadow:0 22px 50px rgba(0,0,0,.45);width:fit-content}
[dir=rtl] .nt{font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-size:40px}
.fn{position:absolute;right:96px;top:150px;font-size:26px;font-weight:600;letter-spacing:.12em;color:var(--dolphin)}
[dir=rtl] .fn{right:auto;left:96px;letter-spacing:0}
"""
STORY_BG = '<img class="bg" src="/assets/graphics/GFX-01_dark-backdrop_9x16.jpg" alt=""><div class="shade-t"></div>'


def story_page(pid, l, i, n, h, s, inner):
    """One 1080×1920 highlight story: logo, number, headline, sub, the proof, footer."""
    lines = h.count("<br>") + 1
    hs = r3_lib.fit(h, 86 if l == "en" else 74, l)  # every line stays on one line
    st = int((270 + lines * hs * 1.06 + 26) if l == "en" else (262 + lines * hs * 1.32 + 14))
    fn = f'<div class="fn">{i} / {n}</div>' if l == "en" else f'<div class="fn">{i} من {n}</div>'
    fn = fn if n > 1 else ""
    body = f'{STORY_BG}<h1 class="h1" style="font-size:{hs}px">{h}</h1><p class="sub" style="top:{st}px">{s}</p>{inner}{top(l)}{fn}{r3_lib.FOOT[l]}'
    nm = r3_lib.name(pid, l, i)
    r3_lib.write(pid, nm, r3_lib.page(l, f"{nm} · {r3_lib.clean(h)}", body, ST_CSS, size=(1080, 1920)))


def phone(src, y0, top_=660, h=1040, w_src=1075):
    """A real phone capture in a plain frame, starting at source row y0 (below the app header)."""
    k = 568 / w_src
    return f'<div class="ph" style="top:{top_}px;height:{h}px"><img src="{src}" alt="" style="margin-top:{-y0 * k:.0f}px"><div class="fade"></div></div>'


def phone_chat(l, u, r, top_=660, h=1040):
    k = 568 / 300
    return (f'<div class="ph" style="top:{top_}px;height:{h}px;background:#F4F8FA"><div style="position:absolute;left:0;top:0;width:300px;height:{h / k:.0f}px;transform:scale({k:.3f});transform-origin:0 0">'
            f'{r3_lib.chat(l, u, r)}</div></div>')


from r3_lib import top  # noqa: E402


def i235():
    pid = "IDEA-235"
    h = ("Start here:<br><em>this is Stacko.</em>", "ابدأ هون:<br><em>هيدا ستاكو.</em>")
    s = ("Stock management for businesses with several warehouses.", "نظام إدارة المخازن للشركات اللي عندها أكتر من مستودع.")
    reg(pid, "highlight-start-here", "Story", h, s,
        ("Highlight: Start Here. Four stories: what Stacko is, who it's for, the problem, and how it works.", "هايلايت: ابدأ هون. أربع ستوريز: شو هو ستاكو، لمين، المشكلة، وكيف بيشتغل."),
        slides=[h, ("Built for importers<br><em>and distributors.</em>", "معمول للمستوردين<br><em>والموزّعين.</em>"),
                ("Nobody logs.<br><em>So nobody knows.</em>", "ما حدا بيسجّل.<br><em>فما حدا بيعرف.</em>"),
                ("Log a move.<br><em>Watch the truck drive.</em>", "سجّل الحركة.<br><em>وشوف الشاحنة ماشية.</em>")],
        note="Evergreen stories for the Start Here highlight (cover IDEA-186-01). Real demo-company captures (live map, phone), sidebar/header cropped.")
    sl = REG[pid]["slides"]
    for l in LS:
        t = T(l)
        cap = CAP(f"{l}-ph-owner-map")
        tiles = "".join(card(f'<div class="tile"><svg viewBox="0 0 24 24" style="width:96px;height:96px">{JI[k]}</svg><div><b>{b}</b><small>{c}</small></div></div>', 0)
                        for k, b, c in (("wh", t("Several warehouses", "أكتر من مستودع"), t("Branches, stores, a showroom.", "فروع، مخازن، صالة عرض.")),
                                        ("sea", t("Imports every month", "استيراد كل شهر"), t("Containers by sea and by air.", "كونتينرات بالبحر والجو.")),
                                        ("road", t("A team on the move", "فريق عالطريق"), t("Lebanon and the Gulf.", "لبنان والخليج."))))
        notes = "".join(f'<div class="nt" style="transform:rotate({r}deg);{al}">{x}</div>' for x, r, al in (
            (t("Which file is right?", "أي ملف الصح؟"), -3, ""), (t("Who moved the 12 fans?", "مين نقل الـ12 مروحة؟"), 2, "align-self:flex-end"),
            (t("Is the container in yet?", "وصل الكونتينر ولا لأ؟"), -2, "")))
        pages = [
            (h, s[l == "ar"], phone(cap, 560)),
            (sl[1], t("Several warehouses, monthly imports and a team on the road.", "أكتر من مستودع، استيراد كل شهر، وفريق عالطريق."), f'<div class="stk" style="top:700px">{tiles}</div>'),
            (sl[2], t("Logging feels like extra work, so the numbers drift.", "التسجيل بيبيّن شغل زيادة، فالأرقام بتضيع."),
             f'<div class="stk" style="top:780px">{notes}</div>' + f'<div class="stk" style="top:1420px">{EX(t("With Stacko, logging takes about 10 seconds, and every move shows on the map.", "مع ستاكو، التسجيل بياخد حوالي 10 ثواني، وكل حركة بتبيّن عالخريطة."))}</div>'),
            (sl[3], t("One message from the phone. The move lands on the live map.", "رسالة وحدة من التلفون. والحركة بتطلع عالخريطة المباشرة."),
             phone_chat(l, t("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"),
                        t('<span class="okc">Logged ✓</span> Beirut → Sidon is on the map, ETA 35m', '<span class="okc">تسجّلت ✓</span> بيروت ← صيدا عالخريطة، 35 دقيقة'))),
        ]
        for i, (hh, ss, inner) in enumerate(pages):
            story_page(pid, l, i + 1, len(pages), hh[l == "ar"], ss, inner)


def i236():
    pid = "IDEA-236"
    feats = [  # (headline EN, AR, sub EN, AR, capture, source row)
        ("Every warehouse<br><em>on one live map.</em>", "كل مستودعاتك<br><em>عخريطة وحدة مباشرة.</em>", "Units in stock, in transit and low-stock lines at a glance.", "الكميات، اللي عالطريق، والأصناف الناقصة، بنظرة وحدة.", "ph-owner-map", 560),
        ("Tap a building.<br><em>See its stock.</em>", "اكبس عالمبنى.<br><em>بتشوف كميّاته.</em>", "Capacity, inbound, outbound, low stock first.", "السعة، الداخل والطالع، والناقص أوّل.", "ph-owner-map-wh2", 1650),
        ("Log a move<br><em>in about 10 seconds.</em>", "سجّل الحركة<br><em>بحوالي 10 ثواني.</em>", "Transfers, receipts, issues and returns, from the phone.", "تحويلات، استلام، تسليم ومرتجعات، من التلفون.", "ph-hadi-newmove", 350),
        ("Or just send<br><em>a message.</em>", "أو بس ابعت<br><em>رسالة.</em>", "AI reads it and drafts the move.", "الذكاء الاصطناعي بيقراها وبيحضّر الحركة.", "chat", 0),
        ("Upload the invoice.<br><em>AI drafts the shipment.</em>", "ارفع الفاتورة.<br><em>والذكاء الاصطناعي بيحضّر الشحنة.</em>", "PDF, Excel or a photo. New items are flagged.", "PDF أو Excel أو صورة. الأصناف الجديدة بتنعلّم.", "ph-owner-doc", 350),
        ("Approve what matters,<br><em>from one list.</em>", "وافق عاللي بيهمّ،<br><em>من لائحة وحدة.</em>", "Nothing changes the stock until someone with rights approves it.", "ما في شي بيغيّر الرصيد قبل ما يوافق عليه حدا عنده الصلاحية.", "ph-owner-approvals", 350),
        ("Counts that end<br><em>with an adjustment.</em>", "جرد بيخلص<br><em>بتسوية واضحة.</em>", "Count a warehouse; the difference becomes a reviewed move.", "بتجرد المستودع، والفرق بيصير حركة بتنراجع.", "ph-owner-count", 350),
        ("Every move,<br><em>with a name and a time.</em>", "كل حركة<br><em>إلها اسم ووقت.</em>", "Any number traces back to who, what, when and where.", "كل رقم بيرجع لمين، شو، إيمتى ووين.", "ph-hadi-moves", 350),
        ("عربي أو English.<br><em>One tap.</em>", "عربي أو English.<br><em>بكبسة وحدة.</em>", "The full app in Arabic, right to left.", "التطبيق كامل بالعربي، من اليمين للشمال.", "ar-ph-owner-map", 560),
    ]
    h = (feats[0][0], feats[0][1])
    reg(pid, "highlight-features", "Story", h, (feats[0][2], feats[0][3]),
        ("Highlight: Features. One story per feature, each on a real Stacko screen (demo company).", "هايلايت: الميزات. ستوري لكل ميزة، كل وحدة عشاشة حقيقية من ستاكو (شركة تجريبية)."),
        slides=[(a, b) for a, b, *_ in feats],
        note="Evergreen stories for the Features highlight (cover IDEA-186-03). Real phone captures of the demo company, cropped below the app header (company name with '(demo)' left out). Only live features (product bible); the online store is left for its own posts.")
    for l in LS:
        t = T(l)
        for i, (he, ha, se, sa, capn, y0) in enumerate(feats):
            if capn == "chat":
                inner = phone_chat(l, t("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"),
                                   t('<span class="okc">Logged ✓</span> Beirut → Sidon is on the map, ETA 35m', '<span class="okc">تسجّلت ✓</span> بيروت ← صيدا عالخريطة، 35 دقيقة'))
            else:
                src = CAP(capn if capn.startswith("ar-") else f"{l}-{capn}")
                inner = phone(src, y0)
            story_page(pid, l, i + 1, len(feats), t(he, ha), t(se, sa), inner)


QI = {  # 24-unit line icons for the FAQ / Contact stories
    "box": '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    "team": '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 2 6 5.5"/>',
    "new": '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M12 9v6M9 12h6"/>',
    "file": '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    "stack": '<path d="M4 8l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
    "map": '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    "plan": '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 3v3M16 3v3M4 9h16M8 13.5l2.2 2.2L16 11"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
}
QI_CSS = """
.tl{display:flex;align-items:center;gap:30px}
.tl i{display:grid;place-items:center;flex:none;width:112px;height:112px;border-radius:50%;background:#E6F4F6}
.tl svg{width:60px;height:60px;stroke:var(--signal);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.tl b{display:block;font-size:42px;line-height:1.18;font-weight:600}
.tl small{display:block;font-size:28px;color:var(--deep);margin-top:6px;line-height:1.32}
.tl .ok{margin-inline-start:auto;flex:none;font-size:28px;font-weight:600;color:#0B7A87}
.ct b{font-size:46px;direction:ltr;unicode-bidi:isolate}
"""


def tiles(rows, top_):
    """A column of white cards: (icon, bold, small[, right-hand tag])."""
    out = ""
    for k, b, s, *ok in rows:
        tag = f'<span class="ok">{ok[0]}</span>' if ok else ""
        out += card(f'<div class="tl"><i><svg viewBox="0 0 24 24">{QI[k]}</svg></i><div><b>{b}</b>' + (f"<small>{s}</small>" if s else "") + f"</div>{tag}</div>", 0)
    return f'<div class="stk" style="top:{top_}px">{out}</div>'


def i237():
    pid = "IDEA-237"
    qs = [  # (question EN, AR, answer EN, AR); answers only from the product bible and the approved FAQ reels EDU-22/24/26
        ("Who is Stacko<br><em>made for?</em>", "لمين<br><em>معمول ستاكو؟</em>",
         "Trading and distribution businesses in Lebanon and the GCC, with several warehouses and frequent imports.",
         "شركات التجارة والتوزيع بلبنان والخليج، اللي عندها أكتر من مستودع واستيراد دايم."),
        ("How do staff<br><em>log a move?</em>", "كيف الفريق<br><em>بيسجّل الحركة؟</em>",
         "A message, a photo or a quick form, from the phone. About 10 seconds.",
         "برسالة، بصورة أو بفورم سريع، من التلفون. بحوالي 10 ثواني."),
        ("Where do I<br><em>see my stock?</em>", "وين بشوف<br><em>مخزني؟</em>",
         "On one live map: every warehouse, every shipment on the way, low stock first.",
         "عخريطة وحدة مباشرة: كل مستودع، كل شحنة عالطريق، والناقص أوّل."),
        ("Is my data<br><em>safe?</em>", "داتا شركتي<br><em>بأمان؟</em>",
         "Each company's data is kept separate, and access follows the roles you set.",
         "داتا كل شركة منفصلة عن غيرها، والصلاحيات حسب الأدوار اللي بتحدّدها."),
        ("How long does<br><em>setup take?</em>", "قدّيش بياخد<br><em>التشغيل؟</em>",
         "It depends on how many locations and products you have. We start from your current files.",
         "بيتوقّف على عدد المواقع والأصناف عندك. ومنبلّش من ملفاتك الحالية."),
        ("Can I see it<br><em>before I commit?</em>", "فيني شوفه<br><em>قبل ما إلتزم؟</em>",
         "Yes. It starts with a meeting with our team.",
         "أكيد. منبلّش باجتماع مع فريقنا."),
    ]
    reg(pid, "highlight-faq", "Story", (qs[0][0], qs[0][1]), (qs[0][2], qs[0][3]),
        ("Highlight: FAQ. Six short answers: who it's for, logging, the map, data, setup and seeing it first.",
         "هايلايت: أسئلة. ست أجوبة قصيرة: لمين، التسجيل، الخريطة، الداتا، التشغيل، وكيف بتشوفه قبل."),
        slides=[(a, b) for a, b, *_ in qs],
        note="Evergreen stories for the FAQ highlight (cover IDEA-186-05). Answers follow the product bible and the approved FAQ reels "
             "EDU-22 (data), EDU-24 (setup, no timeline promised) and EDU-26 (meeting first, no free trial promised). ERP connection left out. "
             "Real demo-company captures cropped below the app header.")
    for l in LS:
        t = T(l)
        inners = [
            tiles([("box", t("About 10,000 items", "حوالي 10,000 صنف"), t("With new items every month.", "مع أصناف جديدة كل شهر.")),
                   ("team", t("About 20 staff", "حوالي 20 موظف"), t("Spread over several warehouses.", "موزّعين على أكتر من مستودع.")),
                   ("pin", t("Lebanon and the GCC", "لبنان والخليج"), t("Branches, stores and a showroom.", "فروع، مخازن وصالة عرض."))], 760),
            phone_chat(l, t("sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"),
                       t('<span class="okc">Logged ✓</span> Beirut → Sidon is on the map, ETA 35m', '<span class="okc">تسجّلت ✓</span> بيروت ← صيدا عالخريطة، 35 دقيقة')),
            phone(CAP(f"{l}-ph-owner-map"), 560),
            phone(CAP(f"{l}-ph-owner-moves"), 400, h=760) + f'<div class="stk" style="top:1460px">{EX(t("Every change keeps who, what, when and where. A correction is a new entry, never an edit.", "كل تغيير بيحفظ مين، شو، إيمتى ووين. والتصحيح بيصير قيد جديد، مش تعديل."))}</div>',
            tiles([("stack", t("Your products", "أصنافك"), t("From your current files.", "من ملفاتك الحالية."), "✓"),
                   ("map", t("Your locations", "مواقعك"), t("Warehouses, branches, stores.", "مستودعات، فروع، مخازن."), "✓"),
                   ("file", t("Your opening stock", "رصيدك الافتتاحي"), t("So the team starts with real numbers.", "ليبلّش الفريق بأرقام حقيقية."), "✓")], 760),
            tiles([("map", t("We show you the live map", "منفرجيك الخريطة المباشرة"), t("On examples like yours.", "على أمثلة متل شغلك.")),
                   ("file", t("Bring a real invoice", "جيب فاتورة حقيقية"), t("And watch the draft it becomes.", "وشوف كيف بتصير مسودّة.")),
                   ("plan", t("A clear plan and a quote", "خطة واضحة وعرض سعر"), t("For your locations, users and setup.", "لمواقعك، المستخدمين والتشغيل."))], 760),
        ]
        for i, ((he, ha, se, sa), inner) in enumerate(zip(qs, inners)):
            story_page(pid, l, i + 1, len(qs), t(he, ha), t(se, sa), inner)


def i238():
    pid = "IDEA-238"
    h = ("Talk to<br><em>our team.</em>", "احكي<br><em>مع فريقنا.</em>")
    s = ("Ask us anything about Stacko. A person from our team will answer.", "اسألنا أي شي عن ستاكو. حدا من فريقنا بيجاوبك.")
    reg(pid, "highlight-contact", "Story", h, s,
        ("Highlight: Contact. www.stacko-lb.com · info@stacko-lb.com", "هايلايت: تواصل. www.stacko-lb.com · info@stacko-lb.com"),
        slides=[h], note="One evergreen story for the Contact highlight (cover IDEA-186-06). Website and business email only; no buttons.")
    for l in LS:
        t = T(l)
        inner = tiles([("globe", L("www.stacko-lb.com"), t("Book a meeting from the website.", "احجز اجتماع من الموقع.")),
                       ("mail", L("info@stacko-lb.com"), t("Write to us, in Arabic or English.", "راسلنا، بالعربي أو بالإنجليزي."))], 780)
        inner = inner.replace('class="tl"', 'class="tl ct"')
        inner += f'<div class="stk" style="top:1190px">{EX(t("We show you Stacko on examples like yours, then agree on a clear plan.", "منفرجيك ستاكو على أمثلة متل شغلك، وبعدين منتّفق على خطة واضحة."))}</div>'
        story_page(pid, l, 1, 1, h[l == "ar"], s[l == "ar"], inner)


PROFILE = {  # what goes in Instagram's Edit profile (the bio is exactly 150 characters, Instagram's limit)
    "username": "stacko.lb",  # placeholder: the plan prefers @stacko, then @stacko.inventory or @stacko.lb
    "name": "Stacko · Warehouse & Stock Management",
    "category": "Software company",
    "bio": "Your stock, always in sight · مخزنك دايماً قدّام عينك\nAll your warehouses on one live map\nImporters & distributors · Lebanon & GCC\nA product by AIPHIN",
    "link": "stacko-lb.com",
    "email": "info@stacko-lb.com",
}


def i239():
    """Profile picture: the Dot core mark alone on Abyss, sized to survive Instagram's circle crop. Same file in EN and AR."""
    from und_lib import page as upage
    pid = "IDEA-239"
    p = PROFILE
    reg(pid, "instagram-profile", "Profile", ("Profile picture", "صورة الحساب"), ("Stacko mark on Abyss", "شعار ستاكو"),
        (f"Name: {p['name']}\nCategory: {p['category']}\n\nBio:\n{p['bio']}\n\nLink: {p['link']}\nEmail button: {p['email']}",
         f"Name: {p['name']}\nCategory: {p['category']}\n\nBio:\n{p['bio']}\n\nLink: {p['link']}\nEmail button: {p['email']}"),
        note="Instagram profile: the profile picture (source/IDEA-239.html, 1080×1080, same in EN and AR) and the text for Edit profile "
             "(captions). Bio is 150 characters, Instagram's limit. Username is a placeholder until the handle is chosen. "
             "Full page preview: mockup/index.html (posts/build_profile_mockup.py).")
    d = POSTS / "unscheduled" / REG[pid]["folder"] / "source"
    d.mkdir(parents=True, exist_ok=True)
    css = """
.post.dark{background:radial-gradient(circle at 50% 46%,#1B4A78 0%,#0E2440 52%,#081A30 100%)}
.halo{position:absolute;left:50%;top:50%;width:900px;height:900px;margin:-450px;border-radius:50%;background:radial-gradient(circle,rgba(46,242,238,.16),rgba(46,242,238,0) 66%)}
.mk{position:absolute;left:50%;top:50%;width:820px;margin:-432px 0 0 -410px;filter:drop-shadow(0 24px 40px rgba(0,0,0,.45))}
"""
    body = '<div class="halo"></div><img class="mk" src="/assets/brand/logo/mark-dark.svg" alt="">'
    for l in LS:
        nm = f"{pid}{'-AR' if l == 'ar' else ''}"
        (d / f"{nm}.html").write_text(upage(l, f"{nm} · Instagram profile picture", body, css, size=(1080, 1080)), encoding="utf8")


ST_CSS += QI_CSS

if __name__ == "__main__":
    # The posts are fixed by hand after review (und_lib guard), so rebuild only what you name:
    #   python -I -X utf8 posts/build_page_kit.py --force --only i186 [--dump out.json]
    a = sys.argv[1:]
    only = a[a.index("--only") + 1].split(",") if "--only" in a else []
    for fn in (i232, i233, i234, i186, i235, i236, i237, i238, i239):
        if not only or fn.__name__ in only:
            fn()
    if "--dump" in a:
        dump(a[a.index("--dump") + 1])
    print("ok", list(REG))
