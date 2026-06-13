import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractReadable } from "@/lib/readable";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Get readable content for a bookmark
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1: Auth
  let userId: string | null;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (err) {
    console.error("[readable] auth error:", err);
    return NextResponse.json(
      { error: "身份验证失败" },
      { status: 500 }
    );
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 2: Get params + bookmark
  let id: string;
  try {
    const p = await params;
    id = p.id;
  } catch (err) {
    console.error("[readable] params error:", err);
    return NextResponse.json(
      { error: "参数解析失败" },
      { status: 500 }
    );
  }

  let bookmark: { id: string; url: string; title: string; archiveHtml: string | null } | null;
  try {
    bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      select: { id: true, url: true, title: true, archiveHtml: true },
    });
  } catch (err) {
    console.error("[readable] db error:", err);
    return NextResponse.json(
      { error: "数据库查询失败" },
      { status: 500 }
    );
  }
  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  // Step 3: Try Readability extraction
  let readableErr: string | null = null;
  try {
    const readable = await extractReadable(bookmark.url);
    return NextResponse.json(readable);
  } catch (err) {
    readableErr = err instanceof Error ? err.message : String(err);
    console.warn("[readable] extraction failed:", readableErr);
  }

  // Step 4: Fallback to archive HTML
  if (bookmark.archiveHtml) {
    try {
      const stripped = bookmark.archiveHtml.replace(/<[^>]*>/g, "");
      return NextResponse.json({
        title: bookmark.title,
        content: bookmark.archiveHtml,
        textContent: stripped.replace(/\s+/g, " ").trim().slice(0, 50000),
        excerpt: stripped.slice(0, 200).trim(),
        byline: null,
        siteName: null,
        length: bookmark.archiveHtml.length,
        source: "archive",
      });
    } catch (err) {
      console.error("[readable] archive fallback error:", err);
      return NextResponse.json(
        { error: "归档内容解析失败" },
        { status: 500 }
      );
    }
  }

  // Step 5: Nothing worked
  return NextResponse.json(
    { error: readableErr || "无法提取正文内容，建议先归档该网页" },
    { status: 503 }
  );
}
