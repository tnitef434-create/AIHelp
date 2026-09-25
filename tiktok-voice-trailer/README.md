# Voice Messages: TikTok concept trailer

A 10-second, 1080×1920 (9:16) fan-made concept trailer announcing voice messages in TikTok DMs. **Unofficial concept. Not affiliated with TikTok or ByteDance.** The end card says so on screen.

**Watch:** [`trailer.mp4`](trailer.mp4) (30 fps, H.264 + AAC)

## Beats
| Time | Scene |
|---|---|
| 0.0–1.3s | Glitch logo hook: “Say it. Don’t type it.” |
| 1.3–2.3s | Phone rises into a dark-mode DM thread: **Voice Messages** |
| 2.3–4.2s | 01 Hold to record: live waveform, timer, pulsing mic |
| 4.2–5.4s | 02 Let go to send: voice bubble drops into the chat |
| 5.4–6.7s | 03 Listen at 2x: reply arrives, plays back, speed toggles |
| 6.7–7.4s | 04 Double-tap to react: heart burst + reaction badge |
| 7.4–10s | Glitch wipe, end card, “Update now”, **CONCEPT** stamp + disclaimer |

## Files
- `index.html`: the whole animation. Open it in a browser to watch it live (Pause / Replay buttons). Everything runs from one `render(t)` timeline, so every frame is deterministic.
- `audio.py`: builds the soundtrack (beat + UI sound effects) from scratch with numpy → `audio.wav`
- `render.mjs`: steps the timeline in headless Chromium and encodes the MP4 with ffmpeg
- `fonts/`: TikTok Sans (SIL Open Font License, see `fonts/OFL.txt`)

## Re-render
```
pip install numpy imageio-ffmpeg
python3 audio.py
FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") node render.mjs
```
`node render.mjs --frames 60,120` writes PNG stills instead.
