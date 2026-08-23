import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { arg, flag, readLines, die } from './util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DICT = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'polyphones.json'), 'utf8'));

const applies = (rule, engine) => !rule.engines?.length || rule.engines.includes(engine);

/** 扫一行，返回命中列表 */
export function scanLine(text, engine) {
  const hits = [];
  for (const r of DICT.rules) {
    if (!applies(r, engine)) continue;
    const re = new RegExp(r.pattern, 'g');
    let m;
    while ((m = re.exec(text))) {
      hits.push({ rule: r, index: m.index, matched: m[0] });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return hits;
}

/**
 * 合成前闸门。
 * - auto_safe    ：放行，只提示
 * - auto_fix     ：--fix 时自动处理（同义替换写回稿子；读音映射只写进 .speech.txt，不动字幕）
 * - needs_review ：必须由人/模型按语义判定；未处理则退出码 1，进不了合成
 */
export function cmdLint() {
  const file = arg('lines', 'vo/narration.txt');
  const engine = arg('engine', process.env.OPENAI_API_KEY ? 'openai' : 'edge');
  const doFix = flag('fix');
  const lines = readLines(file);

  let review = 0, fixed = 0, safe = 0;
  const speechLines = [...lines];
  const outLines = [...lines];

  lines.forEach((text, i) => {
    for (const h of scanLine(text, engine)) {
      const r = h.rule;
      const head = `  第 ${i + 1} 句「${h.matched}」`;
      if (r.verdict === 'auto_safe') { safe++; continue; }

      if (r.verdict === 'auto_fix' && doFix) {
        if (r.speechMap) {
          // 改字不改音：只作用于合成文本，字幕保持原文
          for (const [from, to] of Object.entries(r.speechMap)) speechLines[i] = speechLines[i].split(from).join(to);
          console.log(`${head} → 合成文本用「${Object.values(r.speechMap)[0]}」代读（字幕不变）`);
        } else if (r.replace?.length) {
          const rep = r.replace[0];
          outLines[i] = outLines[i].replace(h.matched, rep);
          speechLines[i] = outLines[i];
          console.log(`${head} → 已替换为「${rep}」（字幕同步改）`);
        }
        fixed++;
        continue;
      }

      review++;
      const tag = r.verdict === 'auto_fix' ? '【加 --fix 可自动处理】' : '';
      console.log(`${head}${tag} ${r.readings.correct} / 误读 ${r.readings.wrong}`);
      console.log(`     句子：${text}`);
      if (r.why) console.log(`     原因：${r.why}`);
      if (r.replace?.length) console.log(`     判不了就替换：${r.replace.join(' / ')}`);
    }
  });

  if (doFix) {
    fs.writeFileSync(file, outLines.join('\n') + '\n');
    const speechFile = file.replace(/\.txt$/, '.speech.txt');
    if (speechLines.join('\n') !== outLines.join('\n')) {
      fs.writeFileSync(speechFile, speechLines.join('\n') + '\n');
      console.log(`\n读音映射稿 → ${speechFile}（kbsub tts 会优先用它合成；字幕仍用 ${file}）`);
    }
  }

  console.log(`\n扫描 ${lines.length} 句：自动处理 ${fixed} ｜提示 ${safe} ｜待判定 ${review}`);
  if (review) {
    console.log(`
🔴 待判定的必须先处理再合成（重渲一次的代价远大于现在改一个词）：
   1) 按上下文能确定读音 → 保留原词，本行加进 polyphones.json 的 auto_safe 规则
   2) 判不了 → 换成上面给的同义词，改完重跑 kbsub lint
   跳过检查（不建议）：kbsub tts --no-lint`);
    process.exit(1);
  }
  console.log('✅ 未发现待判定的多音字风险');
}
