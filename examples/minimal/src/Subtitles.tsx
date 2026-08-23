import React from 'react';
import { useCurrentFrame } from 'remotion';
import voJson from './vo.json'; // tools/vo_build.mjs 的产物

type Cue = { from: number; dur: number; text: string };
const CUES: Cue[] = (voJson as any).cues as Cue[];

// ↓ 改成目标产品的 tokens
const TOKENS = {
  text: '#F0EDE5',
  scrim: 'rgba(12,13,20,0.74)',
  font: '"Avenir Next", Inter, "PingFang SC", sans-serif',
};

/** 口播字幕不带句读 */
const strip = (t: string) =>
  t.replace(/[，。、；：！？,.!?;:“”"]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * 逐句字幕：起止跟 VO 钉帧表，不跟镜头。
 * 🔴 不要用画面里原有的"镜头注解"充当字幕——它跟着镜头走，和人声不是一条时间轴。
 */
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const cue = CUES.find((c) => f >= c.from - 5 && f <= c.from + c.dur + 8);
  if (!cue) return null;
  const a =
    Math.min(1, Math.max(0, (f - (cue.from - 5)) / 8)) *
    Math.min(1, Math.max(0, (cue.from + cue.dur + 8 - f) / 8));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 46, textAlign: 'center', opacity: a, pointerEvents: 'none' }}>
      <span style={{
        display: 'inline-block', maxWidth: 1560, padding: '12px 26px', borderRadius: 12,
        background: TOKENS.scrim, color: TOKENS.text, fontFamily: TOKENS.font,
        fontSize: 34, letterSpacing: 0.8, lineHeight: 1.45,
        textShadow: '0 2px 10px rgba(0,0,0,0.65)',
      }}>{strip(cue.text)}</span>
    </div>
  );
};
