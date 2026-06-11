import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** GET /api/chat/sessions — 列出当前用户的全部会话 */
export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: sessions });
}

/** POST /api/chat/sessions — 创建空白会话（可选） */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json().catch(() => ({}));
  const session = await prisma.chatSession.create({
    data: { userId, title: title || "新对话" },
  });

  return NextResponse.json({ data: session }, { status: 201 });
}
