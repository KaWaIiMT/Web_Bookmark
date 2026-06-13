import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve an image URL that might be relative, protocol-relative, or absolute.
 *  For relative paths, we resolve against the bookmark's original URL.
 *  This handles both newly-created bookmarks (fixed server-side) and
 *  pre-existing ones that may still have raw relative URLs. */
export function resolveImageUrl(imageUrl: string | null | undefined, pageUrl?: string): string | null {
  if (!imageUrl) return null
  try {
    // Already absolute — return as-is
    return new URL(imageUrl).href
  } catch {
    // Protocol-relative (//example.com/img.jpg)
    if (imageUrl.startsWith("//")) {
      return `https:${imageUrl}`
    }
    // Relative path (/images/hero.jpg) — resolve against the page URL
    if (imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
      try {
        if (pageUrl) {
          return new URL(imageUrl, pageUrl).href
        }
      } catch { /* fall through */ }
      // Without a page URL we can't resolve — return the raw value
      return imageUrl
    }
    return imageUrl
  }
}
