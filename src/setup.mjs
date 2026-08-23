import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { run, has, flag, arg } from './util.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(HERE, '..');
const SKILLS = arg('skills-dir', path.join(process.env.HOME, '.claude', 'skills'));

/** 画面那一段由上游 video-shotcraft 提供（Apache-2.0，作者 Wei Yihao）。
 *  本仓库不再分发它的副本，只负责把它装到位——上游更新时你直接 git pull 即可。 */
const UPSTREAM = {
  name: 'video-shotcraft',
  url: 'https://github.com/Vincentwei1021/video-shotcraft.git',
  // 有些网络环境到 github 的 HTTPS 不通（实测 Empty reply from server），SSH 却正常，
  // 所以 HTTPS 失败后自动换 SSH 再试一次，而不是直接让人手动折腾。
  sshUrl: 'git@github.com:Vincentwei1021/video-shotcraft.git',
  what: '画面：镜头配方卡 + 2.5D 运镜 + 卡点 + SFX',
};

const link = (target, linkPath) => {
  if (fs.existsSync(linkPath)) return 'already';
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(target, linkPath);
  return 'linked';
};

export function cmdSetup() {
  console.log(`\n安装目录：${SKILLS}\n`);

  // 1) 本 kit（旁白 + 字幕 + 混音）
  const self = path.join(SKILLS, 'koubo-subtitle-kit');
  const r1 = link(KIT, self);
  console.log(`  ${r1 === 'linked' ? '✓ 已链接' : '· 已存在'} koubo-subtitle-kit  ← 解说旁白 + 逐句字幕 + 混音收口`);

  // 2) 上游画面 skill
  const up = path.join(SKILLS, UPSTREAM.name);
  if (fs.existsSync(up)) {
    console.log(`  · 已存在 ${UPSTREAM.name}  ← ${UPSTREAM.what}`);
  } else if (flag('no-upstream')) {
    console.log(`  · 跳过 ${UPSTREAM.name}（--no-upstream）`);
  } else if (!has('git')) {
    console.log(`  ✗ 没有 git，无法安装 ${UPSTREAM.name}；手动：git clone ${UPSTREAM.url} ${up}`);
  } else {
    console.log(`  … 正在 clone ${UPSTREAM.name}（Apache-2.0，作者 Wei Yihao）`);
    let r = run('git', ['clone', '--depth', '1', UPSTREAM.url, up]);
    if (r.status !== 0) {
      console.log(`  · HTTPS 不通，换 SSH 再试：${(r.stderr || '').trim().split('\n').slice(-1)[0]}`);
      fs.rmSync(up, { recursive: true, force: true });
      r = run('git', ['clone', '--depth', '1', UPSTREAM.sshUrl, up]);
    }
    if (r.status === 0) console.log(`  ✓ 已安装 ${UPSTREAM.name}  ← ${UPSTREAM.what}`);
    else {
      fs.rmSync(up, { recursive: true, force: true });
      console.log(`  ✗ clone 失败：${(r.stderr || '').trim().split('\n').slice(-1)[0]}`);
      console.log(`    手动装：git clone ${UPSTREAM.url} ${up}`);
    }
  }

  console.log(`
装好之后，对 Claude 说一句就能整条跑完：

  「给我的 XXX 项目做支产品宣传片，要带解说和字幕」
     → video-shotcraft 出画面（镜头卡 / 运镜 / 卡点 / SFX）
     → koubo-subtitle-kit 出解说版（旁白 / 逐句字幕 / 闪避混音 / 三版交付）
     画面只渲一次，解说版不重渲画面

只要画面：「做支宣传片」　　只要解说：「给这支片加解说」

再跑一次依赖体检：kbsub doctor`);
}
