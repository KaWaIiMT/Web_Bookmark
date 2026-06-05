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

    const [total, unread, reading, read, archived] = await Promise.all([
      prisma.bookmark.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId, status: "unread" } }),
      prisma.bookmark.count({ where: { userId, status: "reading" } }),
      prisma.bookmark.count({ where: { userId, status: "read" } }),
      prisma.bookmark.count({ where: { userId, status: "archived" } }),
    ]);

    // Top 10 tags by usage
    const topTags = await prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { bookmarks: { _count: "desc" } },
      take: 10,
    });

    // Content type distribution
    const byContentType = await prisma.bookmark.groupBy({
      by: ["contentType"],
      where: { userId },
      _count: true,
      orderBy: { _count: { contentType: "desc" } },
    });

    // Category distribution
    const byCategory = await prisma.bookmark.groupBy({
      by: ["categoryId"],
      where: { userId, categoryId: { not: null } },
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
    });
    const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Weekly trend
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    const [thisWeekCount, lastWeekCount] = await Promise.all([
      prisma.bookmark.count({
        where: { userId, createdAt: { gte: thisWeekStart, lte: now } },
      }),
      prisma.bookmark.count({
        where: { userId, createdAt: { gte: lastWeekStart, lt: lastWeekEnd } },
      }),
    ]);

    return NextResponse.json({
      total,
      unread,
      reading,
      read,
      archived,
      topTags: topTags.map((t) => ({ name: t.name, color: t.color, count: t._count.bookmarks })),
      byContentType: byContentType.map((c) => ({ type: c.contentType, count: c._count })),
      byCategory: byCategory.map((c) => ({
        name: categoryMap.get(c.categoryId!) || "未分类",
        count: c._count,
      })),
      weeklyTrend: {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
      },
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export type StatsResponse = {
  total: number;
  unread: number;
  reading: number;
  read: number;
  archived: number;
  topTags: { name: string; color: string | null; count: number }[];
  byContentType: { type: string; count: number }[];
  byCategory: { name: string; count: number }[];
  weeklyTrend: { thisWeek: number; lastWeek: number };
};
