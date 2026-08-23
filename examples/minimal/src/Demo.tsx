import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { SHOTS, CAPTIONS } from './timeline';
import { C, FONT, MONO } from './tokens';
import { Subtitles } from './Subtitles';
import { SubsContext, useSubs } from './subsContext';
import { Sound } from './Sound';

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const seg = (f: number, a: number, b: number) => ease(Math.min(1, Math.max(0, (f - a) / (b - a))));

/** 画面注解：开字幕时上移并降级，把底部让给逐句字幕（references/subtitles.md） */
const Caption: React.FC<{ id: string }> = ({ id }) => {
  const f = useCurrentFrame();
  const subs = useSubs();
  const c = CAPTIONS[id];
  if (!c) return null;
  const a = seg(f, 6, 20);
  return (
    <div style={{ position: 'absolute', left: 96, right: 96, bottom: subs ? 156 : 62, opacity: a, fontFamily: FONT }}>
      {subs ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 4, height: 30, background: C.accent, borderRadius: 2 }} />
          <div style={{ fontSize: 31, color: C.text }}>{c.text}</div>
        </div>
      )}
      {c.sub ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: subs ? 19 : 21, color: C.faint }}>
          {subs ? <div style={{ width: 4, height: 18, background: C.accent, borderRadius: 2, opacity: 0.7 }} /> : null}
          {c.sub}
        </div>
      ) : null}
    </div>
  );
};

const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 80% -20%, rgba(126,138,255,0.18), transparent 45%), ${C.ink}`, fontFamily: FONT }}>
    {children}
  </AbsoluteFill>
);

const Card: React.FC<{ title: string; rows: string[]; f: number }> = ({ title, rows, f }) => (
  <div style={{
    width: 1100, borderRadius: 18, background: C.surface, border: `1px solid ${C.line}`,
    padding: '34px 40px', boxShadow: '0 40px 110px rgba(0,0,0,0.55)',
    transform: `translateY(${(1 - seg(f, 0, 18)) * 24}px)`, opacity: seg(f, 0, 18),
  }}>
    <div style={{ fontSize: 30, color: C.text, fontWeight: 600, marginBottom: 24 }}>{title}</div>
    {rows.map((r, i) => (
      <div key={r} style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
        opacity: seg(f, 14 + i * 8, 30 + i * 8),
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: C.accent }} />
        <div style={{ fontFamily: MONO, fontSize: 23, color: C.muted }}>{r}</div>
      </div>
    ))}
  </div>
);

const SHOT_VIEW: Record<string, React.FC> = {
  s1: () => {
    const f = useCurrentFrame();
    return (
      <Stage>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 78, fontWeight: 700, color: C.text, letterSpacing: 2, opacity: seg(f, 0, 20) }}>koubo-subtitle-kit</div>
          <div style={{ height: 3, width: 320 * seg(f, 10, 34), background: C.accent, marginTop: 26 }} />
          <div style={{ marginTop: 26, fontSize: 26, color: C.muted, opacity: seg(f, 20, 40) }}>解说旁白 + 逐句字幕 + 混音收口</div>
        </AbsoluteFill>
        <Caption id="s1" />
      </Stage>
    );
  },
  s2: () => {
    const f = useCurrentFrame();
    return (
      <Stage>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Card f={f} title="旁白稿从哪来" rows={['画面注解：每句已经写成"静音也看得懂"', '旁白：照它改口语，补主语、去书面连接词', '结果：字幕可以直接复用同一份文本']} />
        </AbsoluteFill>
        <Caption id="s2" />
      </Stage>
    );
  },
  s3: () => {
    const f = useCurrentFrame();
    return (
      <Stage>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Card f={f} title="钉帧与校验" rows={['from = max(shot.from + 8, prevEnd + 7)', '重叠 / 越界 / 顺延出镜头 → 直接报错', 'kbsub build 校验不过退出码 1']} />
        </AbsoluteFill>
        <Caption id="s3" />
      </Stage>
    );
  },
  s4: () => {
    const f = useCurrentFrame();
    return (
      <Stage>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 54, color: C.text, fontWeight: 600, opacity: seg(f, 0, 20), textAlign: 'center', lineHeight: 1.5 }}>
            字幕跟人声走<br />
            <span style={{ fontSize: 30, color: C.faint }}>画面注解跟镜头走 —— 两条时间轴</span>
          </div>
        </AbsoluteFill>
        <Caption id="s4" />
      </Stage>
    );
  },
};

export const Demo: React.FC<{ vo?: boolean; subs?: boolean; bgm?: boolean }> = ({ vo = true, subs = true, bgm = false }) => (
  <SubsContext value={subs}>
    <AbsoluteFill style={{ background: C.ink }}>
      {SHOTS.map((s) => {
        const V = SHOT_VIEW[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={s.id}>
            <V />
          </Sequence>
        );
      })}
      {subs ? <Subtitles /> : null}
      <Sound vo={vo} bgm={bgm} />
    </AbsoluteFill>
  </SubsContext>
);
