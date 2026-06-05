import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (origin && isAllowedOrigin(origin)) {
      setCorsHeaders(response, origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
    return response;
  }

  // For normal requests, add CORS headers if origin matches
  const response = NextResponse.next();
  if (origin && isAllowedOrigin(origin)) {
    setCorsHeaders(response, origin);
  }
  return response;
}

function isAllowedOrigin(origin: string): boolean {
  // Allow localhost (dev)
  if (origin.startsWith("http://localhost")) return true;
  // Allow chrome extension origins (dev + prod)
  if (origin.startsWith("chrome-extension://")) return true;
  // Allow the app's own origin (same-origin doesn't send Origin header anyway)
  if (origin === process.env.NEXT_PUBLIC_APP_URL) return true;
  return false;
}

function setCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
}

export const config = {
  matcher: "/api/:path*",
};
