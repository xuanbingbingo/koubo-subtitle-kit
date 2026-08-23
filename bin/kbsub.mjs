#!/usr/bin/env node
import { cmdDoctor } from '../src/doctor.mjs';
import { cmdTts } from '../src/tts.mjs';
import { cmdBuild } from '../src/build.mjs';
import { cmdVerify } from '../src/verify.mjs';
import { cmdInit } from '../src/init.mjs';
import { cmdLint } from '../src/lint.mjs';
import { cmdSetup } from '../src/setup.mjs';

const HELP = `
koubo-subtitle-kit — 给已锁定画面的视频加解说旁白 + 逐句字幕

  kbsub setup                       一键装好两个 skill（本 kit + 上游 video-shotcraft 画面段）
  kbsub doctor                      检查依赖（ffmpeg / TTS 引擎 / python）
  kbsub init <src目录>              把 Subtitles.tsx 等组件拷进你的 Remotion 工程
  kbsub lint   --lines vo/narration.txt [--fix] [--engine edge]   合成前多音字闸门（tts 会自动先跑）
  kbsub tts    --lines vo/narration.txt --out vo/raw [--engine edge|openai|<自定义.mjs>] [--voice X] [--only 8,9]
  kbsub build  --lines vo/narration.txt --wav vo/raw --shots shots.json --out-audio public/vo --out-json src/vo.json
  kbsub verify 成片.mp4 [--vo 无BGM有旁白.mp3 --cues src/vo.json]

流程：写稿(=画面字幕口语化) → lint(多音字闸门) → tts → build(钉帧+校验) → 渲染 → verify → 交付三版
文档：SKILL.md 与 references/*.md ；示例工程：examples/minimal
`;

const cmd = process.argv[2];
const main = async () => {
  switch (cmd) {
    case 'setup': return cmdSetup();
    case 'doctor': return cmdDoctor();
    case 'lint': return cmdLint();
    case 'tts': return cmdTts();
    case 'build': return cmdBuild();
    case 'verify': return cmdVerify();
    case 'init': return cmdInit();
    case '-v': case '--version': return console.log('0.1.0');
    default: console.log(HELP);
  }
};
main().catch((e) => { console.error('✗ ' + (e?.message || e)); process.exit(1); });
