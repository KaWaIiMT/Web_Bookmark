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
    // Check if Category table exists
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Category'"
    );
    if (tables.rows.length === 0) {
      console.log("[migrate] Category table not yet created — nothing to migrate ✅");
      return;
    }

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

      // Add column with a temp default so ALTER doesn't fail, then Prisma will pick up
      await client.execute(
        "ALTER TABLE Category ADD COLUMN userId TEXT NOT NULL DEFAULT 'pending'"
      );
      console.log("[migrate] userId column added ✅");
    } else {
      console.log("[migrate] Category ✅ (has userId)");
    }

    // ── Future migrations go here ──
    // Pattern:
    // if (!catCols.has("newField")) {
    //   await client.execute("ALTER TABLE Category ADD COLUMN newField ...");
    // }

    console.log("[migrate] Done ✅");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("[migrate] FAILED:", err.message);
  process.exit(1);
});
