# Reel Studio: notes for AI agents

Beat-synced 1080×1920 Instagram music reels. Python analyses the song → `public/songs/<name>.json`
(`{"song": SongData}`, see `src/lib/types.ts`) → Remotion compositions in `src/reels/` render it.

## Commands
- Analyse: `python3 analysis/analyze.py <audio> --start S --duration D [--title T --artist A --lyrics]`
- Render: `npx remotion render <HypeDrop|LyricVideo|Glitch> out/x.mp4 --props=public/songs/<name>.json`
- One-shot: `npm run reel -- <audio> --style all [analyzer flags]`
- **Check your work visually** before full renders. Render stills on interesting frames and look at them:
  `npx remotion still HypeDrop out/check.png --frame=<n> --scale=0.4 --props=...`
  Good frames to check: just before/after each drop (`drops[i] * 30`), mid-lyric, and the first second.
- Typecheck: `npx tsc`

## Rules
- All times in the song JSON are seconds **relative to the reel start** (already offset).
- Frame = seconds × 30. Use `useCurrentFrame()` / `useVideoConfig().fps`; never wall-clock time.
- Randomness must be deterministic: use `rand(seed)` from `src/lib/beats.ts`, never `Math.random()`.
- Beat-reactive values: `pulse(song.beats, t, decay)` (1 on beat → 0). Drops: `song.drops`.
- New transition = new `case` in `src/transitions/entries.tsx` plus the `EntryName` union. `p` is 0→1.
- New style = file in `src/reels/` plus an entry in the `reels` map in `src/Root.tsx`.
- Fonts are local (`src/lib/fonts.ts`, `public/fonts/`). Don't add network font loading.
- Keep text out of IG's bottom ~320px and top ~220px.
- User media goes in `public/clips/` and `public/songs/` (gitignored, except the demo files).
