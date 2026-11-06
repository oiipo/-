import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import {ReelProps} from './lib/types';
import {HypeDrop} from './reels/HypeDrop';
import {LyricVideo} from './reels/LyricVideo';
import {Glitch} from './reels/Glitch';
import demoProps from '../public/songs/demo.json';

const demo = demoProps.song as ReelProps['song'];

const FPS = 30;

// Reel length follows the song data, so --props=<song.json> just works.
const fromSong: CalculateMetadataFunction<ReelProps> = ({props}) => ({
  durationInFrames: Math.max(1, Math.round(props.song.duration * FPS)),
});

const reels = {HypeDrop, LyricVideo, Glitch};

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(reels).map(([id, Comp]) => (
      <Composition
        key={id}
        id={id}
        component={Comp}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(demo.duration * FPS)}
        defaultProps={{song: demo}}
        calculateMetadata={fromSong}
      />
    ))}
  </>
);
