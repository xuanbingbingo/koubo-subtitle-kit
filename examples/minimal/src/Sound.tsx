import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import voJson from './vo.json';

type Cue = { from: number; dur: number; file: string };
const CUES: Cue[] = (voJson as any).cues ?? [];
const RAMP = 12;
const duckGain = (f: number) => {
  let g = 1;
  for (const c of CUES) {
    const a = c.from - RAMP, b = c.from + c.dur + RAMP;
    if (f < a || f > b) continue;
    const inR = Math.min(1, Math.max(0, (f - a) / RAMP));
    const outR = Math.min(1, Math.max(0, (b - f) / RAMP));
    g = Math.min(g, 1 - 0.5 * Math.min(inR, outR));
  }
  return g;
};

/** BGM 需要自备（见 assets/AUDIO.md）；默认关闭，旁白轨永远可用 */
export const Sound: React.FC<{ vo: boolean; bgm: boolean; bgmFile?: string }> = ({ vo, bgm, bgmFile = 'audio/bgm.mp3' }) => {
  const { durationInFrames } = useVideoConfig();
  const cues = vo ? CUES : [];
  return (
    <>
      {bgm ? (
        <Audio src={staticFile(bgmFile)} volume={(f) => {
          const fadeIn = Math.min(1, f / 24);
          const fadeOut = Math.min(1, Math.max(0, (durationInFrames - f) / 72));
          return (vo ? 0.20 : 0.26) * fadeIn * fadeOut * duckGain(f);
        }} />
      ) : null}
      {cues.map((c, i) => (
        <Sequence key={i} from={c.from} durationInFrames={c.dur + 4}>
          <Audio src={staticFile('vo/' + c.file)} volume={0.9} />
        </Sequence>
      ))}
    </>
  );
};
