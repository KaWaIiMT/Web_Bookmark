import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log("[prisma] TURSO_DATABASE_URL =", dbUrl);
console.log("[prisma] TURSO_AUTH_TOKEN exists =", !!authToken);

const libsql = createClient({
  url: dbUrl,
  ...(authToken && { authToken }),
});

const adapter = new PrismaLibSql({
  url: dbUrl,
  ...(authToken && { authToken }),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
