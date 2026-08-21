import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { approvalSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin", "supervisor"]);
  const rows = await query(
    `select pl.*, p.name product_name, w.full_name worker_name
     from production_logs pl
     join products p on p.id = pl.product_id
     join workers w on w.id = pl.worker_id
     where pl.status = 'pending'
     order by pl.submitted_at asc
     limit 300`,
    [],
    user
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin", "supervisor"]);
  const body = approvalSchema.parse(await request.json());

  const updated = await transaction(user, async (client) => {
    const current = await client.query("select * from production_logs where id = $1 for update", [body.productionLogId]);
    if (!current.rowCount) throw new Response("Production log not found", { status: 404 });
    const old = current.rows[0];
    const quantity = body.quantity ?? old.quantity;
    const result = await client.query(
      `update production_logs
       set status = $1, quantity = $2, reviewed_by = $3, reviewed_at = now(),
           approval_remarks = $4, rejection_reason = $5
       where id = $6
       returning *`,
      [body.status, quantity, user.id, body.remarks ?? null, body.rejectionReason ?? null, body.productionLogId]
    );
    await client.query(
      `insert into approvals(production_log_id, previous_status, new_status, old_quantity, new_quantity, remarks, acted_by)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [old.id, old.status, body.status, old.quantity, quantity, body.remarks ?? body.rejectionReason ?? null, user.id]
    );
    await client.query(
      `insert into notifications(worker_id, title, message, channel)
       values ($1, $2, $3, 'in_app')`,
      [old.worker_id, body.status === "approved" ? "Work approved" : "Work rejected", body.remarks ?? body.rejectionReason ?? "Your production entry was reviewed."]
    );
    await audit(client, user, `production.${body.status}`, "production_logs", old.id, old, result.rows[0]);
    return result.rows[0];
  });

  return NextResponse.json(updated);
}
