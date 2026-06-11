import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { executeSmartCollection } from "@/lib/smart-collections";

/** POST /api/collections/[id]/refresh — 手动刷新智能收藏夹 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!collection.isSmart || !collection.rules) {
    return NextResponse.json({ error: "Not a smart collection" }, { status: 400 });
  }

  // Clear existing entries
  await prisma.collectionBookmark.deleteMany({ where: { collectionId: id } });

  // Re-run matching
  const bookmarks = await executeSmartCollection(userId, {
    rules: collection.rules,
    sortBy: collection.sortBy,
    sortOrder: collection.sortOrder,
    maxItems: collection.maxItems,
  });

  // Re-insert matched bookmarks
  if (bookmarks.length > 0) {
    await prisma.collectionBookmark.createMany({
      data: bookmarks.map((bm) => ({
        collectionId: id,
        bookmarkId: bm.id,
      })),
    });
  }

  return NextResponse.json({ data: { matchedCount: bookmarks.length } });
}
