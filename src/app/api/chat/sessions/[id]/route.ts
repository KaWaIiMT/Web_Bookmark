import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** GET /api/chat/sessions/[id] — 获取会话详情（含全部消息） */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...session,
      messages: session.messages.map((m) => ({
        ...m,
        citations: m.citations ? JSON.parse(m.citations) : null,
      })),
    },
  });
}

/** DELETE /api/chat/sessions/[id] — 删除会话（联级删除消息） */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chatSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
