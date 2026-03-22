# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static, zero-dependency **開發日誌（devlog）** viewer with a CRT phosphor-green terminal UI. Deployed on GitHub Pages. No build step, no package manager, no framework.

**Static files only:** `index.html` + `app.js` + `style.css` + `logs/*.txt` + `file-index.json`

## Running Locally

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`（`fetch()` requires HTTP，不支援 `file://`）。

---

@.claude/visual-theme.md
@.claude/architecture.md
@.claude/log-format.md
@.claude/rwd.md
@.claude/typewriter.md
@.claude/static-noise.md
@.claude/deployment.md
@.claude/tech-stack.md
@.claude/workflow.md
@.claude/ai-guidelines.md
