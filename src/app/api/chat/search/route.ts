import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { retrieveRelevantBookmarks } from "@/lib/chat";

/**
 * POST /api/chat/search — 非流式检索预览（QuickAsk 用）
 * Body: { query: string }
 */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const results = await retrieveRelevantBookmarks(userId, query, 8);

  return NextResponse.json({
    data: results.map((r) => ({
      id: r.id,
      title: r.title,
      snippet: r.aiSummary || r.description || "",
      siteName: r.siteName,
      contentType: r.contentType,
      relevanceScore: Math.round(r.score * 100) / 100,
    })),
  });
}
