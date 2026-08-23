import { spawnSync } from 'child_process';
import { arg, die } from './util.mjs';

const ff = (args) => spawnSync('ffmpeg', args, { encoding: 'utf8' }).stderr || '';

/** 交付前自检：黑帧 / 峰值 / 旁白在轨（细则见 references/mixing.md） */
export function cmdVerify() {
  const video = process.argv[3];
  if (!video || video.startsWith('--')) die('用法：kbsub verify 成片.mp4 [--vo 无BGM有旁白.mp3 --window 51:6]');

  const black = ff(['-hide_banner', '-i', video, '-vf', 'blackdetect=d=0.3:pix_th=0.06', '-an', '-f', 'null', '/dev/null'])
    .split('\n').filter((l) => l.includes('black_start')).length;
  console.log(`黑帧段落：${black}  ${black === 0 ? '✓' : '✗ 应为 0'}`);

  const vol = ff(['-hide_banner', '-i', video, '-af', 'volumedetect', '-f', 'null', '/dev/null']);
  const peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(vol)?.[1] ?? NaN);
  const mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(vol)?.[1] ?? NaN);
  console.log(`峰值 ${peak}dB  ${peak <= -1.5 ? '✓' : '✗ 太贴顶，把旁白从 1.0 降到 0.9'} ｜ 平均 ${mean}dB`);

  const voTrack = arg('vo');
  const win = arg('window');
  if (voTrack && win) {
    const [s, d] = win.split(':');
    const grab = (ss, dd) => {
      const out = ff(['-hide_banner', '-ss', String(ss), '-t', String(dd), '-i', voTrack, '-af', 'volumedetect', '-f', 'null', '/dev/null']);
      return Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(out)?.[1] ?? NaN);
    };
    const inWin = grab(s, d);
    const quiet = grab(Math.max(0, Number(s) - Number(d) - 2), d);
    const delta = quiet - inWin;
    console.log(`旁白在轨：窗口 ${inWin}dB vs 静默 ${quiet}dB（差 ${delta.toFixed(1)}dB）${delta >= 5 ? '✓' : '✗ 差值 <5dB，旁白多半没进去'}`);
  }
  console.log('\n最后一条只能肉眼看：抽首句开口那一帧确认字幕在画');
  console.log(`  ffmpeg -ss <首句开口秒> -i ${video} -frames:v 1 /tmp/subcheck.png`);
}
