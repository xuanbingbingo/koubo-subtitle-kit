import { run } from '../util.mjs';

/**
 * hfvoice（本机私有工具，非本仓库分发）——作者本人的默认音色「清爽男声」走这条。
 * 别人没装这个命令时 doctor 会把它标成不可用，属正常。
 */
export const meta = {
  id: 'hfvoice',
  label: 'hfvoice 本机命令（清爽男声等预置音色）',
  defaultVoice: '清爽',
  ext: 'wav',
  install: '本机私有工具，不随本仓库分发',
  check: () => run('hfvoice', ['--list']).status === 0,
};

export async function synth({ text, out, voice = meta.defaultVoice }) {
  const r = run('hfvoice', [text, out, '-v', voice]);
  if (r.status !== 0) throw new Error(`hfvoice 失败：${(r.stderr || r.stdout || '').slice(0, 200)}`);
}
