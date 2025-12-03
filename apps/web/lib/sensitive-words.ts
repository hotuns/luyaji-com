import fs from "fs";
import path from "path";

let cachedWords: string[] | null = null;

function loadWords(): string[] {
  if (cachedWords) return cachedWords;
  try {
    const filePath = path.join(process.cwd(), "apps/web/config/sensitive-words.txt");
    const content = fs.readFileSync(filePath, "utf8");
    cachedWords = content
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && !w.startsWith("#"));
  } catch (error) {
    console.error("加载敏感词词库失败:", error);
    cachedWords = [];
  }
  return cachedWords!;
}

export function detectSensitiveWord(text: string | null | undefined): string | null {
  if (!text) return null;
  const value = text.toString();
  if (!value) return null;

  const words = loadWords();
  for (const w of words) {
    if (!w) continue;
    if (value.includes(w)) {
      return w;
    }
  }
  return null;
}

export function ensureSafeText(fieldName: string, text: string | null | undefined) {
  const hit = detectSensitiveWord(text);
  if (hit) {
    throw new Error(`${fieldName}包含敏感内容，请修改后再提交`);
  }
}
