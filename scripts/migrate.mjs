import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false } });
const migrationsDir = join(process.cwd(), "migrations");

async function ensureHistory(client) {
  await client.query(`
    create table if not exists migration_history (
      id bigserial primary key,
      version text not null unique,
      applied_at timestamptz not null default now(),
      checksum text not null,
      rollback_file text not null
    )
  `);
}

try {
  const client = await pool.connect();
  try {
    await ensureHistory(client);
    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const version = file.replace(".sql", "");
      const sql = await readFile(join(migrationsDir, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const applied = await client.query("select checksum from migration_history where version = $1", [version]);
      if (applied.rowCount) {
        if (applied.rows[0].checksum !== checksum) {
          throw new Error(`Migration ${version} changed after being applied`);
        }
        console.log(`skip ${version}`);
        continue;
      }
      console.log(`apply ${version}`);
      await client.query(sql);
      await client.query(
        "insert into migration_history(version, checksum, rollback_file) values ($1, $2, $3) on conflict do nothing",
        [version, checksum, `rollbacks/${version}.down.sql`]
      );
    }
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
