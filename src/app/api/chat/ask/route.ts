import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantBookmarks, streamChatAnswer } from "@/lib/chat";

/**
 * POST /api/chat/ask — RAG问答（SSE 流式返回）
 * Body: { query: string, sessionId?: string }
 */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, sessionId } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // 1. Create or load session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const session = await prisma.chatSession.create({
      data: { userId, title: query.slice(0, 60) },
    });
    activeSessionId = session.id;
  }

  // 2. Store user message
  await prisma.chatMessage.create({
    data: { sessionId: activeSessionId, role: "user", content: query },
  });

  // 3. Retrieve candidates
  const candidates = await retrieveRelevantBookmarks(userId, query, 8);

  // 4. Build SSE stream
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let citations: any[] = [];

      try {
        for await (const event of streamChatAnswer(activeSessionId, query, candidates)) {
          // Check if this is the final return (has fullContent property)
          // streamChatAnswer yields strings; the final return is { fullContent, citations }
          if (typeof event === "string") {
            controller.enqueue(encoder.encode(event));
          } else {
            // This is the final return object
            const final = event as unknown as { fullContent: string; citations: unknown[] };
            fullContent = final.fullContent;
            citations = final.citations;
          }
        }
      } catch (err) {
        console.error("[chat/ask] Stream error:", err);
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "生成失败，请重试" })}\n\n`),
        );
      } finally {
        // Persist assistant message
        if (fullContent) {
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId: activeSessionId,
                role: "assistant",
                content: fullContent,
                citations: JSON.stringify(citations),
              },
            });
          } catch (e) {
            console.error("[chat/ask] Failed to persist message:", e);
          }
        }

        // Update session timestamp
        try {
          await prisma.chatSession.update({
            where: { id: activeSessionId },
            data: { updatedAt: new Date(), title: query.slice(0, 60) },
          });
        } catch {
          // ignore
        }

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
