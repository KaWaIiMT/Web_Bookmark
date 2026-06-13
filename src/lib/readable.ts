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
  error?: string;       // non-fatal warning
}

/**
 * Extract readable content from a URL using Mozilla Readability.
 * Uses a realistic browser User-Agent to avoid being blocked.
 * Falls back to raw body text if Readability fails.
 */
export async function extractReadable(url: string): Promise<ReadableResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  let rawHtml: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
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
      throw new Error(`请求超时，该网页响应过慢`);
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`无法访问该网页（${msg}）`);
  } finally {
    clearTimeout(timeout);
  }

  // Validate we got useful HTML
  if (!rawHtml || rawHtml.trim().length < 100) {
    throw new Error("网页内容过短，无法提取正文");
  }

  let doc: JSDOM;
  try {
    doc = new JSDOM(rawHtml, { url });
  } catch {
    throw new Error("网页格式异常，无法解析");
  }

  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  if (article && article.content) {
    // Clean up the content further — strip nav, footer-like elements
    const cleanDoc = new JSDOM(article.content);
    cleanDoc.window.document
      .querySelectorAll(
        "nav, footer, .nav, .footer, .sidebar, .comments, script, style"
      )
      .forEach((el: Element) => el.remove());

    return {
      title: article.title || "",
      content: cleanDoc.serialize(),
      textContent:
        article.textContent?.replace(/\s+/g, " ").trim() || "",
      excerpt:
        article.excerpt ||
        article.textContent?.slice(0, 200)?.replace(/\s+/g, " ").trim() ||
        "",
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
  const bodyText =
    bodyDoc.window.document.body?.textContent
      ?.replace(/\s+/g, " ")
      .trim() || "";

  if (!bodyText || bodyText.length < 50) {
    throw new Error("该网页正文内容极少，可能为纯图片或动态加载页面");
  }

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
