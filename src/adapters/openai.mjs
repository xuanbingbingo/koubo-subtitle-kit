import fs from 'fs';
import { sleep } from '../util.mjs';

/**
 * OpenAI TTS —— 音质更好，需要 OPENAI_API_KEY。
 * 检测到环境变量就自动优先于 edge（可用 --engine edge 强制回退）。
 */
export const meta = {
  id: 'openai',
  label: 'OpenAI TTS（需 OPENAI_API_KEY）',
  defaultVoice: 'onyx',
  ext: 'mp3',
  install: '设置环境变量 OPENAI_API_KEY',
  check: () => Boolean(process.env.OPENAI_API_KEY),
};

export async function synth({ text, out, voice = meta.defaultVoice, model = process.env.KBSUB_OPENAI_MODEL || 'gpt-4o-mini-tts' }) {
  const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${base}/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, voice, input: text, response_format: 'mp3' }),
    }).catch((e) => ({ ok: false, statusText: String(e) }));
    if (res.ok) {
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      return;
    }
    await sleep(600 * (i + 1));
    if (i === 4) throw new Error(`OpenAI TTS 失败：${res.status ?? ''} ${res.statusText ?? ''}`);
  }
}
