import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildCuts, Cut} from '../lib/cuts';
import {SongData} from '../lib/types';
import {ClipLayer} from './ClipLayer';
import {Entry, EntryName} from '../transitions/entries';

const Shot: React.FC<{song: SongData; cut: Cut; entry: EntryName; tFrames: number}> = ({song, cut, entry, tFrames}) => {
  const frame = useCurrentFrame(); // local to the Sequence
  const p = tFrames > 0 ? frame / tFrames : 1;
  return (
    <Entry name={entry} p={p}>
      <ClipLayer clips={song.clips} index={cut.clipIndex} />
    </Entry>
  );
};

/**
 * Lays your clips out on the beat grid. Drops get a big transition
 * (`dropTransitions`, cycled), other cuts get `beatTransitions` (cycled; 'cut' = hard cut).
 * Transitions *start* slightly before the beat so they *land* on it.
 */
export const BeatTimeline: React.FC<{
  song: SongData;
  dropTransitions: EntryName[];
  beatTransitions: EntryName[];
  transitionSeconds?: number;
  calmBeats?: number;
  hypeBeats?: number;
}> = ({song, dropTransitions, beatTransitions, transitionSeconds = 0.35, calmBeats, hypeBeats}) => {
  const {fps} = useVideoConfig();
  const cuts = buildCuts(song, {calmBeats, hypeBeats});
  let dropN = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {cuts.map((cut, i) => {
        const entry: EntryName = i === 0 ? 'cut'
          : cut.isDrop ? dropTransitions[dropN++ % dropTransitions.length]
          : beatTransitions[i % beatTransitions.length];
        const tFrames = entry === 'cut' ? 0 : Math.round(transitionSeconds * fps);
        // Land the transition ON the beat: start it early by ~70% of its length.
        const lead = Math.round(tFrames * 0.7);
        const from = Math.max(0, Math.round(cut.start * fps) - lead);
        const to = Math.round(cut.end * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
            <AbsoluteFill><Shot song={song} cut={cut} entry={entry} tFrames={tFrames} /></AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
