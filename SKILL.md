---
name: koubo-subtitle-kit
description: 给已经做好画面的视频加「解说旁白 + 逐句字幕」并完成混音交付。默认音色清爽男声（斌哥克隆音可选）。当用户说「加解说 / 加旁白 / 配音版 / 带字幕版 / 做个解说版 / 给这支片加字幕 / 用我的声音解说」，或用 video-shotcraft、hf-video、wvp、remotion-video 出完画面后要人声版时使用。本 skill 只管旁白与字幕这一层，不做画面。
---

# koubo-subtitle-kit：口播解说 + 字幕收口套件

画面已经做好了，现在要一版「有人念、有字幕」的。这一层不属于任何出片 skill——
`video-shotcraft` 的 `sound-design.md` 只规定 BGM 与 SFX，压根没有"解说"这个概念；
hf-video / wvp 那边的配音是**画面跟着配音走**，而这里相反：**画面已锁，配音与字幕来适配画面**。
两支实拍片（152 卡能力演示片 4:25、CC Solo 宣传片 1:26）踩出来的规则全在这里。

## 什么时候用

- 已有成片或已锁定的画面工程（Remotion / hyperframes / 任意能重渲的工程），要加解说
- 已经交付过纯音乐版，用户回来说"加个配音""带字幕的给我一版"
- **不适用**：画面还没定（先去把画面做完）、只要 TTS 音频不要视频（直接 `hfvoice`）

## 命令行（仓库自带，零 npm 依赖）

```bash
kbsub doctor                  # 检查 ffmpeg / TTS 引擎 / python
kbsub init <src目录>          # 把 Subtitles.tsx 等组件拷进目标 Remotion 工程
kbsub tts   --lines vo/narration.txt --out vo/raw [--engine edge|openai|./my.mjs] [--only 8,9]
kbsub build --lines vo/narration.txt --wav vo/raw --shots shots.json --out-audio public/vo --out-json src/vo.json
kbsub verify 成片.mp4 [--vo 无BGM有旁白.mp3 --window 51:6]
```

TTS 引擎可插拔：默认 `edge-tts`（免费无 key），检测到 `OPENAI_API_KEY` 自动切 OpenAI；
本机装了 `hfvoice`（清爽男声）或 `voxvoice`（克隆音）则用 `--engine hfvoice|voxvoice`。
**本仓库对外分发时不含任何音色资产与声纹**。

可跑通的示例：`examples/minimal`（`npm i && npm run demo` 出 26 秒带旁白带字幕样片）。

## 六步流程

1. **写旁白稿** → `references/narration.md`
2. **合成语音** → `references/voices.md`（默认清爽男声）
3. **钉帧 + 校验** → `tools/vo_build.mjs`，规则见 `references/pinning.md`
4. **加字幕层** → `assets/Subtitles.tsx`，让位规则见 `references/subtitles.md`
5. **混音** → `references/mixing.md`（BGM 要降、旁白要闪避、必须验峰）
6. **渲染与交付** → `references/pipeline.md`（画面渲一次、音轨渲多版、ffmpeg 封装）

## 五条死亡红线

1. 🔴 **字幕 ≠ 画面注解。** 画面里原本那些"按镜头出现的说明文字"不是字幕：它们的出现时机跟着镜头走，
   而字幕必须跟着**人声**走。实测翻车：某镜注解设了 `in0: 70`（2.3s 才淡入），而第一句旁白 0.3s 就开口，
   开头三秒纯语音无字。**必须另建跟 VO 钉帧表走的字幕层**，并让画面注解上移/降级/只留旁白没说的部分。

2. 🔴 **BGM 基线必须下调。** 出片 skill 给的 0.34 是"无人声"场景的值。有旁白时降到 **0.18–0.20**，
   并在每句旁白窗口内再闪避 50%（→0.09–0.10）。不降的后果是用户一句"背景音乐太聒噪了"。

3. 🔴 **TTS 句子会超出它所属的镜头。** 中文 3.5 字/秒左右，一个 2.4s 的字卡镜头只塞得下约 8 个字。
   钉帧器必须校验"无重叠、无越界"，超了要么缩写重合成，要么顺延——**顺延不能跨出所属镜头的语义**。

4. 🔴 **必须以渲染产物验峰。** 旁白 1.0 + BGM + SFX 实测峰值能顶到 -1.1dB。旁白给 0.9、渲完跑
   `volumedetect`，峰值留 ≥1.5dB 余量。预览里的电平不算数。

5. 🔴 **改文案必须重合成 + 重钉帧 + 重渲字幕。** 音频、字幕、画面三者同源于同一份稿子；
   只改其中一处必然对不上（出片管线里已有同类事故：改完稿直接合成＝合出旧文本还报成功）。

## 与相关 skill 的分工

| 场景 | 用谁 |
|---|---|
| 画面：产品宣传片（真实页面 2.5D + 镜头卡） | `video-shotcraft`，之后接本 skill |
| 画面：口播成片（配音驱动场景路由） | `hf-video`（它自带配音，通常不需要本 skill） |
| 画面：网页点击驱动演示 | `web-video-presentation`，之后接本 skill |
| 只要一段配音文件 | 直接 `hfvoice "文案" out.wav -v 清爽` |
| 「转成我的音色」 | `voxvoice`（本 skill 的第二音色选项） |

## 交付物固定三件

- `xxx-music.mp4` 纯音乐版（无旁白、无字幕，BGM 用降过的基线）
- `xxx-vo.mp4` 解说版（旁白 + 逐句字幕）
- `xxx-nobgm.mp4` 无 BGM 版（留 SFX，方便后期自配乐）

同一份画面渲染产物只渲一次（字幕版另渲一次），三版音轨从同一条时间线出，杜绝版本间画面漂移。
