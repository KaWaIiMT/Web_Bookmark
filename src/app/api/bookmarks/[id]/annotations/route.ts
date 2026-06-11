import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// List all annotations for a bookmark
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      select: { id: true },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const annotations = await prisma.annotation.findMany({
      where: { bookmarkId: id, userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(annotations);
  } catch (err) {
    console.error("GET /api/bookmarks/[id]/annotations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create a new annotation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      select: { id: true },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type, color, text, note, anchor } = body;

    if (!type || !text || !anchor) {
      return NextResponse.json(
        { error: "type, text, and anchor are required" },
        { status: 400 }
      );
    }

    if (type !== "highlight" && type !== "note") {
      return NextResponse.json({ error: "type must be highlight or note" }, { status: 400 });
    }

    if (color && !["yellow", "green", "blue", "red"].includes(color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }

    const annotation = await prisma.annotation.create({
      data: {
        userId,
        bookmarkId: id,
        type,
        color: color || null,
        text,
        note: note || null,
        anchor: typeof anchor === "string" ? anchor : JSON.stringify(anchor),
      },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookmarks/[id]/annotations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
