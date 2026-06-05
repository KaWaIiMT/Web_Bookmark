import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.bookmark.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Reuse existing token if already shared
    if (existing.shareToken) {
      return NextResponse.json({
        shareToken: existing.shareToken,
        shareUrl: `/share/bookmark/${existing.shareToken}`,
      });
    }

    // Generate new token
    const shareToken = crypto.randomUUID();

    await prisma.bookmark.update({
      where: { id, userId },
      data: { shareToken },
    });

    return NextResponse.json({
      shareToken,
      shareUrl: `/share/bookmark/${shareToken}`,
    });
  } catch (err) {
    console.error("POST /api/bookmarks/[id]/share error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
