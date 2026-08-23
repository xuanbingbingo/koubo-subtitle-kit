# tools

| 工具 | 用途 |
|---|---|
| `beat.py` | 测 BPM / 相位 / 网格瞬态覆盖率（numpy 手写梳状拟合，不需要 librosa）。卡点片才用 |

钉帧、校验、自检都在 CLI 里：`kbsub build` / `kbsub verify`。

```bash
python3 tools/beat.py path/to/bgm.mp3
# → {"bpm":122.0,"phase_s":0.0205,"coverage":0.93,"beat_frames@30fps":14.754,...}
```
