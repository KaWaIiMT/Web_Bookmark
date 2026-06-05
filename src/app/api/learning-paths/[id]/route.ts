import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Single path with all items and notes
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({
      where: { id, userId: session.user.id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            bookmark: true,
            notes: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(path);
  } catch (err) {
    console.error("GET /api/learning-paths/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update path metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const { title, description, status, targetTags } = await req.json();
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) { data.status = status; if (status === "completed") data.completedAt = new Date(); }
    if (targetTags !== undefined) data.targetTags = JSON.stringify(targetTags);

    const path = await prisma.learningPath.update({
      where: { id, userId: session.user.id },
      data,
      include: { items: { include: { bookmark: true, notes: true } } },
    });

    return NextResponse.json(path);
  } catch (err) {
    console.error("PATCH /api/learning-paths/[id] error:", err);
    return NextResponse.json({ error: "Failed to update path" }, { status: 500 });
  }
}

// DELETE: Remove path
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    await prisma.learningPath.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/learning-paths/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
