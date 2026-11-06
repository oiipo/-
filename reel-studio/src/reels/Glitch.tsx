import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ReelProps} from '../lib/types';
import {BeatTimeline} from '../components/BeatTimeline';
import {BeatPunch, Flash, GlitchSlices, Grain, Scanlines} from '../components/Effects';
import {KineticLyrics} from '../components/KineticLyrics';
import {ReelShell} from '../components/ReelShell';

/** Glitchy / VHS: slice transitions, RGB-split text, glitch hits on every bar. */
export const Glitch: React.FC<ReelProps> = ({song}) => (
  <ReelShell song={song} accent="#00e5ff">
    <GlitchSlices beats={song.downbeats} duration={0.13}>
      <BeatPunch beats={song.beats} strength={0.05} shake={10}>
        <BeatTimeline song={song} calmBeats={2} hypeBeats={1} transitionSeconds={0.3}
          dropTransitions={['slices', 'split', 'slices', 'zoomThrough']}
          beatTransitions={['cut', 'cut', 'cut', 'slices']} />
      </BeatPunch>
    </GlitchSlices>
    <AbsoluteFill style={{background: 'rgba(0,10,30,0.25)', mixBlendMode: 'multiply'}} />
    <KineticLyrics words={song.words} style="glitch" accent="#00e5ff" emphasis={['drop', 'go', 'up']} />
    <Flash marks={song.drops} color="#00e5ff" max={0.6} />
    <Scanlines />
    <Grain opacity={0.14} />
  </ReelShell>
);
