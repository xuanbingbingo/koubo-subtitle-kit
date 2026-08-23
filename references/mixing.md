# 混音

## 三个数（有旁白时）

| 层 | 值 | 说明 |
|---|---|---|
| BGM 基线 | **0.18–0.20** | 出片 skill 的 0.34 是无人声场景值，有旁白必须降 |
| 旁白窗口内 BGM | **× 0.5**（→0.09–0.10） | 前后各 12 帧斜坡，别硬切 |
| 旁白 | **0.9** | 给 1.0 实测整片峰值顶到 -1.1dB，太贴 |

纯音乐版（无旁白）的 BGM 可给 0.20–0.26；仍**不要回到 0.34**——那个值配上密集 SFX 会被投诉聒噪。

## 闪避实现

```ts
const RAMP = 12;
const duckGain = (f: number, cues: Cue[]) => {
  let g = 1;
  for (const c of cues) {
    const a = c.from - RAMP, b = c.from + c.dur + RAMP;
    if (f < a || f > b) continue;
    const inR  = Math.min(1, Math.max(0, (f - a) / RAMP));
    const outR = Math.min(1, Math.max(0, (b - f) / RAMP));
    g = Math.min(g, 1 - 0.5 * Math.min(inR, outR));
  }
  return g;
};
// BGM volume = base * fadeIn * fadeOut * bedEnvelope(abs) * duckGain(abs, cues)
```

`bedEnvelope` 可选：曲子的 breakdown 段（信息密集、需要阅读的镜头）再 ×0.78。

## SFX 也要一起减

加了人声之后，原来"每 2–3 秒一发"的结构性音效会和旁白抢。实测把 99 发精简到 66 发：
**删掉逐屏重复的转场音、同类镜头每段只留第一发、章标音量 0.38→0.26**，
大 slam 仍只保留 2–3 处（片名落定 / 关键落位 / 片尾字标）。

## 验收：以渲染产物验，不信预览

```bash
kbsub verify out/xxx-vo.mp4 --vo out/audio-vo-only.mp3 --window 51:6
```

- 峰值要 ≤ **-1.5dB**（留余量）；到 -1.1dB 就把旁白从 1.0 降到 0.9
- 旁白在轨校验：单渲一条"无 BGM 有旁白"的音轨，比对旁白窗口与非旁白窗口的 mean_volume，
  实测应差 **5dB 以上**（例：-21.6dB vs -26.9dB）。差值不明显＝旁白根本没进去
