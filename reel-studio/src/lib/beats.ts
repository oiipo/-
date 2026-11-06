import {Easing, interpolate} from 'remotion';

/** Index of the most recent beat at time t (-1 before the first beat). */
export const beatIndexAt = (beats: number[], t: number): number => {
  let lo = 0, hi = beats.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid] <= t) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return ans;
};

/** Seconds since the most recent beat (Infinity before the first). */
export const sinceBeat = (beats: number[], t: number): number => {
  const i = beatIndexAt(beats, t);
  return i < 0 ? Infinity : t - beats[i];
};

/**
 * 1 on the beat, decaying to 0 over `decay` seconds — the core "hit" envelope.
 * Use it to drive zoom punches, flashes, shakes, glow...
 */
export const pulse = (beats: number[], t: number, decay = 0.25): number => {
  const s = sinceBeat(beats, t);
  if (!isFinite(s)) return 0;
  return interpolate(s, [0, decay], [1, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
};

/** Is time t inside a window after any of the given marks (e.g. drops)? */
export const within = (marks: number[], t: number, window: number) =>
  marks.some((m) => t >= m && t < m + window);

/** Deterministic pseudo-random in [0,1) — use instead of Math.random(). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Energy (0..1) of the section containing t. */
export const energyAt = (sections: {start: number; end: number; energy: number}[], t: number) =>
  sections.find((s) => t >= s.start && t < s.end)?.energy ?? 0.5;
