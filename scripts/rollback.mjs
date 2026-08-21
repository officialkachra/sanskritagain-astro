import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const { Pool } = pg;
const version = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!version) throw new Error("Usage: npm run db:rollback -- 001_worker_platform");

const pool = new Pool({ connectionString: databaseUrl, ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false } });

try {
  const client = await pool.connect();
  try {
    const migration = await client.query("select rollback_file from migration_history where version = $1", [version]);
    if (!migration.rowCount) throw new Error(`Migration ${version} has not been applied`);
    const sql = await readFile(join(process.cwd(), migration.rows[0].rollback_file), "utf8");
    await client.query(sql);
    console.log(`rolled back ${version}`);
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
