import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: Add bookmark to path
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    const { bookmarkId } = await req.json();
    if (!bookmarkId) return NextResponse.json({ error: "bookmarkId required" }, { status: 400 });

    // Get max order
    const maxOrder = await prisma.learningPathItem.aggregate({
      where: { pathId: id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const item = await prisma.learningPathItem.create({
      data: { pathId: id, bookmarkId, order: nextOrder },
      include: { bookmark: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error("POST /api/learning-paths/[id]/items error:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
