import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SongData} from '../lib/types';
import {BODY, HEAVY} from '../lib/fonts';

/** Song audio + artist/title card. Every preset renders inside this. */
export const ReelShell: React.FC<{song: SongData; accent?: string; children: React.ReactNode}> = ({song, accent = '#ff2d55', children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cardOpacity = interpolate(t, [0.1, 0.4, 2.2, 2.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {song.audio ? <Audio src={staticFile(`songs/${song.audio}`)} trimBefore={Math.round(song.offset * fps)} /> : null}
      {children}
      {(song.artist || song.title) && cardOpacity > 0 ? (
        // Bottom-third card; stays above Instagram's caption zone (bottom ~320px).
        <AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 70px 380px', opacity: cardOpacity}}>
          <div style={{fontFamily: HEAVY, color: '#fff', fontSize: 64, lineHeight: 1,
            transform: `translateY(${(1 - cardOpacity) * 30}px)`, textShadow: '0 6px 24px rgba(0,0,0,.6)'}}>
            {song.artist?.toUpperCase()}
          </div>
          <div style={{fontFamily: BODY, color: accent, fontSize: 44, fontWeight: 700, marginTop: 10, letterSpacing: 4}}>
            {song.title}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
