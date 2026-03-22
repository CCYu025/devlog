## Architecture

**Static files only:** `index.html` + `app.js` + `style.css` + `logs/*.txt` + `file-index.json`

**Data flow:**
1. `app.js` 於頁面載入時立即啟動 static noise，同步 fetch `file-index.json`
2. index 取得後呼叫 `loadFile()`，沿用已啟動的 noise promise
3. User selects a log → `loadFile()` fetches `./logs/<filename>` 並解析
4. Parsed nodes 透過 typewriter 效果渲染至 `#log-body`

**`file-index.json`** 由 `.github/workflows/generate-index.yml` 在每次 push 觸碰 `logs/` 時自動重新產生，不應手動編輯。

### Key Implementation Details

- **URL navigation:** Hash-based（`#YYYYMMDD`），`history.pushState` 支援前進 / 後退
- **Sidebar resize:** `#resize-handle` 拖曳更新 `#app` grid columns（160px–480px 範圍），支援滑鼠與觸控
- **XSS safety:** 所有使用者可見文字均經 `escapeHTML()` 處理後才渲染；inline formatting 在 escaping 後才套用
- **`inlineFormat()`** 只包裝 `[HH:MM]` timestamp，不實作完整 Markdown

### 關鍵函式（`app.js`）

| 函式 | 說明 |
|------|------|
| `init()` | DOMContentLoaded 觸發；立即清空 `#log-body`、啟動 static noise，再 fetch index（並行） |
| `loadFile(filename, addToHistory, existingStaticPromise?)` | 清空 log-body → 沿用或建立 noise → fetch log → typewriter |
| `fetchIndex()` | fetch `file-index.json` |
| `parseLines(raw)` | 解析 `.txt` 日誌為 node 陣列 |
| `escapeHTML(str)` | XSS 防護 |
| `inlineFormat(str)` | 只處理 `[HH:MM]` timestamp span |
