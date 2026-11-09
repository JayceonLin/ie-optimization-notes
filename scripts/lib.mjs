// scripts/ 共用的小工具：讀寫 data/lessons.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LESSONS_FILE = path.join(ROOT, "data", "lessons.js");
export const ID_PATTERN = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SITE_NAME = "工工最佳化講義";

// 回傳 { header, lessons, error }；header 是 window.LESSONS 之前的註解
export function readLessons() {
  const src = fs.readFileSync(LESSONS_FILE, "utf8");
  const m = src.match(/^([\s\S]*?)window\.LESSONS\s*=\s*(\[[\s\S]*\])\s*;\s*$/);
  if (!m) return { header: "", lessons: [], error: "找不到 `window.LESSONS = [ ... ];`，或檔案結尾不是 `];`" };
  try {
    return { header: m[1], lessons: JSON.parse(m[2]), error: null };
  } catch (e) {
    return { header: m[1], lessons: [], error: "陣列不是合法 JSON：" + e.message };
  }
}

// 用固定格式寫回：每課一個物件、每個欄位一行、tags 寫在同一行
export function formatLessons(list) {
  const items = list.map((l) => {
    const lines = Object.entries(l).map(
      ([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v).replace(/","/g, '", "')}`
    );
    return "  {\n" + lines.join(",\n") + "\n  }";
  });
  return "[\n" + items.join(",\n") + "\n]";
}

export function writeLessons(header, list) {
  fs.writeFileSync(LESSONS_FILE, header + "window.LESSONS = " + formatLessons(list) + ";\n", "utf8");
}

export function numOf(id) {
  return parseInt(id.slice(0, 2), 10);
}
