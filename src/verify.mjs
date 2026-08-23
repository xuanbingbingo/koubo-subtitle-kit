import fs from 'fs';
import { spawnSync } from 'child_process';
import { arg, die } from './util.mjs';

const ff = (args) => spawnSync('ffmpeg', args, { encoding: 'utf8' }).stderr || '';

/** 交付前自检：黑帧 / 峰值 / 旁白在轨（细则见 references/mixing.md） */
export function cmdVerify() {
  const video = process.argv[3];
  if (!video || video.startsWith('--')) die('用法：kbsub verify 成片.mp4 [--vo 无BGM有旁白.mp3 --cues src/vo.json]');

  const black = ff(['-hide_banner', '-i', video, '-vf', 'blackdetect=d=0.3:pix_th=0.06', '-an', '-f', 'null', '/dev/null'])
    .split('\n').filter((l) => l.includes('black_start')).length;
  console.log(`黑帧段落：${black}  ${black === 0 ? '✓' : '✗ 应为 0'}`);

  const vol = ff(['-hide_banner', '-i', video, '-af', 'volumedetect', '-f', 'null', '/dev/null']);
  const peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(vol)?.[1] ?? NaN);
  const mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(vol)?.[1] ?? NaN);
  console.log(`峰值 ${peak}dB  ${peak <= -1.5 ? '✓' : '✗ 太贴顶，把旁白从 1.0 降到 0.9'} ｜ 平均 ${mean}dB`);

  const voTrack = arg('vo');
  if (voTrack) {
    const grab = (ss, dd) => {
      const out = ff(['-hide_banner', '-ss', String(ss), '-t', String(dd), '-i', voTrack, '-af', 'volumedetect', '-f', 'null', '/dev/null']);
      return Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(out)?.[1] ?? NaN);
    };
    const fps = Number(arg('fps', 30));
    let loud = null, quiet = null, how = '';
    const cuesFile = arg('cues');
    if (cuesFile) {
      // 🔴 静默窗口必须真的静默：从钉帧表里找最大空档，别拿"窗口前几秒"猜
      //    （猜出来的段落常常也有旁白，会误报"旁白没进去"）
      const cues = JSON.parse(fs.readFileSync(cuesFile, 'utf8')).cues;
      if (!cues?.length) die(`${cuesFile} 里没有 cues`);
      const longest = cues.reduce((best, c) => (c.dur > best.dur ? c : best), cues[0]);
      loud = [longest.from / fps + 0.3, Math.max(1.5, longest.dur / fps - 0.6)];
      let gap = null;
      for (let i = 0; i < cues.length - 1; i++) {
        const a = (cues[i].from + cues[i].dur) / fps, b = cues[i + 1].from / fps;
        if (b - a > (gap ? gap[1] : 0)) gap = [a, b - a];
      }
      if (!gap || gap[1] < 1) die('钉帧表里找不到 ≥1s 的空档，改用 --window 与 --quiet 手动指定');
      quiet = [gap[0] + 0.3, Math.min(gap[1] - 0.5, 6)];
      how = `（依据 ${cuesFile}：最长句 vs 最大空档）`;
    } else {
      const win = arg('window'), qw = arg('quiet');
      if (!win || !qw) die('用 --cues src/vo.json 自动选窗口，或同时给 --window 起:时长 和 --quiet 起:时长');
      loud = win.split(':').map(Number);
      quiet = qw.split(':').map(Number);
    }
    const inWin = grab(loud[0], loud[1]);
    const inQuiet = grab(quiet[0], quiet[1]);
    const delta = inWin - inQuiet;   // 旁白段应比空档更响
    console.log(`旁白在轨${how}：旁白段 ${inWin}dB vs 空档 ${inQuiet}dB（高出 ${delta.toFixed(1)}dB）${delta >= 5 ? '✓' : '✗ 高出 <5dB，旁白多半没进去'}`);
  }
  console.log('\n最后一条只能肉眼看：抽首句开口那一帧确认字幕在画');
  console.log(`  ffmpeg -ss <首句开口秒> -i ${video} -frames:v 1 /tmp/subcheck.png`);
}
