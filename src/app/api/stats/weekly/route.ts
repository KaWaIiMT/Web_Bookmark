import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";
import { zhCN } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const [
      thisWeekTotal,
      thisWeekUnread,
      thisWeekReading,
      thisWeekRead,
      thisWeekArchived,
      lastWeekTotal,
    ] = await Promise.all([
      prisma.bookmark.count({ where: { userId, createdAt: { gte: thisWeekStart, lte: now } } }),
      prisma.bookmark.count({ where: { userId, status: "unread", createdAt: { gte: thisWeekStart, lte: now } } }),
      prisma.bookmark.count({ where: { userId, status: "reading", createdAt: { gte: thisWeekStart, lte: now } } }),
      prisma.bookmark.count({ where: { userId, status: "read", createdAt: { gte: thisWeekStart, lte: now } } }),
      prisma.bookmark.count({ where: { userId, status: "archived", createdAt: { gte: thisWeekStart, lte: now } } }),
      prisma.bookmark.count({ where: { userId, createdAt: { gte: lastWeekStart, lt: thisWeekStart } } }),
    ]);

    // Top tags this week
    const topTags = await prisma.tag.findMany({
      where: { userId, bookmarks: { some: { bookmark: { createdAt: { gte: thisWeekStart, lte: now } } } } },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { bookmarks: { _count: "desc" } },
      take: 10,
    });

    const delta = thisWeekTotal - lastWeekTotal;
    const percentage = lastWeekTotal > 0 ? Math.round((delta / lastWeekTotal) * 100) : thisWeekTotal > 0 ? 100 : 0;

    return NextResponse.json({
      thisWeek: {
        total: thisWeekTotal,
        byStatus: {
          unread: thisWeekUnread,
          reading: thisWeekReading,
          read: thisWeekRead,
          archived: thisWeekArchived,
        },
        topTags: topTags.map((t) => ({ name: t.name, color: t.color, count: t._count.bookmarks })),
      },
      lastWeek: { total: lastWeekTotal },
      comparison: { delta, percentage },
      weekLabel: `${format(thisWeekStart, "M 月 d 日", { locale: zhCN })} — ${format(thisWeekEnd, "M 月 d 日", { locale: zhCN })}`,
    });
  } catch (err) {
    console.error("GET /api/stats/weekly error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
