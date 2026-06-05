import type { BookmarkData, GraphNode, GraphLink, CategoryData } from "./types";

/**
 * Domain colors for category nodes — assigned deterministically by hashing the node name.
 * Warm editorial palette extended from the ESG color scheme.
 */
const DOMAIN_COLORS = [
  "#b76e4b", // warm terracotta
  "#7a9e7e", // sage green
  "#8b9dc3", // muted blue
  "#a08bbd", // muted purple
  "#d4a853", // warm amber
  "#9e9e9e", // warm gray
  "#c9866b", // light terracotta
  "#5c8370", // deep sage
];

/** Deterministic color from a string name */
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return DOMAIN_COLORS[Math.abs(hash) % DOMAIN_COLORS.length];
}

/** Compute node display radius from bookmark count */
function nodeRadius(count: number): number {
  if (!isFinite(count) || count < 0) return 4;
  return Math.max(4, Math.min(24, Math.sqrt(count) * 5));
}

export interface GraphDataResult {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Build graph data from a flat list of bookmarks.
 *
 * Algorithm:
 * 1. Collect unique tags and categories across all bookmarks, counting occurrences.
 * 2. Build a tag co-occurrence matrix — when two tags appear on the same bookmark,
 *    their edge strength increments.
 * 3. Build tag-category links from each bookmark's tag→category relationship.
 * 4. Produce GraphNode[] and GraphLink[].
 */
export function computeGraphData(bookmarks: BookmarkData[]): GraphDataResult {
  // ── Pass 1: collect tags and categories ──
  const tagCounts = new Map<string, { name: string; color: string | null; count: number }>();
  const catCounts = new Map<string, { name: string; count: number }>();
  // tagId → set of categoryIds (from bookmarks that have this tag + that category)
  const tagCategoryMap = new Map<string, Set<string>>();

  for (const bm of bookmarks) {
    // Category
    if (bm.category) {
      const c = bm.category;
      const prev = catCounts.get(c.id);
      if (prev) prev.count++;
      else catCounts.set(c.id, { name: c.name, count: 1 });
    }

    // Tags
    for (const { tag } of bm.tags) {
      const prev = tagCounts.get(tag.id);
      if (prev) prev.count++;
      else tagCounts.set(tag.id, { name: tag.name, color: tag.color, count: 1 });

      // Tag→Category association
      if (bm.category) {
        let catSet = tagCategoryMap.get(tag.id);
        if (!catSet) {
          catSet = new Set();
          tagCategoryMap.set(tag.id, catSet);
        }
        catSet.add(bm.category.id);
      }
    }
  }

  // ── Pass 2: tag co-occurrence matrix ──
  // key = "tagA_id::tagB_id" (sorted alphabetically to ensure uniqueness)
  const coOccurrence = new Map<string, number>();

  for (const bm of bookmarks) {
    const tagIds = bm.tags.map((t) => t.tag.id);
    for (let i = 0; i < tagIds.length; i++) {
      for (let j = i + 1; j < tagIds.length; j++) {
        const a = tagIds[i];
        const b = tagIds[j];
        const key = a < b ? `${a}::${b}` : `${b}::${a}`;
        coOccurrence.set(key, (coOccurrence.get(key) || 0) + 1);
      }
    }
  }

  // ── Pass 3: build nodes ──
  const nodes: GraphNode[] = [];

  // Category nodes
  for (const [id, info] of catCounts) {
    nodes.push({
      id: `cat:${id}`,
      type: "category",
      label: info.name,
      bookmarkCount: info.count,
      color: hashColor(info.name),
    });
  }

  // Tag nodes
  for (const [id, info] of tagCounts) {
    nodes.push({
      id: `tag:${id}`,
      type: "tag",
      label: info.name,
      bookmarkCount: info.count,
      color: info.color || "accent",
    });
  }

  // ── Pass 4: build links ──
  const links: GraphLink[] = [];

  // tag-tag links from co-occurrence
  for (const [key, strength] of coOccurrence) {
    if (strength < 1) continue;
    const [aId, bId] = key.split("::");
    links.push({
      source: `tag:${aId}`,
      target: `tag:${bId}`,
      strength,
      type: "tag-tag",
    });
  }

  // tag-category links
  for (const [tagId, catIdSet] of tagCategoryMap) {
    for (const catId of catIdSet) {
      const tagInfo = tagCounts.get(tagId);
      links.push({
        source: `tag:${tagId}`,
        target: `cat:${catId}`,
        strength: tagInfo?.count || 1,
        type: "tag-category",
      });
    }
  }

  return { nodes, links };
}

/**
 * Generate bookmark nodes for a specific tag or category.
 * Called when the user clicks a tag/category to expand Layer 2.
 * @param bookmarks All bookmarks
 * @param nodeId The expanded node's ID (e.g. "tag:xxx" or "cat:xxx")
 * @param nodeType The expanded node's type
 * @param maxNodes Maximum bookmark nodes to generate (default 50)
 */
export function computeBookmarkNodes(
  bookmarks: BookmarkData[],
  nodeId: string,
  nodeType: "tag" | "category",
  maxNodes = 50,
): GraphDataResult {
  // Strip prefix to get the raw DB id
  const rawId = nodeId.startsWith("tag:") ? nodeId.slice(4) : nodeId.slice(4);

  // Filter bookmarks matching this tag/category
  const matching: BookmarkData[] = [];
  for (const bm of bookmarks) {
    if (nodeType === "tag") {
      if (bm.tags.some((t) => t.tag.id === rawId)) {
        matching.push(bm);
      }
    } else {
      if (bm.category?.id === rawId) {
        matching.push(bm);
      }
    }
  }

  const limited = matching.slice(0, maxNodes);

  // Bookmark colors by content type
  const typeColors: Record<string, string> = {
    video: "#e07050",
    article: "#7a9e7e",
    repository: "#6b9e6b",
    image: "#d4a853",
    social: "#a08bbd",
    webpage: "#8b9dc3",
  };

  const nodes: GraphNode[] = limited.map((bm) => ({
    id: `bm:${bm.id}`,
    type: "bookmark" as const,
    label: bm.title.slice(0, 8) + (bm.title.length > 8 ? "..." : ""),
    bookmarkCount: 1,
    color: typeColors[bm.contentType] || "#9e9e9e",
    bookmarkId: bm.id,
    url: bm.url,
    favicon: bm.favicon || undefined,
    coverImage: bm.coverImage || undefined,
    contentType: bm.contentType,
    status: bm.status,
    createdAt: bm.createdAt,
  }));

  const links: GraphLink[] = limited.map((bm) => ({
    source: `bm:${bm.id}`,
    target: nodeId,
    strength: 1,
    type: "bookmark-tag" as const,
  }));

  return { nodes, links };
}

export { nodeRadius, hashColor, DOMAIN_COLORS };
