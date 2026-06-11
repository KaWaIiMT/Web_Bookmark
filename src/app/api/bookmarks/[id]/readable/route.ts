import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractReadable } from "@/lib/readable";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Get readable content for a bookmark
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
      select: { id: true, url: true, title: true, archiveHtml: true },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Try Readability extraction first
    try {
      const readable = await extractReadable(bookmark.url);
      return NextResponse.json(readable);
    } catch (readableErr) {
      console.warn("Readability extraction failed, falling back:", readableErr);
    }

    // Fallback: use archive HTML if available
    if (bookmark.archiveHtml) {
      return NextResponse.json({
        title: bookmark.title,
        content: bookmark.archiveHtml,
        textContent: bookmark.archiveHtml.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 50000),
        excerpt: bookmark.archiveHtml.replace(/<[^>]*>/g, "").slice(0, 200).trim(),
        byline: null,
        siteName: null,
        length: bookmark.archiveHtml.length,
        source: "archive",
      });
    }

    return NextResponse.json(
      { error: "Unable to extract readable content. Try archiving this page first." },
      { status: 503 }
    );
  } catch (err) {
    console.error("GET /api/bookmarks/[id]/readable error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
