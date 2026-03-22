## Typewriter Effect

開啟日誌時文字逐字顯示，模擬 CRT 終端機列印輸出。

### 行為

- 每個 block 以 `CHAR_DELAY = 20ms/字元` 逐字輸出（`typeText()`）
- 每個 block 結束後顯示閃爍游標（`.tw-cursor`），暫停後繼續（`pauseWithCursor()`）
- **點擊內容區** → 切換至 **Turbo 模式**：速度加快至 `CHAR_DELAY_TURBO = 2ms/字元`，段落暫停縮短為 `PAUSE_TURBO = 80ms`；打字機效果仍在（非瞬間顯示）
- **切換日誌** → 舊動畫立即中止，不汙染 DOM（generation token 機制）；新動畫從正常速度重新開始（turbo 不跨 session 殘留）

### 暫停時間

| Block | 正常 | Turbo |
|-------|------|-------|
| `h1` | 2000ms | 80ms |
| `h2` | 1000ms | 80ms |
| `p` / timestamp | 600ms | 80ms |
| `ul`（最後一個 li 後） | 600ms | 80ms |

> 調整速度只需改 `app.js` 頂部的 `CHAR_DELAY`、`CHAR_DELAY_TURBO`、`PAUSE_H1/H2/P/LI`、`PAUSE_TURBO` 常數。

### 關鍵函式（`app.js`）

- `typewriteNodes(nodes, logBody, generation)` — 主流程；管理 `turbo` flag、`isStale()` 檢查；`getDelay()` / `getTurbo()` 閉包傳入子函式
- `typeText(el, plainText, isStale, getDelay)` — 逐字用 `textContent` 輸出，動態取得當前 delay；結束後 `innerHTML = inlineFormat()`
- `pauseWithCursor(el, ms, isStale, getTurbo)` — 附加 `.tw-cursor` span，每 50ms 輪詢；turbo 啟動後最多再等 50ms 即提早結束

### 游標樣式（`style.css`）

`.tw-cursor`：磷光綠實心方塊，復用 `@keyframes blink`（0.7s step-end）
