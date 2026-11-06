#!/usr/bin/env python3
"""
Analyse a song and write the JSON the reels sync to.

  python3 analysis/analyze.py path/to/song.mp3 --start 45 --duration 30 \
      --title "Song Name" --artist "Artist" --lyrics

Produces public/songs/<name>.json with beats, bars, drops, energy sections,
word-level lyrics, and the list of clips found in public/clips/.
All times in the JSON are relative to --start (the start of the reel).
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
CLIP_EXT = {".mp4", ".mov", ".webm", ".m4v", ".png", ".jpg", ".jpeg", ".webp"}


def analyse_rhythm(path: Path, start: float, duration: float):
    import librosa

    # Load some context before/after so beat tracking is stable at the edges.
    pad = 4.0
    load_start = max(0.0, start - pad)
    y, sr = librosa.load(str(path), sr=22050, mono=True, offset=load_start, duration=duration + 2 * pad)
    shift = start - load_start

    hop = 512
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop)
    tempo = float(np.atleast_1d(tempo)[0])
    # Keep tempo in a reel-friendly range (avoid half/double-time picks)
    while tempo < 75: tempo *= 2
    while tempo > 170: tempo /= 2
    period = 60.0 / tempo

    # Kick-drum flux (low band) — beats in most music sit on the kick, not the hats.
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = S[freqs < 150].sum(axis=0)
    low_flux = np.maximum(0, np.diff(low, prepend=low[0]))
    norm = lambda v: v / (v.max() + 1e-9)
    env = norm(onset_env[:len(low_flux)]) + 2 * norm(low_flux[:len(onset_env)])
    env_t = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=hop)
    total = len(y) / sr

    def env_at(ts):
        idx = np.clip(np.round(np.asarray(ts) * sr / hop).astype(int), 0, len(env) - 1)
        return env[idx]

    # Fit a steady grid: refine tempo (±3%) and phase together.
    best = (-1.0, period, 0.0)
    for bpm_try in np.arange(tempo * 0.97, tempo * 1.03, 0.05):
        per = 60.0 / bpm_try
        for o in np.arange(0, per, 0.005):
            sc = env_at(np.arange(o, total, per)).mean()
            if sc > best[0]:
                best = (sc, per, o)
    _, period, anchor = best
    tempo = 60.0 / period
    grid = np.arange(anchor, total, period)
    # Snap each beat to the strongest hit within ±45 ms (handles slight drift / swing).
    beat_times = []
    for g in grid:
        m = (env_t >= g - 0.045) & (env_t <= g + 0.045)
        beat_times.append(float(env_t[m][np.argmax(env[m])]) if m.any() and env[m].max() > 0.15 else float(g))
    beat_times = np.array(beat_times)

    # Per-beat loudness → drops = beats where the next bar is much louder than the last.
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    edges = list(beat_times) + [total]
    be = np.array([rms[(rms_t >= x) & (rms_t < z)].mean() if ((rms_t >= x) & (rms_t < z)).any() else 0.0
                   for x, z in zip(edges[:-1], edges[1:])])
    be_n = be / (np.percentile(be, 95) + 1e-9) if len(be) else be
    jump = np.zeros(len(be))
    for i in range(4, len(be) - 1):
        jump[i] = be_n[i:i + 4].mean() - be_n[i - 4:i].mean()
    drop_idx = []
    for i in np.argsort(-jump):
        if jump[i] < 0.3:
            break
        if all(abs(beat_times[i] - beat_times[j]) > 6 for j in drop_idx):
            drop_idx.append(int(i))
    drop_idx.sort()

    # Downbeats: the biggest drop lands on bar 1; otherwise use kick weight.
    if drop_idx:
        phase = int(max(drop_idx, key=lambda i: jump[i]) % 4)
    else:
        low_at = env_at(beat_times)
        phase = int(np.argmax([low_at[p::4].mean() if len(low_at[p::4]) else 0 for p in range(4)]))
    downbeat_times = beat_times[phase::4]
    drops = [float(beat_times[i]) for i in drop_idx]

    # Energy per bar → sections and drops.
    bars = list(downbeat_times) + [len(y) / sr]
    bar_energy = []
    for a, b in zip(bars[:-1], bars[1:]):
        m = (rms_t >= a) & (rms_t < b)
        bar_energy.append(float(rms[m].mean()) if m.any() else 0.0)
    e = np.array(bar_energy)
    if len(e):
        lo_e, hi_e = np.percentile(e, 5), np.percentile(e, 95)
        e_norm = np.clip((e - lo_e) / (hi_e - lo_e + 1e-9), 0, 1)
    else:
        e_norm = e

    def rel(ts):
        return [round(float(t) - shift, 3) for t in ts if 0 <= float(t) - shift < duration]

    sections = []
    for i, (a, b) in enumerate(zip(bars[:-1], bars[1:])):
        a2, b2 = max(0.0, a - shift), min(duration, b - shift)
        if b2 > 0 and a2 < duration:
            sections.append({"start": round(a2, 3), "end": round(b2, 3),
                             "label": "high" if e_norm[i] > 0.65 else "low", "energy": round(float(e_norm[i]), 3)})

    return tempo, rel(beat_times), rel(downbeat_times), rel(drops), sections


def transcribe(path: Path, start: float, duration: float, model_name: str, separate: bool):
    """Word-level lyrics with Whisper (optionally on demucs-isolated vocals)."""
    tmp = Path(tempfile.mkdtemp())
    clip = tmp / "excerpt.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(start), "-t", str(duration),
                    "-i", str(path), "-ac", "2", "-ar", "44100", str(clip)], check=True)
    source = clip
    if separate:
        print("• separating vocals with demucs (first run downloads a model)…")
        subprocess.run([sys.executable, "-m", "demucs", "--two-stems=vocals", "-o", str(tmp / "sep"), str(clip)], check=True)
        found = list((tmp / "sep").rglob("vocals.wav"))
        if found:
            source = found[0]
    print(f"• transcribing with whisper '{model_name}'…")
    import whisper
    model = whisper.load_model(model_name)
    result = model.transcribe(str(source), word_timestamps=True, condition_on_previous_text=False)
    words = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            text = w["word"].strip()
            if text:
                words.append({"text": text, "start": round(w["start"], 3), "end": round(w["end"], 3)})
    shutil.rmtree(tmp, ignore_errors=True)
    return words


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio", type=Path)
    ap.add_argument("--start", type=float, default=0.0, help="seconds into the song where the reel starts")
    ap.add_argument("--duration", type=float, default=30.0, help="reel length in seconds (max 90 for IG)")
    ap.add_argument("--title")
    ap.add_argument("--artist")
    ap.add_argument("--lyrics", action="store_true", help="auto-transcribe lyrics with Whisper")
    ap.add_argument("--lyrics-file", type=Path, help="use a JSON list of {text,start,end} instead (times relative to reel start)")
    ap.add_argument("--whisper-model", default="small", help="tiny/base/small/medium/large-v3")
    ap.add_argument("--no-separate", action="store_true", help="skip demucs vocal separation")
    ap.add_argument("--out", type=Path, help="output JSON (default public/songs/<name>.json)")
    a = ap.parse_args()

    if not a.audio.exists():
        sys.exit(f"not found: {a.audio}")

    songs = PUBLIC / "songs"
    songs.mkdir(parents=True, exist_ok=True)
    dest = songs / a.audio.name
    if dest.resolve() != a.audio.resolve():
        shutil.copy2(a.audio, dest)

    print("• detecting beats, bars and drops…")
    bpm, beats, downbeats, drops, sections = analyse_rhythm(a.audio, a.start, a.duration)
    print(f"  {bpm:.1f} BPM · {len(beats)} beats · {len(downbeats)} bars · drops at {drops}")

    words = []
    if a.lyrics_file:
        words = json.loads(a.lyrics_file.read_text())
    elif a.lyrics:
        words = transcribe(a.audio, a.start, a.duration, a.whisper_model, not a.no_separate)
        print(f"  {len(words)} words")

    clips = sorted(p.name for p in (PUBLIC / "clips").iterdir() if p.suffix.lower() in CLIP_EXT) \
        if (PUBLIC / "clips").exists() else []
    print(f"• {len(clips)} clips in public/clips/" + ("" if clips else " (placeholders will be used)"))

    data = {
        "audio": a.audio.name, "offset": a.start, "duration": a.duration, "bpm": round(bpm, 2),
        "beats": beats, "downbeats": downbeats, "drops": drops, "sections": sections,
        "words": words, "clips": clips, "title": a.title or a.audio.stem, "artist": a.artist or "",
    }
    out = a.out or songs / f"{a.audio.stem}.json"
    # Remotion --props expects the composition props, i.e. {"song": {...}}
    out.write_text(json.dumps({"song": data}, indent=1))
    print(f"✓ wrote {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}")


if __name__ == "__main__":
    main()
