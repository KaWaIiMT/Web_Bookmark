import * as cheerio from "cheerio";

export interface ArchiveResult {
  html: string;
  text: string;
}

/**
 * Fetch and archive a web page as simplified HTML + extracted plain text.
 * - Removes <script>, <style>, <iframe>, <noscript>, event handler attributes
 * - Extracts the main content region (article, main, .content, etc.)
 * - Falls back to <body> if no main content region found
 * - Truncates plain text to 50,000 characters
 */
export async function archivePage(url: string): Promise<ArchiveResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let rawHtml: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MarkBox-Archiver/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    rawHtml = await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`归档超时：${url}`);
    }
    throw new Error(`归档抓取失败：${url} — ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(rawHtml);

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
      // Strip position:fixed/sticky which behave strangely in sandboxed iframes
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
  // Require at least 200 chars of text from the main region, otherwise fall back to body
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
