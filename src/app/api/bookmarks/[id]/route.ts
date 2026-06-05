import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json(bookmark);
  } catch (err) {
    console.error("GET /api/bookmarks/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, categoryId, readAt, title, description } = body;

    if (status && !["unread", "reading", "read", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const bookmark = await prisma.bookmark.update({
      where: { id, userId },
      data: {
        ...(status && { status }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(readAt !== undefined && { readAt: readAt ? new Date(readAt) : null }),
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    });

    return NextResponse.json(bookmark);
  } catch (err) {
    console.error("PATCH /api/bookmarks/[id] error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bookmarks/[id] error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
