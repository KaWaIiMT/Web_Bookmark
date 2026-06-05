import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    // Tags are scoped to user — unauthenticated returns empty
    if (!userId) return NextResponse.json({ data: [] });

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
