#!/usr/bin/env python3
"""Stacko Studio · place real screens into green-screen backgrounds.

The office / presentation backgrounds (BG-xx) are generated with flat chroma-green
(#00FF00) monitors, laptops, phones and TVs. This tool finds every green screen,
fits its four corners, and warps a real Stacko screenshot (or logo card) into it
with matching perspective, focus, brightness, grain and a soft glare, so the
result reads as a photo, not a paste.

Examples
    # 1. see what it finds (writes <name>_screens.png with numbered outlines)
    python3 studio/tools/place_screens.py assets/backgrounds/raw/BG-03.png --list

    # 2. fill screens in order (left→right), cycling the list if there are more screens
    python3 studio/tools/place_screens.py assets/backgrounds/raw/BG-03.png \
        --fill assets/screens/SCR-01_live-map.png assets/screens/SCR-04_dashboard.png \
        -o assets/backgrounds/final/BG-03_map.png

    # 3. pick per screen (numbers from --list), tune the look
    python3 studio/tools/place_screens.py BG-07.png --fill 1=SCR-01.png 2=GFX-logo-card.png \
        --order area --blur auto --glare .25 --dim .9 --grain auto -o BG-07_final.png

Options
    --list               only detect; print the quads and save an annotated preview
    --fill A B | 1=A     screen images, in order or by index
    --order lr|tb|area   numbering order (default lr = left to right)
    --min-area 0.002     ignore green blobs smaller than this share of the image
    --fit cover|contain|stretch   how the image fills the quad (default cover)
    --glare 0.18         strength of the soft diagonal reflection (0 = off)
    --blur auto|0|N      depth-of-field blur in px; auto matches the surroundings
    --dim 0.92           brightness multiplier for the inserted screen
    --grain auto|0|N     noise to match the photo (auto measures it)
    --feather 1.5        edge softening in px
    -o out.png           output path (default: <name>_placed.png next to the input)
"""
import argparse, os, sys
import numpy as np
import cv2


def green_mask(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    b, g, r = [img[..., i].astype(int) for i in range(3)]
    m = ((h > 40) & (h < 85) & (s > 90) & (v > 70) & (g > r + 40) & (g > b + 40)).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k, iterations=1)
    return m


def order_pts(p):
    p = np.array(p, dtype=np.float32).reshape(4, 2)
    s, d = p.sum(1), np.diff(p, axis=1).ravel()
    return np.array([p[np.argmin(s)], p[np.argmin(d)], p[np.argmax(s)], p[np.argmax(d)]], dtype=np.float32)  # tl tr br bl


def fit_quad(cnt):
    hull = cv2.convexHull(cnt); peri = cv2.arcLength(hull, True)
    for eps in np.linspace(.01, .08, 15):
        ap = cv2.approxPolyDP(hull, eps * peri, True)
        if len(ap) == 4: return order_pts(ap)
    return order_pts(cv2.boxPoints(cv2.minAreaRect(cnt)))


def find_screens(img, min_area=.002, order='lr'):
    m = green_mask(img); H, W = m.shape
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    quads = []
    for c in cnts:
        a = cv2.contourArea(c)
        if a < min_area * W * H: continue
        q = fit_quad(c); quads.append(dict(q=q, area=a, cx=q[:, 0].mean(), cy=q[:, 1].mean()))
    key = {'lr': lambda d: (d['cx'], d['cy']), 'tb': lambda d: (d['cy'], d['cx']), 'area': lambda d: -d['area']}[order]
    quads.sort(key=key)
    return quads, m


def quad_size(q):
    w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
    h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    return w, h


def prep_source(src, w, h, fit):
    sh, sw = src.shape[:2]; ta = w / max(h, 1)
    if fit == 'stretch': return src
    if fit == 'cover':
        if sw / sh > ta: nw = int(sh * ta); x0 = (sw - nw) // 2; return src[:, x0:x0 + nw]
        nh = int(sw / ta); y0 = max(0, (sh - nh) // 3); return src[y0:y0 + nh]
    # contain: pad with the image's own edge colour (dark UI or light UI both look right)
    pad_col = np.median(np.concatenate([src[0], src[-1]]), axis=0)
    if sw / sh > ta: nh = int(sw / ta); out = np.full((nh, sw, 3), pad_col, np.uint8); y0 = (nh - sh) // 2; out[y0:y0 + sh] = src; return out
    nw = int(sh * ta); out = np.full((sh, nw, 3), pad_col, np.uint8); x0 = (nw - sw) // 2; out[:, x0:x0 + sw] = src; return out


def sharpness(gray, mask):
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    return lap[mask > 0].var() if (mask > 0).any() else lap.var()


def focus_blur(img, q, mask_q):
    """Blur so the screen matches how sharp the surroundings are (the 'focus ratio')."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ring = cv2.dilate(mask_q, np.ones((61, 61), np.uint8)) - cv2.dilate(mask_q, np.ones((9, 9), np.uint8))
    local, glob = sharpness(gray, ring), sharpness(gray, np.ones_like(gray))
    ratio = local / max(glob, 1e-6)                        # < 1 → the area around the screen is softer than the photo
    w, h = quad_size(q)
    return float(np.clip((1 - min(ratio, 1)) * 0.006 * max(w, h), 0, 6))


def noise_level(img, mask_q):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hp = gray - cv2.GaussianBlur(gray, (0, 0), 1.2)
    ring = cv2.dilate(mask_q, np.ones((41, 41), np.uint8)) - cv2.dilate(mask_q, np.ones((7, 7), np.uint8))
    vals = hp[ring > 0] if (ring > 0).any() else hp.ravel()
    return float(np.median(np.abs(vals)) * 1.4826)          # robust sigma


def despill(img, mask):
    ring = cv2.dilate(mask, np.ones((9, 9), np.uint8)) > 0
    b, g, r = [img[..., i].astype(np.int32) for i in range(3)]
    lim = np.maximum(r, b) + 6
    g2 = np.where(ring & (g > lim), lim, g)
    out = img.copy(); out[..., 1] = np.clip(g2, 0, 255).astype(np.uint8); return out


LAST = {}


def place(img, q, src, fit='cover', glare=.18, blur='auto', dim=.92, grain='auto', feather=1.5, green=None):
    H, W = img.shape[:2]; w, h = quad_size(q)
    src = prep_source(src, w, h, fit)
    sh, sw = src.shape[:2]
    scale = max(1.0, 2 * max(w, h) / max(sw, sh))           # supersample small sources for clean edges
    if scale > 1: src = cv2.resize(src, (int(sw * scale), int(sh * scale)), interpolation=cv2.INTER_CUBIC); sh, sw = src.shape[:2]
    S = np.array([[0, 0], [sw - 1, 0], [sw - 1, sh - 1], [0, sh - 1]], np.float32)
    M = cv2.getPerspectiveTransform(S, q)
    warped = cv2.warpPerspective(src, M, (W, H), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
    mq = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(mq, q.astype(np.int32), 255)
    if green is not None: mq = cv2.bitwise_or(mq, cv2.bitwise_and(cv2.dilate(mq, np.ones((7, 7), np.uint8)), green))
    mq = cv2.dilate(mq, np.ones((3, 3), np.uint8))           # eat the last green pixel line

    warped = warped.astype(np.float32)
    bl = focus_blur(img, q, mq) if blur == 'auto' else float(blur)
    if bl > .3: warped = cv2.GaussianBlur(warped, (0, 0), bl)
    warped *= float(dim)
    if glare and glare > 0:                                   # soft diagonal reflection, strongest top-left
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        c = q.mean(0); d = (xx - c[0]) * .55 + (yy - c[1]) * .85
        span = max(w, h); band = np.clip(1 - np.abs(d + span * .22) / (span * .38), 0, 1) ** 2
        warped += band[..., None] * 255 * float(glare) * .5
    gs = noise_level(img, mq) if grain == 'auto' else float(grain)
    LAST.update(blur=bl, grain=gs)
    if gs > .2: warped += np.random.default_rng(3).normal(0, gs, warped.shape[:2])[..., None]

    alpha = cv2.GaussianBlur(mq.astype(np.float32) / 255, (0, 0), max(.1, float(feather)))[..., None]
    base = despill(img, mq).astype(np.float32)
    out = base * (1 - alpha) + np.clip(warped, 0, 255) * alpha
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('image'); ap.add_argument('--list', action='store_true'); ap.add_argument('--fill', nargs='*', default=[])
    ap.add_argument('--order', default='lr', choices=['lr', 'tb', 'area']); ap.add_argument('--min-area', type=float, default=.002)
    ap.add_argument('--fit', default='cover', choices=['cover', 'contain', 'stretch']); ap.add_argument('--glare', type=float, default=.18)
    ap.add_argument('--blur', default='auto'); ap.add_argument('--dim', type=float, default=.92); ap.add_argument('--grain', default='auto')
    ap.add_argument('--feather', type=float, default=1.5); ap.add_argument('-o', '--out')
    a = ap.parse_args()

    img = cv2.imread(a.image, cv2.IMREAD_COLOR)
    if img is None: sys.exit('cannot read ' + a.image)
    quads, green = find_screens(img, a.min_area, a.order)
    base = os.path.splitext(a.image)[0]
    if a.list or not a.fill:
        vis = img.copy()
        for i, d in enumerate(quads, 1):
            cv2.polylines(vis, [d['q'].astype(np.int32)], True, (40, 40, 255), 4)
            cv2.putText(vis, str(i), (int(d['cx']) - 18, int(d['cy']) + 18), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 6)
            cv2.putText(vis, str(i), (int(d['cx']) - 18, int(d['cy']) + 18), cv2.FONT_HERSHEY_SIMPLEX, 1.6, (40, 40, 255), 3)
            w, h = quad_size(d['q'])
            print(f"{i}: area {d['area'] / (img.shape[0] * img.shape[1]) * 100:.2f}%  size ~{w:.0f}x{h:.0f}  aspect {w / max(h, 1):.2f}  corners {d['q'].round().astype(int).tolist()}")
        if not quads: print('no green screens found (try --min-area 0.0005, or check the screens are flat #00FF00)')
        p = base + '_screens.png'; cv2.imwrite(p, vis); print('preview:', p)
        if not a.fill: return

    jobs = {}
    plain = [f for f in a.fill if '=' not in f]
    for f in a.fill:
        if '=' in f: k, v = f.split('=', 1); jobs[int(k)] = v
    k = 0
    for i in range(1, len(quads) + 1):
        if jobs.get(i) is None and plain: jobs[i] = plain[k % len(plain)]; k += 1
    out = img
    for i, d in enumerate(quads, 1):
        f = jobs.get(i)
        if not f: continue
        src = cv2.imread(f, cv2.IMREAD_COLOR)
        if src is None: print('skip, cannot read', f); continue
        out = place(out, d['q'], src, a.fit, a.glare, a.blur, a.dim, a.grain, a.feather, green)
        print(f'screen {i} ← {os.path.basename(f)}' + (f"   (auto blur {LAST['blur']:.1f}px, grain {LAST['grain']:.1f})" if LAST else ''))
    p = a.out or base + '_placed.png'; os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
    cv2.imwrite(p, out); print('saved', p)


if __name__ == '__main__':
    main()
