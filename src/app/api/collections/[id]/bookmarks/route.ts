import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Get bookmarks in a collection
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const bookmarks = await prisma.collectionBookmark.findMany({
      where: { collectionId: id, collection: { userId } },
      include: {
        bookmark: {
          include: {
            tags: { include: { tag: true } },
            category: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({
      data: bookmarks.map((cb) => cb.bookmark),
    });
  } catch (err) {
    console.error("GET collection bookmarks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add bookmark to collection
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { bookmarkId } = await req.json();

    if (!bookmarkId) return NextResponse.json({ error: "bookmarkId required" }, { status: 400 });

    // Verify collection ownership
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Verify bookmark ownership
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark || bookmark.userId !== userId) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const entry = await prisma.collectionBookmark.create({
      data: { collectionId: id, bookmarkId },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("Add to collection error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
