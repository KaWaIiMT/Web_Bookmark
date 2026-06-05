import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST: Add note to item
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, itemId } = await params;

    // Verify ownership via path
    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    const { content, type = "takeaway" } = await req.json();
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

    const note = await prisma.pathNote.create({
      data: { itemId, content, type },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("POST note error:", err);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
