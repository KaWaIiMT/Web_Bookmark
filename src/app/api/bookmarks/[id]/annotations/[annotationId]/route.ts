import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Update an annotation (color, note)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, annotationId } = await params;

    // Verify annotation ownership
    const existing = await prisma.annotation.findUnique({
      where: { id: annotationId },
    });
    if (!existing || existing.userId !== userId || existing.bookmarkId !== id) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    const body = await req.json();
    const { color, note } = body;

    if (color && !["yellow", "green", "blue", "red"].includes(color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }

    const annotation = await prisma.annotation.update({
      where: { id: annotationId },
      data: {
        ...(color !== undefined && { color }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json(annotation);
  } catch (err) {
    console.error("PATCH /api/bookmarks/[id]/annotations/[annotationId] error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete an annotation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, annotationId } = await params;

    // Verify annotation ownership
    const existing = await prisma.annotation.findUnique({
      where: { id: annotationId },
    });
    if (!existing || existing.userId !== userId || existing.bookmarkId !== id) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    await prisma.annotation.delete({ where: { id: annotationId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/bookmarks/[id]/annotations/[annotationId] error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
