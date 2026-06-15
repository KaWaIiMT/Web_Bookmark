import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

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

const ENCRYPTION_KEY = (process.env.API_KEY_ENCRYPTION_KEY || process.env.AUTH_SECRET || "fallback-encryption-key-32chrs").slice(0, 32).padEnd(32, "0");
const ENCRYPTION_IV = Buffer.from(createHash("sha256").update("markbox-iv").digest()).subarray(0, 16);

function encrypt(text: string): string {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "utf-8"), ENCRYPTION_IV);
  return cipher.update(text, "utf-8", "hex") + cipher.final("hex");
}

function decrypt(encrypted: string): string {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "utf-8"), ENCRYPTION_IV);
  return decipher.update(encrypted, "hex", "utf-8") + decipher.final("utf-8");
}

/**
 * Generate a new API key. Stores the raw key encrypted (reversible) so users
 * can view it later from the settings page.
 */
export function generateApiKey(): { rawKey: string; hashedKey: string; encryptedKey: string } {
  const raw = randomBytes(48).toString("hex");
  const rawKey = `mb_${raw}`;
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  const encryptedKey = encrypt(rawKey);
  return { rawKey, hashedKey, encryptedKey };
}

/**
 * Decrypt an API key stored in the database so it can be shown to the user.
 */
export function decryptApiKey(encryptedKey: string): string {
  return decrypt(encryptedKey);
}

/**
 * Mask an API key for display: mb_a1b2...c3d4 (first 5 + last 4 chars)
 */
export function maskApiKey(rawKey: string): string {
  if (rawKey.length <= 8) return rawKey;
  return `${rawKey.slice(0, 5)}****...${rawKey.slice(-4)}`;
}
