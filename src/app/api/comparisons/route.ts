import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { analyzeComparison } from "@/lib/comparisons";

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

// POST: Analyze comparison of 2-5 bookmarks
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { bookmarkIds } = await req.json();
    if (!Array.isArray(bookmarkIds) || bookmarkIds.length < 2 || bookmarkIds.length > 5) {
      return NextResponse.json({ error: "请选择 2-5 篇书签进行对比" }, { status: 400 });
    }

    // Fetch bookmarks with tags
    const bookmarks = await prisma.bookmark.findMany({
      where: { id: { in: bookmarkIds }, userId },
      include: { tags: { include: { tag: true } } },
    });

    if (bookmarks.length < 2) {
      return NextResponse.json({ error: "找不到足够的书签进行对比" }, { status: 404 });
    }

    const formatted = bookmarks.map((b) => ({
      id: b.id,
      title: b.title,
      url: b.url,
      description: b.description,
      aiSummary: b.aiSummary,
      siteName: b.siteName,
      contentType: b.contentType,
      tags: b.tags.map((t) => t.tag.name),
      createdAt: b.createdAt.toISOString(),
    }));

    const result = await analyzeComparison(formatted);

    // Save to comparison history
    const comparison = await prisma.comparison.create({
      data: {
        userId,
        result: JSON.stringify(result),
        bookmarks: {
          create: bookmarkIds.map((id) => ({ bookmarkId: id })),
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
    console.error("Comparison error:", err);
    return NextResponse.json({ error: "对比分析失败，请重试" }, { status: 500 });
  }
}
