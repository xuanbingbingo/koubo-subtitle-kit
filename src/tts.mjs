import fs from 'fs';
import path from 'path';
import fs2 from 'fs';
import { arg, flag, readLines, pad3, die } from './util.mjs';
import { scanLine } from './lint.mjs';

const BUILTIN = ['edge', 'openai', 'hfvoice', 'voxvoice'];

export const loadAdapter = async (id) => {
  if (id.startsWith('.') || id.startsWith('/')) return import(path.resolve(id));
  if (!BUILTIN.includes(id)) die(`未知引擎 ${id}（内置：${BUILTIN.join(' / ')}，或给一个 .mjs 路径）`);
  return import(`./adapters/${id}.mjs`);
};

/** 没指定引擎时：有 OPENAI_API_KEY 就用 openai，否则 edge */
export const pickEngine = () => (process.env.OPENAI_API_KEY ? 'openai' : 'edge');

export async function cmdTts() {
  const linesFile = arg('lines', 'vo/narration.txt');
  // 🔴 合成前闸门：多音字未过审不许进合成（重渲一次的代价远大于改一个词）
  const speechFileEarly = linesFile.replace(/\.txt$/, '.speech.txt');
  if (!flag('no-lint')) {
    const engineForLint = arg('engine', pickEngine());
    // 闸门要检查"真正会被念出来的那份稿子"：有读音映射稿就查它
    const gateFile = fs2.existsSync(speechFileEarly) ? speechFileEarly : linesFile;
    const pending = readLines(gateFile)
      .map((t, i) => ({ i, hits: scanLine(t, engineForLint).filter((h) => h.rule.verdict !== 'auto_safe') }))
      .filter((x) => x.hits.length);
    if (pending.length) {
      console.error(`✗ 有 ${pending.length} 句存在多音字风险（检查的是 ${gateFile}），先跑：kbsub lint --lines ${linesFile} [--fix]`);
      console.error('  （确认无碍可加 --no-lint 跳过，但请先想清楚重渲的代价）');
      process.exit(1);
    }
  }
  // 有读音映射稿就用它合成，字幕仍用原稿
  const lines = readLines(fs2.existsSync(speechFileEarly) ? speechFileEarly : linesFile);
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
