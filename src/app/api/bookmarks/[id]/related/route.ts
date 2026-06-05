import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRelatedBookmarks } from "@/lib/recommendations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const related = await getRelatedBookmarks(id, session.user.id, 5);
    return NextResponse.json({ data: related });
  } catch (err) {
    console.error("GET /api/bookmarks/[id]/related error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
