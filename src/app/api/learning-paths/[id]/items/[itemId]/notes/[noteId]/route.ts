import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, noteId } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    const { content, type } = await req.json();
    const data: Record<string, unknown> = {};
    if (content !== undefined) data.content = content;
    if (type !== undefined) data.type = type;

    const note = await prisma.pathNote.update({ where: { id: noteId }, data });
    return NextResponse.json(note);
  } catch (err) {
    console.error("PATCH note error:", err);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, noteId } = await params;

    const path = await prisma.learningPath.findUnique({ where: { id, userId: session.user.id } });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    await prisma.pathNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE note error:", err);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
