# python build_reel2.py <itemDir> [en|ar ...]
# Route-B reel: <itemDir>/reel2.json + audio/<lang>.mp3 (ElevenLabs take of the joined VO lines, one per language).
# Splits each take at the pauses between lines, times scenes + captions, renders with Remotion (remotion/render.mjs),
# mixes voice + music bed, and writes:
#   en  → <ID>_en.mp4, subtitles.srt, cover_en.png, caption_en.txt, hashtags.txt
#   ar  → ar-needs-native-review/<ID>_ar.mp4, ar-needs-native-review/subtitles_ar.srt, cover_ar.png, caption_ar.txt
import json, os, re, subprocess, sys
import numpy as np

TOOLS = os.path.dirname(os.path.abspath(__file__))
d = os.path.abspath(sys.argv[1]); langs = [a for a in sys.argv[2:] if a in ('en', 'ar')] or ['en', 'ar']
R = json.load(open(os.path.join(d, 'reel2.json'), encoding='utf-8'))
LEAD, TAIL = 0.4, 2.4

def split_take(take, lines):
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', take, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
    env = np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, mode='same'))[::160]
    on = 20 * np.log10(env + 1e-9) > -40
    sil, i = [], 0
    while i < len(on):
        if not on[i]:
            j = i
            while j < len(on) and not on[j]: j += 1
            if (j - i) >= 18 and i > 0 and j < len(on): sil.append((i / 100, j / 100))
            i = j
        else: i += 1
    voiced = np.where(on)[0]; s0, s1 = voiced[0] / 100, voiced[-1] / 100
    chars = np.array([len(l) for l in lines], dtype=float)
    expected = s0 + (s1 - s0) * np.cumsum(chars)[:-1] / chars.sum()
    bounds, used = [], set()
    for e in expected:
        best = min((k for k in range(len(sil)) if k not in used), key=lambda k: abs((sil[k][0] + sil[k][1]) / 2 - e) - 0.8 * (sil[k][1] - sil[k][0]))
        used.add(best); bounds.append(sil[best])
    bounds.sort()
    return s0, s1, bounds

def chunks(text, maxc):
    joiners = {'and', 'so', 'but', 'or', 'with', 'from', 'to', 'on', 'in', 'at', 'that', 'which', 'when', 'where', 'while', 'because', 'into', 'without', 'و', 'بس', 'لأنو', 'مع', 'من', 'على'}
    def split(p):
        if len(p) <= maxc: return [p]
        w = p.split(); mid = len(p) / 2; best, score = None, 1e9
        for i in range(2, len(w) - 1):
            pos = len(' '.join(w[:i])); sc = abs(pos - mid) - (14 if w[i].lower() in joiners else 0)
            if sc < score: best, score = i, sc
        if best is None: return [p]
        return split(' '.join(w[:best])) + split(' '.join(w[best:]))
    out = []
    for p in [p.strip() for p in re.split(r'(?<=[,.?!:;،؟])\s+', text) if p.strip()]:
        for q in split(p):
            if out and (len(q.split()) <= 2 or len(out[-1].split()) <= 2) and len(out[-1]) + len(q) + 1 <= maxc and not re.search(r'[.?!؟]$', out[-1]): out[-1] += ' ' + q
            else: out.append(q)
    return out

def srt(caps):
    ts = lambda t: f"{int(t // 3600):02}:{int(t % 3600 // 60):02}:{int(t % 60):02},{int(round(t % 1 * 1000)) % 1000:03}"
    return ''.join(f"{k + 1}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['t']}\n\n" for k, c in enumerate(caps))

for lang in langs:
    take = os.path.join(d, 'audio', f'{lang}.mp3')
    if not os.path.exists(take): print('missing', take); continue
    lines = [l['vo'][lang] for l in R['lines']]
    s0, s1, bounds = split_take(take, lines)
    if R.get('hold'):  # optional silence (seconds) after each line, to pace short reels; re-split the padded take
        pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', take, '-ac', '2', '-ar', '48000', '-f', 's16le', '-'], capture_output=True).stdout
        x = np.frombuffer(pcm, dtype=np.int16).reshape(-1, 2); parts, prev = [], 0
        for k, (a, b) in enumerate(bounds):
            cut = int((a + b) / 2 * 48000); parts += [x[prev:cut], np.zeros((int(R['hold'][k] * 48000), 2), np.int16)]; prev = cut
        parts.append(x[prev:]); padded = os.path.join(os.environ.get('TEMP', '/tmp'), f"reel2-{R['id']}-{lang}-held.wav")
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', '-', padded], input=np.concatenate(parts).tobytes(), check=True)
        take = padded; s0, s1, bounds = split_take(take, lines)
    total = round(LEAD + s1 + TAIL, 2)
    scenes = []
    for k, l in enumerate(R['lines']):
        a = 0 if k == 0 else LEAD + (bounds[k - 1][0] + bounds[k - 1][1]) / 2
        b = total if k == len(lines) - 1 else LEAD + (bounds[k][0] + bounds[k][1]) / 2
        sc = {k2: v for k2, v in l['scene'].items() if k2 not in ('en', 'ar')}
        scenes.append({**sc, **l['scene'].get(lang, {}), 'a': round(a, 2), 'b': round(b, 2)})
    # captions: by default the spoken language; PLB-01 burns English captions on the Arabic VO (sheet)
    cap_lang = R.get('arCapsLang', 'ar') if lang == 'ar' else 'en'
    spans = list(zip([s0] + [b[1] for b in bounds], [b[0] for b in bounds] + [s1]))
    caps = []
    for (a, b), l in zip(spans, R['lines']):
        cs = chunks(l['vo'][cap_lang], 52 if cap_lang == 'en' else 40); n = np.array([len(c) for c in cs], float); t = LEAD + a
        for c, k in zip(cs, n):
            dd = (b - a) * k / n.sum(); caps.append({'t': c, 'a': round(t, 2), 'b': round(t + dd, 2)}); t += dd
    for k, c in enumerate(caps):
        nxt = caps[k + 1]['a'] if k + 1 < len(caps) else c['b'] + .8
        c['b'] = round(min(nxt, c['b'] + .5), 2)

    outdir = d if lang == 'en' else os.path.join(d, 'ar-needs-native-review'); os.makedirs(outdir, exist_ok=True)
    tag = '_15s' if R.get('short') else ''
    out = os.path.join(outdir, f"{R['id']}{tag}_{lang}.mp4")
    open(os.path.join(outdir, 'subtitles.srt' if lang == 'en' else 'subtitles_ar.srt') if not R.get('short') else os.path.join(outdir, f'subtitles{tag}_{lang}.srt'), 'w', encoding='utf-8').write(srt(caps))
    tmp = os.path.join(os.environ.get('TEMP', '/tmp'), f"reel2-{R['id']}-{lang}"); os.makedirs(tmp, exist_ok=True)
    props = os.path.join(tmp, 'props.json'); silent = os.path.join(tmp, 'silent.mp4'); mix = os.path.join(tmp, 'mix.wav')
    json.dump({'lang': lang, 'capLang': cap_lang, 'total': total, 'scenes': scenes, 'caps': caps}, open(props, 'w', encoding='utf-8'), ensure_ascii=False)
    print(R['id'], lang, 'total', total, 's ·', len(scenes), 'scenes ·', len(caps), 'captions')
    subprocess.run(['node', os.path.join(TOOLS, 'remotion', 'render.mjs'), props, silent], check=True, stdout=subprocess.DEVNULL)
    ms = int(LEAD * 1000)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', take, '-i', os.path.join(TOOLS, 'music-bed.wav'), '-filter_complex',
        f"[0]adelay={ms}:all=1,aformat=sample_rates=48000:channel_layouts=stereo,apad=pad_dur={TAIL + 2},atrim=0:{total},asplit=2[v][vk];"
        f"[1]atrim=0:{total},afade=t=out:st={total - 2.5}:d=2.5,volume=0.6[m];[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=400[duck];"
        f"[v][duck]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:{total}[out]",
        '-map', '[out]', '-ar', '48000', mix], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', silent, '-i', mix, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(total), '-movflags', '+faststart', out], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(min(2.6, scenes[0]['b'] - .3)), '-i', out, '-frames:v', '1', os.path.join(outdir, f'cover{tag}_{lang}.png')], check=True)
    print('wrote', out)

if R.get('caption'):
    open(os.path.join(d, 'caption_en.txt'), 'w', encoding='utf-8').write(R['caption']['en'].strip() + '\n')
    open(os.path.join(d, 'caption_ar.txt'), 'w', encoding='utf-8').write(R['caption']['ar'].strip() + '\n')
    open(os.path.join(d, 'hashtags.txt'), 'w', encoding='utf-8').write(R['hashtags'].strip() + '\n')
