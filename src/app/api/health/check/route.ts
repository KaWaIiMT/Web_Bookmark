import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkLinkHealth, needsConfirm } from "@/lib/health-checker";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Trigger batch health check for active bookmarks
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find active bookmarks that need checking
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        OR: [
          // Recently created
          { createdAt: { gte: thirtyDaysAgo } },
          // Active statuses
          { status: { in: ["unread", "reading"] } },
          // Not checked recently (last 2 hours)
          { linkCheckedAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
          { linkCheckedAt: null },
        ],
      },
      select: { id: true, url: true, title: true, linkStatus: true },
      orderBy: { linkCheckedAt: { sort: "asc", nulls: "first" } },
      take: 50, // Batch limit
    });

    if (bookmarks.length === 0) {
      return NextResponse.json({ checked: 0, message: "所有书签检查时间不到 2 小时" });
    }

    // Run checks with rate limiting (max 5 concurrent)
    const CONCURRENCY = 5;
    let checked = 0;

    for (let i = 0; i < bookmarks.length; i += CONCURRENCY) {
      const batch = bookmarks.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (bm) => {
          const deepCheck = Math.random() < 0.1; // 10% deep check
          const result = await checkLinkHealth(bm.url, bm.title || undefined, deepCheck);

          const prevStatus = bm.linkStatus as "healthy" | "redirect" | "broken" | "unknown" | null;
          const isBroken = result.status === "broken";

          // Two-confirm for broken links
          if (isBroken && needsConfirm("broken", prevStatus)) {
            // First broken detection — mark as unknown pending confirmation
            await prisma.bookmark.update({
              where: { id: bm.id },
              data: {
                linkStatus: "unknown",
                linkStatusCode: result.code,
                linkCheckedAt: new Date(),
                linkCheckError: result.error || null,
                linkRedirectUrl: result.redirectUrl || null,
              },
            });
          } else {
            const finalStatus = result.status as "healthy" | "redirect" | "broken" | "unknown";
            await prisma.bookmark.update({
              where: { id: bm.id },
              data: {
                linkStatus: finalStatus,
                linkStatusCode: result.code,
                linkCheckedAt: new Date(),
                linkCheckError: result.error || null,
                linkRedirectUrl: result.redirectUrl || null,
                linkTitleChanged: result.titleChanged ?? null,
              },
            });
          }
          checked++;
        })
      );
    }

    return NextResponse.json({ checked, message: `已检查 ${checked} 条书签链接` });
  } catch (err) {
    console.error("POST /api/health/check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
