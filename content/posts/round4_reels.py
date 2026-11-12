"""Round 4 reels: captions and notes for each hand-written reel.html (12 Nov 2026).
    python -I -X utf8 posts/round4_reels.py [ID ...]
The reels themselves are posts/<month>/<ID>_<slug>/reel.html (motion engine). Copy follows the owner's rules
(no badges, no Telegram on visuals, no closing questions or comment asks, a "With Stacko" proof in every reel).
"""
import sys
from pathlib import Path

POSTS = Path(__file__).resolve().parent

META = {
    "RES-01": ("2027-01/RES-01_ordered-isnt-in-stock",
               "Ordered is a promise. On hand is a fact.\n\nBetween the supplier and your shelf, stock spends weeks on the water, at customs and on a truck. Sell it before it lands and you're selling a guess.\n\n"
               "In Stacko, incoming stock has its own line on the map and only joins the warehouse count when it's received.",
               "الطلبية وعد. الرصيد حقيقة.\n\nبين المورّد ورفّك، البضاعة بتقضّي أسابيع بالبحر، بالجمرك وعالشاحنة. إذا بعتها قبل ما توصل، عم تبيع تخمين.\n\n"
               "بستاكو، البضاعة الجايي إلها خطّها عالخريطة، وما بتنضاف عرصيد المستودع إلّا لمّا تتسلّم.",
               "Closing question and Prototype labels removed. Route and durations from the product bible (about 30 days + about 2 days customs). Demo figures (WH-01 7,250 + 1,200). Weak evidence (unlinked Reddit summary)."),
    "RES-05": ("2027-01/RES-05_three-people-one-number",
               "Three people, three warehouses, the same item, the same minute.\n\n"
               "In Stacko each person logs from their own account, every move becomes its own line with a name and a time, and the total updates for everyone at once.",
               "تلات أشخاص، تلات مستودعات، نفس الصنف، نفس الدقيقة.\n\n"
               "بستاكو كل واحد بيسجّل من حسابه، كل حركة بتصير سطر لحالها مع اسم ووقت، والمجموع بيتحدّث عند الكل بنفس اللحظة.",
               "Closing question and Prototype badge removed; the three chats are drawn cards (no app name). Research is evidence, not copy. Demo figures and first names."),
    "RES-08": ("2027-01/RES-08_more-places-than-you-think",
               "Count the places your stock is right now: each warehouse, the showroom's back room, the truck on the road, the container at the port.\n\n"
               "In Stacko every warehouse is on one map, with transfers and incoming shipments moving between them.",
               "عِدّ المطارح اللي فيها بضاعتك هلّق: كل مستودع، المخزن ورا صالة العرض، الشاحنة عالطريق، والكونتينر بالمرفأ.\n\n"
               "بستاكو كل مستودع عخريطة وحدة، والتحويلات والشحنات الواردة ماشية بيناتن.",
               "Closing question ('How many places did you count?') and Prototype badge removed. The showroom is an educational point only: no showroom pin on the Stacko map. Demo figures."),
    "RES-04": ("2027-01/RES-04_clear-stock-not-more-tracking",
               "Nobody on the floor wants another thing to fill in.\n\n"
               "In Stacko, a move is one message from the phone. A manager approves it, the truck shows up on the map, and the inventory ledger keeps who moved what and when.\n\n"
               "The point is knowing where the stock went.",
               "ما حدا بالأرض بدّو شي زيادة يعبّيه.\n\n"
               "بستاكو، الحركة رسالة وحدة من التلفون. المدير بيوافق، الشاحنة بتطلع عالخريطة، وسجل حركة المخزون بيحفظ مين نقل شو وإيمتى.\n\n"
               "المهمّ إنك تعرف وين راحت البضاعة.",
               "Closing question, Telegram name and Prototype badge removed. No line claiming Stacko never measures people (not in the bible). '10 seconds' kept off screen. Demo figures and first names."),
    "D30-26": ("2026-12/D30-26_where-stock-while-truck",
               "It's the gap nobody talks about: stock that has left one place and hasn't reached the other.\n\n"
               "In Stacko, stock leaves on dispatch, travels on the map with its ETA, and lands on arrival. It's never \"nowhere\".",
               "هيدي الفجوة اللي ما حدا بيحكي عنها: بضاعة طلعت من محلّ وبعدها ما وصلت عالتاني.\n\n"
               "بستاكو، البضاعة بتطلع وقت الشحن، بتمشي عالخريطة مع وقت وصولها، وبتفوت لمّا توصل. ما بتكون أبداً «بلا مطرح».",
               "Closing question and Prototype badge removed. Real footage of loading replaced by a dot truck and a notebook card. Demo figures (WH-01 7,250 → 7,210, WH-02 4,980 → 5,020)."),
    "D30-14": ("2026-12/D30-14_our-trucks-move-without",
               "Phase 1 doesn't need GPS. If you know when the truck left and when it's due, you can show roughly where it is.\n\n"
               "Small idea, big difference for logging: people see the result of every move on the Stacko map. Real GPS comes later.",
               "المرحلة الأولى ما بدّها GPS. إذا بتعرف إيمتى طلعت الشاحنة وإيمتى لازم توصل، فيك تبيّن تقريباً وين صارت.\n\n"
               "فكرة صغيرة، بس فرق كبير بالتسجيل: الناس بتشوف نتيجة كل حركة عخريطة ستاكو. والـGPS الحقيقي بعدين.",
               "The founder talking head is replaced by a progress card (no presenter clip). ETA logic from the product bible; GPS is phase 2 and is said to come later. Demo figures (left 09:10, ETA 73 min, 38 min in = 52%)."),
    "D30-08": ("2026-12/D30-08_every-container-brings-new",
               "If you import from China, you know the feeling: half the invoice is products you've never sold before.\n\n"
               "In Stacko, AI reads the supplier invoice, matches the items you already have and flags the new ones for a person to confirm. Nothing is created until someone does.",
               "إذا بتستورد من الصين، بتعرف هالشعور: نصّ الفاتورة أصناف ما عمرك بعتها.\n\n"
               "بستاكو، الذكاء الاصطناعي بيقرا فاتورة المورّد، بيربط الأصناف اللي عندك، وبيعلّم الجديدة ليأكّدها شخص. وما في شي بينعمل قبل ما حدا يأكّد.",
               "Closing question and 'Planned · in build' badge removed (AI invoice reading is phase 1 in the bible). The invoice component's 'EXAMPLE' stamp is hidden. Demo invoice (LED strip, earbuds, yoga mat, storage box)."),
    "D30-17": ("2026-12/D30-17_supplier-sent-excel-packing",
               "PDF, Excel or a photo. Stacko reads your supplier's documents and drafts the incoming shipment, so it's on the map before it even sails.\n\n"
               "You check the draft, then it's recorded.",
               "PDF أو إكسل أو صورة. ستاكو بيقرا مستندات المورّد وبيحضّر الشحنة الواردة، فبتطلع عالخريطة قبل ما تبحر.\n\n"
               "بتراجع المسودة، وبعدها بتتسجّل.",
               "Closing question and 'Planned' badge removed; no speed claims. Route and duration from the product bible ('about'). Demo packing list. Third invoice-themed post: consider spacing it from D30-08 and IDEA-130."),
    "D30-03": ("2026-12/D30-03_manager-who-still-loves",
               "No judgement. Paper has been loyal for years.\n\n"
               "But when the truck leaves, the record should leave with it. In Stacko, one message from the phone drafts the transfer, a manager approves it, and the truck shows up on the map.",
               "ما في حكم. الورق كان وفي لسنين.\n\n"
               "بس لمّا تطلع الشاحنة، لازم يطلع التسجيل معها. بستاكو، رسالة وحدة من التلفون بتحضّر التحويل، المدير بيوافق، والشاحنة بتطلع عالخريطة.",
               "'Tag the paper fan' ask removed; Telegram not named; Prototype badge removed. No presenter clips exist, so receipts rain as notes and the transfer plays as message cards and the map. Karim and Maya are the brand's fictional hosts."),
    "D30-19": ("2026-12/D30-19_3-things-every-owner",
               "Not 30 reports. Three answers, before 9 AM: what's running low, what's on the way and when it lands, and what moved yesterday and who moved it.\n\n"
               "With Stacko, all three are on one screen: the live map.",
               "مش 30 تقرير. تلات أجوبة، قبل الـ9 الصبح: شو عم يخلص، شو جايي وإيمتى بيوصل، وشو تحرّك مبارح ومين حرّكه.\n\n"
               "مع ستاكو، التلاتة على شاشة وحدة: الخريطة المباشرة.",
               "Closing question removed. No presenter clip exists, so the checklist builds over a clock. 'Replace your WMS' angle avoided (as in the plan)."),
    "D30-21": ("2026-12/D30-21_alert-tells-do",
               "A low-stock alert is useful. Seeing what's already on the way, on the same map, is better.\n\n"
               "In Stacko, the alert reaches your phone, and the map shows the incoming shipment and the stock in every other warehouse, so you can decide.",
               "تنبيه النقص مفيد. بس إنك تشوف شو جايي عالطريق، على نفس الخريطة، أحسن.\n\n"
               "بستاكو، التنبيه بيوصل عتلفونك، والخريطة بتورجيك الشحنة الواردة والكميّات بكل المستودعات التانية، فبتقرّر.",
               "'Planned' badge removed. The plan's 'Transfer 100 from Beirut?' suggestion is phase 3 (reorder suggestions) and is left out: the alert only says low stock; the owner decides. Demo figures."),
    "D30-30": ("2026-12/D30-30_four-headaches-one-map",
               "This month in one reel: invoices into drafts, a message into a transfer, counts that flag the gap, and alerts before surprises.\n\n"
               "Stacko is the stock management system built for trading and distribution businesses in Lebanon and the Gulf: every warehouse on one live map.",
               "هالشهر بريل واحد: فواتير بتصير مسودات، رسالة بتصير تحويل، جردة بتبيّن الفرق، وتنبيهات قبل المفاجآت.\n\n"
               "ستاكو هو نظام إدارة المخازن لشركات التجارة والتوزيع بلبنان والخليج: كل مستودع عخريطة وحدة مباشرة.",
               "'DM us MAP' and stage labels removed. Demo figures."),
    "UED-02": ("unscheduled/UED-02_adjust-dont-overwrite",
               "Overwriting a quantity fixes the number and hides the reason. An adjustment fixes it and keeps both: what changed, who changed it, and why.\n\n"
               "In Stacko, you find the reason in the item's history, record a stock adjustment with a note, and it goes through approval. The original records stay.",
               "إذا كتبت فوق الكمية، الرقم بيتصلّح والسبب بيختفي. التسوية بتصلّحه وبتحفظ الاتنين: شو تغيّر، مين غيّره، وليش.\n\n"
               "بستاكو، بتلاقي السبب بتاريخ الصنف، بتسجّل تسوية مخزنية مع ملاحظة، وبتمرق عالموافقة. والسجلّات الأصلية بتضلّ.",
               "User education (manual page not written here). Adjustments with reasons, approval and the audit trail are built (app TERMINOLOGY rule 5). Demo figures."),
    "UED-03": ("unscheduled/UED-03_transfer-not-done-when-truck-leaves",
               "Most transfer problems start when the truck leaves and nobody records what actually arrives.\n\n"
               "In Stacko, a transfer is in transit until the other warehouse receives it. If fewer units arrive, it's partially received, and you can close it short with a reason.",
               "أغلب مشاكل التحويل بتبلّش لمّا تطلع الشاحنة وما حدا يسجّل شو وصل فعلاً.\n\n"
               "بستاكو، التحويل بيضلّ قيد النقل لحدّ ما المستودع التاني يستلمه. وإذا وصل أقلّ، بيصير مستلم جزئياً، وفيك تسكّره بالناقص مع سبب.",
               "User education. Partial receipt and close short are built (receive_transaction). Demo figures (38 of 40, 2 cartons damaged)."),
    "UED-04": ("unscheduled/UED-04_shipment-due-yesterday",
               "Arrival dates change. The problem is when the change lives in one person's phone.\n\n"
               "In Stacko, every ETA change is kept with who changed it, a late shipment shows as Delayed, and due and overdue notices reach the right people by email or phone messages.",
               "مواعيد الوصول بتتغيّر. المشكلة لمّا التغيير بيضلّ بتلفون شخص واحد.\n\n"
               "بستاكو، كل تغيير بوقت الوصول بينحفظ مع مين غيّره، الشحنة المتأخّرة بتبيّن «متأخّرة»، وإشعارات الوصول والتأخير بتوصل للناس المعنيّين بالإيميل أو برسائل عالتلفون.",
               "User education. ETA history, the Delayed badge and due/overdue notifications are built (0030, 0024). CHECK: notification delivery must be switched on in the live project (app/docs/OPERATIONS.md). No app names on screen."),
    "UED-07": ("unscheduled/UED-07_alerts-come-to-you",
               "Nobody can watch a stock system all day. Notifications bring the moments that need someone, an approval, a due shipment, a count mismatch, to the person who can act.\n\n"
               "In Stacko, each person chooses email or phone messages for themselves, and the company decides which events are on.",
               "ما حدا فيه يراقب سيستم المخازن كل النهار. الإشعارات بتجيب اللحظات اللي بدّها حدا، موافقة، شحنة واصلة، فرق بالجردة، للشخص اللي فيه يتصرّف.\n\n"
               "بستاكو، كل واحد بيختار الإيميل أو رسائل التلفون لحاله، والشركة بتقرّر أيّا أحداث شغّالة.",
               "User education. Notification rules and personal preferences are built (0024). CHECK: delivery must be switched on in the live project. Channels said as 'email or phone messages' (no app names)."),
    "JAN-03": ("unscheduled/JAN-03_which-products-need-attention",
               "A good assistant doesn't just show numbers. It points at what to check first, and shows you why.\n\n"
               "Ask Stacko which products need your attention: low stock, moves waiting for approval and what's in transit, each with the record behind it. Suggestions for you to review; nothing changes until you act.",
               "المساعد المنيح ما بيورجيك أرقام وبس. بيدلّك عشو تشيّك أوّل، وبيقلّك ليش.\n\n"
               "اسأل ستاكو أيّا أصناف بدّها انتباهك: النقص، الحركات الناطرة موافقة، واللي قيد النقل، كل واحد مع السجلّ اللي وراه. اقتراحات لتراجعها، وما في شي بيتغيّر قبل ما تتصرّف.",
               "The answer uses only what Ask Stacko's read-only tools return (low stock, pending approvals, in transit). 'Flagged discrepancies' from the plan shown as a pending count adjustment. CHECK the publish date (none in the plan)."),
}


def write(pid):
    folder, en, ar, note = META[pid]
    d = POSTS / folder
    d.mkdir(parents=True, exist_ok=True)
    (d / "caption_en.txt").write_text(en + "\n", encoding="utf8")
    (d / "caption_ar.txt").write_text(ar + "\n", encoding="utf8")
    (d / "notes.md").write_text(f"# {pid} · round 4 reel\n\nreel.html written by hand on 12 Nov 2026 (motion engine); captions from posts/round4_reels.py.\n\n{note}\n", encoding="utf8")
    print("wrote", folder)


if __name__ == "__main__":
    for pid in (sys.argv[1:] or META):
        write(pid)
