import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, decryptApiKey } from "@/lib/auth-helpers";

// Reveal a specific API key's full value
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fallback: if encryptedKey column doesn't exist, try without it
    let apiKey;
    try {
      apiKey = await prisma.apiKey.findUnique({
        where: { id },
        select: { id: true, userId: true, encryptedKey: true },
      });
    } catch {
      apiKey = await prisma.apiKey.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (apiKey.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const encrypted = (apiKey as any).encryptedKey;
    if (!encrypted) {
      return NextResponse.json({ error: "此密钥是在加密功能之前创建的。请生成一个新密钥。" }, { status: 400 });
    }

    try {
      return NextResponse.json({ key: decryptApiKey(encrypted) });
    } catch (e) {
      console.error(`Failed to decrypt apiKey ${id}:`, e);
      return NextResponse.json(
        { error: "此密钥无法解密（加密密钥可能已变更）。请生成一个新密钥。" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("GET /api/settings/api-keys/[id] error:", err);
    return NextResponse.json({ error: "Failed to reveal API key" }, { status: 500 });
  }
}

// Revoke a specific API key
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const apiKey = await prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (apiKey.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/settings/api-keys/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
