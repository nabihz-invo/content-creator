"""Round 3 (IDEA-188 … IDEA-231), EN + AR, as HTML only: plans/Stacko_New_Ideas_Round3.xlsx.
    python -I -X utf8 posts/build_idea_round3.py [out.json]

Copy follows the owner's rules (plans/Stacko design rules review comments and lessons.md), so it differs from the
sheet where the sheet breaks them: مخازن/مخزنك, "With Stacko" lines plus proof, no closing questions, no weekdays.
WooCommerce wording follows the connector in app/supabase/functions/_shared/connectors/woocommerce.ts: the shop is one
"Online store" location whose stock Stacko reads live; moves into or out of it change the shop's stock.
ERP is left off the visuals until the owner confirms it is live.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from r3_lib import (BG, CAP, MAP, PI, REG, ICON, WX, L, U, card, car, chat, crop, dump, invoice_to_pin, lebanon, phone_html, phone_shot,  # noqa: E402
                    POSTS, reg, routes, stars, static, story, strip, subway, tag, tile, write, page, name, top, FOOT, CSS)

T = lambda l: (lambda a, b: a if l == "en" else b)
LS = ("en", "ar")
BGI = lambda c: f'<img class="bg" src="{BG(c)}" alt="">'
PII = lambda c, css="": f'<img class="bg" src="{PI(c)}" alt=""' + (f' style="{css}"' if css else "") + ">"
EX = lambda x: f'<div class="ex">{x}</div>'
WC = "Your WooCommerce store"


def i188():
    h = ("Your business is one ecosystem.<br><em>Your systems should be too.</em>", "شغلك نظام واحد متكامل.<br><em>وأنظمتك كمان لازم تكون هيك.</em>")
    s = ("With Stacko, your online store, warehouses and trucks sit in one live view.", "مع ستاكو، متجرك أونلاين ومخازنك وشاحناتك بصورة وحدة مباشرة.")
    reg("IDEA-188", "one-ecosystem", "2027-06-12", "Static", h, s,
        ("Your online store and your warehouses describe the same business. Stacko brings their stock into one picture.",
         "متجرك أونلاين ومخازنك عم يحكوا عن نفس الشغل. ستاكو بيجمعهن بصورة وحدة."),
        note="ERP chip removed until the owner confirms ERP is live (sheet: keep only if live). Closing question removed from the caption.")
    for l in LS:
        t = T(l)
        x = (f'<img src="/assets/brand/logo/mark-dark.svg" alt="" style="position:absolute;left:506px;top:760px;width:68px;z-index:2">'
             + tag(250, 690, t("Warehouses", "مخازن")) + tag(640, 990, t("Online store", "متجر أونلاين")) + tag(310, 1000, t("Trucks", "شاحنات"))
             + strip(l, [(L("342"), t("Online store", "متجر أونلاين")), (L("7,507"), t("WH-01 Beirut", f"{L('WH-01')} بيروت")), (L("3"), t("Trucks on the road", "شاحنات عالطريق"))]))
        static("IDEA-188", l, PI("OB-41"), h[l == "ar"], s[l == "ar"], x, hs=t(58, 50))


def i189():
    h = ("One order,<br><em>from click to shelf.</em>", "طلبية وحدة.<br><em>متصلة من الكبسة للرف.</em>")
    s = ("With Stacko, follow one online sale through your stock.", "مع ستاكو، تابع بيعة أونلاين وحدة بكل مخازنك.")
    sl = [("A customer buys online.", "زبون اشترى أونلاين."), ("The order reaches the system on its own.", "الطلبية بتوصل عالنظام."),
          ("Your team sees the store is running low.", "فريقك بيشوف إنّو المتجر عم يخلص."), ("The team requests from another warehouse.", "الفريق بيطلب من مخزن ثاني."),
          ("One order,<br><em>zero retyping.</em>", "طلبية وحدة،<br><em>بلا إعادة كتابة.</em>")]
    reg("IDEA-189", "one-order-journey", "2026-12-12", "Carousel", h, s,
        ("Your WooCommerce store sells; Stacko sees it. The store's stock updates in Stacko on its own, and when you move stock to the shop, its number goes up on the store too. One sale, no retyping.",
         "متجرك على WooCommerce بيبيع، وستاكو بيشوف. كمية المتجر بتتحدّث بستاكو لحالها، ولمّا تنقل بضاعة عالمتجر، الرقم بيطلع عالموقع كمان. بيعة وحدة، بلا إعادة كتابة."),
        slides=[(h[0], h[1])] + sl,
        note="Owner review 2026-11-11: cover 'from click to shelf', متصلة instead of موصولة, slides 3 and 5 reworded, support line on the last slide. Slides reworded to what the connector does: the shop is one Online store location, no reservation of stock and no delivery tracking. Footer rule: 'click to shelf' replaces 'click to delivery'.")
    stops = [(340, 919), (434, 862), (673, 725), (804, 1059), (849, 631)]
    for l in LS:
        t = T(l)
        ring = lambda p: f'<div style="position:absolute;left:{p[0] - 52}px;top:{p[1] - 52}px;width:104px;height:104px;border-radius:50%;border:5px solid #fff;box-shadow:0 0 44px 12px rgba(46,242,238,.55)"></div>'
        strips = [
            strip(l, [(t("1 × Desk Lamp", f"{L('1 ×')} لمبة مكتب"), t("Sold on your store", "انباعت عالمتجر")), (t("Nobody", "ولا حدا"), t("had to type it", "اضطر يكتبها"))]),
            strip(l, [(t("Desk Lamp", "لمبة مكتب"), t("Online store", "متجر أونلاين")), (L("12 → 11"), t("Updated on its own", "تحدّثت لحالها"))]),
            strip(l, [(t("Desk Lamp", "لمبة مكتب"), t("Online store", "متجر أونلاين")), (t("3 left", f"{L('3')} باقيين"), t("Low stock alert", "تنبيه نقص"))]),
            strip(l, [(t("WH-01 → Online store", f"{L('WH-01')} ← المتجر"), t("Request · 40 lamps", f"طلب · {L('40')} لمبة")), (t("ETA 35m", f"{L('35')} دقيقة"), t("On the map", "عالخريطة"))]),
            strip(l, [(t("Online store", "متجر أونلاين"), t("Goes back up on the store", "الرقم بيطلع عالموقع")), (L("43"), t("In step, everywhere", "نفس الرقم بكل مكان"))]),
        ]
        slides = [dict(bg=PII("OB-42"), h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=ring(stops[0]))]
        for i, (e, a) in enumerate(sl):
            last = i == len(sl) - 1
            sub = t("The order arrives, the team sees it, the stock goes back up. Nobody types it twice.", "الطلبية بتوصل، الفريق بيشوفها، والمخزون بيرجع بيطلع. وما حدا بيكتبها مرتين.")
            slides.append(dict(bg=PII("OB-42"), h=(e if l == "en" else a), kick=t(f"Step {i + 1} of 5", f"خطوة {L(i + 1)} من {L(5)}"), extra=ring(stops[i]) + strips[i],
                               **({"s": f'<span style="color:#C9D8E4">{sub}</span>'} if last else {})))
        car("IDEA-189", l, slides, "one order")


def i190():
    h = ("Keep your systems.<br><em>Connect your operations.</em>", "خلّي أنظمتك.<br><em>ووصّل شغلك.</em>")
    s = ("With Stacko, the tools you already use connect to one live stock map.", "مع ستاكو، الأدوات اللي بتستعملها بتتوصّل بخريطة وحدة مباشرة.")
    reg("IDEA-190", "keep-your-systems", "2027-06-14", "Static", h, s,
        ("You don't have to throw away the tools your team already knows. Stacko connects to them and adds the live stock map on top.",
         "مش لازم تكبّ الأدوات اللي فريقك بيعرفها. ستاكو بيتوصّل فيها وبيزيد فوقها خريطة مخازنك المباشرة."))
    for l in LS:
        t = T(l)
        x = tag(485, 870, t("Stacko", "ستاكو")) + strip(l, [(t("Online store", "متجر أونلاين"), t("Connected", "موصول")), (t("Stock", "الكميات"), t("Live on the map", "مباشرة عالخريطة")), (t("Your tools", "أدواتك"), t("Stay as they are", "بيضلّوا متل ما هنّي"))])
        static("IDEA-190", l, PI("OB-43"), h[l == "ar"], s[l == "ar"], x)


def i191():
    h = ("Your branches<br><em>shouldn't be islands.</em>", "فروعك<br><em>ما لازم تكون جزر معزولة.</em>")
    s = ("With Stacko, five locations share one live map and every transfer is visible.", "مع ستاكو، خمس مواقع على خريطة وحدة مباشرة، وكل تحويلة ظاهرة.")
    reg("IDEA-191", "branches-islands", "2027-05-14", "Static", h, s,
        ("When every branch keeps its own numbers, every transfer becomes a phone call. Put them on one map.",
         "لمّا كل فرع بيحتفظ بأرقامه لحاله، كل تحويلة بتصير تلفون. حطّهن على خريطة وحدة."), note="Closing question removed from the caption.")
    for l in LS:
        t = T(l)
        # Owner review 2026-11-11: no city names (the islands are not real places), no bottom banner.
        x = tag(230, 722, L("WH-01")) + tag(610, 575, L("WH-02")) + tag(590, 800, L("WH-03")) + tag(870, 700, L("BR-01")) + tag(250, 995, L("BR-02"))
        static("IDEA-191", l, PI("OB-44"), h[l == "ar"], s[l == "ar"], x, css=".bg{transform:translateY(60px)}")


def i192():
    h = ("What should Stacko<br><em>connect to first?</em>", "مع شو لازم ستاكو<br><em>يتوصّل أوّل شي؟</em>")
    s = ("Online stores connect today. Tell us what runs your business.", "المتاجر أونلاين موصولة اليوم. قلّنا شو مشغّل شغلك.")
    sl = [("Your online store", "متجرك أونلاين"), ("Your accounting or ERP", "المحاسبة أو الـ ERP"), ("Your delivery company", "شركة التوصيل"), ("Comment the system you use.", "اكتب بالتعليقات النظام اللي بتستعمله.")]
    reg("IDEA-192", "what-to-connect-poll", "2027-05-11", "Carousel", h, s,
        ("We're choosing our next integrations with you. Comment the system your business uses and we'll read every answer.",
         "عم نختار شو نوصّل بعدين معكن. اكتبوا بالتعليقات النظام اللي بتستعملوه، ورح نقرا كل جواب."), slides=[h] + sl)
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        grid = '<div class="grid2">' + "".join(f'<div class="wc">{tile(k, b)}</div>' for k, b in (
            ("store", t("Online store", "متجر أونلاين")), ("erp", t("Accounting / ERP", "محاسبة / ERP")), ("truck", t("Delivery company", "شركة توصيل")), ("app", t("Your own app", "تطبيقك الخاص")))) + "</div>"
        car("IDEA-192", l, [
            dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[grid], col_top=520),
            dict(bg=B, h=sl[0][l == "ar"], kick=t("Option 1", f"خيار {L(1)}"), col=[card(tile("store", t("Stock on your store, in Stacko", "كميات متجرك، بستاكو"), t("Live today for WooCommerce. Which other platform should be next?", "شغّال اليوم مع WooCommerce. أي منصّة تانية بعدها؟")))], col_top=420),
            dict(bg=B, h=sl[1][l == "ar"], kick=t("Option 2", f"خيار {L(2)}"), col=[card(tile("erp", t("Items and costs, aligned", "أصناف وكلفة متطابقة"), t("No more exporting the same file every week.", "بلا ما تصدّر نفس الملف كل أسبوع.")))], col_top=420),
            dict(bg=B, h=sl[2][l == "ar"], kick=t("Option 3", f"خيار {L(3)}"), col=[card(tile("truck", t("Deliveries next to your stock", "التوصيل حدّ مخازنك"), t("See what left and what arrived, in the same place.", "شوف شو طلع وشو وصل، بنفس المكان.")))], col_top=420),
            dict(bg=B, h=sl[3][l == "ar"], col=[grid, EX(t("Your answers decide what we connect next.", "جوابكن بيحدّد شو منوصّل بعدين."))], col_top=430),
        ], "connect poll")


def i193():
    h = ("PDF, Excel or a photo.<br><em>One language for your stock.</em>", f"{L('PDF')} أو {L('Excel')} أو صورة.<br><em>لغة وحدة لمخزنك.</em>")
    s = ("With Stacko, AI reads the supplier invoice in any of these and creates the items.", "مع ستاكو، الذكاء الاصطناعي بيقرا فاتورة المورّد بأي شكل، وبيعمل الأصناف.")
    reg("IDEA-193", "pdf-excel-photo", "2027-05-15", "Static", (h[0], "PDF أو Excel أو صورة. لغة وحدة لمخزنك."), s,
        ("Suppliers send invoices in every format. Stacko reads all three and turns them into the same clean items and incoming shipment.",
         "الموردين بيبعتوا فواتير بكل الأشكال. ستاكو بيقرا التلاتة، وبيحوّلهن لنفس الأصناف المرتّبة وشحنة واردة."))
    for l in LS:
        t = T(l)
        x = (tag(260, 505, "PDF") + tag(395, 560, "Excel") + tag(250, 700, t("Photo", "صورة")) + tag(800, 900, t("12 items created ✓", f"انعملوا {L('12')} صنف ✓"))
             + strip(l, [(L("INV-2291"), t("Supplier invoice", "فاتورة مورّد")), (L("12"), t("Items created", "صنف انعمل")), (L("SHP-24021"), t("Incoming shipment", "شحنة واردة"))]))
        static("IDEA-193", l, PI("OB-45"), h[l == "ar"], s[l == "ar"], x, css=".bg{transform:translateY(120px)}", hs=t(62, 52))


def i194():
    h = ("Enter it once.<br><em>Keep everything in sync.</em>", "دخّلها مرّة وحدة.<br><em>وكل شي بيضلّ متطابق.</em>")
    s = ("With Stacko, online sales reach your stock without retyping.", "مع ستاكو، البيعات أونلاين بتوصل مخازنك بلا إعادة كتابة.")
    reg("IDEA-194", "enter-it-once", "2027-01-11", "Static", h, s,
        ("Every time the same order is typed twice, a mistake gets a second chance. With WooCommerce connected, your online store's stock updates in Stacko without retyping.",
         "كل مرّة بتنكتب نفس الطلبية مرّتين، الغلطة بتاخد فرصة تانية. لمّا يكون WooCommerce موصول، كمية متجرك أونلاين بتتحدّث بستاكو بلا إعادة كتابة."))
    for l in LS:
        t = T(l)
        x = tag(760, 330 + 110, t("Logged once ✓", "تسجّلت مرّة ✓"))
        static("IDEA-194", l, PI("OB-46"), h[l == "ar"], s[l == "ar"], x)


def i195():
    h = ("Your online store and your stock,<br><em>finally talking.</em>", "موقعك الإلكتروني ومخزنك،<br><em>أخيراً عم يحكوا مع بعض.</em>")
    s = ("With Stacko, the stock on your website stays matched with your warehouse, on the same map.", "مع ستاكو، الكمية الموجودة بموقعك بتضلّ مطابقة مع المخزن وعلى نفس الخريطة.")
    reg("IDEA-195", "online-store-launch", "2026-11-21", "Static", h, s,
        ("New: Stacko now connects to WooCommerce. Your store knows what sold, your warehouses know what's left, and now they know it at the same time.\nIf you run a WooCommerce store, message us.",
         "جديد: ستاكو صار يتوصّل بـWooCommerce. متجرك بيعرف شو انباع، ومخازنك بتعرف شو باقي، وهلّق بيعرفوا بنفس الوقت.\nإذا عندك متجر على WooCommerce، راسلنا."),
        note="'New' moved from a chip to a kicker (no status chips). WooCommerce named in the caption only. Caption question turned into a statement.")
    for l in LS:
        t = T(l)
        x = f'<div class="kick" style="top:128px;font-size:26px;letter-spacing:.04em;text-transform:none">{t("New: online store connection", "جديد: ربط الموقع الإلكتروني")}</div>'
        static("IDEA-195", l, PI("OB-47"), h[l == "ar"], s[l == "ar"], x, hs=t(58, 52), css=".h1{top:200px}.sub{margin-top:30px}.bg{transform:translateY(120px)}")


def i196():
    h = ("Connected<br><em>by Stacko.</em>", "كل شغلك<br><em>بيحكي مع ستاكو.</em>")
    s = ("With Stacko, your store, your phone and your invoices feed one live map.", "مع ستاكو، متجرك وتلفونك وفواتيرك بيغذّوا خريطة وحدة مباشرة.")
    sl = [("Online store:<br><em>stock stays in step.</em>", "المتجر أونلاين:<br><em>الكميات متطابقة.</em>"), ("From your phone:<br><em>ask and log in a chat.</em>", "من تلفونك:<br><em>إسأل وسجّل بمحادثة.</em>"),
          ("AI documents:<br><em>invoices become items.</em>", "المستندات بالذكاء الاصطناعي:<br><em>الفواتير بتصير أصناف.</em>"), ("Your stock,<br><em>always in sight.</em>", "مخزنك<br><em>دايماً قدّام عينك.</em>")]
    reg("IDEA-196", "connected-by-stacko", "2027-06-16", "Carousel", h, s,
        ("Stacko isn't another island of data. Here's how it connects to the rest of your business.", "ستاكو مش جزيرة بيانات جديدة. هيك بيحكي مع باقي شغلك."),
        slides=[h] + sl, note="ERP / accounting slide removed until confirmed. 5 slides instead of 6. Tagline uses مخزنك per the owner's wording rule; the brand guide still has the old form until decided.")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        car("IDEA-196", l, [
            dict(bg=PII("OB-41"), h=h[l == "ar"], s=s[l == "ar"], cover=True),
            dict(bg=B, h=sl[0][l == "ar"], col=[U.rowscard([(t("Desk Lamp", "لمبة مكتب"), t("Sold on your store", "انباعت عالمتجر"), L("12 → 11"), "okc"), (t("USB-C Cable", f"كابل {L('USB-C')}"), t("Moved to the shop", "انتقلت عالمتجر"), L("+40"), "okc")], t("Both directions", "بالاتجاهين")), EX(t("Your store's sales show in Stacko. Stacko's moves show on your store.", "بيعات متجرك بتبيّن بستاكو. وحركات ستاكو بتبيّن عمتجرك."))], col_top=420),
            dict(bg=B, h=sl[1][l == "ar"], col=[U.chatcard(t("Sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"), t("Logged ✓ Transfer on the map, ETA 35m", f"تسجّلت ✓ التحويلة عالخريطة، {L('35')} دقيقة")), EX(t("One message logs the move. One question gets the number.", "رسالة وحدة بتسجّل الحركة. وسؤال واحد بيجيب الرقم."))], col_top=420),
            dict(bg=B, h=sl[2][l == "ar"], col=[U.rowscard([(L("INV-2291"), t("PDF, Excel or a photo", "PDF أو Excel أو صورة"), t("12 items", f"{L('12')} صنف"), "okc"), (L("SHP-24021"), t("Incoming shipment created", "انعملت شحنة واردة"), "✓", "okc")], t("Supplier invoice", "فاتورة مورّد")), EX(t("Upload it once. The items and the shipment appear.", "ارفعها مرّة. الأصناف والشحنة بيطلعوا."))], col_top=430),
            dict(bg=B, h=sl[3][l == "ar"], col=[U.mapcard(), EX(t("Stacko: the stock management system built for several warehouses.", "ستاكو: نظام إدارة المخازن المعمول لأكتر من مستودع."))], col_top=420),
        ], "connected by Stacko")


def i197():
    h = ("Your stock has<br><em>a network map.</em>", "مخازنك كلها موصولة<br><em>مثل شبكة القطارات.</em>")
    s = ("With Stacko, warehouses are stations and transfers are trains. Nothing gets lost in between.", "مع ستاكو، المستودعات محطّات والتحويلات قطارات. وما في شي بيضيع بالنص.")
    reg("IDEA-197", "network-map", "2027-05-12", "Static", h, s,
        ("If your stock moved like a metro, you'd know every station, every line and every arrival time. That's the idea behind the Stacko map.",
         "لو مخزنك بيتحرّك متل المترو، كنت بتعرف كل محطة وكل خط وكل وقت وصول. هيدي فكرة خريطة ستاكو."))
    for l in LS:
        t = T(l)
        x = f'<div class="pn" style="top:520px;height:590px">{subway(l)}</div>' + tag(600, 720, t("ETA 35m", f"{L('35')} دقيقة"))
        static("IDEA-197", l, BG("BG-56"), h[l == "ar"], s[l == "ar"], x)


def i198():
    h = ("One tower.<br><em>Every warehouse in view.</em>", "برج واحد.<br><em>وكل المستودعات قدّام عينك.</em>")
    s = ("With Stacko, the owner sees stock, trucks and shipments on one live map.", "مع ستاكو، صاحب الشغل بيشوف المخازن والشاحنات والشحنات على خريطة وحدة مباشرة.")
    reg("IDEA-198", "control-tower", "2027-05-08", "Static", h, s,
        ("Air traffic control doesn't call every plane. It looks at one screen. Your stock deserves the same.",
         "برج المراقبة ما بيتّصل بكل طيارة. بيطلّع بشاشة وحدة. مخزنك بيستاهل نفس الشي."))
    for l in LS:
        t = T(l)
        x = strip(l, [(L("4"), t("Warehouses", "مستودعات")), (L("3"), t("Trucks on the road", "شاحنات عالطريق")), (L("1"), t("Container at sea", "حاوية بالبحر"))])
        static("IDEA-198", l, PI("OB-48"), h[l == "ar"], s[l == "ar"], x, css=".bg{transform:translateY(-40px) scale(1.04)}")


def i199():
    h = ("Your warehouse has a twin.<br><em>It lives on the map.</em>", "مستودعك إلو توأم.<br><em>عايش عالخريطة.</em>")
    s = ("With Stacko, every box on the shelf is also on the screen, in real time.", "مع ستاكو، كل كرتونة عالرف كمان عالشاشة، بنفس اللحظة.")
    reg("IDEA-199", "warehouse-twin", "2027-05-17", "Static", h, s,
        ("Every time someone logs a move, the twin changes too. That's how the map stays true.", "كل مرّة حدا بيسجّل حركة، التوأم بيتغيّر كمان. هيك الخريطة بتضلّ صحيحة."))
    for l in LS:
        t = T(l)
        x = tag(275, 985, t("On the shelf", "عالرف")) + tag(800, 985, t("On the map", "عالخريطة"))
        static("IDEA-199", l, PI("OB-49"), h[l == "ar"], s[l == "ar"], x, hs=t(60, 54))


def i200():
    h = ("The port outside.<br><em>The map inside.</em>", "المرفأ برّا.<br><em>والخريطة جوّا.</em>")
    s = ("With Stacko, see every container from your desk, leg by leg.", "مع ستاكو، بتشوف كل حاوية من مكتبك، مرحلة بمرحلة.")
    reg("IDEA-200", "port-outside-map-inside", "2027-05-18", "Static", h, s,
        ("You don't need a view of the port to know where your container is.", "ما بدّك منظر عالمرفأ لتعرف وين حاويتك."),
        note="Owner review 2026-11-11: photo and map in two stacked panels (no reflection), dotted route between them, shipment chip on the map. 'day 24' is sample data.")
    for l in LS:
        t = T(l)
        # the cleaned live-map capture (2065x1415; the Arabic one is mirrored), map area only
        mx0, k = (60, 952 / 1150) if l == "en" else (855, 952 / 1150)
        mapimg = (f'<div style="position:absolute;inset:0;background:#EAF1F5 url({CAP(l + "-map-clean")}) no-repeat;'
                  f'background-size:{2065 * k:.0f}px auto;background-position:{-mx0 * k:.0f}px {-500 * k:.0f}px"></div>')
        chip = (f'<div style="position:absolute;left:22px;bottom:22px;background:rgba(14,36,64,.92);color:#fff;border-radius:18px;padding:12px 20px;font-size:24px;font-weight:600;line-height:1.35;box-shadow:0 10px 26px rgba(0,0,0,.35)" dir="{"rtl" if l == "ar" else "ltr"}">'
                f'{L("SHP-24021")} · {t("at sea", "بالبحر")} · {t("day 24", "نهار " + L("24"))}<br><span style="font-weight:400;color:#C9D8E4">{t("Shenzhen → Beirut", "شنزن ← بيروت")}</span></div>')
        # Owner review 2026-11-12: one city in the map and the chip -> the Beirut warehouse (capture x 480 / 1220, y 680)
        pin = f'<div style="position:absolute;left:{t(343, 297)}px;top:158px;width:30px;height:30px;border-radius:50%;background:#0895A6;border:4px solid #fff;box-shadow:0 0 0 8px rgba(8,149,166,.25)"></div>'
        x = (f'<div style="position:absolute;left:64px;right:64px;top:{t(410, 440)}px;height:340px;border-radius:28px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.45)">'
             f'<img src="{PI("SC-17")}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 46%"></div>'
             f'<div style="position:absolute;left:64px;right:64px;top:{t(830, 850)}px;height:380px;border-radius:28px;overflow:hidden;background:#0E2440;border:10px solid #0E2440;box-sizing:border-box;box-shadow:0 0 0 2px #79C0DE,0 20px 50px rgba(0,0,0,.45)">'
             f'{mapimg}{pin}{chip}</div>'
             f'<svg width="1080" height="1350" style="position:absolute;left:0;top:0;pointer-events:none"><path d="M430 {t(640, 670)} C 430 {t(760, 790)}, {t(422, 376)} {t(820, 840)}, {t(422, 376)} {t(988, 1008)}" fill="none" stroke="#0895A6" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>'
             f'<circle cx="430" cy="{t(640, 670)}" r="9" fill="#0895A6" stroke="#fff" stroke-width="3"/></svg>')
        static("IDEA-200", l, BG("BG-56"), h[l == "ar"], s[l == "ar"], x)


def i201():
    h = ("Guesses are dotted lines.<br><em>Logs make them solid.</em>", "التخمين خطوط منقّطة.<br><em>والتسجيل بيخلّيها صلبة.</em>")
    s = ("With Stacko, every logged move turns a guess into a fact on the map.", "مع ستاكو، كل حركة مسجّلة بتحوّل التخمين لحقيقة عالخريطة.")
    sl = [("“I think it left this morning.”", "«بظن طلعت الصبح.»"), ("Logged by Hadi.<br><em>The line turns solid.</em>", "سجّلها هادي.<br><em>الخط صار صلب.</em>"),
          ("Logged by Lina.<br><em>Another one.</em>", "سجّلتها لينا.<br><em>خط تاني.</em>"), ("Every move logged.<br><em>Every line solid.</em>", "كل حركة مسجّلة.<br><em>كل خط صلب.</em>")]
    reg("IDEA-201", "dotted-lines-solid", "2027-05-19", "Carousel", h, s,
        ("A map is only as good as the moves on it. Each 10-second log draws one more solid line.", "الخريطة قدّ الحركات اللي عليها. كل تسجيل بـ10 ثواني بيرسم خط صلب زيادة."), slides=[h] + sl)
    for l in LS:
        t = T(l)
        B = BGI("BG-58") + '<div style="position:absolute;inset:0;background:rgba(10,26,46,.55)"></div>'
        hl = t("Logged by Hadi", "سجّلها هادي")
        ll = t("Logged by Lina", "سجّلتها لينا")
        car("IDEA-201", l, [
            dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=routes(l, 0)),
            dict(bg=B, h=sl[0][l == "ar"], extra=routes(l, 0) + strip(l, [(t("No log", "ما في تسجيل"), t("Just a phone call", "بس تلفون")), (t("No ETA", "ما في وقت وصول"), t("Nobody is sure", "ما حدا متأكد"))])),
            dict(bg=B, h=sl[1][l == "ar"], extra=routes(l, 1, [(340, 520, hl)]) + strip(l, [(t("Tripoli → Jounieh", "طرابلس ← جونية"), hl), (t("10 seconds", f"{L('10')} ثواني"), t("From his phone", "من تلفونه"))])),
            dict(bg=B, h=sl[2][l == "ar"], extra=routes(l, 2, [(340, 520, hl), (710, 540, ll)]) + strip(l, [(t("Jounieh → Zahle", "جونية ← زحلة"), ll), (t("10 seconds", f"{L('10')} ثواني"), t("From her phone", "من تلفونها"))])),
            dict(bg=B, h=sl[3][l == "ar"], extra=routes(l, 4) + strip(l, [(L("4"), t("Moves logged", "حركات مسجّلة")), (L("0"), t("Guesses left", "تخمينات باقية")), (t("Live", "مباشر"), t("On the map", "عالخريطة"))])),
        ], "dotted lines")


def i202():
    h = ("Every warehouse, every branch,<br><em>every box on one map.</em>", "كل مخزن، كل فرع،<br><em>كل كرتونة على خريطة وحدة.</em>")
    s = ("With Stacko, businesses see every box, wherever their stock is.", "مع ستاكو، الشركات بتشوف كل كرتونة، وين ما كان مخزونها.")
    reg("IDEA-202", "tripoli-to-tyre", "2027-05-07", "Static", h, s,
        ("For the people who keep shelves full: every warehouse, branch and box on one live map.", "للناس اللي بيعبّوا الرفوف: كل مخزن وفرع وكرتونة على خريطة وحدة مباشرة."),
        note="Owner review 2026-11-11: no city names or counts (Stacko is not limited to these cities), no 'made in' wording.")
    for l in LS:
        t = T(l)
        x = tag(470, 480, t("Warehouse", "مخزن")) + tag(470, 620, t("Branch", "فرع")) + tag(470, 770, t("Shop", "محل")) + tag(470, 925, t("Port", "مرفأ")) + tag(470, 1070, t("Warehouse", "مخزن"))
        static("IDEA-202", l, PI("OB-50"), h[l == "ar"], s[l == "ar"], x, css=".bg{transform:translateY(90px)}.shade-t{height:700px}", hs=t(66, 52))


def i203():
    h = ("Connect the dots.<br><em>Every warehouse, one picture.</em>", "وصّل النقط.<br><em>كل المستودعات، صورة وحدة.</em>")
    s = ("With Stacko, your branches join up like a constellation.", "مع ستاكو، فروعك بتتوصّل متل مجموعة نجوم.")
    reg("IDEA-203", "connect-the-dots", "2027-05-20", "Static", h, s,
        ("Separately they're just dots. Connected, they're your business.", "كل واحد لحاله مجرّد نقطة. موصولين، هنّي شغلك."))
    for l in LS:
        t = T(l)
        x = stars(l) + tag(440, 810, t("Truck · ETA 35m", f"شاحنة · {L('35')} دقيقة"))
        static("IDEA-203", l, BG("BG-62"), h[l == "ar"], s[l == "ar"], x, hs=t(60, 52))


def i204():
    h = ("Three trucks.<br><em>Zero calls.</em>", "تلات شاحنات.<br><em>ولا تلفون.</em>")
    s = ("With Stacko, every transfer on the road shows its ETA.", "مع ستاكو، كل تحويلة عالطريق بيبيّن وقت وصولها.")
    reg("IDEA-204", "three-trucks-zero-calls", "2027-05-21", "Static", h, s,
        ("The calmest map is the one where nothing needs a phone call.", "أهدى خريطة هي اللي ما بدها ولا تلفون."), note="Zahle route replaced by Dubai → Abu Dhabi: location lists include the UAE; each route stays inside one country.")
    for l in LS:
        t = T(l)
        rows = [(t("Beirut → Sidon", "بيروت ← صيدا"), "", L("35m") if l == "en" else f"{L('35')} دقيقة", "okc"), (t("Tripoli → Jounieh", "طرابلس ← جونية"), "", L("1h 10m") if l == "en" else f"ساعة و{L('10')} دقايق", "okc"), (t("Dubai → Abu Dhabi", "دبي ← أبو ظبي"), "", L("1h 20m") if l == "en" else f"ساعة و{L('20')} دقيقة", "okc")]
        x = f'<div class="col" style="top:400px">{U.mapcard(img="map-crop.jpg")}{U.rowscard(rows)}</div>'
        static("IDEA-204", l, BG("BG-58"), h[l == "ar"], s[l == "ar"], x, hs=t(76, 62), css=".wc.pc.mapc img{max-height:330px;object-fit:cover}")


def i205():
    h = ("This week's<br><em>stock weather.</em>", "طقس المخازن<br><em>هالأسبوع.</em>")
    s = ("With Stacko, read every branch like a weather report.", "مع ستاكو، اقرا كل فرع متل نشرة الطقس.")
    reg("IDEA-205", "stock-weather-report", "2027-05-10", "Static", h, s,
        ("Clear skies in Beirut, a few showers in Sidon. Here's how we'd read your stock if it were a weather report.", "الطقس صافي ببيروت، وشوية شتي بصيدا. هيك منقرا مخازنك لو كانت نشرة طقس."), note="Closing question removed from the caption. 'Report', never 'forecast'.")
    for l in LS:
        t = T(l)
        data = [("sun", t("Beirut", "بيروت"), t("Clear", "صافي"), t("Fully stocked", "مخازن مليانة")), ("rain", t("Sidon", "صيدا"), t("Showers", "شتي"), t("3 low-stock items", f"{L('3')} أصناف ناقصة")),
                ("part", t("Tripoli", "طرابلس"), t("Clearing", "عم يصفى"), t("Transfer arriving 2 PM", f"تحويلة واصلة {L('2 PM')}")), ("sun", t("Dubai", "دبي"), t("Clear", "صافي"), t("Fully stocked", "مخازن مليانة"))]
        rw = "".join(f'<div class="rw2" style="gap:24px"><svg viewBox="0 0 48 48" style="width:68px;height:68px;flex:none;stroke:var(--signal);fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round">{WX[k]}</svg><b style="font-size:36px;width:170px">{c}</b><span class="sp" style="font-size:28px;color:var(--abyss)">{d}</span><span class="okc" style="font-size:30px">{w}</span></div>' for k, c, w, d in data)
        x = f'<div class="col" style="top:440px">{card(f"<div class=rws>{rw}</div>")}</div>'
        static("IDEA-205", l, BG("BG-63"), h[l == "ar"], s[l == "ar"], x, hs=t(76, 62))


def i206():
    h = ("Start-of-week<br><em>stock weather.</em>", "طقس المخازن،<br><em>أول الأسبوع.</em>")
    s = ("What's the weather in your warehouse today?", "شو الطقس بمخزنك اليوم؟")
    reg("IDEA-206", "stock-weather-story", "2027-05-10", "Story", h, s, ("— (Story)", "— (ستوري)"), note="Headline drops the weekday (rule 19). Poll options are the layout for the real Instagram poll sticker. Recurring: change the wording each week.")
    for l in LS:
        t = T(l)
        o = "".join(f'<div class="opt"><span>{e}</span>{x}</div>' for e, x in (("☀️", t("All clear", "صافي")), ("🌧️", t("Showers", "شتي")), ("⛈️", t("Storm", "عاصفة"))))
        story("IDEA-206", l, BG("BG-64"), h[l == "ar"], s[l == "ar"], f'<div class="opts">{o}</div>')


def i207():
    h = ("From foggy numbers<br><em>to a clear view.</em>", "من أرقام مغبّشة<br><em>لنظرة واضحة.</em>")
    s = ("With Stacko, every move is logged and the picture clears.", "مع ستاكو، كل حركة بتتسجّل والصورة بتوضح.")
    reg("IDEA-207", "foggy-to-clear", "2027-05-22", "Static", h, s,
        ("Foggy numbers aren't wrong on purpose. They're just old. Live logs wipe the glass.", "الأرقام المغبّشة مش غلط عن قصد. بس قديمة. التسجيل المباشر بيمسح الإزاز."))
    for l in LS:
        t = T(l)
        x = tag(360, 800, t("Before", "قبل")) + tag(750, 700, t("With Stacko", "مع ستاكو")) + strip(l, [(t("Before: 3 files", f"قبل: {L('3')} ملفات"), t("Three different numbers", "تلات أرقام مختلفة")), (t("With Stacko: 1 map", "مع ستاكو: خريطة وحدة"), t("One live number", "رقم واحد مباشر"))])
        static("IDEA-207", l, PI("OB-51"), h[l == "ar"], s[l == "ar"], x, css=".bg{transform:translateY(60px)}")


def i208():
    h = ("You left at 6.<br><em>Your stock kept logging.</em>", f"فلّيت الساعة {L('6')}.<br><em>ومخزنك ضلّ يتسجّل.</em>")
    s = ("With Stacko, evening receipts and transfers land on the map while you're home.", "مع ستاكو، الاستلامات والتحويلات المسائية بتوصل عالخريطة وإنت بالبيت.")
    reg("IDEA-208", "you-left-at-6", "2027-05-24", "Static", (h[0], "فلّيت الساعة 6. ومخزنك ضلّ يتسجّل."), s,
        ("The night shift logs, the map updates, and tomorrow starts with the right numbers.", "فريق الليل بيسجّل، الخريطة بتتحدّث، وبكرا بيبلّش بالأرقام الصح."), note="Real map on the laptop screen (rule 10); the log card sits beside it.")
    m = "matrix3d(0.377531,-0.161676,0,-0.000223,-0.118253,0.563106,0,-0.000047,0,0,1,0,705.25674,915.90273,0,1)"
    for l in LS:
        t = T(l)
        rows = [(t("7:40 PM", L("7:40 PM")), t("Received 120 × USB-C Cable · WH-02", f"استلام {L('120')} × كابل {L('USB-C')} · {L('WH-02')}"), t("Omar", "عمر"), "okc"), (t("8:15 PM", L("8:15 PM")), t("Transfer · Beirut → Sidon", "تحويلة · بيروت ← صيدا"), t("Hadi", "هادي"), "okc")]
        x = (f'<div class="scr" style="width:420px;height:284px;transform:{m}"><img src="{MAP("map-zoom")}" alt=""></div>'
             + f'<div style="position:absolute;left:64px;top:560px;width:600px">{U.rowscard(rows, t("Logged tonight", "تسجّل الليلة")).replace("left:64px", "")}</div>')
        static("IDEA-208", l, PI("SC-18"), h[l == "ar"], s[l == "ar"], x, css=".strip{display:none}div>.wc.pc{position:static}.rw2{font-size:25px;gap:12px}.rw2 .sp{font-size:23px}")


def i209():
    h = ("From invoice to map pin.<br><em>One line.</em>", "من الفاتورة لدبّوس عالخريطة.<br><em>خط واحد.</em>")
    s = ("With Stacko, upload the invoice and the shipment appears on the map.", "مع ستاكو، ارفع الفاتورة والشحنة بتطلع عالخريطة.")
    reg("IDEA-209", "invoice-to-map-pin", "2027-05-25", "Static", h, s,
        ("Most of the work between an invoice and a map pin is typing. Stacko skips it.", "أغلب الشغل بين الفاتورة والدبّوس عالخريطة هو كتابة. ستاكو بيوفّرها."))
    for l in LS:
        t = T(l)
        static("IDEA-209", l, BG("BG-56"), h[l == "ar"], s[l == "ar"], invoice_to_pin(l), css=".h1 em{color:var(--dolphin)}", hs=t(64, 50))


def i210():
    h = ("Same stock.<br><em>Less noise.</em>", "نفس المخازن.<br><em>ضجّة أقل.</em>")
    s = ("With Stacko, the same week of moves goes from notes to the map.", "مع ستاكو، نفس حركات الأسبوع بتنتقل من الورق للخريطة.")
    sl = [("This week's moves,<br><em>the usual way.</em>", "حركات هالأسبوع،<br><em>عالطريقة المعتادة.</em>"), ("The same moves,<br><em>logged.</em>", "نفس الحركات،<br><em>مسجّلة.</em>"), ("The same moves,<br><em>on the map.</em>", "نفس الحركات،<br><em>عالخريطة.</em>")]
    reg("IDEA-210", "same-stock-less-noise", "2027-05-26", "Carousel", h, s,
        ("Nothing changed in the warehouse. Only how clearly you can see it.", "ما تغيّر شي بالمستودع. بس قدّيش فيك تشوفه بوضوح."), slides=[h] + sl, note="'Monday's moves' changed to 'This week's moves' (no weekdays).")
    notes_en = ["40 LED strips → Sidon??", "Hadi took 12 lamps", "Beirut 20 cables, ask Omar", "who moved the fans?", "container: call Rami"]
    notes_ar = ["40 لمبة LED ← صيدا؟؟", "هادي أخد 12 لمبة", "بيروت 20 كابل، إسأل عمر", "مين نقل المراوح؟", "الحاوية: تلفون لرامي"]
    pos = [(70, 470, -5, "#fff"), (560, 500, 4, "#BCE5E0"), (120, 760, 3, "#C9D8E4"), (590, 790, -4, "#fff"), (290, 1000, -2, "#BCE5E0")]
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        ns = notes_en if l == "en" else notes_ar
        notes = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:430px;min-height:200px;background:{c};transform:rotate({r}deg);padding:32px;font-size:38px;line-height:1.3;font-weight:500;color:var(--abyss);box-shadow:0 18px 40px rgba(14,36,64,.22);border-radius:6px">{n}</div>' for (x, y, r, c), n in zip(pos, ns))
        rows = [(t("LED Strip 5m", "لمبات LED"), t("Beirut → Sidon", "بيروت ← صيدا"), "40", "okc"), (t("Desk Lamp", "لمبة مكتب"), t("Hadi · issue", "هادي · إخراج"), "12", "okc"), (t("USB-C Cable", f"كابل {L('USB-C')}"), t("Omar · Beirut", "عمر · بيروت"), "20", "okc"), (t("Desk Fan", "مروحة"), t("Lina · transfer", "لينا · تحويلة"), "6", "okc"), (L("SHP-24021"), t("Rami · at sea", "رامي · بالبحر"), "✓", "okc")]
        car("IDEA-210", l, [
            dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[U.mapcard()], col_top=540),
            dict(bg=B, h=sl[0][l == "ar"], extra=notes),
            dict(bg=B, h=sl[1][l == "ar"], col=[U.rowscard(rows), EX(t("Every move has a name, a place and a time.", "كل حركة إلها اسم ومكان ووقت."))], col_top=420),
            dict(bg=B, h=sl[2][l == "ar"], col=[U.mapcard(), EX(t("The moves become trucks you can follow.", "الحركات بتصير شاحنات فيك تتابعها."))], col_top=420),
        ], "same stock", theme="light")


def box_talk(pid, l, img, quote, s, x, css="", flip_ar=False):
    t = T(l)
    tp = 620 if l == "en" else 650
    flip = flip_ar and l == "ar"
    side = "right:64px!important;left:auto!important" if flip else "left:64px!important;right:auto!important"
    bg = f'<img class="bg" src="{img}" alt=""' + (' style="transform:scaleX(-1)"' if flip else "") + ">"
    body = f"""{bg}<div class="shade-b"></div>
<div class="bub">{quote}</div>
<p class="sub" style="top:{tp}px;width:500px;{side};color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.7)">{s}</p>
{x}
{top(l)}
{FOOT[l]}"""
    nm = name(pid, l)
    write(pid, nm, page(l, f"{nm} · Box Talk", body, CSS + css))


def i211():
    h = ("“I've been on this shelf<br><em>for five months. Nobody noticed.”</em>", "«صرلي خمس أشهر عهالرف.<br><em>وما حدا انتبه.»</em>")
    s = ("With Stacko, every item keeps its last move date, so forgotten stock shows up.", "مع ستاكو، كل صنف بيحتفظ بتاريخ آخر حركة، فالبضاعة المنسية بتبيّن.")
    reg("IDEA-211", "box-talk-five-months", "2027-05-27", "Static", h, s,
        ("Every box in your warehouse has a story. Some of them are waiting for you to notice.", "كل كرتونة بمستودعك إلها قصّة. في منهن ناطرين تنتبهلهن."))
    for l in LS:
        t = T(l)
        box_talk("IDEA-211", l, PI("OB-52"), h[l == "ar"], s[l == "ar"], strip(l, [(t("Desk Fan", "مروحة"), f"{L('WH-03')}"), (t("Last move", "آخر حركة"), t("5 months ago", f"من {L('5')} أشهر")), (L("86"), t("Units waiting", "قطعة ناطرة"))]), flip_ar=True)


def i212():
    h = ("“I was counted twice.<br><em>The system thinks I'm two boxes.”</em>", "«انعدّيت مرّتين.<br><em>والنظام مفكّرني كرتونتين.»</em>")
    s = ("With Stacko, counts flag the mismatch before anyone approves it.", "مع ستاكو، الجرد بيكشف الفرق قبل ما حدا يوافق عليه.")
    reg("IDEA-212", "box-talk-counted-twice", "2027-05-28", "Static", h, s,
        ("A double count looks harmless until someone sells a box that doesn't exist.", "العدّ مرّتين بيبيّن بسيط، لحتى حدا يبيع كرتونة مش موجودة."))
    for l in LS:
        t = T(l)
        box_talk("IDEA-212", l, PI("OB-52"), h[l == "ar"], s[l == "ar"], strip(l, [(L("2"), t("Counted", "معدود")), (L("1"), t("System", "النظام")), (t("Mismatch", "فرق"), t("Waiting for approval", "ناطر موافقة"))]))


def i214():
    h = ("“I'm in the truck.<br><em>Sidon will see me in 35 minutes.”</em>", "«أنا بالشاحنة.<br><em>صيدا رح تشوفني بعد 35 دقيقة.»</em>")
    s = ("With Stacko, every transfer shows a live ETA.", "مع ستاكو، كل تحويلة بتبيّن وقت وصولها مباشرة.")
    reg("IDEA-214", "box-talk-in-the-truck", "2027-05-29", "Static", h, s,
        ("The box knows when it arrives. Now so does the branch.", "الكرتونة بتعرف إيمتى بتوصل. وهلّق الفرع كمان."))
    for l in LS:
        t = T(l)
        q = h[l == "ar"] if l == "en" else f"«أنا بالشاحنة.<br><em>صيدا رح تشوفني بعد {L('35')} دقيقة.»</em>"
        # Owner review 2026-11-11: the message must come from the truck. Pin above the van's roof (van roof about x 555, y 925).
        pin = ('<div style="position:absolute;left:527px;top:844px;width:56px;height:56px;border-radius:50%;background:#0895A6;border:3px solid #EEF6F9;box-sizing:border-box;'
               'display:grid;place-items:center;box-shadow:0 0 0 9px rgba(46,242,238,.22),0 0 30px 6px rgba(46,242,238,.45);z-index:3">'
               '<svg viewBox="0 0 48 48" width="30" height="30" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"><path d="M6 15l18-9 18 9v19l-18 9-18-9z"/><path d="M6 15l18 9 18-9M24 24v19"/></svg></div>')
        css = (".sub{text-shadow:0 2px 16px rgba(0,0,0,.6);width:440px!important}"
               ".bub,[dir=rtl] .bub{top:auto;bottom:570px;left:548px;right:auto;width:468px;box-sizing:border-box;padding:26px 32px;font-size:40px;line-height:1.18}"
               "[dir=rtl] .bub{font-size:36px;line-height:1.5}"
               ".bub:after,[dir=rtl] .bub:after{right:auto;left:14px;bottom:-50px;border:22px solid transparent;border-top:32px solid #fff;border-left:24px solid #fff;border-right:22px solid transparent}")
        box_talk("IDEA-214", l, PI("SC-01"), q, s[l == "ar"], pin + strip(l, [(t("Beirut → Sidon", "بيروت ← صيدا"), t("Transfer on the road", "تحويلة عالطريق")), (L("ETA 35m"), t("Live countdown", "عدّ تنازلي مباشر"))]), css=css)


def i215():
    h = ("What's inside<br><em>Stacko?</em>", "شو في جوّا<br><em>ستاكو؟</em>")
    s = ("Open the box: with Stacko, this is what you get.", "افتح الكرتونة: هيدا اللي بتاخده مع ستاكو.")
    sl = [("A live map<br><em>of every location.</em>", "خريطة مباشرة<br><em>لكل المواقع.</em>"), ("Logging from your phone,<br><em>in 10 seconds.</em>", "تسجيل من تلفونك،<br><em>بـ10 ثواني.</em>"), ("AI that reads<br><em>supplier invoices.</em>", "ذكاء اصطناعي بيقرا<br><em>فواتير الموردين.</em>"),
          ("Transfers<br><em>with live ETAs.</em>", "تحويلات<br><em>مع وقت وصول مباشر.</em>"), ("Alerts<br><em>before problems.</em>", "تنبيهات<br><em>قبل المشاكل.</em>"), ("Arabic and English,<br><em>one tap.</em>", "عربي وإنكليزي،<br><em>بكبسة وحدة.</em>")]
    reg("IDEA-215", "whats-inside-stacko", "2027-05-06", "Carousel", h, s,
        ("Everything you need to see your stock, in one box.", "كل اللي بدّك ياه لتشوف مخازنك، بكرتونة وحدة."), slides=[h] + sl, note="Closing question removed from the caption.")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        sl_l = [x[l == "ar"] for x in sl]
        col = [
            [U.mapcard(), EX(t("Every warehouse, item and shipment, on one screen.", "كل مستودع وصنف وشحنة، بشاشة وحدة."))],
            [U.chatcard(t("Sent 40 LED strips from Beirut to Sidon", "بعتت 40 لمبة LED من بيروت لصيدا"), t("Logged ✓ by Hadi · 10 seconds", f"تسجّلت ✓ هادي · {L('10')} ثواني")), EX(t("Your team types it the way they'd say it.", "فريقك بيكتبها متل ما بيقولها."))],
            [U.rowscard([(L("INV-2291"), t("PDF, Excel or a photo", "PDF أو Excel أو صورة"), t("12 items", f"{L('12')} صنف"), "okc"), (L("SHP-24021"), t("Incoming shipment", "شحنة واردة"), "✓", "okc")]), EX(t("Upload it. The items and the shipment appear.", "ارفعها. الأصناف والشحنة بيطلعوا."))],
            [U.rowscard([(t("Beirut → Sidon", "بيروت ← صيدا"), t("40 LED Strips", f"{L('40')} لمبة LED"), t("35m", f"{L('35')} دقيقة"), "okc"), (t("Tripoli → Jounieh", "طرابلس ← جونية"), t("12 Desk Lamps", f"{L('12')} لمبة مكتب"), t("1h 10m", f"ساعة و{L('10')}"), "okc")]), EX(t("A truck moves on the map with a countdown.", "الشاحنة بتتحرّك عالخريطة مع عدّ تنازلي."))],
            [U.alertscard(l, [("low", t("USB-C Cable · Sidon · 3 left", f"كابل {L('USB-C')} · صيدا · {L('3')} باقيين")), ("mis", t("Desk Lamp · Count 236, system 240", f"لمبة مكتب · الجرد {L('236')}، النظام {L('240')}"))]), EX(t("Low stock and mismatches reach you first.", "النقص والفروقات بيوصلوك أوّل شي."))],
            [U.togglecard(l), EX(t("The whole interface, right to left too.", "الواجهة كلّها، كمان من اليمين للشمال."))],
        ]
        slides = [dict(bg=PII("OB-53"), h=h[l == "ar"], s=s[l == "ar"], cover=True)]
        for i, sx in enumerate(sl_l):
            slides.append(dict(bg=B, h=sx, col=col[i], col_top=430))
        car("IDEA-215", l, slides, "what's inside")


def i216():
    h = ("Every pile hides<br><em>a number.</em>", "كل كومة<br><em>مخبّية رقم.</em>")
    s = ("With Stacko, each location shows what it holds and what is running low.", "مع ستاكو، كل موقع بيورجيك شو فيه وشو عم يخلص.")
    reg("IDEA-216", "stock-city-skyline", "2027-05-31", "Static", h, s,
        ("A pile of boxes looks like stock. It doesn't tell you what is in it, where it is, or what is about to run out. With Stacko, every location shows its stock and flags what is running low.",
         "كومة الكراتين بتبيّن مخزون، بس ما بتقلك شو فيها، وين هي، ولا شو عم يخلص. مع ستاكو، كل موقع بيورجيك مخزونو وبينبّهك لشو عم يخلص."),
        note="Owner review 2026-11-11: new idea (a pile tells you nothing), no city/skyline wording, statuses instead of figures.")
    for l in LS:
        t = T(l)
        low = f'<span style="display:inline-block;margin-inline-start:8px;padding:2px 14px;border-radius:999px;background:#F5A524;color:#0E2440;font-weight:600">{t("Low stock", "ناقص")}</span>'
        x = tag(670, 450, f"{L('WH-01')} · {t('In stock', 'متوفر')}") + tag(300, 650, f"{L('WH-03')} · {t('In stock', 'متوفر')}") + tag(900, 800, f"{L('WH-02')} ·{low}")
        static("IDEA-216", l, PI("OB-54"), h[l == "ar"], s[l == "ar"], x, hs=t(60, 54))


def i217():
    h = ("Zero Calls Day:<br><em>no “where is it?” calls.</em>", "نهار بلا تلفونات:<br><em>نهار كامل بلا «وينها؟».</em>")
    s = ("Pick one day. With Stacko, check the map before you call.", "نقّي نهار واحد. مع ستاكو، شوف الخريطة قبل ما تتّصل.")
    reg("IDEA-217", "zero-calls-day", "2027-06-01", "Static", h, s,
        ("Challenge: one day where nobody in your team calls another branch to ask where something is.\nTell us how it goes.", "التحدّي: نهار واحد ما حدا بفريقك يتّصل بفرع تاني ليسأل وين الشي.\nخبّرونا كيف بتمشي."), note="'This Thursday' changed to 'Pick one day' (no weekdays). Caption question removed.")
    for l in LS:
        t = T(l)
        x = tag(250, 480 + 90, "#ZeroCallsDay") + f'<div class="wc pc mapc" style="left:64px;right:auto;top:auto;bottom:112px;width:356px;padding:12px"><img src="{MAP("map-crop")}" alt=""></div>'
        static("IDEA-217", l, PI("OB-55"), h[l == "ar"], s[l == "ar"], x, theme="light", hs=t(58, 52))


def i218():
    h = ("How many calls<br><em>did you make today?</em>", "كم تلفون<br><em>عملت اليوم؟</em>")
    s = ("Slide to answer.", "حرّك لتجاوب.")
    reg("IDEA-218", "zero-calls-story", "2027-06-01", "Story", h, s, ("— (Story)", "— (ستوري)"), note="Emoji slider layout for the real Instagram sticker; goes out the same evening as IDEA-217.")
    for l in LS:
        inner = '<div class="sl"><div class="tr"><div class="kn">🙂</div></div><div class="ends"><span>📵</span><span>📞</span></div></div>'
        story("IDEA-218", l, PI("OB-55"), h[l == "ar"], s[l == "ar"], inner, theme="light")


def i219():
    h = ("Eid al-Adha<br><em>Mubarak.</em>", "عيد أضحى<br><em>مبارك.</em>")
    s = ("From the Stacko team.", "من فريق ستاكو.")
    reg("IDEA-219", "eid-al-adha", "2027-05-16", "Static", h, s, ("Eid Mubarak to you, your families and your teams.", "عيد مبارك إلكن ولعائلاتكن ولفرقكن."), note="CHECK: confirm the date (moon sighting).")
    for l in LS:
        t = T(l)
        static("IDEA-219", l, PI("SE-05"), h[l == "ar"], s[l == "ar"], css=".h1,.sub{text-align:center!important;left:64px!important;right:64px!important}.h1{top:390px!important;font-size:88px!important;line-height:1.1}[dir=rtl] .h1{font-size:72px!important;line-height:1.35}.sub{top:610px!important}.shade-t{display:none}")


def i220():
    h = ("Back to school:<br><em>stationery in the right branch?</em>", "رجعت المدارس:<br><em>القرطاسية بالفرع الصح؟</em>")
    s = ("With Stacko, see every branch and move stock before the rush.", "مع ستاكو، شوف كل الفروع وحرّك البضاعة قبل العجقة.")
    reg("IDEA-220", "back-to-school", "2027-08-30", "Static", h, s,
        ("September demand doesn't wait. Move stock to where parents shop, before they arrive.", "طلب أيلول ما بينطر. حرّك البضاعة لوين الأهل بيتسوّقوا، قبل ما يوصلوا."))
    for l in LS:
        t = T(l)
        x = ""
        static("IDEA-220", l, PI("SE-06"), h[l == "ar"], s[l == "ar"], x, theme="light", hs=t(58, 54), css=".strip b{font-size:28px}")


LAP = """.lap{position:absolute;left:243px;top:550px;width:597px;height:380px;overflow:hidden;background:#fff}
.lap div{width:100%;height:100%;background-repeat:no-repeat}"""


def i221():
    h = ("Inside Stacko:<br><em>the warehouse panel.</em>", "جوّا ستاكو:<br><em>لوحة المستودع.</em>")
    s = ("With Stacko, tap a building and see its stock.", "مع ستاكو، اكبس عمبنى وشوف كميته.")
    sl = [("Tap any building<br><em>on the map.</em>", "اكبس عأي مبنى<br><em>عالخريطة.</em>"), ("Capacity used,<br><em>inbound and outbound.</em>", "السعة المستعملة،<br><em>الداخل والطالع.</em>"), ("Search 10,000+ SKUs,<br><em>low stock first.</em>", f"ابحث بأكتر من 10,000 صنف،<br><em>الناقص أوّل.</em>")]
    reg("IDEA-221", "inside-warehouse-panel", "2027-05-13", "Carousel", h, s,
        ("A real look at the screen managers open every morning.", "نظرة حقيقية عالشاشة اللي بيفتحها المدراء كل صبحية."), slides=[h] + sl, note="Real demo-company captures (en/ar-map-wh2), sidebar cropped.")
    for l in LS:
        t = T(l)
        src = CAP(f"{l}-map-wh2")
        # the Arabic capture is mirrored: the map sits on the right, the panel on the left, the sidebar at the far right
        mapc = (556, 340, 1210, 820) if l == "en" else (799, 340, 1210, 820)
        panel_x = 1774 if l == "en" else 57
        B = BGI("BG-57")
        off = 495 if l == "en" else 0
        # Owner review 2026-11-11: the whole app on the laptop was too small to read; show the warehouse panel only, zoomed
        kz = 597 / 729
        lap = f'<div class="lap"><div style="background-image:url({src});background-size:{2560 * kz:.0f}px auto;background-position:{-panel_x * kz:.0f}px {-383 * kz:.0f}px"></div></div>'
        sc = [EX(t("Every warehouse on the map is a building you can open.", "كل مستودع عالخريطة مبنى فيك تفتحه.")), EX(t("See how full it is and what's coming and going.", "شوف قدّيش مليان وشو داخل وطالع.")), EX(t("Find any item in seconds. What's running low comes up first.", "لاقي أي صنف بثواني. الناقص بيطلع أوّل."))]
        car("IDEA-221", l, [
            dict(bg=PII("UI-02"), h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=lap),
            dict(bg=B, h=sl[0][l == "ar"], kick=t("1 of 3", f"{L(1)} من {L(3)}"), col=[crop(src, 2560, *mapc), sc[0]], col_top=410),
            dict(bg=B, h=sl[1][l == "ar"], kick=t("2 of 3", f"{L(2)} من {L(3)}"), col=[crop(src, 2560, panel_x, 383, 729, 377), sc[1]], col_top=430),
            dict(bg=B, h=sl[2][l == "ar"], kick=t("3 of 3", f"{L(3)} من {L(3)}"), col=[crop(src, 2560, panel_x, 772, 729, 458), sc[2]], col_top=430),
        ], "warehouse panel", theme="light", css=LAP)


def i222():
    h = ("Inside Stacko:<br><em>one transfer, every detail.</em>", "جوّا ستاكو:<br><em>تحويلة وحدة، كل التفاصيل.</em>")
    s = ("With Stacko, who, what and where sit on one screen.", "مع ستاكو، مين وشو ووين بشاشة وحدة.")
    sl = [("The lines:<br><em>item and quantity.</em>", "البنود:<br><em>الصنف والكمية.</em>"), ("From and to:<br><em>both locations named.</em>", "من وين ولوين:<br><em>الموقعين مكتوبين.</em>"), ("Created by,<br><em>and when.</em>", "مين عملها،<br><em>وإيمتى.</em>"), ("Approvals,<br><em>on the same screen.</em>", "الموافقات،<br><em>بنفس الشاشة.</em>")]
    reg("IDEA-222", "inside-transfer-detail", "2027-06-02", "Carousel", h, s,
        ("Every transfer keeps its whole story. Here's what it looks like.", "كل تحويلة بتحتفظ بقصّتها كاملة. هيك بتبيّن."), slides=[h] + sl, note="Slide 3 says 'From and to' only: the real capture has no ETA on it (completed transfer).")
    for l in LS:
        t = T(l)
        src = CAP(f"{l}-ph-owner-trf")
        B = BGI("BG-56")
        nx = 30 if l == "en" else 645
        boxes = [(30 if l == "en" else 515, 626, 1100, 406), (nx, 1179, 970, 385), (nx, 1548, 970, 150), (nx, 1784, 970, 280)]
        ex = [t("Exactly what moved, and how much.", "شو انتقل بالظبط، وقدّيش."), t("No guessing where it left and where it landed.", "بلا تخمين من وين طلعت ولوين وصلت."), t("Every stock number traces back to a person and a time.", "كل رقم بيرجع لشخص ووقت."), t("Who approved it is on the same page.", "مين وافق، بنفس الصفحة.")]
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=phone_shot(src, 1645, s=.8, left=169, top_=490))]
        for i, b in enumerate(boxes):
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=[crop(src, 1645, *b), EX(ex[i])], col_top=430))
        car("IDEA-222", l, slides, "one transfer")


def approval_screen(l):
    """Owner review 2026-11-11: the tablet shows one large approval card (sample data), not the dense phone capture."""
    t = T(l)
    d = "rtl" if l == "ar" else "ltr"
    btn = "flex:1;text-align:center;border-radius:16px;padding:16px 0;font-size:28px;font-weight:600"
    row = "display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #DCE7EE;font-size:23px"
    return (f'<div dir="{d}" style="height:100%;box-sizing:border-box;background:#F4F8FA;padding:30px 26px;font-family:\'Readex Pro\',\'Noto Kufi Arabic\',sans-serif;color:#0E2440">'
            f'<div style="display:flex;align-items:center;gap:14px;margin-bottom:26px"><img src="/assets/brand/logo/mark-light.svg" alt="" style="width:44px;height:44px">'
            f'<b style="font-size:30px">{t("Waiting for approval", "بانتظار الموافقة")}</b></div>'
            f'<div style="background:#fff;border-radius:22px;padding:24px 24px 26px;box-shadow:0 10px 30px rgba(14,36,64,.14)">'
            f'<div style="font-size:32px;font-weight:700;margin-bottom:8px">{t("Count adjustment", "تسوية جرد")}</div>'
            f'<div style="{row}"><span>{L("WH-01")} · {t("Wireless Earbuds", "سمّاعات لاسلكية")}</span></div>'
            f'<div style="{row}"><span>{t("System", "النظام")}: <b>{L("120")}</b> {"→" if l == "en" else "←"} {t("Counted", "المعدود")}: <b>{L("112")}</b></span></div>'
            f'<div style="{row};border:0;color:#2C5974">{t("Requested by Rami", "طلب رامي")}</div>'
            f'<div style="display:flex;gap:14px;margin-top:16px"><div style="{btn};background:#0895A6;color:#fff">{t("Approve", "وافق")}</div>'
            f'<div style="{btn};border:2px solid #0E2440;color:#0E2440">{t("Reject", "ارفض")}</div></div></div>'
            f'<div style="margin:18px 14px 0;height:30px;border-radius:14px 14px 0 0;background:#fff;opacity:.55;box-shadow:0 6px 18px rgba(14,36,64,.1)"></div>'
            '</div>')


def i223():
    h = ("Inside Stacko:<br><em>nothing changes without approval.</em>", "جوّا ستاكو:<br><em>ما في شي بيتغيّر بلا موافقة.</em>")
    s = ("With Stacko, adjustments wait for the owner.", "مع ستاكو، التسويات بتنطر صاحب الشغل.")
    sl = [("A count adjustment<br><em>is waiting.</em>", "تسوية جرد<br><em>ناطرة.</em>"), ("Approve or reject,<br><em>with the reason.</em>", "وافق أو ارفض،<br><em>مع السبب.</em>"), ("Every decision has<br><em>a name and a time.</em>", "كل قرار إلو<br><em>اسم ووقت.</em>")]
    reg("IDEA-223", "inside-approvals", "2027-06-03", "Carousel", h, s,
        ("Trust your numbers because you approved them.", "ثق بأرقامك لأنك إنت وافقت عليها."), slides=[h] + sl)
    tab = """.tab{position:absolute;left:279px;top:530px;width:509px;height:713px;border-radius:12px;overflow:hidden;background:#fff}
.tab img{width:100%;height:100%;object-fit:cover;object-position:50% 0}"""
    for l in LS:
        t = T(l)
        src = CAP(f"{l}-ph-owner-approvals")
        B = BGI("BG-57")
        car("IDEA-223", l, [
            dict(bg=PII("UI-03", "top:100px"), h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=f'<div class="tab">{approval_screen(l)}</div>'),
            dict(bg=B, h=sl[0][l == "ar"], col=[crop(src, 1075, 20, 1410, 1035, 430), EX(t("A count found a difference. Nothing moves until someone decides.", "الجرد لقى فرق. ما في شي بيتحرّك لحتى حدا يقرّر."))], col_top=430),
            dict(bg=B, h=sl[1][l == "ar"], col=[crop(src, 1075, 20, 1410, 1035, 430), EX(t("The reason sits next to the Approve and Reject buttons.", "السبب حدّ كبسات الموافقة والرفض."))], col_top=430),
            dict(bg=B, h=sl[2][l == "ar"], col=[crop(CAP(f"{l}-ph-owner-trf"), 1645, 30 if l == "en" else 645, 1784, 970, 280), EX(t("So any stock number can be traced back.", "فكل رقم فيك ترجّعه لمصدره."))], col_top=430),
        ], "approvals", theme="light", css=tab)


def i224():
    h = (f"5 questions managers<br><em>ask before 9 AM.</em>", f"{L('5')} أسئلة بيسألوها المدراء<br><em>قبل الساعة {L('9')}.</em>")
    s = ("With Stacko, ask in a chat and get the answer in seconds.", "مع ستاكو، إسأل بمحادثة وخود الجواب بثواني.")
    q = [("What's short today?", "شو ناقص اليوم؟"), ("What moved yesterday?", "شو تحرّك مبارح؟"), ("Where is SHP-24021?", "وين SHP-24021؟"), ("How many desk lamps in Jounieh?", "كم لمبة مكتب بجونية؟"), ("Anything waiting for my approval?", "في شي ناطر موافقتي؟")]
    reg("IDEA-224", "five-questions-before-9", "2027-06-04", "Carousel", ("5 questions managers ask before 9 AM.", "5 أسئلة بيسألوها المدراء قبل الساعة 9."), s,
        ("The first hour of the day used to be phone calls. Now it's five messages.", "أول ساعة بالنهار كانت تلفونات. هلّق خمس رسايل."), slides=[("5 questions managers ask before 9 AM.", "5 أسئلة بيسألوها المدراء قبل الساعة 9.")] + q,
        note="All five question types checked against the ask-stacko tools (low stock, recent movements, shipments, item balance, pending approvals).")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        ans = [
            t('<span class="ok">3 items low</span><br>USB-C Cable · Sidon · 3<br>Desk Lamp · WH-03 · 8<br>LED Strip · BR-01 · 12', f'<span class="ok">{L("3")} أصناف ناقصة</span><br>كابل {L("USB-C")} · صيدا · {L("3")}<br>لمبة مكتب · {L("WH-03")} · {L("8")}<br>لمبات {L("LED")} · {L("BR-01")} · {L("12")}'),
            t('<span class="ok">14 moves</span><br>9 transfers · 4 receipts · 1 adjustment<small>By Hadi, Lina and Omar</small>', f'<span class="ok">{L("14")} حركة</span><br>{L("9")} تحويلات · {L("4")} استلام · {L("1")} تسوية<small>هادي ولينا وعمر</small>'),
            t('<span class="ok">At sea</span><br>Day 24 · Shenzhen → Beirut<small>Port of Beirut next</small>', f'<span class="ok">بالبحر</span><br>نهار {L("24")} · شنزن ← بيروت<small>الجاي مرفأ بيروت</small>'),
            t('<span class="ok">46 available</span><br>BR-01 Jounieh<small>Plus 12 on the way</small>', f'<span class="ok">{L("46")} متوفرة</span><br>{L("BR-01")} جونية<small>و{L("12")} عالطريق</small>'),
            t('<span class="ok">2 waiting</span><br>ADJ-00020 · Adjustment<br>RCV-00004 · Receipt', f'<span class="ok">{L("2")} ناطرين</span><br>{L("ADJ-00020")} · تسوية<br>{L("RCV-00004")} · استلام'),
        ]
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, extra=phone_html(chat(l, q[0][l == "ar"], ans[0]), s=.74, left=197, top_=500))]
        for i, (e, a) in enumerate(q):
            uq = e if l == "en" else (f'وين {L("SHP-24021")}؟' if i == 2 else a)
            hq = uq if l == "ar" else f"“{e}”"
            slides.append(dict(bg=B, h=hq, kick=t(f"Question {i + 1}", f"سؤال {L(i + 1)}"), extra=phone_html(chat(l, uq, ans[i]), s=.84, left=150, top_=320), css_=None))
        car("IDEA-224", l, slides, "five questions", css=".chat{padding-top:26px}.chat .u{font-size:26px;max-width:250px}.chat .r{font-size:25px;width:auto;max-width:268px;align-self:stretch}.chat .r small{font-size:20px}.chat .hd b{font-size:22px}.chat .hd small{font-size:17px}.r .ok{font-size:20px}")


def i225():
    h = ("How Lebanese warehouses<br><em>really talk.</em>", "كيف بتحكي المستودعات<br><em>اللبنانية فعلاً.</em>")
    s = ("Five phrases every storekeeper knows.", "خمس جمل بيعرفها كل أمين مستودع.")
    ph = [("«شو في عندك؟»", "What's in stock?", "شو الكميات الموجودة؟"), ("«خالص»", "Out of stock.", "ما بقي من الصنف."), ("«بعتلك ياهن»", "I sent them to you.", "البضاعة انبعتت."), ("«نزّلهن عالجردة»", "Put them on the count.", "زيدهن عالجردة."), ("«وصلت الطلبية؟»", "Did the order arrive?", "الطلبية وصلت؟")]
    reg("IDEA-225", "lebanese-stock-words", "2027-06-05", "Carousel", h, s,
        ("Stock has its own language in every country.", "المخازن إلها لغتها بكل بلد."), slides=[h] + [(f"{a} = {b}", f"{a} = {c}") for a, b, c in ph] + [("Stacko speaks Arabic too.", "ستاكو بيحكي عربي كمان.")],
        note="Owner review 2026-11-11: خالص, الجردة, وصلت الطلبية. CHECK: native Lebanese check of the phrases. All 5 phrases used so the count matches. Last slide claims only the Arabic interface (message parsing in dialect is not confirmed). Caption question removed.")
    for l in LS:
        t = T(l)
        B = BGI("BG-57")
        proof = [
            U.rowscard([(t("Desk Lamp", "لمبة مكتب"), t("WH-01 Beirut", f"{L('WH-01')} بيروت"), "240", "okc")], t("In Stacko", "بستاكو")),
            f'<div class="wc pc">{U.alertscard(l, [("low", t("USB-C Cable · Sidon · 0 left", f"كابل {L("USB-C")} · صيدا · {L("0")} باقي"))]).replace("wc pc", "")}</div>',
            U.rowscard([(t("Beirut → Sidon", "بيروت ← صيدا"), t("Transfer", "تحويلة"), t("35m", f"{L('35')} دقيقة"), "okc")], t("In Stacko", "بستاكو")),
            U.rowscard([(t("Count", "جردة"), t("WH-03 Tripoli", f"{L('WH-03')} طرابلس"), t("System 240", f"النظام {L('240')}"), "okc")], t("In Stacko", "بستاكو")),
            U.rowscard([(L("SHP-24021"), t("Port of Beirut", "مرفأ بيروت"), t("Arrived", "وصلت"), "okc")], t("In Stacko", "بستاكو")),
        ]
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[f'<div class="wc pc" style="font-size:56px;font-family:\'Noto Kufi Arabic\';direction:rtl;line-height:1.6;font-weight:700">شو في عندك؟<br>خالص<br>بعتلك ياهن</div>'], col_top=560)]
        for i, (a, b, c) in enumerate(ph):
            big = f'<div style="font-family:\'Noto Kufi Arabic\';font-size:86px;font-weight:700;line-height:1.4;direction:rtl;text-align:center;color:var(--abyss)">{a}</div>'
            slides.append(dict(bg=B, h=(b if l == "en" else c), col=[big, proof[i]], col_top=420))
        slides.append(dict(bg=B, h=t("Stacko speaks<br><em>Arabic too.</em>", "ستاكو بيحكي<br><em>عربي كمان.</em>"), col=[U.togglecard(l), EX(t("Stacko: the stock management system built for several warehouses, fully in Arabic.", "ستاكو: نظام إدارة المخازن المعمول لأكتر من مستودع، بالعربي كامل."))], col_top=430))
        car("IDEA-225", l, slides, "stock words", theme="light")


def i226():
    h = ("Where do you keep your stock?<br><em>Pin your city.</em>", "وين مخزنك؟<br><em>حطّ مدينتك عالخريطة.</em>")
    s = ("Comment your city. We'll add you to the Stacko community map.", "اكتب مدينتك بالتعليقات. ورح نزيدك على خريطة مجتمع ستاكو.")
    reg("IDEA-226", "pin-your-city", "2027-06-07", "Static", h, s, ("Comment your city and we'll pin it. Next month we'll share the map.", "اكتب مدينتك ورح نحطّها عالخريطة. الشهر الجاي منشارك الخريطة."))
    for l in LS:
        t = T(l)
        x = f'<div class="pn" style="top:470px;height:640px">{lebanon(l)}</div>' + strip(l, [(t("With Stacko", "مع ستاكو"), t("Every location on one live map", "كل المواقع على خريطة وحدة مباشرة"))])
        static("IDEA-226", l, BG("BG-56"), h[l == "ar"], s[l == "ar"], x, hs=t(58, 54), css=".strip{bottom:104px}")


def i227():
    h = ("Your 2027,<br><em>wrapped.</em>", f"سنتك {L('2027')}،<br><em>بملخّص.</em>")
    s = ("Your warehouse's year in numbers. With Stacko, every one comes from your logged moves.", "سنة مستودعك بالأرقام. مع ستاكو، كل رقم جايي من حركاتك المسجّلة.")
    sl = [("Moves logged:", "حركات مسجّلة:"), ("Busiest branch:", "أكتر فرع شغّال:"), ("Top item:", "أكتر صنف:"), ("Longest shipment:", "أطول شحنة:"), ("Share yours.", "شارك رقمك.")]
    reg("IDEA-227", "stock-wrapped-2027", "2027-12-27", "Carousel", ("Your 2027, wrapped.", "سنتك 2027، بملخّص."), s,
        ("Fill in your warehouse's year and share it.", "عبّي سنة مستودعك وشاركها."), slides=[("Your 2027, wrapped.", "سنتك 2027، بملخّص.")] + sl, note="Template with blanks; no invented numbers. Caption question removed.")
    for l in LS:
        t = T(l)
        B = BGI("BG-56")
        blank = lambda u="": card(f'<div style="font-size:150px;font-weight:600;line-height:1;text-align:center;color:var(--abyss);padding:40px 0">____</div>' + (f'<div style="text-align:center;font-size:36px;color:var(--deep)">{u}</div>' if u else ""))
        xs = [("", t("Every receipt, issue and transfer counts.", "كل استلام وإخراج وتحويلة بتنحسب.")), ("", t("The one that never stopped moving.", "الفرع اللي ما وقّف.")), ("", t("The item everybody asked for.", "الصنف اللي الكل سأل عنه.")), (t("days", "نهار"), t("The one you watched leg by leg.", "اللي تابعتها مرحلة بمرحلة."))]
        rows = [(x[l == "ar"], "", "____", "num") for x in sl[:4]]
        slides = [dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True, col=[U.rowscard(rows)], col_top=560)]
        for i in range(4):
            slides.append(dict(bg=B, h=sl[i][l == "ar"], col=[blank(xs[i][0]), EX(xs[i][1])], col_top=380))
        slides.append(dict(bg=B, h=sl[4][l == "ar"], col=[U.rowscard(rows), EX(t("Fill it in, screenshot it, tag us.", "عبّيها، صوّرها، وعلّم علينا."))], col_top=380))
        car("IDEA-227", l, slides, "wrapped")


def i228():
    h = ("Log a move<br><em>in 10 seconds.</em>", f"سجّل حركة<br><em>بـ{L('10')} ثواني.</em>")
    s = ("With Stacko, one message logs the move.", "مع ستاكو، رسالة وحدة وبتتسجّل الحركة.")
    reg("IDEA-228", "10-second-challenge", "2027-06-08", "Static", (h[0], "سجّل حركة بـ10 ثواني."), s,
        ("One move, one message, ten seconds. With Stacko, logging stock moves takes less time than writing the note.", "حركة وحدة، رسالة وحدة، عشر ثواني. مع ستاكو، تسجيل حركات المخزون بياخد وقت أقل من كتابة الملاحظة."),
        note="Owner review 2026-11-11: no longer a challenge; hashtag chip and bottom banner removed.")
    for l in LS:
        t = T(l)
        x = ('<div style="position:absolute;left:400px;top:600px;width:280px;text-align:center;font-size:104px;font-weight:600;color:var(--abyss);direction:ltr">10s</div>'
)
        static("IDEA-228", l, PI("OB-25"), h[l == "ar"], s[l == "ar"], x, hs=t(60, 54), css=".strip b{font-size:27px}")


def i229():
    h = ("To the owner who still<br><em>counts at midnight.</em>", "لصاحب الشغل اللي بعده<br><em>عم يعدّ نصّ الليل.</em>")
    s = ("A short letter from the Stacko team.", "رسالة قصيرة من فريق ستاكو.")
    sl = [("We know the shelves are full<br><em>and the numbers don't match.</em>", "منعرف إنّو الرفوف مليانة<br><em>والأرقام ما بتطابق.</em>"), ("We know<br><em>the calls never stop.</em>", "منعرف إنّو<br><em>التلفونات ما بتوقف.</em>"), ("We built Stacko so you can<br><em>see it, not guess it.</em>", "عملنا ستاكو لتشوف،<br><em>مش لتخمّن.</em>"), ("You can relax<br><em>and go home early.</em>", "فيك ترتاح<br><em>وتروح بكير ع بيتك.</em>")]
    reg("IDEA-229", "letter-to-the-owner", "2027-06-09", "Carousel", h, s,
        ("This one is for everyone who has stayed late to count what should have been on a screen.", "هيدي لكل واحد سهر ليعدّ شي كان لازم يكون على شاشة."), slides=[h] + sl, note="Team voice, not a customer quote. Owner review 2026-11-11: slide 2 and 5 copy, one background per slide (BG-60, SE-06, OB-55, the clean live-map capture, SC-18), no long dashes.")
    for l in LS:
        t = T(l)
        dim = lambda src, pos="50% 50%", a=(.55, .78, .9): (f'<img class="bg" src="{src}" alt="" style="object-fit:cover;object-position:{pos}">'
                                                         f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,36,64,{a[2]}) 0%,rgba(14,36,64,{a[0]}) 45%,rgba(14,36,64,{a[1]}) 100%)"></div>')
        B = BGI("BG-60") + '<div style="position:absolute;inset:0;background:rgba(10,26,46,.45)"></div>'
        B2, B3, B4, B5 = dim(PI("SE-06"), "50% 80%", (.72, .85, .92)), dim(PI("OB-55"), "60% 60%", (.66, .8, .92)), dim(CAP(f"{l}-map-clean"), "30% 50%", (.7, .8, .92)), dim(PI("SC-18"), "50% 60%", (.5, .75, .9))
        sig = EX(t("The Stacko team", "فريق ستاكو"))
        car("IDEA-229", l, [
            dict(bg=B, h=h[l == "ar"], s=s[l == "ar"], cover=True),
            dict(bg=B2, h=sl[0][l == "ar"], col=[U.rowscard([(t("On the shelf", "عالرف"), "", "236", "num"), (t("In the file", "بالملف"), "", "240", "zero")])], col_top=470),
            dict(bg=B3, h=sl[1][l == "ar"], col=[U.rowscard([(t("Beirut", "بيروت"), t("“Where is it?”", "«وينها؟»"), t("8:10", L("8:10")), "num"), (t("Sidon", "صيدا"), t("“Did it arrive?”", "«وصلت؟»"), t("8:25", L("8:25")), "num"), (t("Tripoli", "طرابلس"), t("“How many left?”", "«قدّيش باقي؟»"), t("8:40", L("8:40")), "num")], t("Before 9 AM", f"قبل الساعة {L('9')}"))], col_top=450),
            dict(bg=B4, h=sl[2][l == "ar"], col=[U.mapcard()], col_top=470),
            dict(bg=B5, h=sl[3][l == "ar"], col=[U.rowscard([(t("Today's moves", "حركات اليوم"), t("All logged", "كلّها مسجّلة"), "✓", "okc"), (t("Tonight's count", "جردة الليلة"), t("Not needed", "ما في لزوم"), "✓", "okc")]), sig], col_top=420),
        ], "letter")


def i230():
    h = ("Describe your stock process<br><em>in three words.</em>", "وصّف طريقة شغلك بالمخازن<br><em>بتلات كلمات.</em>")
    s = ("We'll go first: “call, guess, recount.”", "منبلّش نحنا: «تلفون، تخمين، إعادة عدّ.»")
    reg("IDEA-230", "three-words", "2027-06-10", "Static", h, s, ("Three words. Go. (Ours used to be: call, guess, recount.)", "تلات كلمات. يلّا. (كانت كلماتنا: تلفون، تخمين، إعادة عدّ.)"))
    for l in LS:
        t = T(l)
        lines = "".join('<div style="height:96px;border-bottom:5px solid rgba(255,255,255,.75)"></div>' for _ in range(3))
        x = f'<div style="position:absolute;left:120px;right:120px;top:520px">{lines}</div>' + strip(l, [(t("With Stacko", "مع ستاكو"), t("It becomes three other words", "بتصير تلات كلمات تانية")), (t("Log, see, done.", "سجّل، شوف، خلصنا."), t("From your phone to the map", "من تلفونك للخريطة"))])
        static("IDEA-230", l, BG("BG-60"), h[l == "ar"], s[l == "ar"], x, hs=t(60, 54))


REEL_HEAD = """<!doctype html>
<html><head><meta charset="utf-8"><title>{title}</title>
<!-- Round 3. HTML only for now: render with node studio/render.mjs <this file> --lang all when approved. -->
<script src="/assets/map-elements/stacko-map-elements.js"></script>
<script src="/studio/engine/sm-core.js"></script>
<script src="/studio/engine/sm-components.js"></script>
<script src="/studio/engine/sm-app.js"></script>
</head><body><script>
"""


def i213():
    h = ("Every order,<br><em>the stock updates.</em>", "كل طلبية،<br><em>المخازن بتتحدّث.</em>")
    s = ("8 s: a product page sells, the stock number ticks down live.", "8 ثواني: صفحة المنتج بتبيع، والرقم بينزل مباشرة.")
    f = reg("IDEA-213", "stock-countdown-motion", "2027-01-25", "Reel", h, s, ("Sell it on your WooCommerce store, see it leave the shelf.", "بيعها على متجرك WooCommerce، وشوفها عم تفلّ من الرف."), note="HTML motion page (reel.html); no MP4 rendered yet.")
    js = REEL_HEAD.format(title="IDEA-213 · Every order, the stock updates") + """const R = SM.reel({ title: 'IDEA-213 · Stock countdown' });
const s = R.scene(6.4, { bg: '/assets/backgrounds/final/BG-56.jpg', name: 'countdown' });
s.text(SM.t('Every order, *the stock updates.*', 'كل طلبية، *المخازن بتتحدّث.*'), { y: 340, size: 86, fx: 'rise', at: .15 });
const box = 'background:#fff;color:#0E2440;border-radius:32px;padding:44px;box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:Readex Pro,Noto Kufi Arabic,sans-serif';
s.html(`<div style="${box};width:860px;display:flex;gap:36px;align-items:center" dir="${SM.ar() ? 'rtl' : 'ltr'}">
  <div style="width:220px;height:220px;border-radius:24px;background:#EEF6F9;display:grid;place-items:center;"><svg viewBox="0 0 48 48" style="width:130px;height:130px;stroke:#0895A6;fill:none;stroke-width:2;stroke-linejoin:round"><path d="M6 15l18-9 18 9v19l-18 9-18-9z"/><path d="M6 15l18 9 18-9M24 24v19"/></svg></div>
  <div><div style="font-size:50px;font-weight:600">${SM.t('Desk Lamp', 'لمبة مكتب')}</div><div style="font-size:34px;color:#2C5974;margin-top:10px">${SM.t('Your online store', 'متجرك أونلاين')}</div></div></div>`, { x: 540, y: 730, in: 'rise', at: .5 });
s.html(`<div style="${box};width:860px;display:flex;justify-content:space-between;align-items:center" dir="${SM.ar() ? 'rtl' : 'ltr'}">
  <div><div style="font-size:30px;color:#0895A6;font-weight:600">${SM.t('In Stacko', 'بستاكو')}</div><div style="font-size:44px;font-weight:600;margin-top:6px">${SM.t('Online store', 'متجر أونلاين')}</div></div>
  <div id="n" style="font-size:140px;font-weight:600;line-height:1;direction:ltr">12</div></div>`, { x: 540, y: 1050, in: 'rise', at: .9 });
s.on(0, 6.4, (p, t) => { const e = document.getElementById('n'); if (e) e.textContent = t < 2.3 ? '12' : t < 4.1 ? '11' : '10'; });
for (const [at, y] of [[2.1, 1330], [3.9, 1430]]) s.text(SM.t('New order · 1 sold', 'طلبية جديدة · انباعت وحدة'), { y, size: 44, weight: 600, style: 'pill', fx: 'pop', at });
R.endcard('dots', { in: 'dots', dur: 1.6, tagline: SM.ar() ? 'off' : 'en' });
R.grain(.04).vignette(.5);
R.audio({ music: '/assets/audio/music/placeholder-calm.mp3', musicVolume: .22 });
R.cover(4.5);
</script></body></html>
"""
    (POSTS / REG["IDEA-213"]["month"] / f / "reel.html").write_text(js, encoding="utf8")


def i231():
    h = ("The map<br><em>never sleeps.</em>", "الخريطة<br><em>ما بتنام.</em>")
    s = ("8 s: day to night on the live map, trucks still moving.", "8 ثواني: من النهار لليل عالخريطة، والشاحنات بعدها ماشية.")
    f = reg("IDEA-231", "map-never-sleeps-motion", "2027-06-11", "Reel", h, s, ("Your stock moves at 9 AM and at 9 PM. The map keeps up.", "مخزنك بيتحرّك الساعة 9 الصبح و9 بالليل. والخريطة لاحقته."),
            note="HTML motion page (reel.html) built on the real live-map capture with a slow day-to-night grade; no MP4 rendered yet. Replace with a screen recording of the demo map when one exists.")
    js = REEL_HEAD.format(title="IDEA-231 · The map never sleeps") + """const R = SM.reel({ title: 'IDEA-231 · The map never sleeps' });
const s = R.scene(6.4, { bg: '/assets/screens/live-map/map-full.jpg', focus: '55% 60%', name: 'map' });
const night = s.fill('background:#0B1E3A;mix-blend-mode:multiply');
s.anim(night, { o: [0, .92] }, .6, 4.6, 'inOutSine');
const dot = (x, y, dx, dy) => { const l = s.layer(x, y); l.innerHTML = '<div style="position:absolute;left:-15px;top:-15px;width:30px;height:30px;border-radius:50%;background:#2EF2EE;box-shadow:0 0 34px 12px rgba(46,242,238,.6)"></div>'; s.anim(l, { x: [x, x + dx], y: [y, y + dy] }, 0, 6.4, 'linear'); };
dot(420, 1040, 180, -70); dot(620, 1240, -150, 110); dot(300, 1300, 200, 90);
s.text(SM.t('The map *never sleeps.*', 'الخريطة *ما بتنام.*'), { y: 330, size: 92, fx: 'rise', at: .2 });
s.text(SM.t('9 AM', '9 الصبح'), { y: 1600, size: 58, weight: 600, style: 'pill', fx: 'pop', at: .4, out: 'fade', outAt: 2.6 });
s.text(SM.t('9 PM', '9 بالليل'), { y: 1600, size: 58, weight: 600, style: 'pill', fx: 'pop', at: 3.4 });
R.endcard('dots', { in: 'dots', dur: 1.6, tagline: SM.ar() ? 'off' : 'en' });
R.grain(.04).vignette(.5);
R.audio({ music: '/assets/audio/music/placeholder-calm.mp3', musicVolume: .22 });
R.cover(5);
</script></body></html>
"""
    (POSTS / REG["IDEA-231"]["month"] / f / "reel.html").write_text(js, encoding="utf8")


if __name__ == "__main__":
    for fn in (i188, i189, i190, i191, i192, i193, i194, i195, i196, i197, i198, i199, i200, i201, i202, i203, i204, i205, i206, i207, i208, i209, i210,
               i211, i212, i213, i214, i215, i216, i217, i218, i219, i220, i221, i222, i223, i224, i225, i226, i227, i228, i229, i230, i231):
        fn()
    if len(sys.argv) > 1:
        dump(sys.argv[1])
    print("ok", len(REG))
