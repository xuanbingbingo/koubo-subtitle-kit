import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { arg, readLines, pad3, durationOf, die } from './util.mjs';

const TRIM = 'silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB:detection=peak,areverse,'
           + 'silenceremove=start_periods=1:start_silence=0.10:start_threshold=-45dB:detection=peak,areverse';

/** TTS 产物 → 裁静音 → 钉帧 → 校验 → vo.json（规则见 references/pinning.md） */
export function cmdBuild() {
  const lines = readLines(arg('lines', 'vo/narration.txt'));
  const wavDir = arg('wav', 'vo/raw');
  const shots = JSON.parse(fs.readFileSync(arg('shots', 'shots.json'), 'utf8'));
  const outAudio = arg('out-audio', 'public/vo');
  const outJson = arg('out-json', 'src/vo.json');
  const OFFSET = Number(arg('offset', 8));
  const GAP = Number(arg('gap', 7));
  const FPS = Number(arg('fps', 30));

  if (lines.length > shots.length) die(`文案 ${lines.length} 行 > 镜头 ${shots.length} 个：多出来的句子没有落点`);
  fs.mkdirSync(outAudio, { recursive: true });

  const cues = [];
  let prevEnd = -1e9;
  lines.forEach((text, i) => {
    const n = pad3(i + 1);
    const candidates = ['wav', 'mp3'].map((e) => path.join(wavDir, `${n}.${e}`)).filter((f) => fs.existsSync(f));
    if (!candidates.length) die(`缺少第 ${i + 1} 句的音频：${path.join(wavDir, n)}.{wav,mp3}（先跑 kbsub tts）`);
    const src = candidates[0];
    const out = path.join(outAudio, `${n}.wav`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', TRIM, '-ar', '48000', out]);
    const d = Math.round(durationOf(out) * FPS);
    const shot = shots[i];
    const wanted = shot.from + OFFSET;
    const from = Math.max(wanted, prevEnd + GAP);
    prevEnd = from + d;
    cues.push({ from, dur: d, file: `${n}.wav`, text, shot: shot.id, push: from - wanted });
  });

  const total = shots[shots.length - 1].from + shots[shots.length - 1].dur;
  const problems = [];
  cues.forEach((c, i) => {
    const next = cues[i + 1];
    if (next && c.from + c.dur > next.from) problems.push(`重叠 ${i + 1}→${i + 2}：超 ${c.from + c.dur - next.from}f`);
    if (c.from + c.dur > total) problems.push(`越界 ${i + 1}：结束 ${c.from + c.dur} > 全片 ${total}`);
    if (c.from >= shots[i].from + shots[i].dur) problems.push(`第 ${i + 1} 句被顺延出镜头 ${shots[i].id} 之外——缩写重合成（kbsub tts --only ${i + 1}），别硬顺延`);
  });

  console.log(cues.map((c, i) =>
    `${String(i + 1).padStart(2)} ${String(c.shot).padEnd(4)} @${(c.from / FPS).toFixed(1)}s +${(c.dur / FPS).toFixed(1)}s`
    + `${c.push ? ` (顺延 ${c.push}f)` : ''}  ${c.text.slice(0, 24)}`).join('\n'));

  if (problems.length) {
    console.error('\n✗ 校验未通过：\n  ' + problems.join('\n  '));
    console.error('\n处理办法见 references/pinning.md');
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ cues }, null, 1));
  console.log(`\n✅ 无重叠、无越界 → ${outJson}（${cues.length} 句，共 ${(cues.reduce((a, c) => a + c.dur, 0) / FPS).toFixed(1)}s）`);
}
