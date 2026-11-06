export type Word = {text: string; start: number; end: number};

export type Section = {start: number; end: number; label: string; energy: number};

/** Produced by analysis/analyze.py — everything the reel syncs to. */
export type SongData = {
  /** File in public/songs/ (empty string = silent preview) */
  audio: string;
  /** Seconds into the song where the reel starts */
  offset: number;
  /** Reel length in seconds (Instagram: up to 90s, 15–30s performs best) */
  duration: number;
  bpm: number;
  /** Beat times in seconds, relative to the start of the reel */
  beats: number[];
  /** Bar starts (every 4th beat), relative to reel start */
  downbeats: number[];
  /** Big energy jumps (drops / chorus hits), relative to reel start */
  drops: number[];
  sections: Section[];
  /** Word-level lyric timestamps, relative to reel start */
  words: Word[];
  /** Video/image files in public/clips/ (empty = colour placeholders) */
  clips: string[];
  title?: string;
  artist?: string;
};

export type ReelProps = {song: SongData};
