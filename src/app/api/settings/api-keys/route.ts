import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { generateApiKey, decryptApiKey, maskApiKey } from "@/lib/auth-helpers";

// List all API keys for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fallback: if encryptedKey column doesn't exist yet on Turso, select without it
    let keys;
    try {
      keys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          encryptedKey: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Column doesn't exist yet — fall back to basic fields
      keys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      data: keys.map((k: any) => ({
        id: k.id,
        name: k.name,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
        keyPreview: k.encryptedKey ? maskApiKey(decryptApiKey(k.encryptedKey)) : "****",
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

    const { rawKey, hashedKey, encryptedKey } = generateApiKey();

    // Fallback: if encryptedKey column doesn't exist on Turso, create without it
    let apiKey;
    try {
      apiKey = await prisma.apiKey.create({
        data: {
          name,
          key: hashedKey,
          encryptedKey,
          userId,
        },
      });
    } catch (e: any) {
      if (e?.code === "P2022" || (e?.message && e.message.includes("encryptedKey"))) {
        // Column doesn't exist — create without encrypted key
        apiKey = await prisma.apiKey.create({
          data: {
            name,
            key: hashedKey,
            userId,
          },
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,
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
