import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
 * Uses linkedom (lightweight) instead of jsdom for Vercel compatibility.
 * Falls back to raw body text if Readability fails.
 */
export async function extractReadable(url: string): Promise<ReadableResult> {
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
      throw new Error(`请求超时，该网页响应过慢`);
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`无法访问该网页（${msg}）`);
  } finally {
    clearTimeout(timeout);
  }

  if (!rawHtml || rawHtml.trim().length < 100) {
    throw new Error("网页内容过短，无法提取正文");
  }

  // Parse with linkedom (lightweight, works on Vercel)
  let document: Document;
  try {
    const dom = parseHTML(rawHtml);
    document = dom.document as unknown as Document;
  } catch {
    throw new Error("网页格式异常，无法解析");
  }

  // Run Readability
  let article: ReturnType<typeof Readability.prototype.parse> | null = null;
  try {
    const reader = new Readability(document as any);
    article = reader.parse();
  } catch {
    // Readability crashed — fall through to body text extraction
  }

  if (article && article.content) {
    // Clean up nav/footer-like elements
    let cleanHtml = article.content;
    try {
      const cleanDom = parseHTML(`<html><body>${article.content}</body></html>`);
      cleanDom.document
        .querySelectorAll("nav, footer, .nav, .footer, .sidebar, .comments, script, style")
        .forEach((el: Element) => el.remove());
      cleanHtml = cleanDom.document.body?.innerHTML || article.content;
    } catch {
      // ignore cleanup errors, use original content
    }

    return {
      title: article.title || "",
      content: cleanHtml,
      textContent: article.textContent?.replace(/\s+/g, " ").trim() || "",
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
  try {
    document
      .querySelectorAll("script, style, nav, footer, iframe, noscript")
      .forEach((el: Element) => el.remove());
  } catch {
    // ignore
  }

  const bodyText =
    document.body?.textContent?.replace(/\s+/g, " ").trim() || "";

  if (!bodyText || bodyText.length < 50) {
    throw new Error("该网页正文内容极少，可能为纯图片或动态加载页面");
  }

  return {
    title: document.title || "",
    content: document.body?.innerHTML || "",
    textContent: bodyText.slice(0, 50000),
    excerpt: bodyText.slice(0, 200),
    byline: null,
    siteName: null,
    length: bodyText.length,
  };
}
