import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface ReadableResult {
  title: string;
  content: string;     // cleaned HTML
  textContent: string;  // plain text
  excerpt: string;      // short excerpt
  byline: string | null;
  siteName: string | null;
  length: number;       // text character count
}

/**
 * Extract readable content from a URL using Mozilla Readability.
 * Falls back to raw body text if Readability fails.
 */
export async function extractReadable(url: string): Promise<ReadableResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let rawHtml: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MarkBox-Reader/1.0",
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
      throw new Error(`提取超时：${url}`);
    }
    throw new Error(`提取失败：${url} — ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  const doc = new JSDOM(rawHtml, { url });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  if (article && article.content) {
    // Clean up the content further — strip nav, footer-like elements
    const cleanDoc = new JSDOM(article.content);
    cleanDoc.window.document
      .querySelectorAll("nav, footer, .nav, .footer, .sidebar, .comments, script, style")
      .forEach((el: Element) => el.remove());

    return {
      title: article.title || "",
      content: cleanDoc.serialize(),
      textContent: article.textContent?.replace(/\s+/g, " ").trim() || "",
      excerpt: article.excerpt || article.textContent?.slice(0, 200)?.replace(/\s+/g, " ").trim() || "",
      byline: article.byline || null,
      siteName: article.siteName || null,
      length: article.textContent?.length || 0,
    };
  }

  // Readability failed — extract body text as fallback
  const bodyDoc = new JSDOM(rawHtml, { url });
  bodyDoc.window.document
    .querySelectorAll("script, style, nav, footer, iframe, noscript")
    .forEach((el: Element) => el.remove());
  const bodyText = bodyDoc.window.document.body?.textContent?.replace(/\s+/g, " ").trim() || "";

  return {
    title: bodyDoc.window.document.title || "",
    content: bodyDoc.window.document.body?.innerHTML || "",
    textContent: bodyText.slice(0, 50000),
    excerpt: bodyText.slice(0, 200),
    byline: null,
    siteName: null,
    length: bodyText.length,
  };
}
