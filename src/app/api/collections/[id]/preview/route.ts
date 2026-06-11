import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { previewSmartCollection } from "@/lib/smart-collections";
import type { SmartCollectionRules } from "@/lib/smart-collections";

/** GET /api/collections/[id]/preview — 预览已保存的智能收藏夹匹配结果 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection || collection.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!collection.isSmart || !collection.rules) {
    return NextResponse.json({ error: "Not a smart collection" }, { status: 400 });
  }

  const rules = JSON.parse(collection.rules) as SmartCollectionRules;
  const result = await previewSmartCollection(userId, rules);

  return NextResponse.json({ data: result });
}

/** POST /api/collections/[id]/preview — 预览临时规则（保存前） */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rules } = await req.json();
  if (!rules || !rules.conditions) {
    return NextResponse.json({ error: "Invalid rules" }, { status: 400 });
  }

  const result = await previewSmartCollection(userId, rules as SmartCollectionRules);
  return NextResponse.json({ data: result });
}
