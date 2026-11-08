"""A folder of new images + its two workbooks → visual library, asset folders and post ideas (P5-T22).

    python -I -X utf8 scripts/import/image-batch.py content/assets/IMG \
        --remap BG-01=BG-56,BG-02=BG-57 [--status approved] [--apply]

The folder holds the images (<CODE>.jpg / .jfif / .png) and two workbooks:
  - images workbook, sheet "New Images": Asset ID, Group, What it shows, Aspect, Theme, Where to use,
    When, Post idea it supports, Prompt, File name, Received?, Notes
  - ideas workbook, sheet "Ideas": ID, Series, Title, Images, Format, … (the content bank)

--remap renames codes that are already used in the library (everywhere: files, entries, ideas,
both workbooks). Without --apply it only prints the plan. With --apply it:
  1. writes the library entries SQL and the ideas plan JSON to <folder>/_import/
  2. copies each image to content/assets/backgrounds/final/<CODE>.jpg (BG) or
     content/assets/post-images/final/<CODE>.jpg (SC, OB, SE, PI) — JPEG files keep their bytes
  3. rewrites the codes in both workbooks and marks "Received?" = Yes
Then run the SQL (psql), upload the files (library.mjs upload) and import the ideas
(content-plan-to-sql.py <json>), as printed at the end.
"""

import argparse
import json
import re
import shutil
from datetime import date, datetime
from pathlib import Path

import openpyxl

GROUP_PREFIX = {"BG": "background", "GFX": "graphic", "PI": "post_image", "SC": "post_image",
                "OB": "post_image", "SE": "post_image", "UI": "post_image", "PR": "post_image"}
GROUP_NAME = {"UI": "Device frame", "PR": "Presenter", "SC": "Scene", "OB": "Concept", "SE": "Seasonal", "BG": "Background", "PI": "Post image"}
# Sheet / column names differ between rounds; the first one found is used.
IMAGE_SHEETS = ("New Images", "Image Prompts", "New Image Prompts")
IDEA_SHEETS = ("Ideas", "Post Ideas", "New Ideas")
ALIASES = {  # later rounds' column name -> round 1 name
    "Family": "Group", "Used for": "Where to use", "Post ideas using it": "Post idea it supports",
    "Ideas using it": "Post idea it supports", "Image": "Images", "Image(s) needed": "Images",
    "Support line": "Support line (EN)", "Slides": "Slides (carousels)",
}
CODE_RE = re.compile(r"\b(BG|GFX|PI|SC|OB|SE|UI|PR|LCH)-\d{2,3}\b")
# Screens in these images are blank white (prompt rule "Screens: … blank, evenly lit white").
SCREEN_NOTE = "Blank white phone/tablet screen → place a real Stacko screen (assets/screens/)"


def text(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.date().isoformat() if isinstance(v, datetime) else v.isoformat()
    s = str(v).strip()
    return s or None


def sheet(wb, name):
    ws = wb[name]
    it = ws.iter_rows(values_only=True)
    head = [text(h) for h in next(it)]
    head = [h if h is None or h in head[:i] or ALIASES.get(h) in head else ALIASES.get(h, h) for i, h in enumerate(head)]
    return [{h: text(v) for h, v in zip(head, r) if h} for r in it if r and text(r[0])]


def find_workbook(folder, names):
    for p in sorted(folder.glob("*.xlsx")):
        if p.name.startswith("~$"):
            continue
        sheets = openpyxl.load_workbook(p, read_only=True).sheetnames
        for n in names:
            if n in sheets:
                return p, n
    raise SystemExit(f"no workbook with a {' / '.join(names)} sheet in {folder}")


def iso_date(v):
    return v if isinstance(v, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--remap", default="")
    ap.add_argument("--status", default="approved")
    ap.add_argument("--brand", default="Stacko")
    ap.add_argument("--assets", default=None, help="content/assets folder (default: <folder>/..)")
    ap.add_argument("--batch", default=None, help="name for the ideas batch (default: folder name)")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    folder = Path(a.folder).resolve()
    assets = Path(a.assets).resolve() if a.assets else folder.parent
    remap = dict(p.split("=") for p in a.remap.split(",") if p)
    sub = lambda s: CODE_RE.sub(lambda m: remap.get(m.group(0), m.group(0)), s) if isinstance(s, str) else s

    images_wb, images_sheet = find_workbook(folder, IMAGE_SHEETS)
    ideas_wb, ideas_sheet = find_workbook(folder, IDEA_SHEETS)
    images = sheet(openpyxl.load_workbook(images_wb, data_only=True), images_sheet)
    ideas = sheet(openpyxl.load_workbook(ideas_wb, data_only=True), ideas_sheet)

    files = {}
    for f in folder.iterdir():
        if f.suffix.lower() in (".jpg", ".jpeg", ".jfif", ".png", ".webp"):
            files[re.sub(r"\s+", "", f.stem).upper()] = f

    uses = {}
    for i in ideas:
        for c in {m.group(0) for m in CODE_RE.finditer(i.get("Images") or "")}:
            uses.setdefault(c, []).append(i["ID"])

    items, moves = [], []
    for r in images:
        old = r["Asset ID"]
        code = remap.get(old, old)
        prefix = code.split("-")[0]
        prompt = r.get("Prompt (copy into Nano Banana / Gemini)") or ""
        prompt = re.sub(rf"^{re.escape(old)}\s*[—-][^\n]*\n", "", prompt).strip()  # drop the "BG-01 — 4:5" line
        fits = "; ".join(x for x in (r.get("Post idea it supports"), ", ".join(uses.get(old, []))) if x)
        notes = "; ".join(x for x in (f"Theme: {r['Theme']}" if r.get("Theme") else None, r.get("Notes"),
                                      f"Renamed from {old} ({images_wb.name})" if old != code else None) if x)
        items.append({
            "code": code, "kind": GROUP_PREFIX[prefix], "status": a.status,
            "title": r.get("What it shows") or code,
            "collection": r.get("Group") or GROUP_NAME.get(prefix), "aspect": r.get("Aspect"),
            "prompt": prompt or None, "use_for": r.get("Where to use"), "when_to_use": r.get("When"),
            "fits_posts": sub(fits) or None, "notes": notes or None,
            "placeholders": SCREEN_NOTE if "Screens:" in prompt else None,
        })
        src = files.get(old)
        if src:
            ext = ".jpg" if src.suffix.lower() in (".jpg", ".jpeg", ".jfif") else src.suffix.lower()
            sub_dir = "backgrounds/final" if prefix == "BG" else "post-images/final"
            moves.append((src, assets / sub_dir / f"{code}{ext}", code))
    missing = [r["Asset ID"] for r in images if r["Asset ID"] not in files]

    batch = a.batch or f"image-batch-{folder.name.lower()}"
    plan_rows = []
    for i in ideas:
        r = {k: sub(v) for k, v in i.items()}
        scene = "\n\n".join(f"{k}:\n{r[k]}" for k in ("Support line (EN)", "On-image elements (HTML layer)",
                                                     "Slides (carousels)", "Images", "Conversion mechanic",
                                                     "KPI to watch", "Notes") if r.get(k))
        plan_rows.append({**r,
                          "Publish date": iso_date(r.get("Suggested date")) or iso_date(r.get("When")),
                          "Objective": " · ".join(x for x in (r.get("Series"), r.get("Answers") and f"answers {r['Answers']}",
                                                              r.get("Theme") and f"{r['Theme']} theme", r.get("Platform"),
                                                              not iso_date(r.get("When")) and r.get("When") and f"when: {r['When']}") if x),
                          "Hook EN (on screen, first 1.5 s)": r.get("Headline (EN)"),
                          "Hook AR": r.get("Headline (AR)"),
                          "Scene plan (beat by beat)": scene,
                          "Caption": r.get("Caption (EN)")})

    print(f"{len(items)} library entries ({len(moves)} with a file), {len(plan_rows)} ideas; remap {remap or 'none'}")
    for src, dst, code in moves:
        print(f"  {src.name:16} → {dst.relative_to(assets.parent)}")
    if missing:
        print(f"  no file yet: {', '.join(missing)}")
    if not a.apply:
        print("(dry run: add --apply)")
        return

    out = folder / "_import"
    out.mkdir(exist_ok=True)
    payload = json.dumps(items, ensure_ascii=False)
    assert "$lib$" not in payload
    (out / "library-items.sql").write_text(f"""-- {images_wb.name}: {len(items)} library entries (scripts/import/image-batch.py). Idempotent.
do $$
declare v_brand uuid := (select id from public.brands where name = '{a.brand}' order by created_at limit 1);
begin
  if v_brand is null then raise exception 'brand not found'; end if;
  insert into public.library_items (brand_id, code, kind, status, title, collection, aspect, prompt, use_for,
    when_to_use, fits_posts, notes, placeholders)
  select v_brand, i.code, i.kind, i.status, left(i.title, 300), i.collection, i.aspect, i.prompt, i.use_for,
    i.when_to_use, i.fits_posts, i.notes, i.placeholders
  from jsonb_to_recordset($lib${payload}$lib$::jsonb) as i(code text, kind text, status text, title text,
    collection text, aspect text, prompt text, use_for text, when_to_use text, fits_posts text, notes text,
    placeholders text)
  on conflict (brand_id, code) do nothing;
end $$;
""", encoding="utf-8")
    (out / "ideas-plan.json").write_text(json.dumps(
        {"workbook_key": batch, "source_file": ideas_wb.name, "content": plan_rows}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    (out / "uploads.txt").write_text("".join(f"{code}\t{dst}\n" for _, dst, code in moves), encoding="utf-8")

    for src, dst, _ in moves:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            raise SystemExit(f"{dst} already exists — pick another code with --remap")
        shutil.copy2(src, dst)

    # Keep both workbooks in step with the new codes.
    got = set(files) | {m[2] for m in moves}
    for p in {images_wb, ideas_wb}:
        wb = openpyxl.load_workbook(p)
        for ws in wb:
            recv = None
            for row in ws.iter_rows():
                for c in row:
                    if isinstance(c.value, str):
                        if c.value == "Received?":
                            recv = c.column
                        new = sub(c.value)
                        if new != c.value:
                            c.value = new
                if recv and ws.title == images_sheet and row[0].row > 1 and row[0].value:
                    if row[0].value in got:
                        ws.cell(row=row[0].row, column=recv).value = "Yes"
        wb.save(p)
    print(f"wrote {out}/library-items.sql, ideas-plan.json, uploads.txt; copied {len(moves)} files; workbooks updated")


if __name__ == "__main__":
    main()
