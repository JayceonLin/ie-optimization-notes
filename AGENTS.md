# AGENTS.md — 工工最佳化講義

這份文件是給 AI 程式助理（Codex、Claude Code、Copilot、Cursor 等）與人類協作者的專案規則。**動手修改任何檔案之前，請完整讀完。**

文件中標了 `R1`～`R13` 的規則都會由 `node scripts/check.mjs` 自動檢查，錯誤訊息開頭的 `[R編號]` 就是對應的規則；標了 `W`、`D` 的是寫作與設計規則，需要靠你自己遵守。

---

## 0. 一分鐘摘要

- 這是**純靜態網站**：HTML + CSS + 原生 JavaScript，沒有框架、沒有 build，推到 `main` 後 GitHub Pages 直接上線。
- 課程清單只有一個來源：`data/lessons.js`。首頁目錄、側邊欄、課程標頭、上一課／下一課都由 `assets/js/site.js` 從它產生。
- 講義頁只寫 `<article class="lesson">` 裡的內容，而且段落順序固定：學習目標 → 概念 → 例題 → 重點整理 → 練習題 → 延伸閱讀。
- 新增一課的標準流程：

  ```bash
  node scripts/new-lesson.mjs <slug> "<中文標題>" "<英文標題>"   # 1. 建檔並登記
  # 2. 把新檔案與 data/lessons.js 裡的 TODO 全部換成內容
  node scripts/check.mjs                                          # 3. 必須顯示「全部通過」
  ```

- 只能用第 6 節列出的元件。不要為了一頁的外觀去改 `site.css`，不要寫行內樣式。

---

## 1. 專案目的與讀者

**目的：** 為工業工程（IE）學生做一份作業研究／最佳化的入門講義網站。每一課都要讓讀者「看得懂概念、算得出例題、跑得動程式」。

**讀者：** 大學二、三年級工工系學生。學過微積分與基礎線性代數、會一點 Python，但還沒修過作業研究。

**內容範圍：** 最佳化建模、線性規劃、單形法、整數規劃、排程。之後可以延伸到對偶與敏感度分析、運輸與指派問題、網路最佳化、存貨模型、啟發式演算法等主題。

**這個網站不是：** 部落格、題庫或論文摘要。不要放與作業研究無關的內容，也不要放沒有例題的純理論頁。

---

## 2. 技術架構與限制

| 項目 | 規定 |
| --- | --- |
| 技術 | 純 HTML、CSS、原生 JavaScript（ES5 寫法即可，不用模組） |
| 不可加入 | 任何前端框架、npm 套件、打包工具、CSS 框架 |
| 數學式 | KaTeX，已放在 `assets/vendor/katex/`，不要改成 CDN |
| 字型 | 標題用 Google Fonts 的 Noto Serif TC（唯一允許的外部資源），內文用系統字型 |
| 部署 | GitHub Pages，從 `main` 分支根目錄發布；根目錄的 `.nojekyll` 不能刪 |
| 本機預覽 | 直接用瀏覽器打開 `index.html` 即可（不需要伺服器），或執行 `python -m http.server` |
| 腳本 | `scripts/` 裡的工具只需要 Node.js 18 以上，沒有任何相依套件 |
| 講義程式碼 | Python 3 + PuLP 3.x，安裝指令一律寫 `pip install "pulp<4"`（PuLP 4 改了 API，也不再內建 CBC 求解器） |

為什麼課程清單是 `lessons.js` 而不是 `lessons.json`：用 `<script>` 載入 JS 檔，直接雙擊 HTML 檔也能運作；`fetch()` 讀 JSON 在 `file://` 下會被瀏覽器擋掉。

---

## 3. 目錄結構

```
ie-optimization-notes/
├── AGENTS.md                  ← 本文件：專案規則（給 AI 與協作者）
├── CLAUDE.md                  ← Claude Code 的入口，內容是引用本文件
├── README.md                  ← 給人看的專案介紹
├── index.html                 ← 首頁：主視覺互動圖、課程目錄、流程說明
├── .nojekyll                  ← 讓 GitHub Pages 不經過 Jekyll 處理
├── data/
│   └── lessons.js             ← 課程清單（唯一資料來源）
├── lessons/
│   └── NN-slug.html           ← 每一課一個檔案，只放 HTML
├── templates/
│   └── lesson.html            ← 新課程的模板（new-lesson.mjs 會複製它）
├── assets/
│   ├── css/site.css           ← 全站唯一的樣式表（含色票與深色模式）
│   ├── js/site.js             ← 版面、導覽、數學渲染、元件載入
│   ├── js/widgets/*.js        ← 互動元件，一個元件一個檔案
│   ├── img/favicon.svg        ← 網站圖示
│   ├── img/<課程 id>/          ← 該課的圖片
│   └── vendor/katex/          ← KaTeX（第三方，不要修改）
└── scripts/
    ├── new-lesson.mjs         ← 新增一課
    ├── check.mjs              ← 規則檢查
    └── lib.mjs                ← 兩支腳本共用的函式
```

**誰負責什麼：**

| 想改的東西 | 改哪裡 | 不要改哪裡 |
| --- | --- | --- |
| 課程標題、摘要、難度、閱讀時間、標籤、順序 | `data/lessons.js` | 講義 HTML 裡的標頭（它是自動產生的） |
| 某一課的內容 | `lessons/NN-slug.html` 的 `<article>` | `site.js`、`site.css` |
| 全站外觀、新元件樣式 | `assets/css/site.css`（並更新本文件第 6、8 節） | 個別講義頁 |
| 頂端列、側邊欄、頁尾、網站名稱、repo 網址 | `assets/js/site.js` 最上方的 `SITE` 設定與對應函式 | 各頁面 HTML |

---

## 4. 命名與放置規則

**R1　課程清單格式。** `data/lessons.js` 的格式是 `window.LESSONS = [ ... ];`，陣列內容必須是合法 JSON（雙引號、不能有註解、最後一項後面不加逗號）。每一課剛好有下列 7 個欄位：

| 欄位 | 型別 | 規定 | 範例 |
| --- | --- | --- | --- |
| `id` | 字串 | 見 R2 | `"02-linear-programming"` |
| `title` | 字串 | 中文標題，8 到 14 字為佳，不加「第幾課」 | `"線性規劃與圖解法"` |
| `en` | 字串 | 英文標題，Title Case | `"Linear Programming and the Graphical Method"` |
| `summary` | 字串 | 一句話說明學到什麼，15 到 70 字，句號結尾 | `"用 Wyndor 玻璃公司的例子……"` |
| `level` | 整數 | 1 = 入門、2 = 基礎、3 = 進階 | `1` |
| `minutes` | 整數 | 預估閱讀時間，5 到 60 | `20` |
| `tags` | 字串陣列 | 1 到 5 個，優先沿用既有標籤 | `["線性規劃", "圖解法"]` |

**R2　檔名與編號。**

- 課程 `id` = 兩位數編號 + `-` + slug，例如 `05-scheduling`。slug 只能用小寫英文、數字、連字號，用英文術語命名（`transportation`、`network-flow`），不要用拼音。
- 檔案放在 `lessons/<id>.html`，檔名必須和 `id` 完全相同。
- 編號從 `01` 開始連續，順序必須和 `lessons.js` 陣列順序一致。
- `lessons/` 裡只能放講義 HTML，而且每個檔案都要登記在 `lessons.js`。
- 該課的圖片放在 `assets/img/<id>/`，檔名用小寫英文與連字號，例如 `assets/img/02-linear-programming/feasible-region.png`。

---

## 5. 講義頁的固定骨架

最簡單的做法是永遠從 `templates/lesson.html` 開始（`new-lesson.mjs` 會幫你複製）。完整骨架如下：

```html
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <!-- 照模板，不要增減或調換順序 -->
  <title>第 N 課：中文標題｜工工最佳化講義</title>
  <meta name="description" content="與 lessons.js 的 summary 完全相同">
</head>
<body data-page="lesson" data-lesson="NN-slug">
  <article class="lesson">
    <section id="goals">…學習目標…</section>
    <section id="英文-slug">…概念段，可以有好幾個…</section>
    <section id="example">…例題…</section>
    <section id="英文-slug">…（可選）例題之後的延伸概念…</section>
    <section id="summary">…重點整理…</section>
    <section id="exercises">…練習題…</section>
    <section id="references">…（可選）延伸閱讀…</section>
  </article>
</body>
</html>
```

**R3　`<head>`。** `lang="zh-Hant-TW"`；`<title>` 固定為「第 N 課：標題｜工工最佳化講義」；`<meta name="description">` 與 `summary` 一字不差；CSS 與 JS 的引用和模板相同、順序相同。

**R4　`<body>` 與 `<article>`。** `<body data-page="lesson" data-lesson="<id>">`，裡面只放一個 `<article class="lesson">`。**不要寫** `<h1>`、頂端列、側邊欄、課程標頭、上一課／下一課、頁尾，這些都由 `site.js` 依 `lessons.js` 產生。

**R5　段落骨架。**

1. 第一段一定是 `section#goals`（學習目標）：先寫「讀完這一課，你應該能夠：」，再用 `<ul>` 列 2 到 5 點，每點以動詞開頭、可以被檢驗（「用單形表完成轉軸」，不是「了解單形法」）。
2. 接著是一到數個概念段。每段一個主題，`id` 用英文 slug（`corner-point`、`slack`）。
3. 必須有 `section#example`，放這一課最主要的例題；它要在重點整理之前。
4. `section#summary`（重點整理）用 `<ul class="key-points">`，3 到 6 點。
5. `section#exercises`（練習題）緊接在重點整理之後。
6. 最後可以有 `section#references`（延伸閱讀），之後不能再有其他段落。
7. 每個 `<section>` 只有 `id` 一個屬性，第一個子元素是 `<h2>`。`<h2>` 只能是純文字，不能放數學式或其他標籤（右側「本頁內容」目錄會直接取它的文字）。
8. 段落內需要小標題時用 `<h3>`，不要跳級。

---

## 6. 內容元件

只能使用下列元件。外觀由 `site.css` 定義，HTML 結構必須照抄。

| 元件 | 用途 | HTML |
| --- | --- | --- |
| 定義框 | 正式定義、定理 | `<div class="definition"><p class="box-title">定義：中文術語（English）</p>…</div>` |
| 例題框 | 有完整解答的例題，背景是方格紙 | `<div class="example"><p class="box-title">例題 N-k：情境名稱</p>題目…<div class="solution"><p class="box-title">解</p>…</div></div>` |
| 提示框 | 補充、動手試試 | `<div class="callout tip"><p class="box-title">小提醒</p>…</div>` |
| 警告框 | 常見錯誤、版本陷阱 | `<div class="callout warn"><p class="box-title">常見錯誤</p>…</div>` |
| 模型區塊 | 完整的最佳化模型 | `<div class="model">$$\begin{aligned}…\end{aligned}$$</div>` |
| 步驟清單 | 有先後順序的程序 | `<ol class="steps"><li>…</li></ol>` |
| 重點整理 | 只用在 `section#summary` | `<ul class="key-points"><li>…</li></ul>` |
| 練習題 | 可展開解答 | 見下方 |
| 表格 | 資料表、比較表 | `<div class="table-wrap"><table><caption>表 N-k　說明</caption>…</table></div>` |
| 單形表 | 單形法的表格 | `<table class="tableau">`，進入變數欄加 `class="entering"`，樞紐元素加 `class="pivot"` |
| 螢光筆 | 一段文字裡最關鍵的一句，每段最多一處 | `<mark>…</mark>` |
| 程式碼 | 可執行的程式 | `<pre><code class="language-python">…</code></pre>` |
| 互動元件 | 見第 9 節 | `<figure class="widget" data-widget="名稱">…</figure>` |
| 參考資料 | 只用在 `section#references` | `<ul class="refs"><li>…</li></ul>` |

練習題的固定寫法：

```html
<details class="exercise">
  <summary><span class="ex-no">練習 N-k</span>題目敘述</summary>
  <div class="answer">
    <p class="box-title">解答</p>
    <p>完整解答，含最後的數值與單位。</p>
  </div>
</details>
```

**R6　元件格式與編號。**

- `definition`、`example`、`callout` 的第一個子元素一定是 `<p class="box-title">`。提示框的 class 只能是 `callout tip` 或 `callout warn`。
- 例題、練習、圖、表都用「章號-流水號」：第 N 課的第 k 個例題是「例題 N-k」，練習是「練習 N-k」，圖說是「圖 N-k」，表格標題是「表 N-k」。流水號在同一頁從 1 開始連續。
- `section#example` 裡至少要有一個例題框。練習題至少 2 題（建議 3 題），每題都要有 `<div class="answer">` 與「解答」標題。
- 引用其他課的例題時寫完整編號，例如「例題 2-1」，必要時加連結 `<a href="02-linear-programming.html#example">`。

**R7　不准行內樣式或自訂腳本。** 不能用 `style` 屬性、`<style>`、`onclick` 等行內事件。`<article>` 裡唯一允許的 `<script>` 是互動元件的 `<script type="application/json">`。

**R8　連結與圖片必須有效。** 站內連結用相對路徑，頁內連結 `#id` 必須存在。`<img>` 一定要有描述內容的 `alt`，圖片放在 `assets/img/<課程 id>/`。能用互動元件或 KaTeX 表達的，就不要放截圖。

**R11　程式碼。**

- 一律寫成 `<pre><code class="language-python">…</code></pre>`，程式碼裡的 `<`、`>`、`&` 要寫成 `&lt;`、`&gt;`、`&amp;`（例如 `x1 &lt;= 4`）。
- 第一行註解寫出對應的例題與安裝方式：`# 例題 2-1：Wyndor 玻璃公司（安裝：pip install "pulp<4"）`。
- 程式必須可以單獨執行，變數名稱與講義的數學符號一致，註解用中文。
- 最後用 `# 輸出：` 註解貼上**實際執行**得到的結果。

---

## 7. 寫作規範

**W1　語言與排版。** 繁體中文、台灣用語，全形標點。中文與英文、數字之間加一個半形空格（「第 2 課」「Wyndor 玻璃公司」），全形標點前後不加空格。內文中四位數以上的數字加千分位（「5,000 公克」「12,000 元」）；數學式裡的係數與右手邊不加（`10x_1 + 10x_2 \le 5000`），但單獨寫出的結果要加（`Z^* = 12{,}000`）。

**W2　術語。** 術語第一次出現寫「中文（English）」，之後只用中文。統一用下表的譯名：

| English | 本講義用詞 | 不要用 |
| --- | --- | --- |
| optimization | 最佳化 | 優化 |
| decision variable | 決策變數 | |
| objective function | 目標函數 | 目標函式 |
| constraint | 限制式 | 約束條件 |
| feasible region | 可行解區域 | 可行域 |
| optimal solution | 最佳解 | 最優解 |
| linear programming (LP) | 線性規劃 | |
| simplex method | 單形法 | 單純形法 |
| slack variable | 寬鬆變數 | 鬆弛變數（會和 LP 鬆弛混淆） |
| LP relaxation | LP 鬆弛 | |
| basic / nonbasic variable | 基變數／非基變數 | |
| shadow price | 影子價格 | |
| integer programming (IP) | 整數規劃 | |
| binary variable | 0-1 變數 | 二元變數 |
| branch and bound | 分支界限法 | 分枝定界法 |
| scheduling | 排程 | |
| makespan | 最大完工時間 $C_{\max}$ | 總完工時間（容易和 $\sum C_j$ 混淆） |
| due date | 交期 | 到期日 |
| lateness / tardiness | 延遲／延誤 | |
| heuristic | 啟發式法則 | |

新增譯名時，請把它加到這張表。

**W3　數學符號。** 行內數學用 `$…$`，獨立式子用 `$$…$$`。

| 意思 | 符號 |
| --- | --- |
| 決策變數 | $x_j$（$j = 1, \dots, n$）；向量用粗體 $\mathbf{x}$ |
| 0-1 變數 | $y_j \in \{0, 1\}$ |
| 目標函數值、最佳值 | $Z$、$Z^*$；最佳解 $\mathbf{x}^*$ |
| 目標係數、技術係數、右手邊 | $c_j$、$a_{ij}$、$b_i$ |
| 寬鬆變數 | $s_i$ |
| 大 M | $M$ |
| 排程：處理時間、交期、完工時間 | $p_j$、$d_j$、$C_j$；最大完工時間 $C_{\max}$；延遲 $L_j = C_j - d_j$ |

- 模型一律用 `\begin{aligned} \max \quad & … \\ \text{s.t.} \quad & … \end{aligned}` 排版，最大化／最小化寫 `\max`、`\min`。
- 小於、大於寫 `\le`、`\ge`、`\lt`、`\gt`，不要在 HTML 裡直接打 `<`。
- 數學式裡的中文要包在 `\text{…}` 裡。

**W4　例題。** 題目要把所有數字給齊，讀者不需要猜。解答照「建模 → 求解 → 解釋答案的意思」的順序，一步一步寫，最後一句寫出答案與單位。**所有數值都必須實際驗算**（手算、用 PuLP 跑，或寫小程式列舉），不可以憑感覺寫。優先沿用前面課程的例題（例如 Wyndor、手搖飲店），讓不同方法可以互相對照。

**W5　練習題。** 2 到 4 題，由易到難：先考概念、再考計算、最後考延伸或判斷。解答要完整到讀者能對答案，不能只寫「略」。

**W6　語氣。** 對學生說話，用「你」。先用生活或工廠情境帶出問題，再給定義。每段只講一件事，句子短。不用 emoji，不寫「讓我們一起探索」「總而言之」這類空話，不用驚嘆號。

**W7　參考資料。** 只列確實存在的書籍、論文或官方文件，格式為「作者, 書名（`<cite>`）, 出版社, 章節」。不知道確切章節就不寫章節，絕對不要捏造。

---

## 8. 視覺風格

**設計概念：「工程方格紙」。** 像工工學生在方格紙上解題：紙張底色、藍黑墨水字、紅筆圈最佳解、螢光筆畫重點；深色模式是「藍圖」。

**D1　色票。** 所有顏色都是 `site.css` 裡 `:root` 的 CSS 變數：

| 變數 | 淺色 | 用途 |
| --- | --- | --- |
| `--paper` | `#fbfcfd` | 背景 |
| `--paper-2` | `#f1f5f8` | 定義框、程式碼、面板 |
| `--grid`、`--grid-strong` | `#e1ecf2`、`#c4d8e4` | 方格紙格線、框線 |
| `--ink` | `#1b2a41` | 主文字、標題 |
| `--ink-soft`、`--ink-faint` | `#4f5f76`、`#7f8ea2` | 次要文字、刻度 |
| `--rule` | `#d6dee7` | 分隔線 |
| `--blue` | `#1f5fad` | 連結、定義框、提示框 |
| `--red` | `#b5382c` | **只用在**最佳解、課次編號、警告框 |
| `--teal` | `#2a8270` | 可行解區域、重點整理的勾勾 |
| `--mark` | `#ffe98a` | 螢光筆 |
| `--job-1`～`--job-6` | 淡色系 | 甘特圖等類別資料 |

**R13　顏色只能用變數。** `site.css` 中 `:root` 以外不能出現色碼；互動元件不能寫死顏色，一律用 `w-` 開頭的 class。真的需要新顏色時，同時加在淺色 `:root` 與深色模式的 `:root`，並登記在上表。

**D2　字體。** 標題（`h1`～`h3`、框標題、課次編號）用 `--font-serif`（Noto Serif TC），內文用 `--font-sans`，程式碼用 `--font-mono`。英文副標用斜體襯線。不要再加新字型。

**D3　版面。** 講義頁是「左側課程列表／中間內文（最寬 43rem）／右側本頁目錄」三欄，1180px 以下隱藏右欄，860px 以下左欄收成「課程列表」按鈕。內文一律靠左對齊，不要置中、不要左右對齊。

**D4　克制。** 每一頁最醒目的只能是互動圖或例題。不要加入場動畫、漸層、陰影、圖示字型或裝飾性插圖；不要把每段內容都包成框框；`<mark>` 每段最多一處。

---

## 9. 互動元件（widgets）

互動元件是讓讀者「動手」的地方，也是這個網站最有特色的部分。

**使用方式：**

```html
<figure class="widget" data-widget="lp-graph">
  <script type="application/json">
    { "objective": [3, 5], "constraints": [ { "a": [1, 0], "b": 4, "label": "x₁ ≤ 4" } ], "xmax": 7, "ymax": 10 }
  </script>
  <figcaption>圖 N-k　說明這張圖在看什麼，以及讀者可以怎麼操作。</figcaption>
</figure>
```

**現有元件：**

| 名稱 | 檔案 | 用途 | 設定說明 |
| --- | --- | --- | --- |
| `lp-graph` | `assets/js/widgets/lp-graph.js` | 兩變數 LP 圖解法，可用滑桿改目標係數 | 見檔案開頭註解 |
| `gantt` | `assets/js/widgets/gantt.js` | 排程甘特圖，可切換不同工件順序比較績效 | 見檔案開頭註解 |

**R9　元件規則。**

- `data-widget` 只能放在 `<figure class="widget">` 上，名稱對應 `assets/js/widgets/<名稱>.js`。
- 設定寫在 `<script type="application/json">` 裡，必須是合法 JSON。
- 每個元件都要有 `<figcaption>`，用「圖 N-k」編號，並告訴讀者可以怎麼操作、應該觀察什麼。
- 元件檔案必須註冊 `window.OptWidgets["<名稱>"] = function (body, config, figure) { … }`：`body` 是 `site.js` 幫你建好的容器，把畫面放進去即可。
- 元件要能用鍵盤操作（原生 `<input>`、`<button>`），SVG 要有 `role="img"` 與 `aria-label`，會變動的結果文字要放在 `aria-live="polite"` 的元素裡。

---

## 10. 標準作業流程

### 10.1 新增一課（最常見）

使用者說「新增一課講運輸問題」時，照下面做：

1. 讀 `data/lessons.js`，確認主題沒有重複，並想好這一課要接在哪一課後面、會沿用哪個舊例題。
2. 執行：

   ```bash
   node scripts/new-lesson.mjs transportation "運輸問題" "The Transportation Problem" --level 2 --minutes 20
   ```

   它會建立 `lessons/06-transportation.html`，並在 `lessons.js` 最後加一筆（summary 是 TODO、tags 是空的）。
3. 在 `lessons.js` 填好 `summary` 與 `tags`；把講義檔 `<meta name="description">` 改成同一句話。
4. 依第 5～7 節，把講義檔裡的每個 TODO 換成內容。概念段的數量與 `id` 自己決定，其餘骨架不要動。
5. 驗算例題與練習題的每個數字（W4）；有程式就實際執行，把結果貼進 `# 輸出：`。
6. 執行 `node scripts/check.mjs`，依照錯誤訊息的規則編號修正，直到顯示「✓ 全部通過」。
7. 用瀏覽器打開頁面確認：數學式有渲染、互動元件會動、手機寬度（390px）不會破版、深色模式看得清楚。
8. 依第 13 節的格式 commit。

### 10.2 修改既有課程

- 只改 `<article>` 裡需要改的地方，不要順手改寫其他段落的風格。
- 改了例題的數字，就要一起檢查：同一頁的解答、練習題、程式的 `# 輸出：`，以及其他課引用這個例題的地方（用 `grep -rn "例題 2-1" lessons/` 找）。
- 改了標題或摘要，要同時改 `lessons.js` 與講義檔的 `<title>`、`<meta name="description">`。

### 10.3 在中間插入、刪除或調換課程

預設只在最後新增。除非使用者明確要求，否則不要插入中間，因為後面每一課都要重新編號。真的要做時：

1. 用 `git mv` 把受影響的檔案依序改名（例如 `05-scheduling.html` → `06-scheduling.html`），並更新 `lessons.js` 的 `id` 與順序。
2. 在每個受影響的檔案裡更新：`data-lesson`、`<title>` 的課次、所有「例題 N-k」「練習 N-k」「圖 N-k」「表 N-k」的章號，以及其他課指向它的連結。
3. 執行 `node scripts/check.mjs`，它會抓出所有沒改到的編號與壞掉的連結。

### 10.4 新增互動元件

1. 先確認現有元件真的做不到。能用 `lp-graph`、`gantt` 換設定解決的，就不要寫新的。
2. 新增 `assets/js/widgets/<名稱>.js`，開頭用註解寫清楚用途與完整的設定格式（照 `lp-graph.js` 的寫法），並註冊 `window.OptWidgets["<名稱>"]`。
3. 需要的樣式加到 `site.css` 的「互動元件」區塊，class 用 `w-` 開頭，顏色只用變數（R13）。
4. 在本文件第 9 節的「現有元件」表格登記。

### 10.5 修改全站外觀或新增元件樣式

先問自己：這個需求是不是所有頁面都需要？只有一頁需要的，就用既有元件表達。確定要改時，改 `site.css`，並同步更新本文件第 6 節（元件）或第 8 節（色票、字體），讓規則和程式碼保持一致。

### 10.6 規則與使用者要求衝突時

使用者明確的要求優先。如果那是長期的改變（例如「之後都改用 SciPy」），請在同一次修改中更新本文件與 `check.mjs`，不要讓規則和實際做法不一致。

---

## 11. 完成前檢查清單

- [ ] `node scripts/check.mjs` 顯示「✓ 全部通過」
- [ ] 例題、練習、程式輸出的每個數字都驗算過
- [ ] 術語與 W2 的譯名表一致，數學符號與 W3 一致
- [ ] 桌面與手機寬度都看過，數學式與互動元件正常
- [ ] 深色模式下文字、圖表都看得清楚
- [ ] 沒有改到與這次任務無關的檔案

---

## 12. 禁止事項

- 不要加入框架、套件、打包工具，或把 KaTeX 改成 CDN。
- 不要在講義頁寫 `<h1>`、導覽列、頁尾，或手動寫上一課／下一課。
- 不要寫行內樣式、`<style>`、行內事件，或在 `:root` 以外寫色碼。
- 不要修改 `assets/vendor/` 裡的第三方檔案。
- 不要捏造參考資料、數據或程式輸出。
- 不要刪除 `.nojekyll`，不要改變 `data/lessons.js` 的 `window.LESSONS = [...]` 格式。
- 不要在使用者沒要求時重新編號、重寫整頁或大改風格。

---

## 13. Git 與部署

- commit 訊息格式：`類型(範圍): 說明`，說明用中文。
  - `feat(lesson-06): 新增運輸問題`
  - `fix(lesson-03): 修正表 3-2 的比值`
  - `feat(widget): 新增 network-graph 元件`
  - `style: 調整手機版表格間距`
  - `docs(agents): 補充 W2 譯名表`
- 推到 `main` 後，GitHub Pages 約一分鐘內自動更新：<https://jayceonlin.github.io/ie-optimization-notes/>
