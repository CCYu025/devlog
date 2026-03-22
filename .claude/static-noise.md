## Static Noise（換台效果）

疊加磷光綠雜訊動畫，模擬映像管電視換台的無訊號畫面。

### 觸發時機

- **頁面初次載入**：`init()` 在 `fetchIndex()` 之前立即啟動 noise，確保雜訊是第一個可見畫面（修復 `#welcome` div 閃現問題）
- **切換日誌**：`loadFile()` 自行建立新的 noise

### 行為

- 清空 `#log-body`（`innerHTML = ''`）→ Canvas overlay 淡入（100ms）蓋在 `#content` 上
- RAF 逐幀繪製隨機磷光綠像素（58% 密度，G 通道 25–255，微量 B，半透明）
- 持續 900ms → 淡出（200ms）→ canvas 從 DOM 移除
- `fetch` 與雜訊**並行**執行；靜態結束後才啟動打字機
- 切換期間再次切換 → `isStale()` 立即取消並移除 canvas

### 時間常數（`app.js` 頂部）

| 常數 | 值 | 說明 |
|------|----|------|
| `STATIC_FADE_IN` | 100ms | 淡入 |
| `STATIC_HOLD` | 900ms | 持續顯示 |
| `STATIC_FADE_OUT` | 200ms | 淡出 |

### 關鍵函式（`app.js`）

- `showStaticNoise(contentEl, isStale)` — 建立 canvas、RAF 繪製、fade in/out；`isStale()` 為真時立即清理
- `init()` — 頁面載入後立即呼叫 `showStaticNoise()`，並將 promise 傳給 `loadFile()`
- `loadFile(filename, addToHistory, existingStaticPromise?)` — 接受外部傳入的 noise promise（初次載入）或自行建立（後續切換）

### 初次載入流程（`init()` → `loadFile()`）

```
DOMContentLoaded
  └─ init()
       ├─ log-body.innerHTML = ''   // 清除 #welcome
       ├─ showStaticNoise()         // 雜訊立即開始
       ├─ fetchIndex()              // 與雜訊並行
       └─ loadFile(..., initStaticPromise)
            ├─ 沿用 initStaticPromise（不重複建立 canvas）
            ├─ fetch log file       // 與雜訊並行
            ├─ await staticPromise  // 等雜訊結束
            └─ typewriteNodes()
```

### Generation Counter 注意事項

`loadFile()` 內的 `_twGeneration++` 會使 `init()` 建立的 noise 在 1000ms 的 `isStale()` 檢查時提早結束（跳過 200ms fade-out）。正常使用下差異極小；快速切換日誌時，cancel 舊 noise 是預期行為。
