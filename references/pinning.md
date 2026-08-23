# 钉帧与校验

## 规则

1. **每句钉在它所描述的那一镜**：`from = shot.from + 8`（8 帧让镜头先立住，人声再进）
2. **最小间隔 7 帧**：`from = max(shot.from + 8, prevEnd + 7)`，避免上一句尾音被踩
3. **越界与重叠必须报错**，不能静默通过：
   - 重叠：`c.from + c.dur > next.from`
   - 越界：`c.from + c.dur > total`
4. **顺延上限**：自动顺延后如果这句已经跨出所属镜头的语义范围（比如"中转站告警"那句飘到了终端镜头上），
   **不许顺延，改缩写重合成**。实测两支片各有 2 句走了缩写这条路
5. **相对表达，不写裸帧号**：钉帧表存 `shot.id + offset`，画面时间线一平移，全表自动跟随

## 静音裁剪（必做）

TTS 输出前后带静音，不裁会让"人声比字幕晚半秒"：

```bash
ffmpeg -y -i in.wav -af \
 "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB:detection=peak,areverse,\
silenceremove=start_periods=1:start_silence=0.10:start_threshold=-45dB:detection=peak,areverse" \
 -ar 48000 out.wav
```

尾端阈值给 0.10s（比头端松），避免把句尾的自然收音切掉。

## 产物：vo.json

```json
{ "cues": [ { "from": 1449, "dur": 144, "file": "010.wav", "text": "…", "shot": "s10", "push": 0 } ] }
```

`push` 记录被顺延了多少帧——review 时一眼看出哪几句写长了。

## 工具

```bash
kbsub build --lines vo/narration.txt --wav vo/raw \
            --shots shots.json --out-audio public/vo --out-json src/vo.json
```

一条命令跑完 trim → 量时长 → 钉帧 → 校验 → 写 `vo.json`，并打印每句的落点、时长、顺延量。
**校验不过直接退出码 1**，不要"警告后继续"。只重合成某几句：`kbsub tts --only 8,9`。
