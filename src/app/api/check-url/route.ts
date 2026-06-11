import { NextRequest, NextResponse } from "next/server";

// HEAD-check a URL to determine if it's still accessible
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate URL
  let validatedUrl: string;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }
    validatedUrl = parsed.href;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(validatedUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "MarkBox-LinkChecker/1.0",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      ok: false,
      status: isTimeout ? 408 : 0,
      statusText: isTimeout ? "Request Timeout" : "Network Error",
    });
  }
}
