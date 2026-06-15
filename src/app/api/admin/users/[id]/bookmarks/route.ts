import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        url: true,
        title: true,
        description: true,
        coverImage: true,
        favicon: true,
        siteName: true,
        contentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tags: { include: { tag: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const count = await prisma.bookmark.count({ where: { userId: targetUserId } });

    return NextResponse.json({
      user: targetUser,
      bookmarks,
      pagination: { total: count, returned: bookmarks.length },
    });
  } catch (err) {
    console.error("GET /api/admin/users/[id]/bookmarks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
