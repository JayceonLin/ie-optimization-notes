#!/usr/bin/env node
// 專案規則檢查：逐條驗證 AGENTS.md 的規則（R1～R14），錯誤訊息開頭的 [R編號] 對應 AGENTS.md 的規則編號。
// 用法：node scripts/check.mjs        （有錯誤時結束代碼為 1）
import fs from "node:fs";
import path from "node:path";
import { ROOT, ID_PATTERN, SITE_NAME, readLessons, numOf } from "./lib.mjs";

const errors = [];
const warnings = [];
const err = (rule, file, msg) => errors.push(`[${rule}] ${file}：${msg}`);
const warn = (rule, file, msg) => warnings.push(`[${rule}] ${file}：${msg}`);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const count = (s, re) => (s.match(re) || []).length;

// ---------- R1：課程清單 data/lessons.js ----------
const { lessons, error: lessonsError } = readLessons();
if (lessonsError) err("R1", "data/lessons.js", lessonsError);
const ALLOWED_KEYS = ["id", "title", "en", "summary", "level", "minutes", "tags"];
const seen = new Set();
lessons.forEach((l, i) => {
  const where = `data/lessons.js 第 ${i + 1} 筆`;
  for (const k of ALLOWED_KEYS) if (!(k in l)) err("R1", where, `缺少欄位「${k}」`);
  for (const k of Object.keys(l)) if (!ALLOWED_KEYS.includes(k)) err("R1", where, `不認得的欄位「${k}」，可用欄位：${ALLOWED_KEYS.join("、")}`);
  if (typeof l.id !== "string" || !ID_PATTERN.test(l.id)) { err("R2", where, `id「${l.id}」格式應為「兩位數編號-英文小寫slug」，例如 06-transportation`); return; }
  if (seen.has(l.id)) err("R2", where, `id「${l.id}」重複`);
  seen.add(l.id);
  if (numOf(l.id) !== i + 1) err("R2", where, `id 編號是 ${numOf(l.id)}，但它排在第 ${i + 1} 筆；編號必須從 01 開始連續，且和陣列順序一致`);
  for (const k of ["title", "en", "summary"]) {
    if (typeof l[k] !== "string" || !l[k].trim()) err("R1", where, `「${k}」必須是非空字串`);
    else if (/TODO/.test(l[k])) err("R10", where, `「${k}」還有 TODO`);
  }
  if (typeof l.summary === "string" && !/TODO/.test(l.summary) && (l.summary.length < 15 || l.summary.length > 70)) {
    err("R1", where, `summary 長度 ${l.summary.length} 字，應在 15 到 70 字之間`);
  }
  if (typeof l.summary === "string" && !/TODO/.test(l.summary) && !l.summary.endsWith("。")) err("R1", where, "summary 必須以全形句號「。」結尾");
  if (typeof l.title === "string" && (l.title.length < 2 || l.title.length > 12)) err("R1", where, `title 長度 ${l.title.length} 字，應在 2 到 12 字之間`);
  if (![1, 2, 3].includes(l.level)) err("R1", where, "level 只能是 1（入門）、2（基礎）、3（進階）");
  if (!Number.isInteger(l.minutes) || l.minutes < 5 || l.minutes > 60) err("R1", where, "minutes 必須是 5 到 60 的整數");
  if (!Array.isArray(l.tags) || l.tags.length < 1 || l.tags.length > 5 || l.tags.some((t) => typeof t !== "string" || !t.trim())) {
    err("R1", where, "tags 必須是 1 到 5 個非空字串");
  }
});

// ---------- R2：檔案與清單一致 ----------
const lessonFiles = fs.readdirSync(path.join(ROOT, "lessons")).filter((f) => f.endsWith(".html"));
for (const f of lessonFiles) {
  const id = f.replace(/\.html$/, "");
  if (!lessons.some((l) => l.id === id)) err("R2", `lessons/${f}`, "這個檔案沒有登記在 data/lessons.js");
}
for (const f of fs.readdirSync(path.join(ROOT, "lessons"))) {
  if (!f.endsWith(".html")) err("R2", `lessons/${f}`, "lessons/ 只能放講義 HTML；圖片請放 assets/img/<課程 id>/");
}

// ---------- 逐課檢查 ----------
const HEAD_ASSETS = [
  'href="../assets/vendor/katex/katex.min.css"',
  'href="../assets/css/site.css"',
  'src="../assets/vendor/katex/katex.min.js"',
  'src="../assets/vendor/katex/auto-render.min.js"',
  'src="../data/lessons.js"',
  'src="../assets/js/site.js"'
];

for (const l of lessons) {
  if (!ID_PATTERN.test(l.id || "")) continue;
  const file = `lessons/${l.id}.html`;
  if (!exists(file)) { err("R2", file, "data/lessons.js 有登記，但檔案不存在"); continue; }
  const html = read(file).replace(/<!--[\s\S]*?-->/g, ""); // 註解不檢查
  const n = numOf(l.id);

  // R10：未完成
  if (/TODO|\{\{[A-Z]+\}\}/.test(html)) err("R10", file, "還有 TODO 或 {{佔位符}} 沒有填完");

  // R3：head
  if (!/<html lang="zh-Hant-TW">/.test(html)) err("R3", file, '必須是 <html lang="zh-Hant-TW">');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const wantTitle = `第 ${n} 課：${l.title}｜${SITE_NAME}`;
  if (title !== wantTitle) err("R3", file, `<title> 應為「${wantTitle}」，目前是「${title}」`);
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
  if (desc !== l.summary) err("R3", file, "<meta name=\"description\"> 必須和 data/lessons.js 的 summary 完全相同");
  let last = -1;
  for (const a of HEAD_ASSETS) {
    const at = html.indexOf(a);
    if (at === -1) err("R3", file, `<head> 缺少 ${a}`);
    else if (at < last) err("R3", file, `<head> 資源順序錯誤：${a} 應該排在更後面（照模板順序）`);
    else last = at;
  }

  // R4：body 與 article
  if (!new RegExp(`<body data-page="lesson" data-lesson="${l.id}">`).test(html)) {
    err("R4", file, `必須是 <body data-page="lesson" data-lesson="${l.id}">`);
  }
  if (count(html, /<article class="lesson">/g) !== 1) err("R4", file, '必須剛好有一個 <article class="lesson">');
  if (/<h1[\s>]/.test(html)) err("R4", file, "講義頁不能寫 <h1>，標題由 site.js 依 data/lessons.js 產生");
  const article = (html.match(/<article class="lesson">([\s\S]*)<\/article>/) || [])[1] || "";

  // R5：段落骨架
  const allSections = [...article.matchAll(/<section(\s[^>]*)?>/g)];
  const ids = [];
  for (const m of allSections) {
    const idm = (m[1] || "").match(/^\s+id="([^"]+)"\s*$/);
    if (!idm) { err("R5", file, `每個 <section> 只能有 id 屬性：${m[0]}`); continue; }
    ids.push(idm[1]);
  }
  for (const id of ids) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) err("R5", file, `section id「${id}」只能用小寫英文、數字與連字號`);
    if (!new RegExp(`<section id="${id}">\\s*<h2>[^<$]+</h2>`).test(article)) err("R5", file, `section#${id} 的第一個元素必須是 <h2>，且 <h2> 裡不能有數學式或其他標籤`);
  }
  if (new Set(ids).size !== ids.length) err("R5", file, "section id 有重複");
  if (ids[0] !== "goals") err("R5", file, "第一個段落必須是 section#goals（學習目標）");
  for (const req of ["example", "summary", "exercises"]) if (!ids.includes(req)) err("R5", file, `缺少必備段落 section#${req}`);
  const iEx = ids.indexOf("example"), iSum = ids.indexOf("summary"), iExe = ids.indexOf("exercises");
  if (iEx > -1 && iSum > -1 && iEx > iSum) err("R5", file, "section#example 必須在 section#summary 之前");
  if (iSum > -1 && iExe > -1 && iExe !== iSum + 1) err("R5", file, "section#exercises 必須緊接在 section#summary 之後");
  const tail = ids.slice(iExe + 1);
  if (iExe > -1 && (tail.length > 1 || (tail.length === 1 && tail[0] !== "references"))) {
    err("R5", file, "section#exercises 之後只能接 section#references（延伸閱讀）");
  }
  const sectionBody = (id) => (article.match(new RegExp(`<section id="${id}">([\\s\\S]*?)</section>`)) || [])[1] || "";
  if (!sectionBody("goals").includes("<p>讀完這一課，你應該能夠：</p>")) err("R5", file, "學習目標要先寫 <p>讀完這一課，你應該能夠：</p>，再接 <ul>");
  const goalsLi = count(sectionBody("goals"), /<li>/g);
  if (goalsLi < 2 || goalsLi > 5) err("R5", file, `學習目標要有 2 到 5 點，目前 ${goalsLi} 點`);
  const sumBody = sectionBody("summary");
  if (!/<ul class="key-points">/.test(sumBody)) err("R5", file, '重點整理必須用 <ul class="key-points">');
  const sumLi = count(sumBody, /<li>/g);
  if (sumLi < 3 || sumLi > 6) err("R5", file, `重點整理要有 3 到 6 點，目前 ${sumLi} 點`);

  // R6：元件格式與編號
  for (const m of article.matchAll(/<div class="(definition|example|callout[^"]*)"[^>]*>\s*(<[^>]+>)?/g)) {
    if (m[1].startsWith("callout") && !/^callout (tip|warn)$/.test(m[1])) err("R6", file, `提示框的 class 只能是 "callout tip" 或 "callout warn"，目前是 "${m[1]}"`);
    if (m[2] !== '<p class="box-title">') err("R6", file, `<div class="${m[1]}"> 的第一個元素必須是 <p class="box-title">`);
  }
  const exampleTitles = [...article.matchAll(/<div class="example">\s*<p class="box-title">([^<]*)<\/p>/g)].map((m) => m[1]);
  if (exampleTitles.length === 0) err("R6", file, '至少要有一個 <div class="example"> 例題框');
  exampleTitles.forEach((t, k) => {
    const want = `例題 ${n}-${k + 1}：`;
    if (!t.startsWith(want)) err("R6", file, `第 ${k + 1} 個例題標題應以「${want}」開頭，目前是「${t}」`);
  });
  if (!/<section id="example">[\s\S]*?<div class="example">[\s\S]*?<\/section>/.test(article)) err("R6", file, "section#example 裡必須至少有一個例題框");
  const exBlocks = [...sectionBody("exercises").matchAll(/<details class="exercise">([\s\S]*?)<\/details>/g)].map((m) => m[1]);
  if (exBlocks.length < 2) err("R6", file, `練習題至少 2 題，目前 ${exBlocks.length} 題`);
  exBlocks.forEach((b, k) => {
    const want = `<summary><span class="ex-no">練習 ${n}-${k + 1}</span>`;
    if (!b.trimStart().startsWith(want)) err("R6", file, `第 ${k + 1} 題練習必須以 ${want} 開頭`);
    if (!/<div class="answer">\s*<p class="box-title">解答<\/p>/.test(b)) err("R6", file, `練習 ${n}-${k + 1} 缺少 <div class="answer"><p class="box-title">解答</p>`);
  });
  const seq = { 圖: 0, 表: 0 };
  for (const m of article.matchAll(/<(figcaption|caption)>\s*(圖|表) (\d+)-(\d+)(.)/g)) {
    if (Number(m[3]) !== n) err("R6", file, `${m[2]} ${m[3]}-${m[4]} 的章號應該是 ${n}`);
    seq[m[2]] += 1;
    if (Number(m[4]) !== seq[m[2]]) err("R6", file, `${m[2]} ${m[3]}-${m[4]} 的流水號應該是 ${seq[m[2]]}（同一頁從 1 開始連續）`);
    if (m[5] !== "\u3000") err("R6", file, `${m[2]} ${m[3]}-${m[4]} 後面要接一個全形空格`);
  }

  // R7：不能有行內樣式與自訂腳本
  if (/\sstyle="/.test(html) || /<style[\s>]/.test(html)) err("R7", file, "不能使用 style 屬性或 <style>，樣式只能寫在 assets/css/site.css");
  if (/\son[a-z]+="/.test(html)) err("R7", file, "不能使用 onclick 等行內事件，互動請做成 widget");
  for (const m of article.matchAll(/<script([^>]*)>/g)) {
    if (!/type="application\/json"/.test(m[1])) err("R7", file, "<article> 裡只能有 <script type=\"application/json\">（互動元件設定）");
  }

  // R8：連結與圖片
  const localIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    const url = m[2].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:)/.test(url)) continue;
    if (url.startsWith("#")) {
      if (!localIds.has(url.slice(1))) err("R8", file, `頁內連結 ${url} 找不到對應的 id`);
      continue;
    }
    const target = path.normalize(path.join(path.dirname(file), url.split(/[?#]/)[0]));
    if (!exists(target)) err("R8", file, `連結或資源 ${url} 不存在`);
  }
  for (const m of article.matchAll(/<img\s[^>]*>/g)) {
    if (!/\salt="[^"]+"/.test(m[0])) err("R8", file, `<img> 必須有非空的 alt：${m[0]}`);
    const src = (m[0].match(/src="([^"]+)"/) || [])[1] || "";
    if (src && !src.startsWith(`../assets/img/${l.id}/`)) err("R8", file, `圖片必須放在 assets/img/${l.id}/，目前是 ${src}`);
  }

  // R9：互動元件
  for (const m of article.matchAll(/<figure class="widget" data-widget="([^"]+)">([\s\S]*?)<\/figure>/g)) {
    const name = m[1];
    if (!exists(`assets/js/widgets/${name}.js`)) err("R9", file, `找不到元件 assets/js/widgets/${name}.js`);
    const cfg = (m[2].match(/<script type="application\/json">([\s\S]*?)<\/script>/) || [])[1];
    if (cfg === undefined) err("R9", file, `元件 ${name} 缺少 <script type="application/json"> 設定`);
    else { try { JSON.parse(cfg); } catch (e) { err("R9", file, `元件 ${name} 的設定不是合法 JSON：${e.message}`); } }
    if (!/<figcaption>/.test(m[2])) err("R9", file, `元件 ${name} 缺少 <figcaption> 說明`);
  }
  if (count(article, /data-widget=/g) !== count(article, /<figure class="widget" data-widget="/g)) {
    err("R9", file, 'data-widget 只能放在 <figure class="widget"> 上');
  }

  // R11：程式碼區塊
  for (const m of article.matchAll(/<pre>([\s\S]*?)<\/pre>/g)) {
    const inner = m[1];
    if (!/^<code class="language-[a-z]+">[\s\S]*<\/code>$/.test(inner)) err("R11", file, '程式碼必須寫成 <pre><code class="language-語言">…</code></pre>');
    const code = inner.replace(/^<code[^>]*>/, "").replace(/<\/code>$/, "");
    if (/[<>]/.test(code)) err("R11", file, "程式碼裡的 < 與 > 必須寫成 &lt; 與 &gt;");
  }
}

// ---------- R14：禁用詞（「不要用」欄直接從 AGENTS.md 的 W2 表格讀取） ----------
const agents = read("AGENTS.md");
const w2 = (agents.match(/\*\*W2[\s\S]*?\*\*W3/) || [""])[0];
const banned = ["讓我們", "總而言之", "！", "!"];
for (const row of w2.split("\n")) {
  const cells = row.split("|").map((c) => c.trim());
  if (cells.length < 5 || cells[1] === "English" || /^-+$/.test(cells[1])) continue;
  const word = cells[3].split("（")[0].trim();
  if (word) banned.push(word);
}
function proseOf(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<pre>[\s\S]*?<\/pre>/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/<[^>]+>/g, " ");
}
const proseFiles = ["index.html", ...lessons.filter((l) => ID_PATTERN.test(l.id || "") && exists(`lessons/${l.id}.html`)).map((l) => `lessons/${l.id}.html`)];
for (const f of proseFiles) {
  const text = proseOf((read(f).match(/<body[\s\S]*<\/body>/) || [""])[0]);
  for (const w of banned) if (text.includes(w)) err("R14", f, `出現禁用詞「${w}」（AGENTS.md W2、W6）`);
  const emoji = text.match(/\p{Extended_Pictographic}/u);
  if (emoji) err("R14", f, `出現 emoji「${emoji[0]}」`);
}

// ---------- R12：首頁 ----------
if (!exists("index.html")) err("R12", "index.html", "首頁不存在");
else {
  const home = read("index.html");
  if (!/<body data-page="home">/.test(home)) err("R12", "index.html", '首頁必須是 <body data-page="home">');
  if (!/id="lesson-list"/.test(home)) err("R12", "index.html", '首頁必須保留 <ol class="syllabus" id="lesson-list">，課程目錄由 site.js 產生');
}

// ---------- R13：顏色只能用 CSS 變數 ----------
const css = read("assets/css/site.css").replace(/\/\*[\s\S]*?\*\//g, "");
const cssOutsideRoot = css.replace(/:root\s*\{[^}]*\}/g, "");
for (const m of cssOutsideRoot.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)) {
  err("R13", "assets/css/site.css", `顏色「${m[0]}」寫在 :root 以外；請在 :root（與深色模式）新增變數後用 var(--名稱)`);
}
for (const f of fs.readdirSync(path.join(ROOT, "assets/js/widgets"))) {
  const js = read(`assets/js/widgets/${f}`);
  const name = f.replace(/\.js$/, "");
  if (!js.includes(`window.OptWidgets["${name}"]`)) err("R9", `assets/js/widgets/${f}`, `必須註冊 window.OptWidgets["${name}"]`);
  if (/#[0-9a-fA-F]{6}\b/.test(js.replace(/\/\*[\s\S]*?\*\//g, ""))) err("R13", `assets/js/widgets/${f}`, "元件不能寫死顏色，請用 site.css 的 w- 開頭 class");
}

// ---------- 結果 ----------
for (const w of warnings) console.log("⚠ " + w);
if (errors.length) {
  for (const e of errors) console.log("✗ " + e);
  console.log(`\n共 ${errors.length} 個錯誤。請對照 AGENTS.md 中相同編號的規則修正後，再執行一次 node scripts/check.mjs。`);
  process.exit(1);
}
console.log(`✓ 全部通過：${lessons.length} 課、${lessonFiles.length} 個講義檔，所有規則都符合。`);
