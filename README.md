# DevLog

一個靜態、零依賴的開發日誌閱讀器，CRT 磷光綠終端機風格。部署於 GitHub Pages。

**Live demo：** https://ccyu025.github.io/devlog/

---

## 特色

- **零依賴**：純 HTML + CSS + JavaScript，無 npm、無框架、無 bundler
- **CRT 視覺效果**：Scanlines、Vignette、Beam Sweep、H-Sync Jitter、Phosphor Glow
- **打字機效果**：文字逐字輸出，模擬終端機列印；點擊可切換 Turbo 模式
- **換台雜訊**：切換日誌時 Canvas 疊加磷光綠靜態畫面，模擬映像管換台
- **RWD 適配**：桌機固定側欄 / 平板觸控拖曳 / 手機 Overlay 側欄
- **自動索引**：推送新日誌後，GitHub Actions 自動重建 `file-index.json`

---

## 本地執行

需要 HTTP server（`fetch()` 在 `file://` 下無法運作）：

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

開啟 `http://localhost:8080`。

---

## 新增日誌

1. 在 `logs/` 建立 `YYYYMMDD.txt`，格式如下：

   ```
   # 標題

   ## 段落

   [09:30] 帶時間戳的段落文字

   - 清單項目
   ```

2. 推送至 `main` branch → GitHub Actions 自動更新 `file-index.json`

本地預覽時需手動更新 `file-index.json`：

```json
{"files": ["20260307.txt", "20260305.txt"], "generated": "2026-03-07T00:00:00Z"}
```

### 日誌格式

| 語法 | 渲染結果 |
|---|---|
| `# Title` | `<h1>`（磷光綠） |
| `## Section` | `<h2>`（青色） |
| `[HH:MM] text` | 帶黃色時間戳的段落 |
| `- item` | 清單項目 |
| 一般文字 | 段落 |
| 空行 | 跳過 |

### 模板

`templates/` 目錄提供五種預設模板：

| 檔案 | 用途 |
|---|---|
| `A_worklog.txt` | 時間軸流水帳 |
| `B_technote.txt` | 技術筆記 |
| `C_sprint.txt` | 衝刺速記 |
| `D_reflection.txt` | 反思日記 |
| `E_minimal.txt` | 極簡清單 |

複製至 `logs/YYYYMMDD.txt` 後填入內容即可。

---

## 專案結構

```
├── index.html              # 進入點
├── app.js                  # 資料抓取、解析、渲染、動畫邏輯
├── style.css               # CRT 視覺效果、RWD 樣式
├── file-index.json         # 日誌檔案清單（由 Actions 自動維護）
├── logs/                   # 日誌檔案（YYYYMMDD.txt）
├── templates/              # 寫作模板參考
└── .github/workflows/
    └── generate-index.yml  # 自動重建 file-index.json
```

---

## 部署至 GitHub Pages

1. 推送至 `main` branch
2. 前往 repo **Settings → Pages**
3. Source 選 `Deploy from a branch`，Branch 選 `main`，資料夾選 `/ (root)`
4. 儲存後數分鐘即可訪問

---

## 技術細節

### z-index 層級

```
#content::after  (scanlines)    z: 100
canvas #static-overlay          z: 95
#content::before (crt-beam)     z: 90
#log-body::before (vignette)    z: 50
```

### 打字機速度常數（`app.js` 頂部）

| 常數 | 預設值 | 說明 |
|---|---|---|
| `CHAR_DELAY` | 20ms | 正常模式字元間距 |
| `CHAR_DELAY_TURBO` | 2ms | Turbo 模式字元間距 |
| `PAUSE_H1` | 2000ms | h1 後暫停 |
| `PAUSE_H2` | 1000ms | h2 後暫停 |
| `PAUSE_P` | 600ms | 段落後暫停 |

### RWD Breakpoints

| 範圍 | 行為 |
|---|---|
| > 900px | 側欄 260px，固定 |
| 601–900px | 側欄 200px，支援觸控拖曳 |
| ≤ 600px | 側欄收為 Overlay，顯示 \[MENU\] 按鈕 |
