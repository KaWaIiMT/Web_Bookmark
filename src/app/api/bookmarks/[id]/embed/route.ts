import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateAndCacheEmbedding, buildEmbeddingText } from "@/lib/embeddings";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const userId = session.user.id;

    const bookmark = await prisma.bookmark.findUnique({
      where: { id, userId },
      include: { tags: { include: { tag: true } } },
    });
    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    const text = buildEmbeddingText({
      title: bookmark.title,
      description: bookmark.description || undefined,
      aiSummary: bookmark.aiSummary || undefined,
      tags: bookmark.tags.map((t) => t.tag.name),
      siteName: bookmark.siteName || undefined,
    });

    const embedding = await generateAndCacheEmbedding(id, text, userId, prisma);
    return NextResponse.json({ dimensions: embedding.length });
  } catch (err) {
    console.error("POST /api/bookmarks/[id]/embed error:", err);
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
  }
}
