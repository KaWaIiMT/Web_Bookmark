import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Delete or update collection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { name, isPublic } = body;

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name, slug: name.toLowerCase().replace(/\s+/g, "-") }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: { _count: { select: { bookmarks: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH collection error:", err);
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

    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection || collection.userId !== userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE collection error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
