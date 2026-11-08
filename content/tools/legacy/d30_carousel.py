# python d30_carousel.py <spec.json> <outDir>
# 30-Day plan carousels (1080×1350) and story frames (1080×1920, "size": "story").
# spec.json: {id, size?, label?, images:{key: {src, ratio?, cx?, cy?, panel?, box?, screen?, screenCrop?}}, slides:[...]}
#   slide types: cover · step · text · big · shot · close · frame (story)
#   images: "logo": true marks a background that already shows the logo (GFX-xx), so the header logo is hidden
#   any slide: label (stage pill; true = spec label), tag ("Illustration"), note (small footnote), leg (import-leg tracker)
#   text: *word* = accent colour. Device images: "screen" = a real screenshot placed on the green screen.
# Crops the library images, builds one HTML page with a .slide per slide (system temp folder), renders each slide
# with render.js to <outDir>/slide-NN.png (frame-NN.png for stories). Brand: content/_brand/stacko.css + logo pack.
import json, os, re, subprocess, sys, html
import numpy as np
from PIL import Image, ImageFilter

TOOLS = os.path.dirname(os.path.abspath(__file__))
NEW = 'C:/nabih/projects/AIphin/Stacko/content/New'
LOGO = NEW + '/brand/Stacko_Logo_Pack/Stacko_Logo_Pack/svg/'
BRAND = 'file:///C:/nabih/projects/AIphin/Stacko/content/_brand/'  # Stacko brand kit: stacko.css tokens + local fonts
spec = json.load(open(sys.argv[1], encoding='utf-8')); out = os.path.abspath(sys.argv[2])
STORY = spec.get('size') == 'story'; W, H = (1080, 1920) if STORY else (1080, 1350)
tmp = os.path.join(os.environ.get('TEMP', '/tmp'), 'd30-' + spec['id']); os.makedirs(tmp, exist_ok=True)
url = lambda p: 'file:///' + p.replace('\\', '/')

def screen_on(m, shot, crop=None):
    """Place a real screenshot on the plain green device screen (perspective-fitted to the green area)."""
    a = np.asarray(m).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (g > 110) & (g - r > 55) & (g - b > 55)
    ys, xs = np.nonzero(mask)
    s, d = xs + ys, xs - ys
    quad = [(xs[s.argmin()], ys[s.argmin()]), (xs[d.argmax()], ys[d.argmax()]), (xs[s.argmax()], ys[s.argmax()]), (xs[d.argmin()], ys[d.argmin()])]
    sc = Image.open(shot).convert('RGB')
    if crop: sc = sc.crop(crop)
    qw = np.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]); qh = np.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1])
    ratio = qw / qh  # cover-crop the screenshot to the screen's shape
    if sc.width / sc.height > ratio: w = int(sc.height * ratio); sc = sc.crop((0, 0, w, sc.height))
    else: h = int(sc.width / ratio); sc = sc.crop((0, 0, sc.width, h))
    src = [(0, 0), (sc.width, 0), (sc.width, sc.height), (0, sc.height)]
    A = []; B = []
    for (x, y), (u, v) in zip(quad, src):  # output (x,y) -> input (u,v)
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    coef = np.linalg.solve(np.array(A, float), np.array(B, float))
    warped = sc.transform(m.size, Image.PERSPECTIVE, tuple(coef), Image.BICUBIC)
    k = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1))
    m = m.copy(); m.paste(warped, (0, 0), k); return m

def crop(key, v):
    m = Image.open(v['src']).convert('RGB')
    if v.get('panel') is not None:  # IMG-27 holds three backgrounds side by side
        w = m.width // 3; m = m.crop((v['panel'] * w + 4, 0, (v['panel'] + 1) * w - 4, m.height))
    if v.get('box'): m = m.crop(v['box'])  # a region of a real screenshot, kept at full resolution
    ratio = v.get('ratio', None if v.get('box') else W / H)
    if ratio:
        w0, h0 = m.size; cx, cy = v.get('cx', .5), v.get('cy', .5)
        if w0 / h0 > ratio: w = int(h0 * ratio); x = int(min(max(cx * w0 - w / 2, 0), w0 - w)); m = m.crop((x, 0, x + w, h0))
        else: h = int(w0 / ratio); y = int(min(max(cy * h0 - h / 2, 0), h0 - h)); m = m.crop((0, y, w0, y + h))
        m = m.resize((W, H), Image.LANCZOS)
    if v.get('screen'): m = screen_on(m, v['screen'], v.get('screenCrop'))
    f = os.path.join(tmp, key + ('.png' if v.get('box') else '.jpg')); m.save(f, **({} if v.get('box') else {'quality': 93}))
    return url(f), m.size

ICON = {  # simple line icons, 24-unit grid
    'list': '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    'calendar': '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14.5h3"/>',
    'compare': '<path d="M12 4v16M6 20h12"/><path d="M5 8h14"/><path d="M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
    'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    'wrench': '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 10a5.5 5.5 0 0 1-7.2 5.6L7 22.4a2 2 0 0 1-2.8-2.8l6.8-6.8A5.5 5.5 0 0 1 16.6 5.6z"/>',
    'bookmark': '<path d="M6 3h12v18l-6-4-6 4z"/>',
    'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'monitor': '<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8 20.5h8M12 16.5v4"/><path d="M6 8h5M6 11h8M15 8h3"/>',
    'phone': '<rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10.5 18.5h3"/>',
    'box': '<path d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    'bolt': '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    'chat': '<path d="M4 5.5h16v10H10l-4.5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    'check': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9.5"/>',
    'x': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    'block': '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    'pin': '<path d="M12 21.5s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10.5" r="2.4"/>',
    'doc': '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 11h6M9 14.5h6M9 18h4"/>',
    'factory': '<path d="M2.5 21V10l5 3V10l5 3V10l5 3V4h4v17z"/><path d="M6 17h2M11 17h2M16 17h2"/>',
    'ship': '<path d="M3 15.5h18l-2.5 4.5h-13z"/><path d="M5 15.5V11h14v4.5M8 11V7h6v4M11 7V4"/>',
    'plane': '<path d="M10.5 3.5c.6-1 2.4-1 3 0l.3 5.7 7.2 4.3v2l-7.3-2.2-.4 4.4 2.2 1.8v1.5l-3.5-1-3.5 1V20l2.2-1.8-.4-4.4L3 16v-2l7.2-4.3z"/>',
    'customs': '<rect x="3.5" y="6" width="17" height="13" rx="1.5"/><path d="M3.5 10h17M8 14.5h3M8 6V3.5h8V6"/><circle cx="16" cy="14.5" r="1.6"/>',
    'truck': '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    'question': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17v.2"/>',
    'seedling': '<path d="M12 21v-8"/><path d="M12 13c0-4-3-6.5-7.5-6.5 0 4 3 6.5 7.5 6.5zM12 11c0-3.5 2.6-6 6.5-6 0 3.5-2.6 6-6.5 6z"/>',
    'warehouse': '<path d="M2.5 9 12 3.5 21.5 9v11.5h-19z"/><path d="M6.5 20.5v-7h11v7M6.5 16.5h11"/>',
    'user': '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
}
ico = lambda k, s=1: f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{1.6 * s}" stroke-linecap="round" stroke-linejoin="round">{ICON[k]}</svg>'
def e(t):  # escape, then *accent*
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', html.escape(t))

imgs = {k: crop(k, v) for k, v in spec['images'].items()}
img = lambda k: imgs[k][0]
LEGS = [('factory', 'Factory'), ('ship', 'Sea / Air'), ('customs', 'Customs'), ('truck', 'Truck')]
n = len(spec['slides']); parts = []
for i, s in enumerate(spec['slides']):
    lab = s.get('label'); lab = spec.get('label') if lab is True else lab
    pill = f'<span class="stage">{e(lab)}</span>' if lab else ''
    head = f'<div class="top"><img class="logo" src="{url(LOGO + "stacko-horizontal-dark.svg")}"><span class="right">{pill}{"" if STORY else f"<span class=pg>{i + 1:02} / {n:02}</span>"}</span></div>'
    extra = (f'<span class="tag">{e(s["tag"])}</span>' if s.get('tag') else '') + (f'<p class="note">{e(s["note"])}</p>' if s.get('note') else '')
    leg = ''
    if s.get('leg'):
        leg = '<div class="legs">' + ''.join(f'<div class="lg{" on" if k + 1 == s["leg"] else (" done" if k + 1 < s["leg"] else "")}">{ico(ic)}<span>{t}</span></div>' + ('<i></i>' if k < 3 else '') for k, (ic, t) in enumerate(LEGS)) + '</div>'
    vis = ''
    if s.get('photo'):
        vis = f'<div class="photo" style="background-image:url({img(s["photo"])});background-position:{s.get("pos", "center")}"></div>'
    elif s.get('icon'):
        vis = f'<div class="iconwrap">{ico(s["icon"])}</div>'
    elif s.get('icons'):  # small illustration row: icon, icon, ...
        vis = '<div class="icons">' + ''.join(f'<div class="ic">{ico(k)}</div>' if k != '>' else f'<div class="sep">{ico("arrow")}</div>' for k in s['icons']) + '</div>'
    elif s.get('chips'):  # big numbers as the visual: "$1", ">", "$10", ...
        vis = '<div class="icons">' + ''.join(f'<div class="ic chip">{e(k)}</div>' if k != '>' else f'<div class="sep">{ico("arrow")}</div>' for k in s['chips']) + '</div>'
    lst = ''.join(f'<li>{f"<span class=li-ico>{ico(q[0])}</span>" if isinstance(q, list) else "<span class=dot></span>"}<span>{e(q[1] if isinstance(q, list) else q)}</span></li>' for q in s.get('list', []))
    lst = f'<ul>{lst}</ul>' if lst else ''
    kick = f'<div class="kicker">{e(s["kicker"])}</div>' if s.get('kicker') else ''
    body = f'<p class="body">{e(s["body"])}</p>' if s.get('body') else ''
    t = s['type']
    if t == 'cover':
        sub = f'<p class="sub">{e(s["sub"])}</p>' if s.get('sub') else ''
        inner = f'''<div class="bg" style="background-image:url({img(s['img'])});background-position:{s.get('pos', 'center')}"></div><div class="shade {s.get('shade', '')}"></div>{head}
<div class="cover {s.get('align', '')}">{kick}<h1>{e(s['title'])}</h1>{sub}{'' if STORY else f'<div class="swipe">{ico("arrow", 1.2)}</div>'}</div>'''
    elif t == 'step':
        inner = f'''<div class="bg" style="background-image:url({img(s['bg'])})"></div>{head}
<div class="step"><div class="num">{s['num']}</div><div class="kicker">{e(s.get('kicker', f"Step {s['num']}"))}</div>
<h2>{e(s['title'])}</h2>{body}{lst}</div>{vis}'''
    elif t == 'text':
        inner = f'''<div class="bg" style="background-image:url({img(s['bg'])})"></div>{head}{leg}
<div class="text{' withleg' if leg else ''}">{kick}<h2 class="{s.get('size', '')}">{e(s['title'])}</h2>{body}{lst}</div>{vis}'''
    elif t == 'big':
        inner = f'''<div class="bg" style="background-image:url({img(s['bg'])})"></div>{head}
<div class="big"><div class="huge">{e(s['num'])}</div>{kick}<h2>{e(s['title'])}</h2>{body}</div>{vis}'''
    elif t == 'shot':
        k = s['shot']; w_, h_ = imgs[k][1]; cw = s.get('w', 920); ch = cw * h_ / w_
        if ch > s.get('maxh', 760): ch = s.get('maxh', 760); cw = ch * w_ / h_
        calls = ''.join(f'<i class="call" style="left:{c[0]}%;top:{c[1]}%;width:{c[2]}%;height:{c[3]}%"></i>' for c in s.get('callouts', []))
        inner = f'''<div class="bg" style="background-image:url({img(s['bg'])})"></div>{head}{leg}
<div class="text shottext{' withleg' if leg else ''}">{kick}<h2 class="{s.get('size', 'm')}">{e(s['title'])}</h2>{body}</div>
<div class="shot {s.get('place', '')}" style="width:{cw:.0f}px;height:{ch:.0f}px"><img src="{img(k)}">{calls}</div>'''
    elif t == 'frame':  # story frame: headline at the top, open space below for the native sticker
        inner = f'''<div class="bg" style="background-image:url({img(s['bg'])})"></div>{head}
<div class="frame">{kick}<h2 class="{s.get('size', '')}">{e(s['title'])}</h2>{body}</div>'''
    else:  # close
        save = f'<div class="save">{ico(s.get("saveIcon", "bookmark"), 1.2)}<span>{e(s["save"])}</span></div>' if s.get('save') else ''
        inner = f'''<div class="bg" style="background-image:url({img(s['img'])})"></div><div class="shade close"></div>{head}
<div class="closing">{kick}<h2>{e(s['title'])}</h2>{body}{save}</div>
<img class="endlogo" src="{url(LOGO + "stacko-horizontal-tagline-dark.svg")}">'''
    bgk = s.get('bg') or s.get('img')  # GFX backgrounds carry their own small logo: no header logo, lift bottom content
    cls = ' gfx' if spec['images'].get(bgk, {}).get('logo') else ''
    cls += ' hasnote' if s.get('note') else ''
    parts.append(f'<section class="slide s-{t}{cls}">{inner}{extra}</section>')

css = f'''
body{{background:#333;font-family:var(--f-ui);color:var(--foam)}}
.slide{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:var(--abyss);margin:0 0 20px}}
em{{font-style:normal;color:var(--glow)}}
.bg{{position:absolute;inset:0;background-size:cover;background-position:center}}
.shade{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,36,64,.85) 0%,rgba(14,36,64,.15) 30%,rgba(14,36,64,.78) 58%,#0E2440 82%)}}
.shade.low{{background:linear-gradient(180deg,rgba(14,36,64,.85) 0%,rgba(14,36,64,0) 22%,rgba(14,36,64,0) 48%,rgba(14,36,64,.85) 66%,#0E2440 80%)}}
.shade.close{{background:linear-gradient(180deg,rgba(14,36,64,.95) 0%,rgba(14,36,64,.86) 50%,rgba(14,36,64,.96) 100%)}}
.top{{position:absolute;left:80px;right:80px;top:64px;display:flex;justify-content:space-between;align-items:center;z-index:3}}
.logo{{height:150px;margin:-44px 0 -44px -56px}}
.right{{display:flex;align-items:center;gap:26px}}
.pg{{font-size:26px;letter-spacing:.12em;color:var(--dolphin);font-weight:500}}
.stage{{font-size:24px;font-weight:600;padding:12px 22px;border-radius:999px;background:rgba(14,36,64,.82);border:1.5px solid rgba(121,192,222,.5);color:var(--foam);white-space:nowrap}}
.tag{{position:absolute;left:80px;bottom:44px;z-index:3;font-size:22px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:9px 18px;border-radius:999px;border:1.5px dashed var(--dolphin);color:var(--dolphin);background:rgba(14,36,64,.6)}}
.note{{position:absolute;left:80px;right:80px;bottom:40px;z-index:3;font-size:26px;line-height:1.35;color:var(--dolphin)}}
.cover{{position:absolute;left:80px;right:80px;bottom:{260 if STORY else 110}px}}
h1{{font-size:104px;line-height:1.02;font-weight:700;letter-spacing:-.02em;color:#fff}}
.sub{{margin-top:34px;font-size:48px;line-height:1.2;font-weight:500;color:var(--glow)}}
.swipe{{position:absolute;right:0;bottom:4px;width:84px;height:84px;border-radius:50%;border:2px solid rgba(46,242,238,.5);color:var(--glow);padding:20px}}
.step,.text,.big{{position:absolute;left:80px;right:80px;top:170px}}
.text{{top:230px}} .text.withleg{{top:330px}} .text.shottext{{top:200px}} .text.shottext.withleg{{top:320px}}
.num{{font-size:250px;line-height:.86;font-weight:700;color:var(--signal);letter-spacing:-.04em}}
.huge{{font-size:330px;line-height:.9;font-weight:700;color:var(--glow);letter-spacing:-.05em}}
.kicker{{margin-top:24px;font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:var(--glow);font-weight:600}}
.text .kicker,.closing .kicker,.cover .kicker,.frame .kicker{{margin:0 0 4px}}
h2{{margin-top:22px;font-size:90px;line-height:1.08;font-weight:700;letter-spacing:-.015em;color:#fff}}
h2.xl{{font-size:112px;line-height:1.03}} h2.m{{font-size:70px}} h2.s{{font-size:60px}}
.body{{margin-top:32px;font-size:48px;line-height:1.32;color:var(--visor);font-weight:400}}
.shottext .body{{font-size:42px;margin-top:22px}}
ul{{list-style:none;margin-top:38px}}
li{{display:flex;gap:26px;align-items:center;font-size:50px;line-height:1.28;color:var(--visor);margin-bottom:30px}}
li .dot{{flex:none;width:14px;height:14px;border-radius:50%;background:var(--glow)}}
li .li-ico{{flex:none;width:86px;height:86px;border-radius:50%;background:rgba(8,149,166,.16);border:2px solid rgba(46,242,238,.35);color:var(--glow);padding:20px}}
.photo{{position:absolute;left:80px;right:80px;bottom:80px;height:380px;border-radius:28px;background-size:cover;box-shadow:0 0 0 1px rgba(121,192,222,.25)}}
.iconwrap{{position:absolute;right:80px;bottom:90px;width:340px;height:340px;border-radius:50%;background:rgba(8,149,166,.14);border:2px solid rgba(46,242,238,.35);color:var(--glow);padding:88px}}
.icons{{position:absolute;left:80px;right:80px;bottom:110px;display:flex;align-items:center;gap:28px}}
.icons .ic{{width:200px;height:200px;border-radius:50%;background:rgba(8,149,166,.14);border:2px solid rgba(46,242,238,.35);color:var(--glow);padding:50px}}
.icons .sep{{width:70px;height:70px;color:var(--dolphin)}}
.shot{{position:absolute;left:50%;transform:translateX(-50%);bottom:96px;border-radius:24px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 2px rgba(121,192,222,.35)}}
.shot img{{width:100%;height:100%;display:block}}
.call{{position:absolute;border:5px solid var(--glow);border-radius:18px;box-shadow:0 0 0 6px rgba(46,242,238,.18),0 0 30px rgba(46,242,238,.55)}}
.legs{{position:absolute;left:80px;right:80px;top:170px;display:flex;align-items:center;z-index:2}}
.legs .lg{{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--deep);width:120px}}
.legs .lg svg{{width:64px;height:64px;padding:12px;border-radius:50%;border:2px solid currentColor}}
.legs .lg span{{font-size:20px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}}
.legs .lg.done{{color:var(--signal)}} .legs .lg.on{{color:var(--glow)}} .legs .lg.on svg{{background:rgba(46,242,238,.14);box-shadow:0 0 24px rgba(46,242,238,.45)}}
.legs i{{flex:1;height:2px;margin:0 6px 30px;background:linear-gradient(90deg,var(--signal),var(--deep))}}
.frame{{position:absolute;left:80px;right:80px;top:330px}}
.closing{{position:absolute;left:80px;right:80px;top:260px}}
.closing h2{{font-size:96px}}
.closing .body{{font-size:46px;margin-top:40px}}
.save{{display:inline-flex;align-items:center;gap:22px;margin-top:70px;padding:26px 40px;border-radius:999px;background:var(--signal);color:#fff;font-size:38px;font-weight:600}}
.save svg{{width:40px;height:40px;flex:none}}
.endlogo{{position:absolute;left:50%;bottom:40px;height:260px;transform:translateX(-50%)}}
.s-close .tag{{bottom:auto;top:150px}}
.s-close .note{{bottom:34px}} .s-close .note ~ .endlogo,.s-close:has(.note) .endlogo{{bottom:80px}}
.cover.top{{bottom:auto;top:190px}} .cover.top .swipe{{display:none}}
.shade.fromtop{{background:linear-gradient(180deg,#0E2440 0%,rgba(14,36,64,.88) 40%,rgba(14,36,64,.1) 62%,rgba(14,36,64,0) 100%)}}
.shot.mid{{bottom:auto;top:620px}}
.icons .chip{{width:240px;height:240px;padding:0;display:flex;align-items:center;justify-content:center;font-size:76px;font-weight:700;letter-spacing:-.03em}}
.photo{{bottom:96px}}
.gfx .logo{{visibility:hidden}} .gfx .photo,.gfx .shot,.gfx .iconwrap{{bottom:150px}} .gfx .icons{{bottom:165px}}
.gfx .note{{bottom:118px}} .gfx.hasnote .photo{{bottom:185px}} .gfx .tag{{bottom:118px}}
'''
page = os.path.join(tmp, 'index.html')
open(page, 'w', encoding='utf-8').write(f'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="{BRAND}fonts/fonts.css"><link rel="stylesheet" href="{BRAND}stacko.css"><style>{css}</style>' + ''.join(parts))
prefix = 'frame' if STORY else 'slide'
for f in os.listdir(out) if os.path.isdir(out) else []:
    if f.startswith(prefix + '-') and f.endswith('.png'): os.remove(os.path.join(out, f))
subprocess.run(['node', os.path.join(TOOLS, 'render.js'), 'shots', page, out, '.slide', prefix], check=True, env={**os.environ, 'LOCAL_FONTS': '1'})
print('wrote', n, prefix + 's to', out)
