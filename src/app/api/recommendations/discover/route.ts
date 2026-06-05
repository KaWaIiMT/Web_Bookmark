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
    const mode = req.nextUrl.searchParams.get("mode") || "serendipity";

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { tags: { include: { tag: true } }, category: true },
    });

    if (bookmarks.length < 3) return NextResponse.json({ data: [] });

    let results: typeof bookmarks;

    switch (mode) {
      case "trending": {
        // Most recent additions
        results = bookmarks.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 10);
        break;
      }
      case "daily": {
        // Pick a "daily pick" — random from the set
        const shuffled = [...bookmarks].sort(() => Math.random() - 0.5);
        results = shuffled.slice(0, 5);
        break;
      }
      case "serendipity":
      default: {
        // Cross-domain serendipity — pick bookmarks from diverse categories
        const byCategory = new Map<string, typeof bookmarks>();
        for (const b of bookmarks) {
          const catId = b.categoryId || "__none__";
          if (!byCategory.has(catId)) byCategory.set(catId, []);
          byCategory.get(catId)!.push(b);
        }
        const categories = [...byCategory.keys()].sort(() => Math.random() - 0.5);
        results = [];
        for (const cat of categories.slice(0, 5)) {
          const items = byCategory.get(cat)!;
          results.push(items[Math.floor(Math.random() * items.length)]);
        }
        break;
      }
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("GET /api/recommendations/discover error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
