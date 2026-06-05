import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { aiSummary: { contains: q } },
          { siteName: { contains: q } },
          { tags: { some: { tag: { name: { contains: q } } } } },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: bookmarks });
  } catch (err) {
    console.error("GET /api/search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
