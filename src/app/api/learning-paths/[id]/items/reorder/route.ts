import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    const { orderedIds } = await req.json();
    if (!Array.isArray(orderedIds)) return NextResponse.json({ error: "orderedIds required" }, { status: 400 });

    await prisma.$transaction(
      orderedIds.map((itemId: string, index: number) =>
        prisma.learningPathItem.update({
          where: { id: itemId, pathId: id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
