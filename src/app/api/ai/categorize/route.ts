import { NextRequest, NextResponse } from "next/server";
import { categorizeBookmark } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, siteName, contentType } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const result = await categorizeBookmark({
      title,
      description: description || "",
      siteName: siteName || "",
      contentType: contentType || "webpage",
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI categorization failed";
    console.error("AI categorization error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
