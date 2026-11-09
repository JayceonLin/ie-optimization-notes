#!/usr/bin/env node
// 新增一課：複製 templates/lesson.html，並在 data/lessons.js 最後登記。
// 用法：node scripts/new-lesson.mjs <slug> <中文標題> <英文標題> [--level 1|2|3] [--minutes 分鐘]
// 例如：node scripts/new-lesson.mjs transportation "運輸問題" "The Transportation Problem" --level 2 --minutes 20
// 規則見 AGENTS.md 第 10.1 節。
import fs from "node:fs";
import path from "node:path";
import { ROOT, SLUG_PATTERN, readLessons, writeLessons } from "./lib.mjs";

function fail(msg) {
  console.error("✗ " + msg);
  process.exit(1);
}

const args = process.argv.slice(2);
const opts = { level: 2, minutes: 20 };
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--level") opts.level = Number(args[++i]);
  else if (args[i] === "--minutes") opts.minutes = Number(args[++i]);
  else pos.push(args[i]);
}
const [slug, title, en] = pos;

if (!slug || !title || !en) {
  fail('用法：node scripts/new-lesson.mjs <slug> <中文標題> <英文標題> [--level 1|2|3] [--minutes 分鐘]\n  例如：node scripts/new-lesson.mjs transportation "運輸問題" "The Transportation Problem"');
}
if (!SLUG_PATTERN.test(slug)) fail(`slug「${slug}」只能用小寫英文、數字與連字號，例如 transportation 或 network-flow（AGENTS.md R2）`);
if (![1, 2, 3].includes(opts.level)) fail("--level 只能是 1（入門）、2（基礎）或 3（進階）");
if (!Number.isInteger(opts.minutes) || opts.minutes < 5 || opts.minutes > 60) fail("--minutes 必須是 5 到 60 的整數");

const { header, lessons, error } = readLessons();
if (error) fail("data/lessons.js 格式錯誤：" + error + "。請先執行 node scripts/check.mjs 修好。");
if (lessons.some((l) => l.id.slice(3) === slug)) fail(`已經有 slug 為「${slug}」的課程`);

const num = lessons.length + 1;
if (num > 99) fail("課程編號已經到 99，請先和維護者討論如何分冊");
const id = String(num).padStart(2, "0") + "-" + slug;
const target = path.join(ROOT, "lessons", id + ".html");
if (fs.existsSync(target)) fail(`檔案 lessons/${id}.html 已經存在`);

const template = fs.readFileSync(path.join(ROOT, "templates", "lesson.html"), "utf8");
const html = template
  .replaceAll("{{ID}}", id)
  .replaceAll("{{NUM}}", String(num))
  .replaceAll("{{TITLE}}", title);
fs.writeFileSync(target, html, "utf8");

lessons.push({
  id,
  title,
  en,
  summary: "TODO：說明這一課學到什麼，15 到 70 字，以「。」結尾",
  level: opts.level,
  minutes: opts.minutes,
  tags: []
});
writeLessons(header, lessons);

console.log(`✓ 已建立 lessons/${id}.html，並登記為第 ${num} 課（data/lessons.js）`);
console.log("接下來：");
console.log(`  1. 在 data/lessons.js 填好這一課的 summary 與 tags（1 到 5 個）`);
console.log(`  2. 依 AGENTS.md 第 5 到 7 節，把 lessons/${id}.html 裡所有 TODO 換成內容`);
console.log(`  3. 把 <meta name="description"> 改成和 summary 一模一樣的文字`);
console.log(`  4. 執行 node scripts/check.mjs，直到顯示「全部通過」`);
console.log(`  5. 更新 README.md 的「目前的課程」表（AGENTS.md 第 10.1 節第 8 步）`);
