import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
    }

    // Update order for each category in a transaction
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
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
