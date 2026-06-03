import * as cheerio from "cheerio";

export interface ExtractedMetadata {
  title: string;
  description: string;
  coverImage: string;
  favicon: string;
  siteName: string;
  contentType: "video" | "article" | "repository" | "image" | "social" | "webpage";
  specifics: Record<string, unknown>;
}

// Bilibili API fallback — the site is a JS SPA, so server-rendered HTML
// contains no OG meta tags. We call the public view API instead.
async function fetchBilibiliMeta(url: string): Promise<{
  title: string;
  description: string;
  coverImage: string;
  specificFields: Record<string, unknown>;
} | null> {
  // Extract bvid or aid from URL
  const bvidMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  const aidMatch = url.match(/bilibili\.com\/video\/av(\d+)/i);

  let apiUrl: string;
  if (bvidMatch) {
    apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvidMatch[1]}`;
  } else if (aidMatch) {
    apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${aidMatch[1]}`;
  } else {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.bilibili.com/",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 0 || !json.data) return null;

    const d = json.data;
    const rawPic = d.pic || "";
    return {
      title: d.title || "",
      description: (d.desc || "").slice(0, 500),
      coverImage: rawPic.replace(/^http:\/\//, "https://"),
      specificFields: {
        author: d.owner?.name || "",
        duration: d.duration ? formatBilibiliDuration(d.duration) : "",
        viewCount: String(d.stat?.view || ""),
        danmaku: String(d.stat?.danmaku || ""),
      },
    };
  } catch {
    return null;
  }
}

function formatBilibiliDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
const DOMAIN_RULES: Array<{
  pattern: RegExp;
  type: ExtractedMetadata["contentType"];
  extract?: ($: cheerio.CheerioAPI, url: string) => Record<string, unknown>;
}> = [
  {
    pattern: /bilibili\.com\/video/i,
    type: "video",
    extract: ($) => {
      const meta = $('meta[itemprop="description"]').attr("content") || "";
      const durationMatch = meta.match(/(\d{2}:\d{2}:\d{2})/);
      return {
        author: $('meta[name="author"]').attr("content") || "",
        duration: durationMatch ? durationMatch[1] : "",
        viewCount: $('meta[itemprop="interactionCount"]').attr("content") || "",
      };
    },
  },
  {
    pattern: /(youtube\.com\/watch|youtu\.be)/i,
    type: "video",
    extract: ($) => ({
      author: $('meta[itemprop="author"]').attr("content") || $('link[itemprop="name"]').attr("content") || "",
    }),
  },
  {
    pattern: /zhihu\.com\/(question|p\d+)/i,
    type: "social",
  },
  {
    pattern: /github\.com\/[^/]+\/[^/]+$/i,
    type: "repository",
    extract: ($) => {
      const lang = $('[itemprop="programmingLanguage"]').attr("content") || "";
      const stars = $('[href$="/stargazers"]').text().trim();
      return {
        language: lang,
        stars: parseInt(stars.replace(/,/g, "")) || 0,
      };
    },
  },
  {
    pattern: /(cnblogs\.com|blog\.csdn\.net|juejin\.cn|segmentfault\.com|zhuanlan\.zhihu\.com)/i,
    type: "article",
    extract: ($) => {
      const dateEl = $('meta[property="article:published_time"]').attr("content")
        || $('meta[name="date"]').attr("content")
        || $("time").attr("datetime")
        || "";
      return {
        publishDate: dateEl,
        author: $('meta[name="author"]').attr("content") || "",
      };
    },
  },
  {
    pattern: /(dribbble\.com|pinterest\.com|behance\.net)/i,
    type: "image",
  },
  {
    pattern: /(twitter\.com|x\.com|weibo\.com)/i,
    type: "social",
  },
];

function extractFavicon($: cheerio.CheerioAPI, url: string): string {
  const linkFavicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");

  if (linkFavicon) {
    return new URL(linkFavicon, url).href;
  }

  const parsed = new URL(url);
  return `${parsed.origin}/favicon.ico`;
}

function matchContentType(url: string): {
  type: ExtractedMetadata["contentType"];
  extract?: ($: cheerio.CheerioAPI, url: string) => Record<string, unknown>;
} {
  for (const rule of DOMAIN_RULES) {
    if (rule.pattern.test(url)) {
      return { type: rule.type, extract: rule.extract };
    }
  }
  return { type: "webpage" };
}

export async function extractMetadata(url: string): Promise<ExtractedMetadata> {
  // Validate URL
  let validatedUrl = url.trim();
  if (!/^https?:\/\//i.test(validatedUrl)) {
    validatedUrl = `https://${validatedUrl}`;
  }
  const parsed = new URL(validatedUrl);

  // Bilibili: use public API (site is a JS SPA — HTML has zero meta)
  if (/bilibili\.com\/video/i.test(url)) {
    const biliMeta = await fetchBilibiliMeta(url);
    if (biliMeta) {
      const favicon = `${parsed.origin}/favicon.ico`;
      return {
        title: biliMeta.title,
        description: biliMeta.description,
        coverImage: biliMeta.coverImage,
        favicon,
        siteName: "bilibili",
        contentType: "video",
        specifics: biliMeta.specificFields,
      };
    }
  }

  // Fetch HTML
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let html: string;
  try {
    const response = await fetch(validatedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    html = await response.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`请求超时：${validatedUrl}`);
    }
    throw new Error(`无法获取网页内容：${validatedUrl}`);
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);

  // Extract OG / Twitter Card / standard meta tags
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    parsed.hostname;

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const coverImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[itemprop="image"]').attr("content") ||
    "";

  const siteName =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[name="application-name"]').attr("content") ||
    parsed.hostname.replace(/^www\./, "");

  const favicon = extractFavicon($, validatedUrl);

  // Match content type
  const { type: contentType, extract: specificsExtractor } = matchContentType(url);

  // Extract type-specific fields
  const specifics: Record<string, unknown> = specificsExtractor
    ? specificsExtractor($, validatedUrl)
    : {};

  return {
    title,
    description: description.slice(0, 500),
    coverImage,
    favicon,
    siteName,
    contentType,
    specifics,
  };
}
