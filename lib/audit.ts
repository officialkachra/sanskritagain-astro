import type { PoolClient } from "pg";
import type { SessionUser } from "@/types/domain";

export async function audit(client: PoolClient, user: SessionUser, action: string, tableName: string, recordId?: string, oldData?: unknown, newData?: unknown) {
  await client.query(
    `insert into audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
     values ($1, $2, $3, $4, $5, $6)`,
    [user.id, action, tableName, recordId ?? null, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null]
  );
}
