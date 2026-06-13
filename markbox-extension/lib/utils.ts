import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve an image URL that might be relative, protocol-relative, or absolute. */
export function resolveImageUrl(imageUrl: string | null | undefined, pageUrl?: string): string | null {
  if (!imageUrl) return null
  try {
    return new URL(imageUrl).href
  } catch {
    if (imageUrl.startsWith("//")) {
      return `https:${imageUrl}`
    }
    if (imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
      try {
        if (pageUrl) {
          return new URL(imageUrl, pageUrl).href
        }
      } catch { /* fall through */ }
      return imageUrl
    }
    return imageUrl
  }
}
