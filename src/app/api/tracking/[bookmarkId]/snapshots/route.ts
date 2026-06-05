import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { takeSnapshot } from "@/lib/tracking";

// GET: Snapshots for a tracked bookmark
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { bookmarkId } = await params;

    const tracker = await prisma.hotnessTracker.findUnique({
      where: { bookmarkId, bookmark: { userId: session.user.id } },
    });
    if (!tracker) return NextResponse.json({ error: "Not tracking" }, { status: 404 });

    const snapshots = await prisma.hotnessSnapshot.findMany({
      where: { trackerId: tracker.id },
      orderBy: { timestamp: "desc" },
      take: 90, // up to 3 months daily
    });

    return NextResponse.json({ data: snapshots.reverse() });
  } catch (err) {
    console.error("GET snapshots error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Manually refresh tracking data
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { bookmarkId } = await params;

    const tracker = await prisma.hotnessTracker.findUnique({
      where: { bookmarkId, bookmark: { userId: session.user.id } },
    });
    if (!tracker) return NextResponse.json({ error: "Not tracking" }, { status: 404 });

    const snapshot = await takeSnapshot(bookmarkId);
    return NextResponse.json({
      success: true,
      changed: !!snapshot,
      snapshot,
    });
  } catch (err) {
    console.error("Refresh tracking error:", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
