import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { die } from './util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILES = ['Subtitles.tsx', 'subsContext.ts', 'Sound.snippet.tsx'];

/** 把字幕/音轨组件拷进目标 Remotion 工程 */
export function cmdInit() {
  const target = process.argv[3];
  if (!target || target.startsWith('--')) die('用法：kbsub init <你的 Remotion 工程的 src 目录>');
  fs.mkdirSync(target, { recursive: true });
  for (const f of FILES) {
    const from = path.join(HERE, '..', 'assets', f);
    const to = path.join(target, f);
    if (fs.existsSync(to)) { console.log(`  跳过（已存在）${to}`); continue; }
    fs.copyFileSync(from, to);
    console.log(`  ✓ ${to}`);
  }
  console.log(`
接下来：
  1. 在合成里挂 <SubsContext value={subs}> 并渲染 <Subtitles />
  2. 用 Sound.snippet.tsx 里的 duckGain 接管 BGM 音量（BGM 基线 0.18–0.20）
  3. 导出 shots.json（[{id,from,dur}]）→ kbsub tts → kbsub build
细则见 references/subtitles.md 与 references/mixing.md`);
}
