# 音色

## 默认：清爽男声（不问，直接用）

```bash
hfvoice "这一句话" out.wav -v 清爽
```

- 引擎 SAMI（剪映内部接口），音色 id `zh_male_iclvop_huaxuekepu`，48kHz wav
- 是**出片默认音色**（用户 2026-07-29 A/B 试听后拍板），语速比微软云扬快约 8%
- 英文白名单音色：Claude / Agent / prompt / MCP / token / API / code 七词实测全准
- 🔴 SAMI 是非官方接口，可能失效。**连续失败时退回 edge 的「微软云扬」并主动告知用户**，
  不要默默换声——同一支片前后音色不一致比换声更糟
- 🔴 必须带 `-v`：`hfvoice` 的缺省音色指向已丢失的 Kokoro 模型，不带参数直接报错

## 第二选择：斌哥克隆音（用户点名"我的音色"时）

```bash
voxvoice -f vo/narration.txt -d vo/wav/ --fast
```

- VoxCPM2 本地零样本克隆，音色 `binge`，48kHz；长稿必须 `--fast`（快 4 倍，相似度 -0.025）
- 批量模式一次加载模型，16 句约 5 分钟
- **不改任何默认**：只有用户说"我的音色 / 用我的声音 / 克隆我的声音"才走这条

## 两条音轨可以共存

同一份稿子合成两套，钉帧表各算各的（语速不同，时长不同），
渲染时用同一个 `vo` inputProp 切换：`'none' | 'qs' | 'binge'`。
实测同一稿清爽男声比克隆音短约 8%，所以**钉帧表必须分开生成，不能共用**。

## 批量合成模板（清爽男声）

```bash
i=0
while IFS= read -r line; do
  i=$((i+1)); n=$(printf "%03d" $i)
  env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY \
    hfvoice "$line" "vo/qs/$n.wav" -v 清爽 || echo "FAIL $n"
done < vo/narration.txt
```

🔴 `env -u ...` 不能省：本机代理会让 edge 分支必挂，SAMI 也可能被拦。
