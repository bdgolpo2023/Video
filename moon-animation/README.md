# What If the Moon Disappeared? (2D animation)

`What-If-The-Moon-Disappeared_1080p60.mp4`: 1920×1080, 16:9, 60 fps, 1:57.9.

- **Video:** H.264 High profile, level 4.2, about 5.8 Mbit/s. That bitrate keeps the file under GitHub's 100 MB limit.
- **Audio:** Opus, 48 kHz stereo, 256 kbit/s.
  - The Chrome build in the render sandbox can't encode AAC, so the audio is Opus.
  - It plays in YouTube, Chrome, Firefox, Edge, VLC and Windows.
  - Some older Apple players and video editors may not read it. Re-encode the audio to AAC if you need them.
- **Voiceover:** ElevenLabs Eleven v4, voice "Mark". The source file is in `bdgolpo2023/my-voice`.

## How it's built

Everything is drawn in code on an HTML canvas: characters, backgrounds, infographics, camera moves, film grain, vignette and letterbox. There are no image or audio assets apart from the voiceover.

- `src/lib.js`: drawing helpers, the stick-figure character rig, moon, Earth, text and pill labels, post-processing.
- `src/env.js`: the environments (rooftop city, ocean, tide pool, reef, space) and the creatures.
- `src/scenes.js`: the shot list. There are 37 shots, each timed to the narration.
- `src/audio.js`: the sound design, synthesized in an `OfflineAudioContext`.
  - Ambience beds, whooshes, impacts, risers, UI pops, thunder, a seagull, ticking clocks and more.
  - An underscore pad that ducks under the voice whenever the narrator speaks.
  - The voiceover gets EQ, compression and a little reverb. The full mix is limited and normalized to a -1 dBFS peak.
- `src/render.mjs`: draws each frame in headless Chrome and encodes it with WebCodecs.
- `src/mp4.mjs`: a small MP4 muxer.
- `src/vo_segments.json` and `src/vo_timeline.json`: the speech and pause segments detected in the voiceover, plus each script line aligned to them (`src/align.py`).

The scripts contain hard-coded absolute paths from the build sandbox. Adjust those paths before running them anywhere else.
