"""Instagram profile mockup (12 Nov 2026): one page that looks like the Stacko Instagram profile, built from the real posts.
    python -I -X utf8 posts/build_profile_mockup.py          (run from content/)
→ posts/unscheduled/IDEA-239_instagram-profile/preview/instagram/index.html  (+ img/; rendered output, gitignored)

Profile text, pins, highlights and the first nine grid posts come from the page plan (build_page_kit.PROFILE and the lists
below). Slides come from each post's final/en|ar or en|ar slides, then preview/, and are rendered from source/ when neither
exists. Reels use their cover and play the local MP4 when there is one. Status per post is read from the CRM.
"""
import html
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_page_kit import PROFILE  # noqa: E402

CONTENT = HERE.parent
REPO = CONTENT.parent
OUT = HERE / "unscheduled" / "IDEA-239_instagram-profile" / "preview" / "instagram"
IMG = OUT / "img"
CACHE = OUT / "_render"
LANGS = ("en", "ar")

PINS = ["LCH-00", "IDEA-232", "IDEA-141"]
# The first nine feed posts in posting order (1 = first post, shown bottom-right; 9 = newest, top-left under the pins).
FIRST9 = [
    ("IDEA-117", "Meet Stacko"), ("NOV-09", "One map"), ("NOV-04", "The problem"),
    ("IDEA-221", "Inside the product"), ("NOV-01", "See every warehouse"), ("IDEA-001", "Follow a shipment"),
    ("IDEA-233", "On the way ≠ in stock"), ("EDU-04", "Daily operations"), ("IDEA-215", "What's inside Stacko"),
]
# (name EN, cover number in IDEA-186, [(post, which pages, fixed language or None)])
HIGHLIGHTS = [
    ("Start Here", 1, [("IDEA-235", None, None)]),
    ("Demo", 2, [("IDEA-232", None, None)]),
    ("Features", 3, [("IDEA-236", None, None)]),
    ("Tips", 4, [("STK-03", [1], None), ("IDEA-006", [1], None), ("IDEA-007", [1], None), ("IDEA-008", [1], None), ("IDEA-009", [1], None)]),
    ("FAQ", 5, [("IDEA-237", None, None)]),
    ("Contact", 6, [("IDEA-238", None, None)]),
    ("عربي", 7, [("IDEA-235", None, "ar"), ("IDEA-236", [1, 3, 9], "ar")]),
]


def folder(pid):
    hits = sorted(HERE.glob(f"*/{pid}_*"))
    if not hits:
        raise SystemExit(f"no folder for {pid}")
    return hits[0]


def nkey(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]


def is_ar(name):
    return bool(re.search(r"(-AR\b|-AR-|-ar-|_AR\b|_ar\b|-ar\b)", name))


def render(src, lang_tag):
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"{src.parent.parent.name}_{src.stem}.png"
    if not out.exists():
        subprocess.run(["node", "studio/post/render.mjs", str(src.relative_to(CONTENT)).replace("\\", "/"), "--out", str(out)],
                       cwd=CONTENT, check=True, stdout=subprocess.DEVNULL)
    return out


def slides(pid, lang):
    d = folder(pid)
    for sub in (d / "final" / lang, d / lang):
        got = sorted(sub.glob("slide-*.png"), key=nkey) if sub.is_dir() else []
        if got:
            return got
    src = sorted([p for p in (d / "source").glob("*.html") if is_ar(p.stem) == (lang == "ar")], key=nkey) if (d / "source").is_dir() else []
    out = []
    for p in src:
        pv = d / "preview" / f"{p.stem}.png"
        out.append(pv if pv.exists() else render(p, lang))
    return out


def reel(pid, lang):
    d = folder(pid)
    L = lang.upper()
    cover = next((p for p in (d / f"cover_{L}.png", d / "cover.png") if p.exists()), None)
    vids = [p for p in d.glob("*.mp4") if "15s" not in p.name]
    vid = next((p for p in vids if f"_{L}" in p.name), None) or next((p for p in vids if not re.search(r"_(EN|AR)\.mp4$", p.name)), None)
    if vid is None and (d / "final").is_dir():
        vid = next(iter(sorted((d / "final").rglob(f"*{L}*.mp4"))), None)
    return cover, vid


def caption(pid, lang):
    d = folder(pid)
    for n in (f"caption_{lang}.txt", f"caption_{lang.upper()}.txt"):
        if (d / n).exists():
            t = (d / n).read_text(encoding="utf8").strip()
            break
    else:
        t = (d / "caption.txt").read_text(encoding="utf8") if (d / "caption.txt").exists() else ""
        m = re.search(r"^CAPTION\s*\n(.*?)(?=^\s*(?:[A-Z][A-Z ()\-]{3,})\s*(?:\(|$)|\Z)", t, re.S | re.M)
        t = (m.group(1) if m else t).strip()
    tags = (d / "hashtags.txt").read_text(encoding="utf8").strip() if (d / "hashtags.txt").exists() else ""
    if tags and tags not in t:
        t += "\n\n" + tags
    return t


def save(src, name, w, crop=None):
    """Write a compact JPEG copy into img/ and return its relative path."""
    IMG.mkdir(parents=True, exist_ok=True)
    out = IMG / f"{name}.jpg"
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop(crop)
    im.thumbnail((w, w * 3))
    im.save(out, "JPEG", quality=82, optimize=True)
    return f"img/{out.name}"


def rel(p):
    """Path from the mockup folder to a file elsewhere in content/ (videos are linked, not copied)."""
    return "../../../../" + str(p.relative_to(HERE)).replace("\\", "/")


def stages(ids):
    q = CACHE.parent / "_status.sql"
    CACHE.mkdir(parents=True, exist_ok=True)
    q.write_text("select source_metadata->>'plan_id', public.inbox_stage(p) from content_projects p where source_metadata->>'plan_id' in ("
                 + ",".join(f"'{i}'" for i in ids) + ");", encoding="utf8")
    import shutil
    bash = next((b for b in ("C:/Program Files/Git/bin/bash.exe", shutil.which("bash")) if b and Path(b).exists()), "bash")
    try:
        r = subprocess.run([bash, "scripts/sql.sh", "-f", str(q)], cwd=REPO, capture_output=True, text=True, encoding="utf8")
        rows = [[c.strip() for c in ln.split("|")] for ln in r.stdout.splitlines() if "|" in ln and "inbox_stage" not in ln]
        if not rows:
            print("status lookup returned nothing:", r.stderr.strip()[:200])
        return {a: b for a, b in rows}
    except Exception as e:  # noqa: BLE001
        print("status lookup failed:", e)
        return {}


def post_entry(pid, label=""):
    d = folder(pid)
    kind = "reel" if (d / "reel.html").exists() or list(d.glob("*.mp4")) else None
    e = {"id": pid, "label": label, "lang": {}}
    for l in LANGS:
        if kind == "reel":
            cover, vid = reel(pid, l)
            e["lang"][l] = {"cover": save(cover, f"{pid}-{l}-cover", 720) if cover else "", "video": rel(vid) if vid else "", "caption": caption(pid, l)}
        else:
            ss = slides(pid, l)
            e["lang"][l] = {"slides": [save(s, f"{pid}-{l}-{i + 1:02d}", 720) for i, s in enumerate(ss)], "caption": caption(pid, l)}
    if kind != "reel":
        kind = "carousel" if len(e["lang"]["en"]["slides"]) > 1 else "static"
    e["kind"] = kind
    print(f"  {pid:9} {kind:8} " + " ".join(f"{l}:{len(e['lang'][l].get('slides', [])) or ('video' if e['lang'][l].get('video') else 'cover')}" for l in LANGS))
    return e


def story_items(pid, pages, fixed):
    d = folder(pid)
    out = {}
    for l in LANGS:
        lang = fixed or l
        if (d / "reel.html").exists():
            cover, vid = reel(pid, lang)
            out[l] = [{"type": "video", "src": rel(vid), "poster": save(cover, f"{pid}-{lang}-cover", 720) if cover else ""}] if vid else \
                     [{"type": "image", "src": save(cover, f"{pid}-{lang}-cover", 720), "fit": "contain"}]
            continue
        ss = slides(pid, lang)
        idx = pages or range(1, len(ss) + 1)
        items = []
        for i in idx:
            s = ss[i - 1]
            w, h = Image.open(s).size
            items.append({"type": "image", "src": save(s, f"{pid}-{lang}-{i:02d}", 720), "fit": "cover" if h / w > 1.6 else "contain"})
        out[l] = items
    return out


def main():
    print("posts")
    pins = [post_entry(p) for p in PINS]
    grid = [post_entry(p, lab) for p, lab in reversed(FIRST9)]  # newest first, as Instagram shows them
    print("highlights")
    hl = []
    cov_dir = folder("IDEA-186") / "preview"
    for name, n, items in HIGHLIGHTS:
        cov = cov_dir / f"IDEA-186-{n:02d}.png"
        if not cov.exists():
            cov = render(folder("IDEA-186") / "source" / f"IDEA-186-{n:02d}.html", "en")
        entry = {"name": name, "cover": save(cov, f"cover-{n:02d}", 240, crop=(140, 560, 940, 1360)), "items": {l: [] for l in LANGS}, "src": []}
        for pid, pages, fixed in items:
            got = story_items(pid, pages, fixed)
            for l in LANGS:
                entry["items"][l] += got[l]
            entry["src"].append(pid + ((" (first slide)" if pages == [1] else f" (stories {', '.join(map(str, pages))})") if pages else "") + (" · Arabic" if fixed else ""))
        hl.append(entry)
        print(f"  {name}: {len(entry['items']['en'])} stories")
    pfp = save(folder("IDEA-239") / "preview" / "IDEA-239.png", "profile", 320)
    ids = sorted({*PINS, *(p for p, _ in FIRST9), "IDEA-186", "IDEA-239", *(p for _, _, it in HIGHLIGHTS for p, _, _ in it)})
    data = {"profile": PROFILE, "pfp": pfp, "pfpFull": rel(folder("IDEA-239") / "preview" / "IDEA-239.png"), "pins": pins, "grid": grid,
            "highlights": hl, "first9": [p for p, _ in FIRST9], "status": stages(ids)}
    page = (HERE / "profile_mockup_template.html").read_text(encoding="utf8")
    page = page.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False))
    (OUT / "index.html").write_text(page, encoding="utf8")
    size = sum(p.stat().st_size for p in IMG.glob("*")) / 1e6
    print(f"wrote {OUT.relative_to(CONTENT)}/index.html  ({len(list(IMG.glob('*')))} images, {size:.1f} MB)")


if __name__ == "__main__":
    main()
