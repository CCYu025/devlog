## Visual Theme

CRT 綠磷光管風格。所有色彩變數集中在 `style.css :root`，修改顏色只需改變數。

| 元素 | 說明 |
|------|------|
| 主色 | `#00ff41`，黑底，模擬 VT100 終端機 |
| **Scanlines** | `#content::after` 用 `repeating-linear-gradient` 疊加，`z-index: 100` |
| **Vignette** | `#log-body::before` 用 `radial-gradient`；`position: absolute`（相對 `#log-body`），`z-index: -1`；`#log-body` 設 `isolation: isolate` 確保 stacking context 隔離正確 |
| **Flicker + H-Sync Jitter** | `#content` 套用 `crt-noise` 動畫（8s 循環）；~94% 處加入 ±1px `translateX` 模擬水平同步失鎖 |
| **Beam Sweep** | `#content::before` 每 6s 掃一次；140px 半透明磷光橫帶從頂到底（`z-index: 90`）；`::after` 已給 scanlines 佔用 |
| **Static Noise** | 見 `static-noise.md` |
| **Phosphor glow** | `text-shadow` 套用於 `#log-body`、`#breadcrumb`、`#status-bar`、`.log-h1/h2`、`.log-timestamp` |

### z-index 全局層級（`#content` stacking context 內）

```
#content::after  (scanlines)         z: 100
canvas #static-overlay               z: 95
#content::before (crt-beam)          z: 90
#log-body (isolation:isolate 整體)   z: auto
  └ text content                     z: auto
  └ #log-body::before (vignette)     z: -1  （在 #log-body stacking ctx）
```
