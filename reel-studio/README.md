# Reel Studio 🎬🎵

**Beat-synced Instagram music reels, made with code, built to be driven by an AI agent (like Claude) or by hand.**

Drop in a song and some clips. Reel Studio finds the beats, bars and drop, then builds a 1080×1920 reel where
**every cut, transition, zoom punch, flash and lyric lands on the music**, in the style of After Effects
(big shape-mask transitions, text mattes, kinetic typography, glitch, grain) but with no keyframing.

```
song.mp3 ──► analysis/analyze.py ──► song.json ──► Remotion (React) ──► reel.mp4
             beats · bars · drops     the "edit       transitions, masks,    1080×1920
             energy · lyrics          brain"          lyrics, effects        30fps, H.264
```

---

## Contents
1. [What you need](#1-what-you-need)
2. [Get it onto your computer](#2-get-it-onto-your-computer)
3. [See the demo](#3-see-the-demo-2-minutes)
4. [Make a reel from your song](#4-make-a-reel-from-your-song)
5. [The three styles](#5-the-three-styles)
6. [How it works](#6-how-it-works)
7. [Customising: the After Effects cheat-sheet](#7-customising-the-after-effects-cheat-sheet)
8. [Using it with Claude / AI agents](#8-using-it-with-claude--ai-agents)
9. [Instagram tips](#9-instagram-tips)
10. [Troubleshooting](#10-troubleshooting)
11. [Cost & licences](#11-cost--licences)

---

## 1. What you need

| Tool | Why | Get it |
|---|---|---|
| **Node.js 18+** | runs Remotion (the video engine) | nodejs.org (LTS) |
| **Python 3.10+** | beat/drop/lyrics analysis | python.org (Windows: tick "Add to PATH") |
| **FFmpeg** | audio cutting for lyrics | Mac: `brew install ffmpeg` · Windows: `winget install ffmpeg` |
| **Git** | download the project | git-scm.com |

Remotion downloads its own headless Chrome the first time you render. You don't need to install anything for that.

## 2. Get it onto your computer

```bash
git clone -b claude/reel-studio https://github.com/oiipo/-.git reels
cd reels/reel-studio

npm install                                   # video engine
python3 -m venv .venv                         # optional but tidy
source .venv/bin/activate                     # Windows: .venv\Scripts\activate
pip install numpy librosa soundfile           # beat detection (small)
```

Want **automatic lyrics** too? That's a bigger download (~2 GB of AI models) but it's free:
```bash
pip install demucs openai-whisper
```

> Prefer a GUI? On github.com open the repo, switch to branch `claude/reel-studio`, then **Code → Download ZIP**.

## 3. See the demo (2 minutes)

The project ships with a demo beat (`public/songs/demo-beat.mp3`), already-analysed `demo.json`, and placeholder
"clips" (animated colour panels), so you can see everything before adding your own stuff.

```bash
npm run studio
```

This opens **Remotion Studio** in your browser. Pick `HypeDrop`, `LyricVideo` or `Glitch` on the left, press
play, and scrub the timeline. It's live: edit any file in `src/` and the preview updates.

Render the demo to a file:
```bash
npx remotion render HypeDrop out/demo.mp4
```

## 4. Make a reel from your song

**Step 1. Add your footage** to `public/clips/`: `.mp4 .mov .webm` video or `.jpg .png .webp` images (images get a
slow Ken Burns push-in). They're used in **alphabetical order**, so name them `01-intro.mp4`, `02-crowd.mp4`... to
control the order. Vertical (9:16) footage looks best; anything else is centre-cropped to fill.

**Step 2. One command:**
```bash
npm run reel -- path/to/song.mp3 --start 45 --duration 30 --title "Song Name" --artist "Your Name" --lyrics --style all
```

| Option | Meaning |
|---|---|
| `--start 45` | where in the song the reel begins (seconds). Start a few bars before the drop. |
| `--duration 30` | reel length (IG allows up to 90s; 15–30s performs best) |
| `--title` / `--artist` | shown on the intro card; the first word of the title becomes the **masked drop title** in HypeDrop |
| `--lyrics` | auto-transcribe word-by-word lyrics (needs demucs + whisper). Leave it off for instrumentals. |
| `--whisper-model small` | `tiny`/`base` = fast, `medium`/`large-v3` = more accurate lyrics |
| `--style` | `HypeDrop` (default), `LyricVideo`, `Glitch`, or `all` |

Finished reels land in `out/`.

**Step 3. Tweak** (optional). Preview your song live in the Studio, adjust the code or
`public/songs/<song>.json`, then re-render:
```bash
npx remotion studio --props=public/songs/<song>.json
npx remotion render HypeDrop out/final.mp4 --props=public/songs/<song>.json
```

### Fixing lyrics by hand
Whisper on sung vocals is good but not perfect. Open `public/songs/<song>.json`, find `"words"`, and fix any
`text` or `start`/`end` times (seconds from the start of the reel). Or write your own lyric file and pass it:
```bash
python3 analysis/analyze.py song.mp3 --start 45 --lyrics-file my-lyrics.json
```
```json
[{"text": "Turn", "start": 1.0, "end": 1.4}, {"text": "it", "start": 1.45, "end": 1.6}, {"text": "up", "start": 1.65, "end": 2.3}]
```

## 5. The three styles

| Style | Vibe | What it does |
|---|---|---|
| **HypeDrop** | EDM, rap, hype | Cuts every 4 beats in the verse and **every beat** in high-energy parts. Zoom punch and camera shake on each kick, a white flash on drops, big drop transitions (zoom-through, split-slam, diagonal wipe, bar slices), the song title becomes a **text mask showing footage** on the first drop, and one-word-at-a-time pop lyrics. |
| **LyricVideo** | R&B, pop, chill | Long shots, soft push on each bar, circle/iris mask transitions, lyrics that **stack word by word** with alternating outline/solid type, heavy vignette and grain. |
| **Glitch** | Hyperpop, phonk, drill | Fast cuts, horizontal glitch slices with RGB tint on every bar, slice/split transitions, RGB-split lyrics, VHS scanlines, cyan flash on drops. |

## 6. How it works

### The analyzer: `analysis/analyze.py`
1. **Tempo**: librosa estimates BPM, which is then refined (±3%) together with the beat phase by fitting a steady grid
   to kick-drum hits. (Plain beat trackers often lock onto hi-hats half a beat off, or give up at the drop. This
   approach avoids both.)
2. **Beats** are snapped to the nearest real hit (±45 ms), so swing and slight drift still line up.
3. **Drops** are beats where the next bar is much louder than the previous one. The biggest drop decides where
   **bar 1** is, because drops almost always land on a downbeat.
4. **Sections** get an energy score of 0–1 per bar. The edit cuts faster when energy is high.
5. **Lyrics** (optional): **demucs** strips the instruments, then **Whisper** transcribes the vocals with per-word timestamps.

Everything goes into `public/songs/<song>.json`:
```jsonc
{ "song": {
  "audio": "song.mp3", "offset": 45, "duration": 30, "bpm": 124.1,
  "beats":     [0.02, 0.51, 0.98, ...],   // seconds from reel start
  "downbeats": [0.02, 1.95, 3.88, ...],   // bar starts
  "drops":     [7.76],
  "sections":  [{"start": 0.02, "end": 1.95, "label": "low", "energy": 0.1}, ...],
  "words":     [{"text": "Turn", "start": 1.0, "end": 1.4}, ...],
  "clips":     ["01-intro.mp4", "02-crowd.mp4"],
  "title": "Own The Night", "artist": "Your Name"
}}
```

### The video: `src/`
```
src/
├── Root.tsx                  registers the 3 styles (1080×1920 @ 30fps, length = song duration)
├── reels/                    ← the styles. Each is ~40 lines of "layers", like an AE comp
│   ├── HypeDrop.tsx
│   ├── LyricVideo.tsx
│   └── Glitch.tsx
├── components/
│   ├── BeatTimeline.tsx      cuts your clips on the beat grid, picks transitions
│   ├── ClipLayer.tsx         one clip, cover-fit (or a placeholder)
│   ├── KineticLyrics.tsx     lyric styles (pop / stack / outline / glitch) + MaskedWord (text matte)
│   ├── Effects.tsx           BeatPunch, Flash, GlitchSlices, Grain, Vignette, Scanlines
│   └── ReelShell.tsx         audio + artist/title card
├── transitions/entries.tsx   circle, iris, diagonal, zoomThrough, whip, slices, split
└── lib/
    ├── beats.ts              pulse(), beatIndexAt(), within(), rand(): the sync helpers
    ├── cuts.ts               the edit decision list (where cuts go)
    ├── fonts.ts              local fonts (Anton, Archivo Black, Inter)
    └── types.ts
```

A style is just layers stacked top to bottom, like an AE timeline:
```tsx
<ReelShell song={song}>                               {/* audio + title card */}
  <BeatPunch beats={song.beats} strength={0.09} shake={22}>   {/* zoom/shake every beat */}
    <BeatTimeline song={song}
      dropTransitions={['zoomThrough', 'split']}      {/* big ones on drops */}
      beatTransitions={['cut', 'cut', 'whip']} />     {/* cycle on normal cuts */}
  </BeatPunch>
  <KineticLyrics words={song.words} style="pop" emphasis={['fire']} />
  <Flash marks={song.drops} />                        {/* white flash on drops */}
  <Grain opacity={0.1} />
</ReelShell>
```

## 7. Customising: the After Effects cheat-sheet

| In After Effects you'd... | Here you... |
|---|---|
| Set keyframes | `interpolate(frame, [0, 20], [0, 1])`: from/to values over frames |
| Use the graph editor / easy ease | `Easing.bezier(0.8, 0, 0.2, 1)` or `spring({frame, fps})` for overshoot |
| Make a mask / track matte | CSS `clipPath` (`circle()`, `polygon()`, `inset()`), or `<MaskedWord>` for text mattes |
| Precompose | Make a component and nest it |
| Add a layer effect | CSS `filter` (`blur`, `hue-rotate`...), `mix-blend-mode` |
| Sync to the beat by eye | `pulse(song.beats, t)` gives 1 on each beat, decaying to 0 |
| Wiggle expression | `rand(frame)`: deterministic random (never use `Math.random()`) |

**Quick tweaks** (all in `src/reels/*.tsx`):
- **Harder hits:** raise `strength` (zoom) and `shake` on `<BeatPunch>`.
- **Cut speed:** `calmBeats` / `hypeBeats` on `<BeatTimeline>` (beats per shot in low/high energy parts).
- **Which transitions:** edit the `dropTransitions` / `beatTransitions` arrays.
- **Colours:** the `ACCENT` / `accent` values. Lyrics in `emphasis` get the accent colour and extra size.
- **Fonts:** put a `.woff2`/`.ttf` in `public/fonts/` and add a `loadFont()` line in `src/lib/fonts.ts`.

**Add your own transition:** add a `case` to `src/transitions/entries.tsx`. You get `p` (0→1 progress) and the
incoming shot as `children`; return it with any CSS transform, clip-path or filter. For example, a rotating square reveal:
```tsx
case 'square':
  return <AbsoluteFill style={{clipPath: `inset(${(1 - e) * 50}%)`, transform: `rotate(${(1 - e) * 90}deg)`}}>{children}</AbsoluteFill>;
```
Add `'square'` to the `EntryName` type, then use it in a style.

**Make a new style:** copy `src/reels/HypeDrop.tsx`, rename it, and add it to the `reels` object in `src/Root.tsx`.

## 8. Using it with Claude / AI agents

This project is set up so an agent can edit your reels for you. Everything is code and JSON, and the agent can
check its own work by rendering single frames as images.

**Claude Code** (terminal or desktop app): open this folder and just ask, e.g.
- *"Make a new style called Neon with pink/cyan glow lyrics and a zoom-through on every drop."*
- *"The cuts feel too fast in the verse. Make them every 8 beats."*
- *"Add a transition where the next clip is revealed through a growing star shape."*
- *"Analyse `~/Music/track.mp3` from 1:02 for 20 seconds, with lyrics, and render all three styles."*

`CLAUDE.md` in this folder tells the agent how the project works and how to check frames
(`npx remotion still HypeDrop out/check.png --frame=240`).

**Other agents / MCP:** the whole pipeline is two CLI commands (`analyze.py` and `remotion render`), so it's easy
to wrap as MCP tools if you want, e.g. `analyze_song`, `render_reel` and `render_frame`.

## 9. Instagram tips

- **Format:** 1080×1920, 30fps, H.264, high bitrate (CRF 18). Already the default.
- **Safe zones:** keep important stuff out of the **bottom ~320px** (caption, audio label) and the **top ~220px**.
  The title card already sits above the caption zone. Lyrics are centred.
- **Length:** 15–30s hooks best. Start `--start` **1–2 bars before the drop** so the payoff comes within ~3 seconds.
- **Music rights:** if it's your own track, you're fine. If it isn't, IG may mute the audio. Uploading the reel
  silent and adding the song from IG's music library is a common workaround (the edit will still be on-beat if you
  pick the same section).
- Upload from your phone (AirDrop / Google Drive / cable). Desktop uploads can get recompressed harder.

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Cuts are on the off-beat / bars feel shifted | Open the JSON and nudge `beats` / `downbeats`, or try a `--start` closer to the drop. Songs with tempo changes or no drums are the hardest. |
| No drop detected (`drops: []`) | Fine for chill tracks. Or add one by hand: `"drops": [7.75]` (seconds from reel start). |
| Lyrics wrong | Use a bigger model (`--whisper-model medium`) or fix the JSON by hand (see §4). |
| `python3` not found (Windows) | Use `python`. The `npm run reel` script handles this automatically. |
| Render is slow | Preview at half size: `--scale=0.5`. Video clips are slower than images. |
| Video clip freezes at the end | That clip is shorter than its shot. Use longer clips (≥ 4s) or more clips. |
| Fonts look wrong | Make sure `public/fonts/` exists (it's part of the project). |

## 11. Cost & licences

- **Remotion** is free for individuals and companies of up to 3 people. Bigger companies need a paid company
  licence: see remotion.dev/license.
- **librosa, demucs, Whisper, FFmpeg**: free and open source.
- **Fonts** (Anton, Archivo Black, Inter): SIL Open Font License, free for commercial use.
- **Your music/footage**: make sure you have the rights to post them.

**Total cost: $0** for personal and small-team use. Rendering runs on your own computer.
