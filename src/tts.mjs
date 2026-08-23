import fs from 'fs';
import path from 'path';
import { arg, readLines, pad3, die } from './util.mjs';

const BUILTIN = ['edge', 'openai', 'hfvoice', 'voxvoice'];

export const loadAdapter = async (id) => {
  if (id.startsWith('.') || id.startsWith('/')) return import(path.resolve(id));
  if (!BUILTIN.includes(id)) die(`未知引擎 ${id}（内置：${BUILTIN.join(' / ')}，或给一个 .mjs 路径）`);
  return import(`./adapters/${id}.mjs`);
};

/** 没指定引擎时：有 OPENAI_API_KEY 就用 openai，否则 edge */
export const pickEngine = () => (process.env.OPENAI_API_KEY ? 'openai' : 'edge');

export async function cmdTts() {
  const lines = readLines(arg('lines', 'vo/narration.txt'));
  const out = arg('out', 'vo/raw');
  const engineId = arg('engine', pickEngine());
  const adapter = await loadAdapter(engineId);
  const voice = arg('voice', adapter.meta.defaultVoice);
  const only = arg('only');            // 只重合成某几句：--only 8,9
  const targets = only ? only.split(',').map(Number) : lines.map((_, i) => i + 1);

  fs.mkdirSync(out, { recursive: true });
  console.log(`引擎 ${adapter.meta.label} ｜ 音色 ${voice} ｜ 共 ${targets.length} 句`);
  for (const n of targets) {
    const text = lines[n - 1];
    if (!text) die(`第 ${n} 句不存在（稿子只有 ${lines.length} 行）`);
    const file = path.join(out, `${pad3(n)}.${adapter.meta.ext}`);
    process.stdout.write(`  [${pad3(n)}] ${text.slice(0, 22)}… `);
    await adapter.synth({ text, out: file, voice });
    console.log('✓');
  }
  console.log(`\n完成 → ${out}／下一步：kbsub build`);
}
