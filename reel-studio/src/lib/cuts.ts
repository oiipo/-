import {SongData} from './types';
import {energyAt} from './beats';

export type Cut = {start: number; end: number; clipIndex: number; isDrop: boolean};

/**
 * Builds the edit decision list: cut on downbeats in calm parts,
 * on every beat (or every 2) in high-energy parts. Drops always cut.
 */
export const buildCuts = (song: SongData, opts: {calmBeats?: number; hypeBeats?: number} = {}): Cut[] => {
  const calm = opts.calmBeats ?? 4;
  const hype = opts.hypeBeats ?? 2;
  const points = new Set<number>([0]);
  let lastCutBeat = 0;
  song.beats.forEach((b, i) => {
    const step = energyAt(song.sections, b) > 0.65 ? hype : calm;
    if (i - lastCutBeat >= step) { points.add(b); lastCutBeat = i; }
  });
  song.drops.forEach((d) => points.add(d));
  const sorted = [...points].filter((p) => p < song.duration).sort((a, b) => a - b);
  const n = Math.max(1, song.clips.length || 6);
  return sorted.map((start, i) => ({
    start,
    end: sorted[i + 1] ?? song.duration,
    clipIndex: i % n,
    isDrop: song.drops.some((d) => Math.abs(d - start) < 0.05),
  }));
};
