import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: List comparison history
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const comparisons = await prisma.comparison.findMany({
      where: { userId },
      include: {
        bookmarks: {
          include: {
            bookmark: {
              select: { id: true, title: true, url: true, favicon: true, siteName: true, coverImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ data: comparisons });
  } catch (err) {
    console.error("Fetch comparisons error:", err);
    return NextResponse.json({ error: "Failed to fetch comparisons" }, { status: 500 });
  }
}

// POST: Save a comparison result (AI analysis done client-side to avoid Vercel timeout)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { bookmarkIds, result } = await req.json();

    if (!Array.isArray(bookmarkIds) || bookmarkIds.length < 2 || bookmarkIds.length > 5) {
      return NextResponse.json({ error: "请选择 2-5 篇书签进行对比" }, { status: 400 });
    }

    if (!result || typeof result !== "object") {
      return NextResponse.json({ error: "缺少对比结果 result" }, { status: 400 });
    }

    // Verify bookmarks belong to user
    const bookmarks = await prisma.bookmark.findMany({
      where: { id: { in: bookmarkIds }, userId },
      include: { tags: { include: { tag: true } } },
    });

    if (bookmarks.length < 2) {
      return NextResponse.json({ error: "找不到足够的书签进行对比" }, { status: 404 });
    }

    // Save to comparison history
    const comparison = await prisma.comparison.create({
      data: {
        userId,
        result: JSON.stringify(result),
        bookmarks: {
          create: bookmarkIds.map((id: string) => ({ bookmarkId: id })),
        },
      },
      include: {
        bookmarks: {
          include: {
            bookmark: {
              select: { id: true, title: true, url: true, favicon: true, siteName: true, coverImage: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: comparison.id,
      bookmarks: comparison.bookmarks.map((cb) => cb.bookmark),
      ...result,
    });
  } catch (err) {
    console.error("Comparison save error:", err);
    return NextResponse.json({ error: "保存对比结果失败，请重试" }, { status: 500 });
  }
}
