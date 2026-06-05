import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: List user's learning paths
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const paths = await prisma.learningPath.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        items: { take: 1, orderBy: { order: "asc" }, include: { bookmark: { select: { coverImage: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: paths });
  } catch (err) {
    console.error("GET /api/learning-paths error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new learning path
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { title, description, targetTags } = await req.json();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const path = await prisma.learningPath.create({
      data: {
        userId,
        title,
        description: description || null,
        targetTags: targetTags ? JSON.stringify(targetTags) : null,
      },
    });

    return NextResponse.json(path, { status: 201 });
  } catch (err) {
    console.error("POST /api/learning-paths error:", err);
    return NextResponse.json({ error: "Failed to create path" }, { status: 500 });
  }
}
