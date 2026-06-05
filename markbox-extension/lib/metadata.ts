import type { ExtractedMetadata } from "./types";

/**
 * Extract metadata from the current page DOM.
 * This runs in the content script context and has direct access to the page's DOM.
 */
export function extractMetadataFromDocument(doc: Document = document): ExtractedMetadata {
  let title = "";
  let description = "";
  let coverImage = "";
  let favicon = "";
  let siteName = "";
  let contentType = "webpage";

  // --- Title ---
  title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
    doc.title ||
    "";

  // --- Description ---
  description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
    doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
    "";

  // --- Cover image ---
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
  coverImage = ogImage || twitterImage || "";

  // --- Site name ---
  siteName =
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ||
    window.location.hostname ||
    "";

  // --- Favicon ---
  const faviconLink =
    doc.querySelector('link[rel="icon"]')?.getAttribute("href") ||
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
    doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ||
    `${window.location.origin}/favicon.ico`;

  if (faviconLink) {
    try {
      favicon = new URL(faviconLink, window.location.origin).href;
    } catch {
      favicon = faviconLink;
    }
  }

  // --- Content type detection ---
  const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute("content") || "";

  if (
    ogType.includes("video") ||
    window.location.hostname.includes("youtube.com") ||
    window.location.hostname.includes("bilibili.com") ||
    window.location.hostname.includes("vimeo.com")
  ) {
    contentType = "video";
  } else if (
    doc.querySelector('article') ||
    doc.querySelector('[itemtype*="Article"]') ||
    ogType === "article"
  ) {
    contentType = "article";
  } else if (
    window.location.hostname.includes("github.com") ||
    ogType.includes("repository")
  ) {
    contentType = "repository";
  } else if (
    ogType.includes("image") ||
    window.location.hostname.includes("pinterest.com") ||
    window.location.hostname.includes("dribbble.com")
  ) {
    contentType = "image";
  } else if (
    ogType.includes("social") ||
    window.location.hostname.includes("twitter.com") ||
    window.location.hostname.includes("x.com")
  ) {
    contentType = "social";
  }

  return { title, description, coverImage, favicon, siteName, contentType };
}
