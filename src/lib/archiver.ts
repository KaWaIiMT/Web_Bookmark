import * as cheerio from "cheerio";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface ArchiveResult {
  html: string;
  text: string;
}

/**
 * Fetch and archive a web page as simplified HTML + extracted plain text.
 * Uses a realistic browser User-Agent to avoid being blocked.
 * - Removes <script>, <style>, <iframe>, <noscript>, event handler attributes
 * - Extracts the main content region (article, main, .content, etc.)
 * - Falls back to <body> if no main content region found
 * - Truncates plain text to 50,000 characters
 */
export async function archivePage(url: string): Promise<ArchiveResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let rawHtml: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    rawHtml = await res.text();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`归档超时：${url}`);
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`归档抓取失败（${msg}）：${url}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!rawHtml || rawHtml.trim().length < 100) {
    throw new Error("网页内容过短，无法归档");
  }

  let $: cheerio.CheerioAPI;
  try {
    $ = cheerio.load(rawHtml);
  } catch {
    throw new Error("网页格式异常，无法解析");
  }

  // Remove dangerous / unwanted tags
  $("script, style, iframe, noscript, nav, footer, header").remove();

  // Remove inline event handlers from all elements
  $("*").each((_, el) => {
    const attrs = Object.keys($(el).attr() || {});
    for (const attr of attrs) {
      if (/^on/i.test(attr)) {
        $(el).removeAttr(attr);
      }
    }
    // Remove style attributes that could be problematic in sandbox
    const style = $(el).attr("style");
    if (style) {
      const cleaned = style
        .replace(/position\s*:\s*fixed\s*;?/gi, "")
        .replace(/position\s*:\s*sticky\s*;?/gi, "");
      if (cleaned.trim()) {
        $(el).attr("style", cleaned);
      } else {
        $(el).removeAttr("style");
      }
    }
  });

  // Extract main content region (prefer semantic containers)
  const mainSelectors = [
    "article",
    "main",
    '[role="main"]',
    ".content",
    ".post-body",
    ".markdown-body",
    ".post-content",
    ".article-content",
    ".entry-content",
  ];
  let $main = $(mainSelectors.join(", "));
  const mainText = $main.text()?.replace(/\s+/g, " ").trim() || "";
  if (!mainText || mainText.length < 200) {
    $main = $("body");
  }

  const html = ($main.length ? $main.html() : $("body").html()) || "";
  const text = ($main.length ? $main.text() : $("body").text())
    ?.replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000) || "";

  return { html, text };
}
