import type { BookmarkData, AICategorizeOutput, ExtractedMetadata } from "./types";
import { getApiKey } from "./storage";

/**
 * API client for MarkBox backend.
 * Uses the production URL by default (ccjproject.top).
 * Auth: tries session cookie first; falls back to API key Bearer token.
 */
const BASE_URL = "https://ccjproject.top";

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    // Try API key auth as fallback for environments where cookies don't work
    const apiKey = await getApiKey();
    if (apiKey && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API error: ${res.status}`);
    }

    return res.json();
  }

  /** Check if a URL is already bookmarked */
  async checkDuplicate(url: string): Promise<BookmarkData | null> {
    const result = await this.request<{ data: BookmarkData[] }>(
      `/api/bookmarks?url=${encodeURIComponent(url)}&limit=1`
    );
    return result.data?.[0] || null;
  }

  /** Get AI categorization for metadata */
  async categorize(
    metadata: Pick<ExtractedMetadata, "title" | "description" | "siteName" | "contentType">
  ): Promise<AICategorizeOutput> {
    return this.request<AICategorizeOutput>("/api/ai/categorize", {
      method: "POST",
      body: JSON.stringify(metadata),
    });
  }

  /** Create a new bookmark */
  async createBookmark(data: {
    url: string;
    title?: string;
    description?: string;
    categoryId?: string | null;
  }): Promise<BookmarkData> {
    return this.request<BookmarkData>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** List recent bookmarks */
  async listBookmarks(limit = 20): Promise<BookmarkData[]> {
    const result = await this.request<{ data: BookmarkData[] }>(
      `/api/bookmarks?limit=${limit}`,
    );
    return result.data || [];
  }

  /** Search bookmarks */
  async searchBookmarks(query: string): Promise<BookmarkData[]> {
    const result = await this.request<{ data: BookmarkData[] }>(
      `/api/search?q=${encodeURIComponent(query)}`,
    );
    return result.data || [];
  }

  /** Update bookmark status */
  async updateBookmark(id: string, data: Record<string, unknown>): Promise<void> {
    await this.request(`/api/bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
