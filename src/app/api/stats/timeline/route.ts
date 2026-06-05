import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Group by year-month
    const groups: Record<string, { year: number; month: number; label: string; bookmarks: typeof bookmarks }> = {};

    for (const b of bookmarks) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups[key]) {
        const monthLabels = [
          "1 月", "2 月", "3 月", "4 月", "5 月", "6 月",
          "7 月", "8 月", "9 月", "10 月", "11 月", "12 月",
        ];
        groups[key] = {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: `${d.getFullYear()} 年 ${monthLabels[d.getMonth()]}`,
          bookmarks: [],
        };
      }
      groups[key].bookmarks.push(b);
    }

    return NextResponse.json({
      groups: Object.values(groups),
    });
  } catch (err) {
    console.error("GET /api/stats/timeline error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
