import { getApiKey, getApiUrl } from "./storage";
import type { BookmarkData, AICategorizeOutput, ExtractedMetadata } from "./types";

/**
 * API client for MarkBox backend.
 * All requests include Authorization: Bearer <apiKey> header.
 */
class ApiClient {
  private async getBaseUrl(): Promise<string> {
    return getApiUrl();
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const apiKey = await getApiKey();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return headers;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();
    const url = `${baseUrl}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
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

  /** Try cookie-based auth (session cookie from main site) */
  async tryCookieAuth(): Promise<boolean> {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await fetch(`${baseUrl}/api/bookmarks?limit=1`, {
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Validate API key by making a lightweight request */
  async validateKey(): Promise<boolean> {
    try {
      await this.request<{ data: unknown[] }>("/api/bookmarks?limit=1");
      return true;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();
