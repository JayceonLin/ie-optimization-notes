# CLAUDE.md

本專案的完整規則寫在 AGENTS.md，所有 AI 助理共用同一份規則。Claude Code 會透過下一行自動載入它：

@AGENTS.md

## 給 Claude Code 的補充

- 開始任何修改前，先確認自己已讀過上面的 AGENTS.md，特別是第 0 節摘要與第 10 節作業流程。
- 新增課程一律先執行 `node scripts/new-lesson.mjs`，不要手動複製檔案。
- 每次修改講義、樣式或元件之後，都要執行 `node scripts/check.mjs`，在回報完成前貼出它的結果。
- 講義裡的 Python 程式要用 `pip install "pulp<4"` 的環境實際執行過，再把輸出貼進 `# 輸出：` 註解。
- 完成後依 AGENTS.md 第 10.1 節第 9 步與第 13 節的格式 commit；push 會讓網站立刻上線，push 前先向使用者確認（使用者已明確要求上線時除外）。
