import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, unread, reading, read, archived] = await Promise.all([
      prisma.bookmark.count(),
      prisma.bookmark.count({ where: { status: "unread" } }),
      prisma.bookmark.count({ where: { status: "reading" } }),
      prisma.bookmark.count({ where: { status: "read" } }),
      prisma.bookmark.count({ where: { status: "archived" } }),
    ]);

    // Top 10 tags by usage
    const topTags = await prisma.tag.findMany({
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { bookmarks: { _count: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      total,
      unread,
      reading,
      read,
      archived,
      topTags: topTags.map((t) => ({ name: t.name, count: t._count.bookmarks })),
    });
  } catch (err) {
    console.error("GET /api/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
