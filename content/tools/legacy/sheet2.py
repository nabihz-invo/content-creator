# python sheet2.py <itemDir> <out.png> : contact sheet of en/ and ar-needs-native-review/ rows (v2 layout)
import sys, glob, os
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
rows = [[Image.open(f) for f in sorted(glob.glob(os.path.join(d, sub, '*.png')))] for sub in ('en', 'ar-needs-native-review')]
rows = [r for r in rows if r]
w = 250
rows = [[i.resize((w, int(w * i.height / i.width))) for i in r] for r in rows]
h = max(i.height for r in rows for i in r)
img = Image.new('RGB', (max(len(r) for r in rows) * (w + 8), len(rows) * (h + 8)), 'white')
for y, r in enumerate(rows):
    for x, i in enumerate(r): img.paste(i, (x * (w + 8), y * (h + 8)))
img.save(out)
