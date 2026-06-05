import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH: Update item (completion, difficulty, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, itemId } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    const { isCompleted, difficulty, estimatedMinutes, isOptional, stage } = await req.json();
    const data: Record<string, unknown> = {};
    if (isCompleted !== undefined) { data.isCompleted = isCompleted; data.completedAt = isCompleted ? new Date() : null; }
    if (difficulty !== undefined) data.difficulty = difficulty;
    if (estimatedMinutes !== undefined) data.estimatedMinutes = estimatedMinutes;
    if (isOptional !== undefined) data.isOptional = isOptional;
    if (stage !== undefined) data.stage = stage;

    const item = await prisma.learningPathItem.update({
      where: { id: itemId, pathId: id },
      data,
      include: { bookmark: true, notes: true },
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("PATCH item error:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE: Remove item from path
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, itemId } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    await prisma.learningPathItem.delete({ where: { id: itemId, pathId: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE item error:", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
