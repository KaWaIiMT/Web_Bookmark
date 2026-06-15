import { prisma } from "@/lib/prisma";

/**
 * Parse ADMIN_GITHUB_IDS into a Set of numeric ID strings.
 * Cached at module scope for the lifetime of the server instance.
 */
function getAdminGithubIds(): Set<string> {
  const raw = process.env.ADMIN_GITHUB_IDS || "";
  return new Set(
    raw.split(",").map((s) => s.trim()).filter(Boolean)
  );
}

/**
 * Check if a user (by database user ID) is an admin.
 * Queries the Account table for a GitHub-linked account and
 * compares the providerAccountId against the configured admin IDs.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminIds = getAdminGithubIds();
  if (adminIds.size === 0) return false;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { providerAccountId: true },
  });

  if (!account) return false;
  return adminIds.has(account.providerAccountId);
}
