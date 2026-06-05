import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseGitHubUrl } from "@/lib/tracking";

// GET: List all tracking configs with latest snapshot
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const configs = await prisma.hotnessTracker.findMany({
      where: { bookmark: { userId: session.user.id } },
      include: {
        bookmark: { select: { id: true, title: true, url: true, favicon: true, coverImage: true } },
        snapshots: { orderBy: { timestamp: "desc" }, take: 30 },
        _count: { select: { snapshots: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: configs });
  } catch (err) {
    console.error("GET tracking configs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Start tracking a bookmark
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookmarkId } = await req.json();
    if (!bookmarkId) return NextResponse.json({ error: "bookmarkId required" }, { status: 400 });

    // Verify bookmark ownership
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });
    if (!bookmark || bookmark.userId !== session.user.id) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Check if it's a GitHub URL
    const sourceType = parseGitHubUrl(bookmark.url) ? "github" : "webpage";

    // Check for existing tracker
    const existing = await prisma.hotnessTracker.findUnique({ where: { bookmarkId } });
    if (existing) return NextResponse.json(existing);

    const tracker = await prisma.hotnessTracker.create({
      data: { bookmarkId, sourceType },
    });

    return NextResponse.json(tracker, { status: 201 });
  } catch (err) {
    console.error("POST tracking config error:", err);
    return NextResponse.json({ error: "Failed to start tracking" }, { status: 500 });
  }
}
