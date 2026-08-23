import shots from '../shots.json';
export const FPS = 30;
export type Shot = { id: string; from: number; dur: number };
export const SHOTS = shots as Shot[];
export const TOTAL = SHOTS[SHOTS.length - 1].from + SHOTS[SHOTS.length - 1].dur;
/** 画面自带的说明文字（旁白稿就是照这些改口语的） */
export const CAPTIONS: Record<string, { text: string; sub?: string }> = {
  s1: { text: '示例：给已做好的画面加解说与字幕' },
  s2: { text: '旁白稿 ＝ 画面说明文字的口语化版本', sub: '念的和看到的是同一句，字幕才能复用' },
  s3: { text: '每句钉到所属镜头，并校验重叠与越界', sub: 'from + 8 帧，句间至少留 7 帧' },
  s4: { text: '字幕跟人声走，不跟镜头走' },
};
