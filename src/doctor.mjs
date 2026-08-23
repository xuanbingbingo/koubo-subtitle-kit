import { has, run } from './util.mjs';
import { loadAdapter, pickEngine } from './tts.mjs';

const row = (ok, name, hint) => console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(28)} ${ok ? '' : hint}`);

export async function cmdDoctor() {
  console.log('\n必需：');
  row(Number(process.versions.node.split('.')[0]) >= 18, `node ${process.versions.node}`, '需要 Node ≥ 18');
  row(has('ffmpeg'), 'ffmpeg', 'brew install ffmpeg  /  apt install ffmpeg');
  row(has('ffprobe'), 'ffprobe', '随 ffmpeg 一起装');

  console.log('\nTTS 引擎（至少要有一个）：');
  for (const id of ['edge', 'openai', 'hfvoice', 'voxvoice']) {
    const a = await loadAdapter(id);
    let ok = false;
    try { ok = a.meta.check(); } catch { ok = false; }
    row(ok, a.meta.label, a.meta.install);
  }
  console.log(`\n  当前默认引擎：${pickEngine()}${process.env.OPENAI_API_KEY ? '（检测到 OPENAI_API_KEY）' : '（未设置 OPENAI_API_KEY）'}`);

  console.log('\n可选：');
  row(has('python3'), 'python3（tools/beat.py 卡点分析用）', 'brew install python');
  const numpy = has('python3') && run('python3', ['-c', 'import numpy']).status === 0;
  row(numpy, 'numpy（beat.py 依赖）', 'pip install numpy');
  console.log('');
}
