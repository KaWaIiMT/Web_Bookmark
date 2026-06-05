import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. "Keep Going" — based on recent 7-day tags
    const recentTags = await prisma.bookmarkTag.groupBy({
      by: ["tagId"],
      where: { bookmark: { userId, createdAt: { gte: weekAgo } } },
      _count: true,
      orderBy: { _count: { tagId: "desc" } },
      take: 5,
    });
    const recentTagIds = recentTags.map((t) => t.tagId);

    const keepGoing = recentTagIds.length > 0
      ? await prisma.bookmark.findMany({
          where: {
            userId,
            tags: { some: { tagId: { in: recentTagIds } } },
            createdAt: { lt: weekAgo }, // not created this week
            status: "unread",
          },
          include: { tags: { include: { tag: true } }, category: true },
          take: 5,
        })
      : [];

    // 2. "Expand Horizon" — adjacent fields to top tags
    const expandHorizon = await prisma.bookmark.findMany({
      where: {
        userId,
        status: "unread",
        // Tags NOT in the user's top 5 recent tags
        NOT: recentTagIds.length > 0 ? { tags: { some: { tagId: { in: recentTagIds } } } } : undefined,
      },
      include: { tags: { include: { tag: true } }, category: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 3. "Revisit Old Gems" — bookmarks older than 30 days, unread, with AI summary
    const revisitGems = await prisma.bookmark.findMany({
      where: {
        userId,
        status: "unread",
        createdAt: { lt: monthAgo },
        aiSummary: { not: null },
      },
      include: { tags: { include: { tag: true } }, category: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    return NextResponse.json({
      keepGoing,
      expandHorizon,
      revisitGems,
    });
  } catch (err) {
    console.error("GET /api/recommendations/dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
