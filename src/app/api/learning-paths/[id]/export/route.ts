import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportPathAsMarkdown } from "@/lib/learning-path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const markdown = await exportPathAsMarkdown(id, session.user.id);
    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="learning-path-${id.slice(0, 8)}.md"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
