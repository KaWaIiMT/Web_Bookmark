/**
 * Smart Dynamic Collections — rules engine.
 *
 * Converts user-defined rule conditions into Prisma where inputs,
 * evaluates matches, and powers the smart collection preview + refresh flows.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// ── Types ──

export interface RuleCondition {
  field: "tag" | "category" | "status" | "contentType" | "createdAt" | "domain" | "keyword";
  operator: "contains" | "not_contains" | "equals" | "not_equals" | "within_days" | "before_days";
  value: string | string[];
}

export interface SmartCollectionRules {
  combinator: "and" | "or";
  conditions: RuleCondition[];
  aiPrompt?: string;
}

// ── Condition → Prisma Where ──

function ensureArray(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}

export function conditionToPrismaWhere(
  condition: RuleCondition,
): Prisma.BookmarkWhereInput {
  const { field, operator, value } = condition;

  switch (field) {
    // ── Tag ──
    case "tag": {
      const tagNames = ensureArray(value);
      if (operator === "contains") {
        return { tags: { some: { tag: { name: { in: tagNames } } } } };
      }
      if (operator === "not_contains") {
        return { NOT: { tags: { some: { tag: { name: { in: tagNames } } } } } };
      }
      break;
    }

    // ── Category ──
    case "category": {
      const catName = Array.isArray(value) ? value[0] : value;
      if (operator === "equals") {
        return { category: { name: catName } };
      }
      if (operator === "not_equals") {
        return { NOT: { category: { name: catName } } };
      }
      if (operator === "contains") {
        return { category: { name: { contains: catName } } };
      }
      break;
    }

    // ── Status ──
    case "status": {
      const s = Array.isArray(value) ? value[0] : value;
      if (operator === "equals") return { status: s };
      if (operator === "not_equals") return { status: { not: s } };
      break;
    }

    // ── Content Type ──
    case "contentType": {
      const ct = Array.isArray(value) ? value[0] : value;
      if (operator === "equals") return { contentType: ct };
      if (operator === "not_equals") return { contentType: { not: ct } };
      break;
    }

    // ── Created At (time window) ──
    case "createdAt": {
      const days = Number(Array.isArray(value) ? value[0] : value);
      if (operator === "within_days") {
        return { createdAt: { gte: new Date(Date.now() - days * 86400000) } };
      }
      if (operator === "before_days") {
        return { createdAt: { lt: new Date(Date.now() - days * 86400000) } };
      }
      break;
    }

    // ── Domain ──
    case "domain": {
      const domain = Array.isArray(value) ? value[0] : value;
      if (operator === "contains") return { url: { contains: domain } };
      if (operator === "not_contains") return { NOT: { url: { contains: domain } } };
      break;
    }

    // ── Keyword (title + description + aiSummary) ──
    case "keyword": {
      const keyword = Array.isArray(value) ? value[0] : value;
      if (operator === "contains") {
        return {
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
            { aiSummary: { contains: keyword } },
          ],
        };
      }
      if (operator === "not_contains") {
        return {
          NOT: {
            OR: [
              { title: { contains: keyword } },
              { description: { contains: keyword } },
              { aiSummary: { contains: keyword } },
            ],
          },
        };
      }
      break;
    }

    default:
      break;
  }

  return {}; // unknown field/operator combo — pass through
}

// ── Rules → Prisma Where ──

export function rulesToPrismaWhere(
  rules: SmartCollectionRules,
): Prisma.BookmarkWhereInput {
  if (!rules.conditions || rules.conditions.length === 0) {
    return {};
  }
  const clauses = rules.conditions.map(conditionToPrismaWhere).filter(
    (c) => Object.keys(c).length > 0,
  );
  if (clauses.length === 0) return {};
  return rules.combinator === "and"
    ? { AND: clauses }
    : { OR: clauses };
}

// ── Execution ──

export async function executeSmartCollection(
  userId: string,
  collection: {
    rules: string;
    sortBy?: string | null;
    sortOrder?: string | null;
    maxItems?: number | null;
  },
) {
  let parsed: SmartCollectionRules;
  try {
    parsed = JSON.parse(collection.rules) as SmartCollectionRules;
  } catch {
    return [];
  }

  const ruleWhere = rulesToPrismaWhere(parsed);

  let orderBy: Record<string, string> = {};
  if (collection.sortBy && collection.sortOrder) {
    orderBy = { [collection.sortBy]: collection.sortOrder };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      AND: Object.keys(ruleWhere).length > 0 ? [ruleWhere] : [],
    },
    orderBy,
    take: collection.maxItems ?? undefined,
  });

  return bookmarks;
}

/** Preview rule results before saving — returns count + first 3 samples */
export async function previewSmartCollection(
  userId: string,
  rules: SmartCollectionRules,
): Promise<{
  count: number;
  samples: Array<{ id: string; title: string; createdAt: Date }>;
}> {
  const ruleWhere = rulesToPrismaWhere(rules);
  const where = {
    userId,
    ...(Object.keys(ruleWhere).length > 0 ? { AND: [ruleWhere] } : {}),
  };

  const [count, samples] = await Promise.all([
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      select: { id: true, title: true, createdAt: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { count, samples };
}

// ── Incremental Matching ──

/**
 * Called on bookmark CREATE or UPDATE.
 * Evaluates the bookmark against all of the user's smart collections,
 * adding/removing the bookmark from CollectionBookmark as needed.
 */
export async function matchBookmarkToSmartCollections(
  bookmarkId: string,
): Promise<void> {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    select: {
      id: true,
      userId: true,
      tags: { include: { tag: true } },
      category: true,
      status: true,
      contentType: true,
      createdAt: true,
      title: true,
      description: true,
      aiSummary: true,
      url: true,
    },
  });
  if (!bookmark) return;

  const smartCollections = await prisma.collection.findMany({
    where: { userId: bookmark.userId, isSmart: true, rules: { not: null } },
  });

  for (const col of smartCollections) {
    let parsed: SmartCollectionRules;
    try {
      parsed = JSON.parse(col.rules!) as SmartCollectionRules;
    } catch {
      continue; // skip malformed rules
    }

    const ruleWhere = rulesToPrismaWhere(parsed);
    if (Object.keys(ruleWhere).length === 0) continue;

    // Check if this specific bookmark matches the rules
    const matchCount = await prisma.bookmark.count({
      where: {
        id: bookmarkId,
        AND: [ruleWhere],
      },
    });

    const isInCollection = await prisma.collectionBookmark.findUnique({
      where: {
        collectionId_bookmarkId: {
          collectionId: col.id,
          bookmarkId,
        },
      },
    });

    if (matchCount > 0 && !isInCollection) {
      await prisma.collectionBookmark.create({
        data: { collectionId: col.id, bookmarkId },
      });
    } else if (matchCount === 0 && isInCollection) {
      await prisma.collectionBookmark.delete({
        where: {
          collectionId_bookmarkId: {
            collectionId: col.id,
            bookmarkId,
          },
        },
      });
    }
  }
}
