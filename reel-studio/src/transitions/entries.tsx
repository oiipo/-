import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';

/**
 * "Entry" transitions: the incoming shot animates in over the outgoing one.
 * p goes 0 → 1 over the transition. Add your own here — it's just CSS.
 */
export type EntryName = 'cut' | 'circle' | 'diagonal' | 'zoomThrough' | 'whip' | 'slices' | 'iris' | 'split';

const ease = (p: number) => Easing.bezier(0.8, 0, 0.2, 1)(Math.min(1, Math.max(0, p)));

export const Entry: React.FC<{name: EntryName; p: number; children: React.ReactNode}> = ({name, p, children}) => {
  const e = ease(p);
  if (name === 'cut' || p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;

  switch (name) {
    case 'circle': // circle mask grows from centre
      return <AbsoluteFill style={{clipPath: `circle(${e * 75}% at 50% 50%)`}}>{children}</AbsoluteFill>;

    case 'iris': { // ring mask: shape with a hole that closes
      const r = e * 80;
      return <AbsoluteFill style={{clipPath: `circle(${r}% at 50% ${50 + (1 - e) * 20}%)`, transform: `rotate(${(1 - e) * -25}deg) scale(${1 + (1 - e) * 0.3})`}}>{children}</AbsoluteFill>;
    }

    case 'diagonal': { // hard diagonal shape wipe
      const x = interpolate(e, [0, 1], [-60, 160]);
      return <AbsoluteFill style={{clipPath: `polygon(0 0, ${x}% 0, ${x - 60}% 100%, 0 100%)`}}>{children}</AbsoluteFill>;
    }

    case 'zoomThrough': // punches in from huge + blurred
      return (
        <AbsoluteFill style={{
          transform: `scale(${interpolate(e, [0, 1], [2.6, 1])}) rotate(${(1 - e) * 12}deg)`,
          filter: `blur(${(1 - e) * 28}px)`, opacity: interpolate(p, [0, 0.25], [0, 1], {extrapolateRight: 'clamp'}),
        }}>{children}</AbsoluteFill>
      );

    case 'whip': // fast whip-pan with motion blur
      return (
        <AbsoluteFill style={{
          transform: `translateX(${(1 - e) * 110}%) skewX(${(1 - e) * -12}deg)`,
          filter: `blur(${Math.sin(e * Math.PI) * 30}px)`,
        }}>{children}</AbsoluteFill>
      );

    case 'slices': { // staggered horizontal bars slide in
      const n = 6;
      return (
        <AbsoluteFill>
          {Array.from({length: n}).map((_, i) => {
            const local = ease(p * 1.6 - (i / n) * 0.6);
            const dir = i % 2 ? 1 : -1;
            return (
              <AbsoluteFill key={i} style={{
                clipPath: `inset(${(i * 100) / n}% 0 ${100 - ((i + 1) * 100) / n}% 0)`,
                transform: `translateX(${dir * (1 - local) * 105}%)`,
              }}>{children}</AbsoluteFill>
            );
          })}
        </AbsoluteFill>
      );
    }

    case 'split': { // two halves slam in from top and bottom
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{clipPath: 'inset(0 0 50% 0)', transform: `translateY(${-(1 - e) * 55}%)`}}>{children}</AbsoluteFill>
          <AbsoluteFill style={{clipPath: 'inset(50% 0 0 0)', transform: `translateY(${(1 - e) * 55}%)`}}>{children}</AbsoluteFill>
        </AbsoluteFill>
      );
    }
  }
};
