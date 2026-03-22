## RWD 適配

### Breakpoints

| 範圍 | sidebar | resize handle | menu toggle |
|------|---------|--------------|------------|
| > 900px | 260px，固定 | 滑鼠拖曳 | 隱藏 |
| 601–900px | 200px，固定 | 滑鼠 + 觸控 | 隱藏 |
| ≤ 600px | 隱藏，overlay 240px | 隱藏 | 顯示 |

### Mobile Overlay Sidebar（≤600px）

- `#app` grid 縮為 `0 0 1fr`，sidebar 從 layout 移除；**必須**同時設 `#content { grid-column: 3 }`，否則 `#content` 會自動排入第 1 欄（寬度 0）導致不可見
- `#app` height 使用 `100dvh`（非 `100vh`），避免 iOS Safari URL bar 造成高度誤差
- `#sidebar` 改為 `position: absolute`，預設 `translateX(-100%)` 隱藏於左側
- `#menu-toggle` 顯示於 `#breadcrumb` 最左側，點擊切換 sidebar `.open` class
- `#sidebar-backdrop`（`z-index: 199`）點擊後關閉 sidebar
- `#sidebar`（`z-index: 200`）疊於 backdrop 之上
- 選擇日誌後 `loadFile()` 自動呼叫 `closeSidebar()`（桌面版無副作用）

### iframe 嵌入

無需額外設定；iframe 寬度 ≤ 600px 時自動套用手機 layout。
