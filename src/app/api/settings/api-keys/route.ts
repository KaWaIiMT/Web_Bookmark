import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/auth-helpers";

// List all API keys for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // We don't return the raw key — only masked versions for display
    return NextResponse.json({
      data: keys.map((k) => ({
        ...k,
        // Key is hashed in DB, so we can't show it. Display a placeholder.
        keyPreview: "****",
      })),
    });
  } catch (err) {
    console.error("GET /api/settings/api-keys error:", err);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

// Generate a new API key
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { rawKey, hashedKey } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId,
      },
    });

    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey, // Only returned once — user must copy now
        createdAt: apiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/settings/api-keys error:", err);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}
