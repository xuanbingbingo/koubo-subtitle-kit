import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';

/** 本机代理常常挡住 TTS 端点，合成一律在剥掉代理的环境里跑 */
export const cleanEnv = () => {
  const e = { ...process.env };
  for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) delete e[k];
  return e;
};

export const has = (cmd) => spawnSync('which', [cmd], { encoding: 'utf8' }).status === 0;

export const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', env: cleanEnv(), ...opts });

export const durationOf = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim());

export const readLines = (file) =>
  fs.readFileSync(file, 'utf8').trim().split('\n').filter((l) => l.trim());

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const pad3 = (n) => String(n).padStart(3, '0');
export const die = (msg) => { console.error('✗ ' + msg); process.exit(1); };
export const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
export const flag = (k) => process.argv.includes('--' + k);
