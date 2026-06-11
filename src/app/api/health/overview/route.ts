import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [healthy, redirect, broken, unknown_, total, brokenList] = await Promise.all([
      prisma.bookmark.count({ where: { userId, linkStatus: "healthy" } }),
      prisma.bookmark.count({ where: { userId, linkStatus: "redirect" } }),
      prisma.bookmark.count({ where: { userId, linkStatus: "broken" } }),
      prisma.bookmark.count({
        where: { userId, OR: [{ linkStatus: null }, { linkStatus: "unknown" }] },
      }),
      prisma.bookmark.count({ where: { userId } }),
      // Get broken links with archive status
      prisma.bookmark.findMany({
        where: { userId, linkStatus: "broken" },
        select: {
          id: true,
          title: true,
          url: true,
          linkStatusCode: true,
          linkCheckedAt: true,
          linkRedirectUrl: true,
          archiveStatus: true,
        },
        orderBy: { linkCheckedAt: "desc" },
        take: 20,
      }),
    ]);

    // Also get redirect links
    const redirectList = await prisma.bookmark.findMany({
      where: { userId, linkStatus: "redirect" },
      select: {
        id: true,
        title: true,
        url: true,
        linkStatusCode: true,
        linkCheckedAt: true,
        linkRedirectUrl: true,
      },
      orderBy: { linkCheckedAt: "desc" },
      take: 10,
    });

    const lastCheck = await prisma.bookmark.findFirst({
      where: { userId, linkCheckedAt: { not: null } },
      orderBy: { linkCheckedAt: "desc" },
      select: { linkCheckedAt: true },
    });

    return NextResponse.json({
      total,
      healthy,
      redirect,
      broken,
      unknown: unknown_,
      lastCheckAt: lastCheck?.linkCheckedAt?.toISOString() || null,
      brokenLinks: brokenList.map((b) => ({
        ...b,
        hasArchive: b.archiveStatus === "success",
        linkCheckedAt: b.linkCheckedAt?.toISOString() || null,
      })),
      redirectLinks: redirectList.map((r) => ({
        ...r,
        linkCheckedAt: r.linkCheckedAt?.toISOString() || null,
      })),
    });
  } catch (err) {
    console.error("GET /api/health/overview error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
