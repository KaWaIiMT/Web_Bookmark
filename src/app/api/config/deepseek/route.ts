import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Returns the DeepSeek API key for client-side comparison.
 * Auth-protected — only authenticated users can get the key.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 });
  }
  return NextResponse.json({ apiKey: key });
}
