## Log File Format

檔案放在 `logs/`，命名為 `YYYYMMDD.txt`。解析器在 `app.js:parseLines()` 中：

| 語法 | 渲染結果 |
|------|---------|
| `# Title` | `<h1>`（磷光綠，`.log-h1`） |
| `## Section` | `<h2>`（cyan，`.log-h2`） |
| `- item` | `<li>` in `<ul>` |
| `[HH:MM] text` | `<p>` with yellow timestamp span |
| plain text | `<p>` |
| blank line | skipped |

## Adding a New Log Entry

1. 建立 `logs/YYYYMMDD.txt`，依上表格式撰寫
2. 本地預覽：手動更新 `file-index.json`；推送至 `main` 後 GitHub Action 自動重新產生

## Log Templates

`templates/` 提供六種寫作風格樣板，複製後改名為 `YYYYMMDD.txt` 使用：

| 檔名 | 風格 | 適用場景 |
|------|------|---------|
| `A_worklog.txt` | 時間軸流水帳 | 按部就班的工作日 |
| `B_technote.txt` | 技術筆記 | 深入解決一個問題 |
| `C_sprint.txt` | 衝刺速記 | 靈感爆發、快速推進 |
| `D_reflection.txt` | 反思日記 | 心情複雜、需要整理思緒 |
| `E_minimal.txt` | 極簡清單 | 懶得打字、只記 bullet |
| `F_cyberpunk.txt` | 賽博龐克終端機 | 想用機器人口吻記錄、風格強烈 |

**F_cyberpunk 慣例：** 標題用 `SYSTEM_LOG :: NODE-DD :: YYYY.MM.DD`；區塊用 `BOOT SEQUENCE / PROCESS LOG / SELF-DIAGNOSTIC / NEXT_TASK_QUEUE`；時間戳記可用 `[HH:MM:SS]`（解析器以 `[HH:MM]` 前綴匹配，秒數部分保留為 plain text）。
