import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

const COLOR_LABELS: Record<string, string> = {
  yellow: "🟡 重点",
  green: "🟢 好观点",
  blue: "🔵 疑问",
  red: "🔴 需验证",
};

// Export annotations as Markdown
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      select: { id: true, title: true, url: true },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const annotations = await prisma.annotation.findMany({
      where: { bookmarkId: id, userId },
      orderBy: { createdAt: "asc" },
    });

    if (annotations.length === 0) {
      return NextResponse.json({ error: "No annotations to export" }, { status: 404 });
    }

    // Group by color
    const byColor: Record<string, typeof annotations> = {};
    for (const a of annotations) {
      const key = a.color || "none";
      if (!byColor[key]) byColor[key] = [];
      byColor[key].push(a);
    }

    // Count by color for summary
    const counts = Object.entries(byColor)
      .filter(([k]) => k !== "none")
      .map(([k, v]) => `${COLOR_LABELS[k]?.split(" ")[0] || k} ${v.length}`)
      .join(" · ");

    // Build Markdown
    let md = `# 批注：《${bookmark.title}》\n`;
    md += `> 导出时间：${new Date().toISOString().slice(0, 10)}\n`;
    md += `> 共 ${annotations.length} 条批注${counts ? `（${counts}）` : ""}\n`;
    md += `> 原文：${bookmark.url}\n\n`;

    const colorOrder = ["yellow", "green", "blue", "red", "none"];
    let index = 0;

    for (const color of colorOrder) {
      const items = byColor[color];
      if (!items || items.length === 0) continue;

      const label = COLOR_LABELS[color] || "📝 笔记";
      md += `## ${label}\n\n`;

      for (const a of items) {
        index++;
        md += `${index}. > ${a.text.replace(/\n/g, "\n   > ")}\n`;
        if (a.note) {
          md += `   💡 ${a.note.replace(/\n/g, "\n   ")}\n`;
        }
        md += "\n";
      }
    }

    const safeTitle = (bookmark.title || "untitled").replace(/["\\;:\n\r]/g, "").slice(0, 50);

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="annotations-${safeTitle}.md"`,
      },
    });
  } catch (err) {
    console.error("GET /api/bookmarks/[id]/annotations/export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
