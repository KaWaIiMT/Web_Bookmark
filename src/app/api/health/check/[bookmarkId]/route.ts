import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkLinkHealth } from "@/lib/health-checker";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Check a single bookmark's link health
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookmarkId } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId, userId },
      select: { id: true, url: true, title: true, linkStatus: true },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const result = await checkLinkHealth(bookmark.url, bookmark.title || undefined, false);

    // Apply two-confirm filter — transient errors should not immediately mark as broken
    const prevStatus = bookmark.linkStatus as string | null;
    const finalStatus =
      result.status === "broken" && prevStatus !== "broken"
        ? "unknown" // Pending confirmation
        : result.status;

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        linkStatus: finalStatus,
        linkStatusCode: result.code,
        linkCheckedAt: new Date(),
        linkCheckError: result.error || null,
        linkRedirectUrl: result.redirectUrl || null,
        linkTitleChanged: result.titleChanged ?? null,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/health/check/[bookmarkId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
