# 多音字闸门（合成前必过）

## 为什么要有这一层

配音管线不止一条（hf-video / wvp / remotion-video / 本 kit …），过去每条各自维护一份"多音字注意事项"，
结果是**四份规则各自漂移，新管线天然漏**，而漏掉的代价是**整片重渲**。
所以规则不再靠记性，做成**一份词典 + 一道可执行闸门**：

```
polyphones.json（唯一真相源） → kbsub lint（闸门，退出码 1 拦住） → kbsub tts（合成前自动先跑）
```

## 三类判定

| verdict | 含义 | 处理 |
|---|---|---|
| `auto_safe` | 上下文能确定读对 | 只提示，放行 |
| `auto_fix` | 已知会读错且有确定解法 | `--fix` 自动处理 |
| `needs_review` | **要靠语义判断** | 必须人/模型定夺；不处理就退出码 1 |

`needs_review` 是刻意设计的：程序判不了"长出"到底该 zhǎng 还是 cháng，
**判定交给读稿的人或模型**，判得了就保留原词，判不了就换成词典给的同义词。

## 🔴 双轨：改音不改字

有些字换成同音字就能修（`塞 → 腮`，腮只有 sāi 一个读音），但**这种替换只能作用于合成文本**——
字幕里出现"腮进去"就穿帮了。所以 `--fix` 产出两份稿子：

| 文件 | 用途 |
|---|---|
| `vo/narration.txt` | **字幕**用（只做同义词替换，人能读通） |
| `vo/narration.speech.txt` | **合成**用（额外做读音映射） |

`kbsub tts` 有 `.speech.txt` 就优先用它合成，`kbsub build` 写进 `vo.json` 的文本仍取自
`narration.txt`——所以字幕永远是给人看的那份。闸门也检查"真正会被念出来的那份"。

## 扩词典

编辑 `polyphones.json`，一条规则长这样：

```json
{
  "id": "yi-hang", "char": "行",
  "pattern": "一行(?![\\u4e00-\\u9fa5])",
  "readings": { "correct": "háng（一行代码）", "wrong": "xíng" },
  "verdict": "auto_fix",
  "engines": ["hfvoice", "edge", "sami"],
  "why": "后面紧跟汉字才念对；后面是标点/英文/句尾时念成 xíng",
  "replace": ["一句", "一条", "一段"],
  "speechMap": { "塞": "腮" }
}
```

- `engines` 留空＝对所有引擎生效；本地克隆音（voxvoice）多音字表现好，多数规则对它豁免
- **每次踩到新的读错，第一件事是往这里加一条**，而不是在某个 skill 的文档里写一句提醒

## 用在别的配音管线上

闸门只吃纯文本，和引擎无关：

```bash
kbsub lint --lines 任意稿子.txt --engine edge [--fix]
```

hf-video / wvp / remotion-video 出稿后、合成前跑一次即可，不需要各自再实现一遍。
