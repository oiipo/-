import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

const PALETTES = [
  ['#ff2d55', '#5e17eb'], ['#00e5ff', '#0047ff'], ['#ffb800', '#ff2d55'],
  ['#7cff4f', '#00a3ff'], ['#ff5ef7', '#2b00ff'], ['#ffffff', '#ff6a00'],
];

/** A placeholder "clip" so presets look alive before you add real footage. */
const Placeholder: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const [a, b] = PALETTES[index % PALETTES.length];
  const rot = frame * (index % 2 ? 1.2 : -1.2);
  return (
    <AbsoluteFill style={{background: `linear-gradient(${135 + index * 40}deg, ${a}, ${b})`, overflow: 'hidden'}}>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 1400, height: 1400,
        marginLeft: -700, marginTop: -700, transform: `rotate(${rot}deg)`,
        background: `repeating-conic-gradient(rgba(0,0,0,0.18) 0deg 15deg, transparent 15deg 30deg)`,
      }} />
      <div style={{position: 'absolute', top: 260, left: 70, fontFamily: 'sans-serif', fontWeight: 700,
        fontSize: 36, color: 'rgba(255,255,255,0.45)', letterSpacing: 6}}>
        PLACEHOLDER {index + 1}
      </div>
    </AbsoluteFill>
  );
};

const isImage = (f: string) => /\.(png|jpe?g|webp|gif)$/i.test(f);

/** Shows clip `index` from public/clips/, cover-fit to 9:16, or a placeholder. */
export const ClipLayer: React.FC<{clips: string[]; index: number; style?: React.CSSProperties}> = ({clips, index, style}) => {
  const file = clips.length ? clips[index % clips.length] : null;
  const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
  return (
    <AbsoluteFill style={style}>
      {!file ? <Placeholder index={index} />
        : isImage(file) ? <KenBurns><Img src={staticFile(`clips/${file}`)} style={fill} /></KenBurns>
        : <OffthreadVideo src={staticFile(`clips/${file}`)} muted style={fill} />}
    </AbsoluteFill>
  );
};

/** Slow push-in so still images don't feel dead. */
const KenBurns: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${1.05 + frame * 0.0015})`}}>{children}</AbsoluteFill>;
};
