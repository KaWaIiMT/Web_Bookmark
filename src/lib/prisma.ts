import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const adapter = new PrismaLibSql({
  url: dbUrl,
  ...(authToken && { authToken }),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Cold-start: push schema to Turso on first invoke in production
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const { execSync } = require("child_process") as typeof import("child_process");
  try {
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "pipe",
      timeout: 30_000,
    });
    console.log("[prisma] Schema pushed to Turso ✅");
  } catch (e) {
    console.warn("[prisma] Schema push to Turso failed (may already be synced):", (e as Error).message?.slice(0, 120));
  }
}
