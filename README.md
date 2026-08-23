# koubo-subtitle-kit

给**已经做好画面**的视频加上「解说旁白 + 逐句字幕」，并完成混音与交付。

出片工具（Remotion / hyperframes / 任何能重渲的工程）管的是画面；这个套件管画面之后的那一层：
写稿 → 合成语音 → 钉帧校验 → 字幕层 → 混音 → 三版交付。TTS 引擎可插拔，**默认 edge-tts，免费、无需 API key**。

> 方法论来自两支真实成片：一支 4 分 25 秒的能力演示片、一支 1 分 27 秒的产品宣传片。
> 里面的每个数字（BGM 基线、闪避比例、钉帧间隔、峰值门槛）都是踩出来的，不是拍脑袋定的。

---

## 一句话出完整片（画面 + 解说）

```bash
git clone https://github.com/xuanbingbingo/koubo-subtitle-kit.git && cd koubo-subtitle-kit
npm link && kbsub setup      # 装好本 kit + 上游 video-shotcraft（画面段）
```

然后对 Claude Code 说一句：

> 「给我的 XXX 项目做支产品宣传片，要带解说和字幕」

它会自动分两段跑完：`video-shotcraft` 出画面（镜头配方卡 / 2.5D 运镜 / 卡点 / SFX）
→ 本 kit 出解说版（旁白 / 逐句字幕 / 闪避混音 / 三版交付）。**画面只渲一次**，解说版不重做画面。

只要画面：说「做支宣传片」　｜　只要解说（片子已有）：说「给这支片加解说」

> 画面那一段由上游 [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft)（Apache-2.0，作者 Wei Yihao）提供，
> 本仓库不分发其副本，只负责把它装到位并衔接流水线。两段之间只交接一份 `shots.json`（画面时间线）。

## 30 秒跑通（只跑解说这一段）

```bash
git clone https://github.com/xuanbingbingo/koubo-subtitle-kit.git
cd koubo-subtitle-kit && npm link          # 装上 kbsub 命令（也可 npx 直接用）
kbsub doctor                               # 看缺什么依赖

cd examples/minimal && npm i && npm run demo
# → 合成旁白 → 钉帧校验 → 渲染 → 自检，产出 out/demo.mp4（26 秒，带旁白与字幕）
```

`npm run demo` 跑完你会看到：

```
引擎 edge-tts（免费，无需 key） ｜ 音色 zh-CN-YunyangNeural ｜ 共 4 句
 1 s1   @0.3s +5.4s  这是一支示例片…
 …
✅ 无重叠、无越界 → src/vo.json（4 句，共 21.7s）
黑帧段落：0  ✓
峰值 -7.3dB  ✓ ｜ 平均 -31.3dB
```

## 依赖

| 必需 | 说明 |
|---|---|
| Node ≥ 18 | CLI 与 Remotion |
| ffmpeg / ffprobe | 裁静音、量时长、封装、自检 |
| 一个 TTS 引擎 | 见下表，**至少一个** |

| TTS 引擎 | 装法 | 备注 |
|---|---|---|
| **edge-tts**（默认） | `pipx install edge-tts` | 免费、无需 key。微软云扬等中文音色 |
| **OpenAI TTS** | 设 `OPENAI_API_KEY` | 检测到 key 就自动优先；音质更好 |
| 自带引擎 | `kbsub tts --engine ./my-tts.mjs` | 实现一个 `synth({text,out,voice})` 即可，模板见 `src/adapters/custom.mjs` |

> 作者本机用的「清爽男声」走的是剪映非官方接口、克隆音是本人声纹，**都不随本仓库分发**；
> 适配器仍在（`hfvoice` / `voxvoice`），装了同名命令就能用。换个音色不影响方法论——
> 决定成片质感的是钉帧、闪避、字幕与校验这几层。

## 用在你自己的工程里

```bash
kbsub init path/to/your/src        # 拷 Subtitles.tsx / subsContext.ts / Sound.snippet.tsx
```

1. 导出画面时间线为 `shots.json`：`[{ "id":"s1", "from":0, "dur":180 }, …]`（帧）
2. 写 `vo/narration.txt`，**一行一句**，第 N 行钉到第 N 个镜头
3. `kbsub tts` → `kbsub build` → 渲染 → `kbsub verify`

```bash
kbsub lint  --lines vo/narration.txt --fix     # 多音字闸门（tts 会自动先跑，不过审直接拦下）
kbsub tts   --lines vo/narration.txt --out vo/raw
kbsub build --lines vo/narration.txt --wav vo/raw --shots shots.json \
            --out-audio public/vo --out-json src/vo.json
kbsub verify out/film.mp4 --vo out/audio-vo-only.mp3 --window 51:6
```

## 六条死亡红线

1. **字幕 ≠ 画面注解**。画面里那些"按镜头出现的说明文字"跟着镜头走，字幕必须跟着**人声**走——
   实测翻车：某镜注解 2.3s 才淡入，而首句旁白 0.3s 就开口，开头三秒纯语音无字。
2. **有旁白时 BGM 基线必须降**：出片工具常给的 0.34 是无人声场景值，有旁白降到 **0.18–0.20**，
   并在旁白窗口内再闪避 50%。
3. **TTS 句子会超出它所属的镜头**（中文约 3.5 字/秒）。钉帧器必须校验重叠与越界；
   顺延到镜头之外就得缩写重合成，不能硬顺。
4. **必须以渲染产物验峰**：旁白给 1.0 实测峰值能顶到 -1.1dB。给 0.9，渲完 `kbsub verify`。
5. **多音字要在合成前拦住**：`kbsub lint` 用一份共享词典扫稿，判不了读音就换同义词；
   "改音不改字"的替换只进合成稿，不进字幕。等听出来再改＝整片重渲。
6. **改文案＝重合成 + 重钉帧 + 重渲字幕**：音频、字幕、画面同源于一份稿子，只改一处必然对不上。

## 文档

| 文件 | 内容 |
|---|---|
| `SKILL.md` | 作为 Claude Code skill 使用时的入口（clone 进 `~/.claude/skills/` 即可） |
| `references/narration.md` | 旁白稿怎么写、字数怎么倒推、TTS 文案禁忌 |
| `references/voices.md` | 音色选择与批量合成 |
| `references/polyphones.md` | 多音字闸门：词典、三类判定、改音不改字的双轨 |
| `references/pinning.md` | 钉帧规则与校验 |
| `references/subtitles.md` | 字幕层规范 + 画面注解让位 |
| `references/mixing.md` | 混音数值与验收 |
| `references/pipeline.md` | 渲染与交付管线 |
| `assets/AUDIO.md` | BGM / 音效去哪找（仓库不分发音频） |

## 也可以当 Claude Code skill 用

```bash
git clone https://github.com/xuanbingbingo/koubo-subtitle-kit.git ~/.claude/skills/koubo-subtitle-kit
```

之后对 Claude 说「给这支片加解说」「做个配音版」即可触发。

## License

MIT。仓库内不含任何音频素材与声纹数据。
