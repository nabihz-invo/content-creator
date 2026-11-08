#!/usr/bin/env python3
"""Stacko Studio · starter sound effects.

Synthesises the small SFX set the engine cues by name (scene.sfx('pop', t) etc.)
into assets/audio/sfx/<name>.mp3. They are clean, quiet, UI-style sounds made
from scratch, so there are no licence questions. Replace any file with a better
one from your own library (same name, .mp3/.wav/.m4a/.ogg) and the renderer
picks it up automatically.

    python3 studio/tools/make_sfx.py            # writes all
    python3 studio/tools/make_sfx.py pop ding   # writes only these
    python3 studio/tools/make_sfx.py --music    # also a placeholder music bed: assets/audio/music/placeholder-calm.mp3
"""
import os, sys, subprocess, tempfile, wave
import numpy as np

SR = 48000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'audio', 'sfx')
rng = np.random.default_rng(7)


def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=.005, r=.1, curve=3.0):
    x = np.ones(n); na = max(1, int(SR * a)); x[:na] = np.linspace(0, 1, na)
    nr = n - na; x[na:] = np.exp(-np.linspace(0, curve, nr)) if nr > 0 else 1
    return x
def noise(d): return rng.standard_normal(int(SR * d))
def lp(x, fc):  # one-pole low-pass, fc may be an array
    if np.isscalar(fc):
        from scipy.signal import lfilter
        a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); p = 0.0
    for i in range(len(x)): p = (1 - a[i]) * x[i] + a[i] * p; y[i] = p
    return y
def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return hp(lp(x, hi), lo)
def sweep(f0, f1, d, shape='exp'):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d) if shape == 'exp' else f0 + (f1 - f0) * tt / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def tone(f, d, harm=(1,), decay=6.0):
    tt = t_(d); return sum(np.sin(2 * np.pi * f * h * tt) / (k + 1) for k, h in enumerate(harm)) * np.exp(-decay * tt)
def norm(x, peak=.8): m = np.max(np.abs(x)) or 1; return x / m * peak
def pad(x, d): return np.concatenate([x, np.zeros(int(SR * d))])
def place(dst, src, at):
    i = int(SR * at); n = min(len(src), len(dst) - i)
    if n > 0: dst[i:i + n] += src[:n]
    return dst
def fade(x, a=.004, r=.03):
    na, nr = int(SR * a), int(SR * r); x = x.copy()
    if na: x[:na] *= np.linspace(0, 1, na)
    if nr: x[-nr:] *= np.linspace(1, 0, nr)
    return x


def whoosh():
    d = .55; n = noise(d); tt = t_(d); bell = np.sin(np.pi * tt / d) ** 2
    return norm(lp(hp(n, 200), 600 + 4200 * bell) * bell, .7)
def swoosh():
    d = .32; n = noise(d); tt = t_(d); bell = np.sin(np.pi * (tt / d) ** .6) ** 2
    return norm(lp(hp(n, 500), 1200 + 7000 * tt / d) * bell, .6)
def pop():
    d = .14; s = sweep(900, 320, d) * env(int(SR * d), .002, d, 9); return norm(s + .2 * lp(noise(d), 3000) * env(int(SR * d), .001, d, 30), .75)
def thud():
    d = .4; s = sweep(120, 42, d) * env(int(SR * d), .002, d, 7) + .5 * lp(noise(d), 400) * env(int(SR * d), .001, d, 25)
    return norm(s, .9)
def tick():
    d = .05; return norm(bp(noise(d), 2500, 7000) * env(int(SR * d), .0005, d, 40), .5)
def click():
    d = .06; s = tone(2200, d, (1, 2.7), 90) + .4 * bp(noise(d), 3000, 9000) * env(int(SR * d), .0003, d, 60)
    return norm(s, .55)
def typing():
    out = np.zeros(int(SR * 1.2)); at = 0.0
    while at < 1.1:
        k = bp(noise(.035), 1800 + rng.random() * 1500, 6000) * env(int(SR * .035), .0004, .035, 35) * (.6 + .4 * rng.random())
        place(out, k, at); at += .06 + rng.random() * .07
    return norm(out, .45)
def send():
    d = .28; s = sweep(500, 1600, d) * env(int(SR * d), .003, d, 6); return norm(s + .3 * swoosh()[:len(s)], .55)
def ding():
    d = 1.1; s = tone(1318.5, d, (1, 2.0, 3.01), 4.5) + .5 * tone(1975.5, d, (1, 2.0), 5.5); return norm(fade(s), .6)
def check():
    a = tone(880, .16, (1, 2), 14); b = tone(1318.5, .4, (1, 2), 8); out = np.zeros(int(SR * .55)); place(out, a, 0); place(out, b, .09)
    return norm(fade(out), .55)
def glitch():
    d = .38; out = np.zeros(int(SR * d)); at = 0.0
    while at < d - .03:
        L = .01 + rng.random() * .04; seg = np.sign(np.sin(2 * np.pi * (200 + rng.random() * 2400) * t_(L))) * .5 + bp(noise(L), 1000, 8000) * .5
        place(out, seg * (.4 + .6 * rng.random()), at); at += L + rng.random() * .02
    return norm(out, .45)
def flash():
    d = .6; tt = t_(d); s = bp(noise(d), 3000, 12000) * np.exp(-tt * 8) + .4 * sweep(3000, 9000, d) * np.exp(-tt * 10)
    return norm(s, .45)
def scan():
    d = 1.0; tt = t_(d); s = sweep(300, 2400, d, 'lin') * (.5 + .5 * np.sin(2 * np.pi * 14 * tt)) * np.sin(np.pi * tt / d)
    return norm(lp(s, 3000), .4)
def buzz():
    d = .7; tt = t_(d); s = np.sign(np.sin(2 * np.pi * 165 * tt)) * (np.sin(2 * np.pi * 9 * tt) > -.2)
    out = np.zeros(int(SR * 1.0)); place(out, lp(s, 900) * np.minimum(1, tt * 40), 0); return norm(fade(out), .4)
def paper():
    d = .45; tt = t_(d); n = bp(noise(d), 1200, 9000) * (np.abs(np.sin(2 * np.pi * 11 * tt)) ** 3) * np.sin(np.pi * tt / d)
    return norm(n, .45)
def assemble():
    out = np.zeros(int(SR * 1.3)); notes = [523.3, 659.3, 784, 1046.5, 1318.5]
    for i in range(22):
        f = notes[i % 5] * (2 if rng.random() > .7 else 1); place(out, tone(f, .12, (1, 3), 30) * .5, .04 * i + rng.random() * .02)
    place(out, tone(1046.5, .9, (1, 2, 3), 4) * .8, .9); return norm(fade(out), .55)
def engine():
    d = 2.0; tt = t_(d); f = 42 + 14 * np.sin(np.pi * tt / d); ph = np.cumsum(f) / SR * 2 * np.pi
    s = (np.sin(ph) + .6 * np.sin(2 * ph) + .3 * np.sign(np.sin(3 * ph))) * (.7 + .3 * np.sin(2 * np.pi * 7 * tt))
    s = lp(s + .2 * lp(noise(d), 300), 500) * np.sin(np.pi * tt / d) ** .5; return norm(fade(s, .1, .3), .5)
def marker():
    d = .5; tt = t_(d); s = bp(noise(d), 2500, 8000) * (.6 + .4 * np.sin(2 * np.pi * 30 * tt)) * np.sin(np.pi * tt / d) ** .4
    return norm(s, .35)
def riser():
    d = 1.6; tt = t_(d); s = lp(hp(noise(d), 300), 400 + 9000 * (tt / d) ** 2) * (tt / d) ** 2 + .3 * sweep(200, 1800, d) * (tt / d) ** 2
    return norm(fade(s, .01, .02), .6)
def impact():
    d = 1.2; n = int(SR * d); return norm(pad(thud(), .8)[:n] + .35 * lp(noise(d), 1500) * env(n, .001, d, 6), .95)
def notification():
    a = tone(987.8, .25, (1, 2), 10); b = tone(1480, .6, (1, 2), 6); out = np.zeros(int(SR * .8)); place(out, a, 0); place(out, b, .12)
    return norm(fade(out), .55)
def shutter():
    d = .18; out = np.zeros(int(SR * d)); place(out, click(), 0); place(out, tick() * .8, .07); return norm(out, .6)

ALL = dict(whoosh=whoosh, swoosh=swoosh, pop=pop, thud=thud, tick=tick, click=click, typing=typing, send=send, ding=ding,
           check=check, glitch=glitch, flash=flash, scan=scan, buzz=buzz, paper=paper, assemble=assemble, engine=engine,
           marker=marker, riser=riser, impact=impact, notification=notification, shutter=shutter)


def write(name, x):
    os.makedirs(OUT, exist_ok=True); x = np.clip(x, -1, 1); st = np.stack([x, x], 1)
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
    dst = os.path.join(OUT, name + '.mp3')
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-b:a', '192k', dst])
    if r.returncode: os.replace(tmp, dst[:-4] + '.wav'); dst = dst[:-4] + '.wav'
    else: os.remove(tmp)
    print('wrote', os.path.relpath(dst, ROOT))




# ── placeholder music bed (so renders have music before you add licensed tracks) ──
def music_bed(bpm=100, bars=16):
    beat = 60 / bpm; d = bars * 4 * beat; n = int(SR * d); out = np.zeros(n); tt = t_(d)
    prog = [(57, 60, 64, 67), (53, 57, 60, 64), (48, 52, 55, 59), (55, 59, 62, 66)]  # Am7 Fmaj7 Cmaj7 G(add#11-ish)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    for b in range(bars):
        ch = prog[b % 4]; L = 4 * beat; seg = t_(L)
        pad_ = sum(np.sin(2 * np.pi * hz(m) * seg + .3 * np.sin(2 * np.pi * .5 * seg)) + .3 * np.sin(2 * np.pi * hz(m + 12) * seg) for m in ch)
        pad_ *= np.minimum(1, seg / .4) * np.minimum(1, (L - seg) / .4)
        place(out, .12 * pad_, b * L)
        bass = np.sin(2 * np.pi * hz(ch[0] - 12) * seg) * np.exp(-1.2 * (seg % beat))
        place(out, .25 * bass, b * L)
    pump = .55 + .45 * np.minimum(1, (tt % beat) / (beat * .6))       # gentle side-chain feel
    out *= pump
    for k in range(int(d / (beat / 2))):                                # soft off-beat ticks
        if k % 2: place(out, .05 * bp(noise(.04), 6000, 12000) * env(int(SR * .04), .0005, .04, 30), k * beat / 2)
    for k in range(int(d / beat)):                                      # soft kick on 1 and 3
        if k % 2 == 0: place(out, .35 * sweep(110, 45, .25) * env(int(SR * .25), .002, .25, 8), k * beat)
    return norm(lp(out, 7000), .7)


def write_music(name='placeholder-calm'):
    global OUT
    keep = OUT; OUT = os.path.join(ROOT, 'assets', 'audio', 'music'); write(name, music_bed()); OUT = keep


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--music' in sys.argv: write_music()
    if '--music' not in sys.argv or args:
        for n in (args or list(ALL)):
            if n not in ALL: print('unknown sfx', n); continue
            write(n, ALL[n]())
