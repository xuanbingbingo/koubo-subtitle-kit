import { run } from '../util.mjs';

/**
 * voxvoice（VoxCPM2 本地零样本克隆）——"用我自己的声音念"。
 * 需要本机装好 voxvoice 与参考音频，本仓库不分发任何声纹。
 */
export const meta = {
  id: 'voxvoice',
  label: 'voxvoice 本地克隆音',
  defaultVoice: 'binge',
  ext: 'wav',
  install: '本机私有工具，不随本仓库分发',
  check: () => run('voxvoice', ['--help']).status === 0,
};

export async function synth({ text, out, voice = meta.defaultVoice }) {
  const r = run('voxvoice', [text, '-o', out, '-v', voice, '--fast']);
  if (r.status !== 0) throw new Error(`voxvoice 失败：${(r.stderr || r.stdout || '').slice(0, 200)}`);
}
