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
