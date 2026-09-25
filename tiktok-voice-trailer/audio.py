"""Synthesizes the trailer soundtrack (beat + UI sound effects) to audio.wav.

Every sound is generated from scratch with numpy, and cues line up with the
timeline in index.html.  Run:  python3 audio.py
"""
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 10.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.003, k=8.0):
    x = tt(d)
    return np.minimum(1, x / a) * np.exp(-k * x)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def noise(d):
    return rng.uniform(-1, 1, int(d * SR))


# ---------- instruments ----------
def kick(d=0.45):
    x = tt(d)
    f = 45 + 110 * np.exp(-x * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7) * 1.0 + noise(d) * env(d, k=90) * 0.15


def clap(d=0.25):
    n = noise(d)
    e = env(d, k=22)
    for off in (0.008, 0.017):
        e = e + np.roll(env(d, k=120), int(off * SR)) * 0.6
    return (n - lowpass(n, 900)) * e * 0.45


def hat(d=0.06):
    n = noise(d)
    return (n - lowpass(n, 6000)) * env(d, k=70) * 0.22


def bass(freq, d=0.45):
    x = tt(d)
    s = np.tanh(2.2 * np.sin(2 * np.pi * freq * x)) * np.minimum(1, x / 0.005) * np.exp(-x * 4)
    return lowpass(s, 500) * 0.5


def pad(freqs, d):
    x = tt(d)
    s = sum(np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
    e = np.minimum(1, x / 0.25) * np.minimum(1, (d - x) / 0.3)
    return s * e * 0.05


def blip(f0, f1, d=0.12, gain=0.35):
    x = tt(d)
    f = np.geomspace(f0, f1, len(x))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, a=0.002, k=30) * gain


def click():
    return noise(0.03) * env(0.03, a=0.0005, k=300) * 0.5 + blip(2400, 1800, 0.03, 0.2)


def whoosh(d, up=True):
    n = noise(d)
    x = tt(d) / d
    shape = np.sin(np.pi * (x ** (1.6 if up else 0.6)))
    # sweep a simple one-pole filter by blending two cutoffs
    lo, hi = lowpass(n, 700), n - lowpass(n, 2500)
    mix = x if up else 1 - x
    return (lo * (1 - mix) + hi * mix) * shape * 0.5


def impact(d=1.6):
    x = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-x * 9)) / SR) * np.exp(-x * 2.6)
    n = noise(d)
    crash = (n - lowpass(n, 3000)) * np.exp(-x * 3.5) * 0.25
    return sub * 0.9 + crash


def glitch(d=0.25):
    n = noise(d)
    gate = (np.floor(tt(d) * 60) % 2).astype(float)
    return (n - lowpass(n, 1500)) * gate * env(d, k=6) * 0.25 + blip(900, 300, d, 0.15) * gate


# ---------- arrangement ----------
# intro
add(glitch(0.3), 0.04, 1.0)
add(impact(0.9), 0.04, 0.6)
add(blip(180, 90, 0.35, 0.6), 0.38)
add(kick(), 0.38, 0.7)
add(kick(), 0.66, 0.8)
add(glitch(0.2), 0.7, 0.8, -0.3)
add(whoosh(0.3, up=True), 1.05, 1.1)

# beat section: 120 bpm starting at the phone reveal
BEAT = 0.5
start = 1.35
roots = [55.0, 55.0, 43.65, 49.0]  # A1 A1 F1 G1, one bar each
t = start
b = 0
while t < 7.36:
    add(kick(), t, 0.95)
    if b % 2 == 1:
        add(clap(), t, 0.8, 0.1)
    add(hat(), t + BEAT / 2, 0.8, 0.35)
    add(hat(0.03), t + BEAT * 0.75, 0.4, -0.35)
    add(bass(roots[(b // 4) % 4]), t + 0.01, 1.0)
    if b % 4 == 0:
        chord = {55.0: [220, 261.6, 329.6], 43.65: [174.6, 220, 261.6], 49.0: [196, 246.9, 293.7]}[roots[(b // 4) % 4]]
        add(pad(chord, BEAT * 4), t, 1.0)
    t += BEAT
    b += 1

# UI sound effects
for tm in (1.55, 1.9):
    add(blip(700, 1100, 0.09, 0.28), tm, 1.0, 0.2)
add(click(), 2.32, 1.0)
add(blip(500, 1000, 0.1, 0.35), 2.36)
add(blip(1000, 1500, 0.1, 0.3), 2.46)
add(click(), 4.22, 1.0)
add(whoosh(0.28, up=True), 4.2, 0.7, 0.4)
add(blip(900, 1800, 0.12, 0.35), 4.3, 1.0, 0.3)
add(blip(1300, 800, 0.1, 0.3), 5.38, 1.0, -0.3)
add(blip(1600, 1100, 0.08, 0.2), 5.46, 1.0, -0.3)
add(click(), 5.58)
add(click(), 6.16)
add(blip(1200, 2000, 0.08, 0.25), 6.2)
add(click(), 6.88)
add(click(), 7.02)
add(blip(700, 1400, 0.15, 0.35), 6.95)
add(blip(1400, 2100, 0.12, 0.25), 7.05)

# transition + end card
add(whoosh(0.5, up=True), 7.2, 1.3)
add(impact(2.2), 7.66, 1.1)
add(pad([220, 277.2, 329.6, 440], 2.3), 7.66, 1.5)
for tm in (7.66, 8.16, 8.66):
    add(kick(), tm, 0.7)
add(hat(), 7.91, 0.6)
add(hat(), 8.41, 0.6)
add(blip(800, 1600, 0.14, 0.3), 8.42)
add(impact(1.0), 8.95, 1.0)
add(clap(0.3), 8.95, 1.0)

# master: gentle glue, fade in/out, normalize
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fi, fo = int(0.01 * SR), int(0.6 * SR)
fade[:fi] = np.linspace(0, 1, fi)
fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]
mix = np.tanh(mix * 1.4)
mix /= np.max(np.abs(mix)) / 0.89

out = Path(__file__).with_name('audio.wav')
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out)
