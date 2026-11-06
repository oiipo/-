import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ReelProps} from '../lib/types';
import {BeatTimeline} from '../components/BeatTimeline';
import {BeatPunch, Grain, Vignette} from '../components/Effects';
import {KineticLyrics} from '../components/KineticLyrics';
import {ReelShell} from '../components/ReelShell';

/** Slower, moodier: long shots, mask wipes on drops, stacked lyrics that build word by word. */
export const LyricVideo: React.FC<ReelProps> = ({song}) => (
  <ReelShell song={song} accent="#ffd166">
    <BeatPunch beats={song.downbeats} strength={0.025} decay={0.5}>
      <BeatTimeline song={song} calmBeats={8} hypeBeats={4} transitionSeconds={0.6}
        dropTransitions={['circle', 'iris', 'diagonal']}
        beatTransitions={['cut', 'circle']} />
    </BeatPunch>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.45))'}} />
    <KineticLyrics words={song.words} style="outline" accent="#ffd166" emphasis={['love', 'night', 'you', 'heart']} />
    <Vignette strength={0.7} />
    <Grain opacity={0.16} />
  </ReelShell>
);
