import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// List user's collections
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        _count: { select: { bookmarks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: collections });
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create collection
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, isSmart, rules, sortBy, sortOrder, maxItems } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        userId,
        ...(isSmart !== undefined && { isSmart }),
        ...(rules !== undefined && { rules: typeof rules === "string" ? rules : JSON.stringify(rules) }),
        ...(sortBy !== undefined && { sortBy }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(maxItems !== undefined && { maxItems }),
      },
      include: { _count: { select: { bookmarks: true } } },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (err) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
