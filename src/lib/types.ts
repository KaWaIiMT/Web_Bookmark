export interface BookmarkData {
  id: string;
  url: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  favicon: string | null;
  siteName: string | null;
  contentType: "video" | "article" | "repository" | "image" | "social" | "webpage";
  metadata: string | null;
  aiSummary: string | null;
  shareToken: string | null;
  status: "unread" | "reading" | "read" | "archived";
  categoryId: string | null;
  category: CategoryData | null;
  tags: { tag: TagData }[];
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export interface TagData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
}

export interface ExtractedMetadata {
  title: string;
  description: string;
  coverImage: string;
  favicon: string;
  siteName: string;
  contentType: "video" | "article" | "repository" | "image" | "social" | "webpage";
  specifics: Record<string, unknown>;
}

export interface AICategorizeOutput {
  tags: string[];
  category: string;
  summary: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ViewType = "grid" | "gallery" | "dashboard" | "timeline" | "weekly" | "graph";

export interface GraphNode {
  id: string;
  type: "category" | "tag" | "bookmark";
  label: string;
  bookmarkCount: number;
  color: string;
  // Bookmark node fields (set when type === "bookmark")
  bookmarkId?: string;
  url?: string;
  favicon?: string;
  coverImage?: string;
  contentType?: string;
  status?: string;
  createdAt?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: "tag-tag" | "tag-category" | "bookmark-tag";
}

export interface TimelineGroup {
  year: number;
  month: number;
  label: string;
  bookmarks: BookmarkData[];
}

export interface TimelineResponse {
  groups: TimelineGroup[];
}

export interface WeeklyReportData {
  thisWeek: {
    total: number;
    byStatus: { unread: number; reading: number; read: number; archived: number };
    topTags: { name: string; color: string | null; count: number }[];
  };
  lastWeek: {
    total: number;
  };
  comparison: {
    delta: number;
    percentage: number;
  };
  weekLabel: string;
}
