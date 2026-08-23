import { Config } from '@remotion/cli/config';
import fs from 'fs';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// 国内网络下 remotion 自动下载 Chrome 常常卡死（无输出、看着像挂了）。
// 本机若已有 puppeteer 缓存的 headless shell，直接指过去；也可用 KBSUB_CHROME 覆盖。
const cached =
  process.env.KBSUB_CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome-headless-shell/mac_arm-149.0.7827.22/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
if (fs.existsSync(cached)) Config.setBrowserExecutable(cached);
