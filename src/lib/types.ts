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
  archiveHtml: string | null;
  archiveText: string | null;
  archivedAt: string | null;
  archiveStatus: string | null;
  linkStatus: string | null;
  linkStatusCode: number | null;
  linkCheckedAt: string | null;
  linkRedirectUrl: string | null;
  linkTitleChanged: boolean | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export interface ArchiveData {
  html: string | null;
  text: string | null;
  archivedAt: string | null;
  status: string | null;
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

export type ViewType = "grid" | "gallery" | "discover" | "learning-path" | "compare" | "activity" | "dashboard" | "timeline" | "weekly" | "graph";

export interface GraphNode {
  id: string;
  type: "category" | "tag" | "bookmark";
  label: string;
  bookmarkCount: number;
  color: string;
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
