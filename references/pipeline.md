# 渲染与交付管线

## 画面渲一次，音轨渲多版

**不要**为每个音轨版本重渲画面——慢，而且三版画面可能不一致。

```bash
# 1) 画面（muted）：无字幕版 + 有字幕版各一次
npx remotion render src/index.ts Comp out/video-only.mp4  --muted
npx remotion render src/index.ts Comp out/video-subs.mp4  --props=props-vo.json --muted

# 2) 音轨：从同一条时间线渲 mp3
npx remotion render src/index.ts Comp out/audio-music.mp3 --props=props-music.json
npx remotion render src/index.ts Comp out/audio-vo.mp3    --props=props-vo.json
npx remotion render src/index.ts Comp out/audio-nobgm.mp3 --props=props-nobgm.json

# 3) ffmpeg 封装
ffmpeg -y -i out/video-only.mp4 -i out/audio-music.mp3 -c:v copy -c:a aac -b:a 192k -shortest out/xxx-music.mp4
ffmpeg -y -i out/video-subs.mp4 -i out/audio-vo.mp3    -c:v copy -c:a aac -b:a 192k -shortest out/xxx-vo.mp4
ffmpeg -y -i out/video-only.mp4 -i out/audio-nobgm.mp3 -c:v copy -c:a aac -b:a 192k -shortest out/xxx-nobgm.mp4
```

inputProps 用文件传（Windows shell 会剥掉内联 JSON 的双引号）：
`props-vo.json` = `{"bgm":true,"vo":"qs","subs":true}`。

## 交付前自检（tools/verify_mix.sh）

1. 黑帧：`blackdetect=d=0.3:pix_th=0.06` 应为 0 处
2. 峰值：`volumedetect` max ≤ -1.5dB
3. 旁白在轨：无 BGM 有旁白轨里，旁白窗口比静默窗口高 ≥5dB
4. 字幕在画：抽 VO 首句开口那一帧，肉眼确认字已经在（这一条只能靠看，别靠推理）

## 发飞书

🔴 单文件 >30MB 直接 HTTP 400。压 HEVC 再发，原片留本地：

```bash
ffmpeg -y -i out/xxx-vo.mp4 -c:v libx265 -crf 28 -preset fast -tag:v hvc1 -c:a aac -b:a 128k out/feishu-xxx-vo.mp4
~/.claude/tools/feishu-send-file out/feishu-xxx-vo.mp4
```

4:25 的 1080p30：H.264 原片 61MB → HEVC crf28 约 25MB，小字仍清晰。
