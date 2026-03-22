## 部署至 GitHub Pages

Remote：`https://github.com/CCYu025/devlog.git`

### 初次部署（一次性設定）

```bash
git init
git add .
git commit -m "init: initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

推送後在 GitHub repo 操作：
**Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**

數分鐘後可訪問 `https://<user>.github.io/<repo>/`。

### 日常推送流程

當使用者說「推送 github」時，依序執行：

```bash
git add -A
git commit -m "<自動根據變更內容產生的 commit message>"
git pull --rebase origin main
git push
```

> **注意**：每次 push `logs/` 異動時，`generate-index.yml` 會自動 commit 一次 `file-index.json`（`[skip ci]`）。若下次 push 前未先 pull，會因 remote 超前而被拒絕。標準處理：`git pull --rebase origin main` 再 push。
