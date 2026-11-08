# python sheet.py <itemDir> <out.png> [prefix] : contact sheet of png-en and png-ar rows
import sys, glob, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]; pre = sys.argv[3] if len(sys.argv) > 3 else 'slide'
rows = []
for L in ('en', 'ar'):
    fs = sorted(glob.glob(os.path.join(d, f'png-{L}', f'{pre}-*.png')))
    if fs: rows.append([Image.open(f) for f in fs])
w = 250
rows = [[i.resize((w, int(w * i.height / i.width))) for i in r] for r in rows]
h = max(i.height for r in rows for i in r)
img = Image.new('RGB', (max(len(r) for r in rows) * (w + 8), len(rows) * (h + 8)), 'white')
for y, r in enumerate(rows):
    for x, i in enumerate(r): img.paste(i, (x * (w + 8), y * (h + 8)))
img.save(out)
