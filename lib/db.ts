import pg from "pg";
import type { QueryResultRow } from "pg";
import type { SessionUser } from "@/types/domain";
import { requireEnv } from "@/lib/env";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = [], user?: SessionUser) {
  const client = await getPool().connect();
  try {
    if (user) {
      await client.query("select set_config('app.worker_id', $1, true), set_config('app.role', $2, true)", [user.id, user.role]);
    }
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function transaction<T>(user: SessionUser | undefined, fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    if (user) {
      await client.query("select set_config('app.worker_id', $1, true), set_config('app.role', $2, true)", [user.id, user.role]);
    }
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
