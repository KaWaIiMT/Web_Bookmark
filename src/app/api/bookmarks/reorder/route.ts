import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
    }

    // Verify all bookmarks belong to this user
    const userId = session.user.id;
    const owned = await prisma.bookmark.findMany({
      where: { id: { in: orderedIds }, userId },
      select: { id: true },
    });

    if (owned.length !== orderedIds.length) {
      return NextResponse.json({ error: "Some bookmarks not found" }, { status: 400 });
    }

    // Use a transaction so partial failure rolls back
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.bookmark.update({
          where: { id, userId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/bookmarks/reorder error:", err);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
