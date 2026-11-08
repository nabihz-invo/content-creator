---
name: content-production-pipeline
description: Non-obvious tooling facts for rendering Stacko posts/carousels/reels on this Windows machine
metadata:
  node_type: memory
  type: reference
  originSessionId: c7e9e62f-20fd-47bf-87bf-5a0275dff805
  modified: 2026-10-25T04:13:15.642Z
---

- Render scripts live in C:/Users/Hp/stacko-content-tools/ (render.js, site_clip.js, site_assets.js, pptx_build.py, music-bed.wav; content/ must hold no code). Stack: Playwright-core driving installed Edge (C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe), python-pptx for Canva-importable PPTX.
- Website must be served over HTTP (root-relative /assets paths): `python -m http.server 8765 --bind 127.0.0.1` in website/.
- Recording website animations: CDP Emulation.setVirtualTimePolicy (pause/advance 1000/30 per frame). Under paused virtual time, Playwright page.evaluate hangs — use cdp Runtime.evaluate. CDP screenshot clips are page coordinates (add scrollY). Disable smooth scroll (html{scroll-behavior:auto}).
- Reel HTML: window.seek(t) async, seeks <video> footage (encode with -g 6). Render via page.screenshot({clip}) not element.screenshot (element stability waits time out).
- ElevenLabs audio pad: apad whole_dur didn't work; use apad=pad_dur + atrim and mux with -t.
- Brand: website tokens (abyss #0E2440, glow #2EF2EE, signal #0895A6, ocean #2F86B8), Readex Pro / Noto Kufi Arabic, assets in content/_brand/.

Related: [[content-production-rules]]

- Reel QA: no ffprobe on this machine; use `ffmpeg -i f -map 0:v -f null -` (last time= must equal Duration) and grep build logs for "Invalid NAL" (a corrupted silent.mp4 once left EDU-56 with 11 s of video under 19 s of audio; a clean re-render fixed it).
- reel-template.html: global `.big` (text-scene headline) is absolutely positioned; any nested `.big` must reset `position:static` (fixed 2026-10-25 for call/note cards).
- EDU-69 checklist PDFs: `node checklist_pdf.js <checklist.json> <outDir>` in the tools folder.
