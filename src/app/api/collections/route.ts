import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// List user's collections
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { bookmarks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: collections });
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create collection
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const userId = session.user.id;

    const collection = await prisma.collection.create({
      data: { name, slug, userId },
      include: { _count: { select: { bookmarks: true } } },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (err) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
