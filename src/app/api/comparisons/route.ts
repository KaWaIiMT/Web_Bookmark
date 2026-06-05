import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { analyzeComparison } from "@/lib/comparisons";

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
    return NextResponse.json({
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        favicon: b.favicon,
        siteName: b.siteName,
        coverImage: b.coverImage,
      })),
      ...result,
    });
  } catch (err) {
    console.error("Comparison error:", err);
    return NextResponse.json({ error: "对比分析失败，请重试" }, { status: 500 });
  }
}
