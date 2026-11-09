// 課程清單：全站唯一的資料來源（首頁目錄、側邊欄、上一課／下一課都從這裡產生）。
// 規則見 AGENTS.md 第 4 節。陣列內容必須是「合法 JSON」：雙引號、不能有註解、最後一項後面不加逗號。
// scripts/new-lesson.mjs 會自動在陣列最後加一筆，scripts/check.mjs 會驗證格式。
window.LESSONS = [
  {
    "id": "01-what-is-optimization",
    "title": "最佳化問題是什麼？",
    "en": "What Is Optimization?",
    "summary": "認識決策變數、目標函數與限制式，把一段文字敘述寫成可以求解的最佳化模型。",
    "level": 1,
    "minutes": 15,
    "tags": ["建模", "基本概念"]
  },
  {
    "id": "02-linear-programming",
    "title": "線性規劃與圖解法",
    "en": "Linear Programming and the Graphical Method",
    "summary": "用 Wyndor 玻璃公司的例子畫出可行解區域，看懂為什麼最佳解一定落在頂點上。",
    "level": 1,
    "minutes": 20,
    "tags": ["線性規劃", "圖解法", "PuLP"]
  },
  {
    "id": "03-simplex-method",
    "title": "單形法",
    "en": "The Simplex Method",
    "summary": "加上寬鬆變數、建立單形表，一步一步從原點走到最佳頂點。",
    "level": 2,
    "minutes": 25,
    "tags": ["線性規劃", "演算法"]
  },
  {
    "id": "04-integer-programming",
    "title": "整數規劃",
    "en": "Integer Programming",
    "summary": "四捨五入為什麼會失敗？學會 0-1 變數的建模技巧與分支界限法的基本想法。",
    "level": 2,
    "minutes": 25,
    "tags": ["整數規劃", "0-1 變數", "分支界限法", "PuLP"]
  },
  {
    "id": "05-scheduling",
    "title": "機器排程",
    "en": "Machine Scheduling",
    "summary": "用 SPT、EDD 與 Johnson 法則排出工件順序，並用甘特圖比較不同排法的績效。",
    "level": 2,
    "minutes": 20,
    "tags": ["排程", "派工法則", "甘特圖"]
  }
];
