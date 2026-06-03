import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: [] });

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { bookmarks: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: tags });
  } catch (err) {
    console.error("GET /api/tags error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
