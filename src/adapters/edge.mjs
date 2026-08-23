import { run, sleep, pad3 } from '../util.mjs';

/**
 * edge-tts（微软 Edge 在线 TTS）——免费、无需 API key。
 * 装： pipx install edge-tts    或    pip install edge-tts
 *
 * 🔴 已知坑：部分网络环境下 speech.platform.bing.com 的 TLS 握手会被 reset（实测约 50%），
 * 因此每句最多重试 12 次并递增退避；合成一律在剥掉代理的环境里跑（见 util.cleanEnv）。
 */
export const meta = {
  id: 'edge',
  label: 'edge-tts（免费，无需 key）',
  defaultVoice: 'zh-CN-YunyangNeural',
  ext: 'mp3',
  install: 'pipx install edge-tts  （或 pip install edge-tts）',
  check: () => run('edge-tts', ['--version']).status === 0 || run('python3', ['-m', 'edge_tts', '--version']).status === 0,
};

const invoke = (args) => {
  let r = run('edge-tts', args);
  if (r.error || r.status !== 0) r = run('python3', ['-m', 'edge_tts', ...args]);
  return r;
};

export async function synth({ text, out, voice = meta.defaultVoice, rate }) {
  const args = ['--voice', voice, '--text', text, '--write-media', out];
  if (rate) args.push('--rate', rate);
  for (let i = 0; i < 12; i++) {
    const r = invoke(args);
    if (r.status === 0) return;
    await sleep(400 * (i + 1));
  }
  throw new Error(`edge-tts 连续 12 次失败：${text.slice(0, 20)}…（多半是 TLS 被 reset，换网络或稍后重试）`);
}
