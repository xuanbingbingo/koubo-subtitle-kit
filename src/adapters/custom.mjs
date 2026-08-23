/**
 * 自带 TTS 模板：复制这个文件，实现 synth() 即可。
 * 用法：kbsub tts --engine ./my-tts.mjs --lines vo/narration.txt --out vo/raw
 */
export const meta = {
  id: 'custom',
  label: '自定义 TTS',
  defaultVoice: 'default',
  ext: 'wav',          // 'wav' 或 'mp3'，build 阶段会统一转 48k wav
  install: '实现 synth() 即可',
  check: () => true,
};

export async function synth({ text, out, voice }) {
  throw new Error('请实现 synth({ text, out, voice })：把 text 合成到 out 这个文件路径');
}
