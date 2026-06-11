import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

/**
 * Get the authenticated user ID from a request.
 * Tries session-based auth first (NextAuth), falls back to API key
 * from the Authorization header.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  // 1. Try session-based auth (works for same-origin web app)
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // 2. Try API key from Authorization header (for browser extension, etc.)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice(7);
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });
    if (apiKey) {
      // Update lastUsedAt asynchronously (don't block the request)
      prisma.apiKey
        .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
        .catch((e) => console.error("Failed to update apiKey lastUsedAt:", e));
      return apiKey.userId;
    }
  }

  return null;
}

/**
 * Generate a new API key. Returns the raw key (only shown once) and stores
 * the SHA-256 hash in the database.
 */
export function generateApiKey(): { rawKey: string; hashedKey: string } {
  const raw = randomBytes(48).toString("hex");
  const rawKey = `mb_${raw}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, hashedKey };
}

/**
 * Mask an API key for display: mb_a1b2...c3d4 (first 2 + last 4 chars)
 */
export function maskApiKey(rawKey: string): string {
  if (rawKey.length <= 8) return rawKey;
  return `${rawKey.slice(0, 5)}****...${rawKey.slice(-4)}`;
}
