import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** POST /api/chat/messages/[id]/feedback — 提交消息反馈（👍/👎） */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { feedback } = await req.json();

  if (!["positive", "negative"].includes(feedback)) {
    return NextResponse.json({ error: "feedback must be 'positive' or 'negative'" }, { status: 400 });
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id },
    include: { session: { select: { userId: true } } },
  });

  if (!message || message.session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chatMessage.update({
    where: { id },
    data: { feedback },
  });

  return NextResponse.json({ success: true });
}
