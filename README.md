# 工工最佳化講義

給工業工程學生的作業研究入門講義網站：從最佳化建模、線性規劃、單形法、整數規劃一路到機器排程。每一課都有算完的例題、可以動手操作的互動圖，以及能直接執行的 Python（PuLP）程式。

- 網站：<https://jayceonlin.github.io/ie-optimization-notes/>
- 專案規則（給 AI 與協作者）：[AGENTS.md](AGENTS.md)

這是「生成式 AI」課程作業九的成果。作業的重點不是做出一個網頁，而是設計一套規則，讓 AI 之後可以照同一套方式持續新增頁面。

## 目前的課程

| 課 | 主題 | 重點 |
| --- | --- | --- |
| 1 | 最佳化問題是什麼？ | 決策變數、目標函數、限制式與建模四步驟 |
| 2 | 線性規劃與圖解法 | Wyndor 例題、角點定理、互動圖解法、PuLP |
| 3 | 單形法 | 寬鬆變數、單形表、影子價格 |
| 4 | 整數規劃 | 四捨五入的陷阱、0-1 變數建模、分支界限法 |
| 5 | 機器排程 | SPT、EDD、Johnson 法則與互動甘特圖 |

## 這套規則怎麼運作

```
AGENTS.md（規則）
   │  AI 先讀規則：目的、骨架、命名、元件、用詞、色票
   ▼
node scripts/new-lesson.mjs   ← 從模板建立新課程，並登記到 data/lessons.js
   │  AI 把 TODO 換成內容
   ▼
node scripts/check.mjs        ← 逐條檢查 R1～R13，錯誤訊息標出規則編號
   │  全部通過
   ▼
git push → GitHub Pages 自動上線
```

- `data/lessons.js` 是唯一的課程清單，首頁目錄、側邊欄、上一課／下一課都由它自動產生，新增一課不用改任何其他頁面。
- 講義頁只寫內容，版面由 `assets/js/site.js` 統一產生，所以每一課的外觀與結構都一致。
- 規則寫得夠具體，才能被 `check.mjs` 自動檢查；AI 看到 `[R5]` 這類錯誤訊息，就能回到 AGENTS.md 找到對應規則自行修正。

## 在本機預覽

直接用瀏覽器打開 `index.html` 即可，不需要安裝任何東西。也可以啟動一個本機伺服器：

```bash
python -m http.server 8000
# 打開 http://localhost:8000
```

## 新增一課

```bash
node scripts/new-lesson.mjs transportation "運輸問題" "The Transportation Problem" --level 2 --minutes 20
# 填完 lessons/06-transportation.html 與 data/lessons.js 裡的 TODO
node scripts/check.mjs
```

詳細步驟見 [AGENTS.md 第 10 節](AGENTS.md#10-標準作業流程)。

## 執行講義裡的程式

```bash
pip install "pulp<4"
```

PuLP 4 改了 API 也不再內建 CBC 求解器，講義的程式以 3.x 版為準。

## 第三方資源

- [KaTeX](https://katex.org/)（MIT License），放在 `assets/vendor/katex/`
- 標題字型 [Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC)（SIL Open Font License）
