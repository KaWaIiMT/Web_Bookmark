import { prisma } from "@/lib/prisma";

export interface ScoredBookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  favicon: string | null;
  siteName: string | null;
  contentType: string;
  score: number;
  sharedTags: string[];
  similarity: number; // 0-100 percentage display
}

/**
 * Tag Jaccard similarity — find bookmarks sharing tags with the source.
 * Pure Prisma query + in-memory calculation. <50ms for <1k bookmarks.
 * Falls back to same-category popular bookmarks if no tag overlap.
 */
export async function getRelatedBookmarks(
  bookmarkId: string,
  userId: string,
  limit = 5
): Promise<ScoredBookmark[]> {
  // 1. Get source bookmark with tags
  const source = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    include: { tags: { include: { tag: true } } },
  });
  if (!source) return [];

  const sourceTagIds = source.tags.map((t) => t.tagId);

  // 2. Find candidates sharing at least 1 tag (exclude self and same URL)
  const candidates = sourceTagIds.length > 0
    ? await prisma.bookmark.findMany({
        where: {
          userId,
          id: { not: bookmarkId },
          url: { not: source.url },
          tags: { some: { tagId: { in: sourceTagIds } } },
        },
        include: { tags: { include: { tag: true } } },
        take: 50,
      })
    : [];

  // 3. Score: Jaccard similarity
  let scored = candidates.map((candidate) => {
    const candidateTagIds = candidate.tags.map((t) => t.tagId);
    const sharedTagIds = sourceTagIds.filter((id) => candidateTagIds.includes(id));
    const sharedTags = sharedTagIds.map(
      (id) => candidate.tags.find((t) => t.tagId === id)?.tag.name || ""
    );
    const unionSize = new Set([...sourceTagIds, ...candidateTagIds]).size;
    const jaccard = unionSize > 0 ? sharedTagIds.length / unionSize : 0;

    return {
      id: candidate.id,
      url: candidate.url,
      title: candidate.title,
      description: candidate.description,
      coverImage: candidate.coverImage,
      favicon: candidate.favicon,
      siteName: candidate.siteName,
      contentType: candidate.contentType,
      score: jaccard,
      sharedTags,
      similarity: Math.round(jaccard * 100),
    };
  });

  // 4. If not enough results, fall back to same-category bookmarks
  if (scored.length < limit && source.categoryId) {
    const existingIds = new Set(scored.map((s) => s.id));
    existingIds.add(bookmarkId);

    const categoryFallbacks = await prisma.bookmark.findMany({
      where: {
        userId,
        categoryId: source.categoryId,
        id: { notIn: [...existingIds] },
        url: { not: source.url },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      take: limit - scored.length,
    });

    const fallbackScored = categoryFallbacks.map((fb) => ({
      id: fb.id,
      url: fb.url,
      title: fb.title,
      description: fb.description,
      coverImage: fb.coverImage,
      favicon: fb.favicon,
      siteName: fb.siteName,
      contentType: fb.contentType,
      score: 0.1,
      sharedTags: [] as string[],
      similarity: 10,
    }));

    scored = [...scored, ...fallbackScored];
  }

  // 5. Sort by score desc, return top N
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Cosine similarity between two vectors (pure TypeScript)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Hybrid rerank: tag score (40%) + semantic cosine (60%)
 */
export function hybridScore(tagScore: number, semanticSimilarity: number): number {
  return tagScore * 0.4 + semanticSimilarity * 0.6;
}
