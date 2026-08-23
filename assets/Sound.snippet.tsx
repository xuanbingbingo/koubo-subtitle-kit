/**
 * 音轨片段：BGM（可开关 + 旁白闪避）+ SFX 钉帧表 + 多音色旁白轨。
 * copy 进工程后改 import 路径与音量基线；数值依据见 references/mixing.md。
 */
import React from 'react';
import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import voQs from './vo-qs.json';
import voBinge from './vo.json';

type Cue = { from: number; dur: number; file: string; text: string };
export type VoKind = 'none' | 'qs' | 'binge';
const TRACKS: Record<string, { dir: string; cues: Cue[] }> = {
  qs: { dir: 'vo-qs/', cues: (voQs as any).cues },
  binge: { dir: 'vo/', cues: (voBinge as any).cues },
};

const BGM_BASE_VO = 0.20;   // 有旁白
const BGM_BASE_MUSIC = 0.26; // 纯音乐版（仍不要回到 0.34）
const RAMP = 12;

const duckGain = (f: number, cues: Cue[]) => {
  let g = 1;
  for (const c of cues) {
    const a = c.from - RAMP, b = c.from + c.dur + RAMP;
    if (f < a || f > b) continue;
    const inR = Math.min(1, Math.max(0, (f - a) / RAMP));
    const outR = Math.min(1, Math.max(0, (b - f) / RAMP));
    g = Math.min(g, 1 - 0.5 * Math.min(inR, outR));
  }
  return g;
};

export const Sound: React.FC<{
  bgm: boolean; vo: VoKind;
  bgmFile: string; musicIn: number; musicStartS: number;
  sfx: { from: number; src: string; volume: number; dur: number }[];
}> = ({ bgm, vo, bgmFile, musicIn, musicStartS, sfx }) => {
  const { durationInFrames } = useVideoConfig();
  const track = vo === 'none' ? null : TRACKS[vo];
  const cues = track ? track.cues : [];
  const base = vo === 'none' ? BGM_BASE_MUSIC : BGM_BASE_VO;
  return (
    <>
      {bgm ? (
        <Sequence from={musicIn} durationInFrames={durationInFrames - musicIn}>
          <Audio src={staticFile(bgmFile)} startFrom={Math.round(musicStartS * 30)}
            volume={(f) => {
              const abs = f + musicIn;
              const fadeIn = Math.min(1, f / 24);
              const fadeOut = Math.min(1, Math.max(0, (durationInFrames - abs) / 72));
              return base * fadeIn * fadeOut * duckGain(abs, cues);
            }} />
        </Sequence>
      ) : null}
      {cues.map((c, i) => (
        <Sequence key={`vo-${i}`} from={c.from} durationInFrames={c.dur + 4}>
          <Audio src={staticFile(track!.dir + c.file)} volume={0.9} />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.dur}>
          <Audio src={staticFile('audio/sfx/' + s.src)} volume={s.volume} />
        </Sequence>
      ))}
    </>
  );
};
