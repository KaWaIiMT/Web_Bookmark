import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get bookmarks in a collection
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const bookmarks = await prisma.collectionBookmark.findMany({
      where: { collectionId: id, collection: { userId: session.user.id } },
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
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { bookmarkId } = await req.json();

    if (!bookmarkId) return NextResponse.json({ error: "bookmarkId required" }, { status: 400 });

    // Verify collection ownership
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Verify bookmark ownership
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark || bookmark.userId !== session.user.id) {
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
