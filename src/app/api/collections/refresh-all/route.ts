import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { executeSmartCollection } from "@/lib/smart-collections";

/** POST /api/collections/refresh-all — 全量重算所有智能收藏夹 */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const smartCollections = await prisma.collection.findMany({
    where: { userId, isSmart: true, rules: { not: null } },
  });

  const results: Array<{ id: string; matchedCount: number }> = [];

  for (const col of smartCollections) {
    // Clear
    await prisma.collectionBookmark.deleteMany({ where: { collectionId: col.id } });

    // Re-run
    const bookmarks = await executeSmartCollection(userId, {
      rules: col.rules!,
      sortBy: col.sortBy,
      sortOrder: col.sortOrder,
      maxItems: col.maxItems,
    });

    if (bookmarks.length > 0) {
      await prisma.collectionBookmark.createMany({
        data: bookmarks.map((bm) => ({
          collectionId: col.id,
          bookmarkId: bm.id,
        })),
      });
    }

    results.push({ id: col.id, matchedCount: bookmarks.length });
  }

  return NextResponse.json({ data: results });
}
