# python recolor.py <in.png|dir> <out.png|dir> : move warm hues (red/orange/yellow) to brand teal
# UI screenshots use a low saturation floor (pastel chips); illustrations (hero, story-map) a higher one
import sys, os, numpy as np
from PIL import Image

def recolor(im, smin=.28):
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3:]
    hsv = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    warm = ((h < 65) | (h > 330)) & (s > smin) & (v > .22)
    # soft edge on saturation so halos blend
    w = np.clip((s - smin) / .1, 0, 1) * warm
    nh = 180 + (h - 30) * .25          # teal band, slight variation kept
    hsv2 = np.stack([np.where(w > 0, nh, h) * 255 / 360, s * 255, v * 255], -1).astype(np.uint8)
    rgb2 = np.asarray(Image.fromarray(hsv2, 'HSV').convert('RGB')).astype(np.float32) / 255
    out = rgb * (1 - w[..., None]) + rgb2 * w[..., None]
    return Image.fromarray((np.concatenate([out, al], -1) * 255).astype(np.uint8), 'RGBA')

src, dst = sys.argv[1], sys.argv[2]
UI = lambda f: .06 if not any(k in os.path.basename(f) for k in ('hero',)) else .28
if os.path.isdir(src):
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith('.png'): recolor(Image.open(os.path.join(src, f)), UI(f)).save(os.path.join(dst, f))
else:
    im = recolor(Image.open(src), UI(src))
    (im.convert('RGB') if dst.endswith('.jpg') else im).save(dst)
