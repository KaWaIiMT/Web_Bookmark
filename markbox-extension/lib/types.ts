export interface BookmarkData {
  id: string;
  url: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  favicon: string | null;
  siteName: string | null;
  contentType: string;
  metadata: string | null;
  aiSummary: string | null;
  status: "unread" | "reading" | "read" | "archived";
  categoryId: string | null;
  category: CategoryData | null;
  tags: { tag: TagData }[];
  createdAt: string;
  updatedAt: string;
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
}

export interface ExtractedMetadata {
  title: string;
  description: string;
  coverImage: string;
  favicon: string;
  siteName: string;
  contentType: string;
}

export interface AICategorizeOutput {
  tags: string[];
  category: string;
  summary: string;
}

export type PopupStep =
  | "loading"
  | "preview"
  | "already_bookmarked"
  | "error"
  | "auth_required";
