import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { bookmarks: true } },
        children: {
          include: { _count: { select: { bookmarks: true } } },
        },
      },
      where: { parentId: null },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ data: categories });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, parentId } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const category = await prisma.category.create({
      data: { name, slug, parentId: parentId || null, order: 0 },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Rename a category
export async function PATCH(req: NextRequest) {
  try {
    const { id, name } = await req.json();
    if (!id || !name || typeof name !== "string") {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });
    return NextResponse.json(category);
  } catch (err) {
    console.error("PATCH /api/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a category (bookmarks become uncategorized)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Unlink bookmarks first (set categoryId to null)
    await prisma.bookmark.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/categories error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
