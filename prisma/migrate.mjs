// Database auto-migration — runs before every build on Vercel
// Handles schema changes safely so you never need to manually migrate again
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

async function main() {
  const url = TURSO_URL || "file:./prisma/dev.db";
  console.log("[migrate] DB:", TURSO_URL ? url.replace(/\/\/.*@/, "//***@") : url);

  const client = createClient({
    url,
    ...(TURSO_TOKEN && { authToken: TURSO_TOKEN }),
  });

  try {
    // Check if Category table exists (indicates this is not a fresh deploy)
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Category'"
    );
    const isFresh = tables.rows.length === 0;
    if (isFresh) {
      console.log("[migrate] Category table not yet created — fresh deploy, Prisma will handle ✅");
    } else {
      // ── Category: ensure userId column exists ──
      const catInfo = await client.execute("PRAGMA table_info('Category')");
      const catCols = new Set(catInfo.rows.map((r) => String(r[1])));

      if (!catCols.has("userId")) {
        console.log(`[migrate] Category.userId missing (table has ${catCols.size} cols) — fixing...`);

        // Old global categories belong to no user → delete them
        const countRow = await client.execute("SELECT COUNT(*) as cnt FROM Category");
        const cnt = countRow.rows[0].cnt;
        console.log(`[migrate] Removing ${cnt} orphaned global categories`);
        await client.execute("DELETE FROM Category");

        await client.execute(
          "ALTER TABLE Category ADD COLUMN userId TEXT NOT NULL DEFAULT 'pending'"
        );
        console.log("[migrate] userId column added ✅");
      } else {
        console.log("[migrate] Category ✅ (has userId)");
      }
    }

    // ── ApiKey: ensure table exists (only if User table already exists — not a fresh deploy) ──
    const userTables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    );
    if (userTables.rows.length > 0) {
      const apiKeyTables = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ApiKey'"
      );
      if (apiKeyTables.rows.length === 0) {
        console.log("[migrate] ApiKey table missing — creating...");
        await client.execute(`
          CREATE TABLE ApiKey (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            key TEXT NOT NULL UNIQUE,
            encryptedKey TEXT,
            userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
            lastUsedAt TEXT,
            createdAt TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `);
        console.log("[migrate] ApiKey table created ✅");
      } else {
        // Check if encryptedKey column exists
        const keyInfo = await client.execute("PRAGMA table_info('ApiKey')");
        const keyCols = new Set(keyInfo.rows.map((r) => String(r[1])));
        if (!keyCols.has("encryptedKey")) {
          console.log("[migrate] ApiKey.encryptedKey missing — adding...");
          await client.execute("ALTER TABLE ApiKey ADD COLUMN encryptedKey TEXT");
          console.log("[migrate] ApiKey.encryptedKey added ✅");
        } else {
          console.log("[migrate] ApiKey ✅ (has encryptedKey)");
        }
      }
    } else {
      console.log("[migrate] User table not yet created — skipping ApiKey migration (Prisma will handle fresh deploy) ✅");
    }

    console.log("[migrate] Done ✅");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("[migrate] FAILED:", err.message);
  process.exit(1);
});
