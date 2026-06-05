import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { analyzeLearningPath } from "@/lib/learning-path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            bookmark: { include: { tags: { include: { tag: true } } } },
          },
        },
      },
    });
    if (!path) return NextResponse.json({ error: "Path not found" }, { status: 404 });

    const targetTopic = path.targetTags ? JSON.parse(path.targetTags).join(", ") : path.title;

    const bookmarks = path.items.map((item) => ({
      id: item.bookmark.id,
      title: item.bookmark.title,
      description: item.bookmark.description,
      aiSummary: item.bookmark.aiSummary,
      tags: item.bookmark.tags.map((t) => t.tag.name),
    }));

    const result = await analyzeLearningPath(targetTopic, bookmarks);

    // If AI returned results, update items with difficulty/stage data
    if (result) {
      for (const stage of result.stages) {
        for (const si of stage.items) {
          const existing = path.items.find((i) => i.bookmarkId === si.bookmarkId);
          if (existing) {
            await prisma.learningPathItem.update({
              where: { id: existing.id },
              data: {
                stage: stage.name,
                difficulty: si.difficulty,
                estimatedMinutes: si.estimatedMinutes,
              },
            });
          }
        }
      }
    }

    return NextResponse.json(result || { stages: [], gaps: [] });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
