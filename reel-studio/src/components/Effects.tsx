import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {pulse, rand, sinceBeat} from '../lib/beats';

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

/** Zoom punch + optional shake on every beat. Wrap footage in this. */
export const BeatPunch: React.FC<{
  beats: number[]; strength?: number; shake?: number; decay?: number; children: React.ReactNode;
}> = ({beats, strength = 0.08, shake = 0, decay = 0.22, children}) => {
  const t = useT();
  const p = pulse(beats, t, decay);
  const frame = useCurrentFrame();
  const sx = shake ? (rand(frame) - 0.5) * 2 * shake * p : 0;
  const sy = shake ? (rand(frame + 99) - 0.5) * 2 * shake * p : 0;
  const rot = shake ? (rand(frame + 7) - 0.5) * shake * 0.05 * p : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${1 + strength * p})`}}>
      {children}
    </AbsoluteFill>
  );
};

/** White (or any colour) flash frames on given marks — classic drop hit. */
export const Flash: React.FC<{marks: number[]; color?: string; decay?: number; max?: number}> = ({
  marks, color = '#fff', decay = 0.18, max = 0.9,
}) => {
  const t = useT();
  const p = pulse(marks, t, decay);
  return <AbsoluteFill style={{background: color, opacity: p * max, pointerEvents: 'none'}} />;
};

/** Animated film grain (SVG noise, reseeded every frame). */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.12}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 100} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill style={{
    background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
    pointerEvents: 'none',
  }} />
);

/** VHS-style scanlines + slight colour bleed. */
export const Scanlines: React.FC<{opacity?: number}> = ({opacity = 0.18}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{
      opacity, pointerEvents: 'none', mixBlendMode: 'multiply',
      backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 2px, transparent 2px, transparent 5px)',
      backgroundPosition: `0 ${frame % 5}px`,
    }} />
  );
};

/**
 * Glitch: on beats, slices the children into horizontal strips with random
 * offsets and an RGB-split tint, for `duration` seconds.
 */
export const GlitchSlices: React.FC<{beats: number[]; duration?: number; slices?: number; children: React.ReactNode}> = ({
  beats, duration = 0.12, slices = 6, children,
}) => {
  const t = useT();
  const frame = useCurrentFrame();
  const s = sinceBeat(beats, t);
  if (!(s < duration)) return <AbsoluteFill>{children}</AbsoluteFill>;
  const h = 100 / slices;
  return (
    <AbsoluteFill>
      {Array.from({length: slices}).map((_, i) => {
        const off = (rand(frame * 31 + i) - 0.5) * 160;
        const tint = i % 3 === 0 ? 'hue-rotate(90deg) saturate(2)' : i % 3 === 1 ? 'hue-rotate(-60deg)' : 'none';
        return (
          <AbsoluteFill key={i} style={{
            clipPath: `inset(${i * h}% 0 ${100 - (i + 1) * h}% 0)`,
            transform: `translateX(${off}px)`, filter: tint,
          }}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
