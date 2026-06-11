import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { archivePage } from "@/lib/archiver";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Get archive statistics
async function handleGET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalBookmarks, archived, pending, failed, bookmarksWithArchive] = await Promise.all([
      prisma.bookmark.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId, archiveStatus: "success" } }),
      prisma.bookmark.count({ where: { userId, archiveStatus: "pending" } }),
      prisma.bookmark.count({ where: { userId, archiveStatus: { startsWith: "failed" } } }),
      // Get total archive size by summing text lengths of archived bookmarks
      prisma.bookmark.findMany({
        where: { userId, archiveStatus: "success" },
        select: { archiveHtml: true, archiveText: true },
      }),
    ]);

    // Estimate storage size
    const storageBytes = bookmarksWithArchive.reduce((sum, b) => {
      return sum + (b.archiveHtml?.length || 0) + (b.archiveText?.length || 0);
    }, 0);

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return NextResponse.json({
      totalBookmarks,
      archived,
      pending,
      failed,
      unarchived: totalBookmarks - archived - pending - failed,
      storageBytes,
      storageFormatted: formatSize(storageBytes),
    });
  } catch (err) {
    console.error("GET /api/bookmarks/archive error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Batch refresh archives for recent bookmarks
async function handlePOST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const days = body.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Find bookmarks created within the window that need archiving
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        createdAt: { gte: since },
        OR: [
          { archiveStatus: null },
          { archiveStatus: { startsWith: "failed" } },
        ],
      },
      select: { id: true, url: true },
      take: 50, // Batch limit
    });

    if (bookmarks.length === 0) {
      return NextResponse.json({ refreshed: 0, message: "所有近期书签已存档" });
    }

    // Mark all as pending
    await prisma.bookmark.updateMany({
      where: { id: { in: bookmarks.map((b) => b.id) } },
      data: { archiveStatus: "pending" },
    });

    // Archive in background (fire-and-forget)
    Promise.allSettled(
      bookmarks.map((b) =>
        archivePage(b.url)
          .then(({ html, text }) =>
            prisma.bookmark.update({
              where: { id: b.id },
              data: { archiveHtml: html, archiveText: text, archivedAt: new Date(), archiveStatus: "success" },
            })
          )
          .catch((e) => {
            const msg = e instanceof Error ? e.message : "unknown";
            return prisma.bookmark.update({
              where: { id: b.id },
              data: { archiveStatus: `failed: ${msg.slice(0, 200)}` },
            });
          })
      )
    ).catch(() => {});

    return NextResponse.json({ refreshed: bookmarks.length, message: `开始刷新 ${bookmarks.length} 篇书签存档` });
  } catch (err) {
    console.error("POST /api/bookmarks/archive error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function POST(req: NextRequest) {
  return handlePOST(req);
}
