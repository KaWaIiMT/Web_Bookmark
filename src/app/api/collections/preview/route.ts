import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { previewSmartCollection } from "@/lib/smart-collections";
import type { SmartCollectionRules } from "@/lib/smart-collections";

/** POST /api/collections/preview — 预览临时规则（无需保存） */
export async function POST(req: NextRequest) {
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
