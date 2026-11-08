# python build_reel.py <itemDir> [--no-render]
# Needs <itemDir>/reel.json and <itemDir>/audio/take1.mp3 (the ElevenLabs take of the joined voice lines).
# Splits the take at the pauses between lines, times one scene per line and the captions to the speech,
# writes reel.html, renders it, mixes voice + music bed, and writes <ID>_reel.mp4, cover.png and caption.txt.
import json, os, re, subprocess, sys
import numpy as np

TOOLS = os.path.dirname(os.path.abspath(__file__))
d = os.path.abspath(sys.argv[1]); render = '--no-render' not in sys.argv; audio_only = '--audio-only' in sys.argv
R = json.load(open(os.path.join(d, 'reel.json'), encoding='utf-8'))
take = os.path.join(d, 'audio', 'take1.mp3')
LEAD, TAIL = 0.4, 2.4

pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', take, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
dur = len(x) / 16000
env = np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, mode='same'))[::160]
on = 20 * np.log10(env + 1e-9) > -40
# silences of 0.18s+ as (start, end) in seconds
sil, i = [], 0
while i < len(on):
    if not on[i]:
        j = i
        while j < len(on) and not on[j]: j += 1
        if (j - i) >= 18 and i > 0 and j < len(on): sil.append((i / 100, j / 100))
        i = j
    else: i += 1
voiced = np.where(on)[0]
s0, s1 = voiced[0] / 100, voiced[-1] / 100

lines = [l['vo'] for l in R['lines']]
chars = np.array([len(l) for l in lines], dtype=float)
expected = s0 + (s1 - s0) * np.cumsum(chars)[:-1] / chars.sum()
bounds, used = [], set()
for e in expected:  # nearest unused pause to where the line should end, weighted to prefer longer pauses
    best = min((k for k in range(len(sil)) if k not in used), key=lambda k: abs((sil[k][0] + sil[k][1]) / 2 - e) - 0.8 * (sil[k][1] - sil[k][0]))
    used.add(best); bounds.append(sil[best])
bounds.sort()
spans = []  # speech span per line in take time
starts = [s0] + [b[1] for b in bounds]; ends = [b[0] for b in bounds] + [s1]
spans = list(zip(starts, ends))
total = round(LEAD + s1 + TAIL, 2)

scenes = []
for k, l in enumerate(R['lines']):
    a = 0 if k == 0 else LEAD + (bounds[k - 1][0] + bounds[k - 1][1]) / 2
    b = total if k == len(lines) - 1 else LEAD + (bounds[k][0] + bounds[k][1]) / 2
    scenes.append({**l['scene'], 'a': round(a, 2), 'b': round(b, 2)})

def chunks(text, maxc=52):
    # phrases at punctuation; long phrases split near the middle, preferably before a connecting word
    joiners = {'and', 'so', 'but', 'or', 'with', 'from', 'to', 'on', 'in', 'at', 'that', 'which', 'when', 'where', 'while', 'because', 'into', 'without'}
    def split(p):
        if len(p) <= maxc: return [p]
        w = p.split(); mid = len(p) / 2; best, score = None, 1e9
        for i in range(2, len(w) - 1):
            pos = len(' '.join(w[:i])); sc = abs(pos - mid) - (14 if w[i].lower() in joiners else 0)
            if sc < score: best, score = i, sc
        return split(' '.join(w[:best])) + split(' '.join(w[best:]))
    out = []
    for p in [p.strip() for p in re.split(r'(?<=[,.?!:;])\s+', text) if p.strip()]:
        for q in split(p):
            if out and (len(q.split()) <= 2 or len(out[-1].split()) <= 2) and len(out[-1]) + len(q) + 1 <= maxc and not re.search(r'[.?!]$', out[-1]): out[-1] += ' ' + q
            else: out.append(q)
    return out
caps = []
for (a, b), text in zip(spans, lines):
    cs = chunks(text); n = np.array([len(c) for c in cs], float); t = LEAD + a
    for c, k in zip(cs, n):
        dd = (b - a) * k / n.sum(); caps.append({'t': c, 'a': round(t, 2), 'b': round(t + dd, 2)}); t += dd
for k, c in enumerate(caps):
    nxt = caps[k + 1]['a'] if k + 1 < len(caps) else c['b'] + .8
    c['b'] = round(min(nxt, c['b'] + .5), 2)

tpl = open(os.path.join(TOOLS, 'reel-template.html'), encoding='utf-8').read()
html = tpl.replace('__ID__', R['id']).replace('__TITLE__', R['title']).replace('__DATA__', json.dumps({'scenes': scenes, 'caps': caps}, ensure_ascii=False))
open(os.path.join(d, 'reel.html'), 'w', encoding='utf-8').write(html)
print('take', round(dur, 2), 's · total', total, 's ·', len(scenes), 'scenes ·', len(caps), 'captions')
for s in scenes: print(f"  {s['a']:6.2f}–{s['b']:6.2f} {s['type']}")

# caption.txt
vo = '\n'.join(f"{LEAD + a:5.1f}s  {t}" for (a, b), t in zip(spans, lines))
open(os.path.join(d, 'caption.txt'), 'w', encoding='utf-8').write('\n'.join([
    f"{R['id']} · Reel · {R.get('date', '')} · {total:.0f}s · 1080x1920", f"Title: {R['title']}",
    f"Files: {R['id']}_reel.mp4 (final) · cover.png · reel.html (source) · reel.json (script) · audio/", '',
    'CAPTION', R['caption'], '', R.get('tags', '#Stacko #InventoryManagement #WarehouseManagement'), '',
    'VOICE-OVER (ElevenLabs · "Justin Case – Warm, Trustworthy, Clear" · eleven_v4)', vo, '',
    'NOTES', '- Product footage is recorded from the Stacko website, with demo data.',
    '- Music bed is a placeholder pad; swap for a licensed track or add music in Instagram.',
    *[f'- {n}' for n in R.get('notes', [])], '']))

if render:
    tmp = os.path.join(os.environ.get('TEMP', '/tmp'), f"reel-{R['id']}")
    os.makedirs(tmp, exist_ok=True)
    silent = os.path.join(tmp, 'silent.mp4'); mix = os.path.join(tmp, 'mix.wav')
    if not (audio_only and os.path.exists(silent)):
        subprocess.run(['node', os.path.join(TOOLS, 'render.js'), 'video', os.path.join(d, 'reel.html'), silent, str(total), '30'], check=True)
    ms = int(LEAD * 1000)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', take, '-i', os.path.join(TOOLS, 'music-bed.wav'), '-filter_complex',
        f"[0]adelay={ms}:all=1,aformat=sample_rates=48000:channel_layouts=stereo,apad=pad_dur={TAIL + 2},atrim=0:{total},asplit=2[v][vk];"
        f"[1]atrim=0:{total},afade=t=out:st={total - 2.5}:d=2.5,volume=0.6[m];[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=400[duck];"
        f"[v][duck]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:{total}[out]",
        '-map', '[out]', '-ar', '48000', mix], check=True)
    out = os.path.join(d, f"{R['id']}_reel.mp4")
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', silent, '-i', mix, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(total), '-movflags', '+faststart', out], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(min(2.6, scenes[0]['b'] - .3)), '-i', out, '-frames:v', '1', os.path.join(d, 'cover.png')], check=True)
    print('wrote', out)
