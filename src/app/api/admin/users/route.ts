import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { select: { bookmarks: true } },
        accounts: {
          select: { provider: true, providerAccountId: true },
          where: { provider: "github" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt,
      bookmarkCount: u._count.bookmarks,
      githubAccount: u.accounts[0] ?? null,
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
