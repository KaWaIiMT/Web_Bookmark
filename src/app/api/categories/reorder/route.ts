import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
    }

    // Only reorder the user's own categories
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id, userId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/categories/reorder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
