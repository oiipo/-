import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Word} from '../lib/types';
import {rand} from '../lib/beats';
import {DISPLAY, HEAVY} from '../lib/fonts';

export type LyricStyle = 'pop' | 'stack' | 'glitch' | 'outline';

type Props = {
  words: Word[];
  style: LyricStyle;
  font?: string;
  color?: string;
  accent?: string;
  /** words to blow up extra big (case-insensitive) */
  emphasis?: string[];
};

/** Group words into short on-screen lines (max 3 words or a pause > 0.5s). */
const toLines = (words: Word[]) => {
  const lines: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= 3 || (prev && w.start - prev.end > 0.5))) { lines.push(cur); cur = []; }
    cur.push(w);
  });
  if (cur.length) lines.push(cur);
  return lines;
};

const clean = (s: string) => s.replace(/[^\p{L}\p{N}']/gu, '').toUpperCase();

export const KineticLyrics: React.FC<Props> = ({
  words, style, font = DISPLAY, color = '#fff', accent = '#ff2d55', emphasis = [],
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const emph = new Set(emphasis.map(clean));

  if (style === 'pop' || style === 'glitch') {
    // One word at a time, huge and centred.
    const w = [...words].reverse().find((x) => x.start <= t && t < Math.max(x.end, x.start + 0.25) + 0.15);
    if (!w) return null;
    const local = frame - Math.round(w.start * fps);
    const s = spring({frame: local, fps, config: {damping: 8, stiffness: 220, mass: 0.6}});
    const big = emph.has(clean(w.text));
    const size = (big ? 330 : 250) * (clean(w.text).length > 6 ? 0.68 : 1);
    const glitch = style === 'glitch' && local < 5;
    const gx = glitch ? (rand(frame) - 0.5) * 30 : 0;
    return (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 60}}>
        <div style={{
          fontFamily: font, fontSize: size, lineHeight: 1, color: big ? accent : color, textAlign: 'center',
          transform: `translateX(${gx}px) scale(${interpolate(s, [0, 1], [1.8, 1])}) rotate(${(1 - s) * -6}deg)`,
          opacity: Math.min(1, s * 2),
          textShadow: style === 'glitch'
            ? `${4 + Math.abs(gx) / 3}px 0 #ff004c, ${-4 - Math.abs(gx) / 3}px 0 #00e5ff, 0 10px 40px rgba(0,0,0,0.6)`
            : '0 10px 40px rgba(0,0,0,0.55)',
          WebkitTextStroke: big ? '0' : undefined,
        }}>
          {clean(w.text)}
        </div>
      </AbsoluteFill>
    );
  }

  // 'stack' and 'outline': a line builds word by word.
  const lines = toLines(words);
  const line = lines.find((l) => l[0].start <= t && t < l[l.length - 1].end + 0.35);
  if (!line) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 70}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
        {line.map((w, i) => {
          if (w.start > t) return null;
          const local = frame - Math.round(w.start * fps);
          const s = spring({frame: local, fps, config: {damping: 12, stiffness: 180}});
          const big = emph.has(clean(w.text));
          const outline = style === 'outline' && i % 2 === 1;
          return (
            <div key={i} style={{
              fontFamily: font, fontSize: big ? 230 : 170, lineHeight: 0.95,
              color: outline ? 'transparent' : big ? accent : color,
              WebkitTextStroke: outline ? `4px ${color}` : undefined,
              transform: `translateY(${(1 - s) * 80}px) scaleY(${interpolate(s, [0, 1], [0.3, 1])})`,
              opacity: s, textShadow: outline ? undefined : '0 8px 30px rgba(0,0,0,0.5)',
            }}>
              {clean(w.text)}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Text-as-mask: the word is a window into footage (AE track matte style).
 * Works like a luma matte: white text on black, multiplied over the footage.
 * `reveal` 0→1 animates the matte in.
 */
export const MaskedWord: React.FC<{text: string; fontSize?: number; reveal?: number; children: React.ReactNode}> = ({
  text, fontSize = 300, reveal = 1, children,
}) => (
  <AbsoluteFill style={{isolation: 'isolate', background: '#000'}}>
    {children}
    <AbsoluteFill style={{background: '#000', mixBlendMode: 'multiply', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{
        fontFamily: HEAVY, fontSize, lineHeight: 1, color: '#fff', textAlign: 'center',
        transform: `scale(${interpolate(reveal, [0, 1], [3.2, 1])})`, opacity: Math.min(1, reveal * 3),
      }}>
        {text}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
