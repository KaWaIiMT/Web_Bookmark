import { NextRequest, NextResponse } from "next/server";
import { extractMetadata } from "@/lib/metadata";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const metadata = await extractMetadata(url);
    return NextResponse.json(metadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
