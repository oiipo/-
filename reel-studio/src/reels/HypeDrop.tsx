import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {ReelProps} from '../lib/types';
import {BeatTimeline} from '../components/BeatTimeline';
import {BeatPunch, Flash, Grain, Vignette} from '../components/Effects';
import {KineticLyrics, MaskedWord} from '../components/KineticLyrics';
import {ClipLayer} from '../components/ClipLayer';
import {ReelShell} from '../components/ReelShell';

const ACCENT = '#ff2d55';

/** Masked-title moment: the title becomes a window into footage on the first drop. */
const DropTitle: React.FC<{text: string; clips: string[]}> = ({text, clips}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = Math.min(1, frame / (0.25 * fps));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <MaskedWord text={text} reveal={reveal} fontSize={text.length > 4 ? 230 : 330}><ClipLayer clips={clips} index={2} /></MaskedWord>
    </AbsoluteFill>
  );
};

/** Fast cuts, zoom punches + shake on every beat, flash + big transitions on drops. */
export const HypeDrop: React.FC<ReelProps> = ({song}) => {
  const {fps} = useVideoConfig();
  const firstDrop = song.drops[0];
  const titleWord = (song.title ?? 'DROP').split(' ')[0].toUpperCase();
  return (
    <ReelShell song={song} accent={ACCENT}>
      <BeatPunch beats={song.beats} strength={0.09} shake={22}>
        <BeatTimeline song={song} calmBeats={4} hypeBeats={1}
          dropTransitions={['zoomThrough', 'split', 'diagonal', 'slices']}
          beatTransitions={['cut', 'cut', 'whip', 'cut']} />
      </BeatPunch>
      {firstDrop !== undefined ? (
        <Sequence from={Math.round(firstDrop * fps)} durationInFrames={Math.round(0.9 * fps)}>
          <DropTitle text={titleWord} clips={song.clips} />
        </Sequence>
      ) : null}
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.18)'}} />
      <KineticLyrics words={song.words} style="pop" accent={ACCENT} emphasis={['drop', 'up', 'fire', 'night', 'go']} />
      <Flash marks={song.drops} />
      <Flash marks={song.downbeats} max={0.15} decay={0.1} />
      <Vignette />
      <Grain opacity={0.1} />
    </ReelShell>
  );
};
