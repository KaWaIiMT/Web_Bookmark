import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { archivePage } from "@/lib/archiver";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Trigger archive for a bookmark
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({ where: { id, userId } });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Set status to pending
    await prisma.bookmark.update({
      where: { id },
      data: { archiveStatus: "pending" },
    });

    // Run archive (synchronous for now; Phase 3 will make this async)
    try {
      const { html, text } = await archivePage(bookmark.url);

      await prisma.bookmark.update({
        where: { id },
        data: {
          archiveHtml: html,
          archiveText: text,
          archivedAt: new Date(),
          archiveStatus: "success",
        },
      });

      return NextResponse.json({
        status: "success",
        archivedAt: new Date().toISOString(),
      });
    } catch (archiveErr) {
      const errorMessage =
        archiveErr instanceof Error ? archiveErr.message : "Archive failed";

      await prisma.bookmark.update({
        where: { id },
        data: { archiveStatus: `failed: ${errorMessage.slice(0, 200)}` },
      });

      return NextResponse.json(
        { status: "failed", error: errorMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("POST /api/bookmarks/[id]/archive error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get archive content for a bookmark
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      select: {
        archiveHtml: true,
        archiveText: true,
        archivedAt: true,
        archiveStatus: true,
        url: true,
        title: true,
      },
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({
      html: bookmark.archiveHtml,
      text: bookmark.archiveText,
      archivedAt: bookmark.archivedAt?.toISOString() || null,
      status: bookmark.archiveStatus,
      originalUrl: bookmark.url,
      title: bookmark.title,
    });
  } catch (err) {
    console.error("GET /api/bookmarks/[id]/archive error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
