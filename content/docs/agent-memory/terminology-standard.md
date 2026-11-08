---
name: terminology-standard
description: Stacko's inventory terminology standard (app/docs/TERMINOLOGY.md) — use its EN/AR words on every screen, email, bot reply
metadata:
  type: project
---

Since 2026-10-31 the app follows an inventory-management expert's dictionary, written down in `app/docs/TERMINOLOGY.md`: "Transaction / حركة مخزنية" (never "move" on screens), Stock receipt / issue / transfer / adjustment, Incoming shipment (not "Import"), On hand / الرصيد, Available / المتاح, Pending approval, In transit / قيد النقل, Inventory ledger, Audit trail. Database keys stay as they are (`import`, `moves` routes, `stock_levels`); the document maps them.

**Why:** the user approved the expert's recommendation to use one word per concept across UI, docs and customers.

**How to apply:** take labels from TERMINOLOGY.md when adding screens, emails, Telegram replies or AI prompts; add new terms there first. Not-yet-built concepts (batches, bins, reservations, valuation…) stay off screens. See also [[handoff-checklist-plan]].
