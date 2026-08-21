import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { paymentSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const rows = await query(
    `select p.*, w.full_name worker_name
     from payments p join workers w on w.id = p.worker_id
     where ($1::text in ('admin','supervisor') or p.worker_id = $2)
     order by p.created_at desc
     limit 200`,
    [user.role, user.id],
    user
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin"]);
  const body = paymentSchema.parse(await request.json());
  const row = await transaction(user, async (client) => {
    const result = await client.query(
      `insert into payments(worker_id, payroll_id, amount, mode, status, notes, paid_at, recorded_by)
       values ($1, $2, $3, $4, $5, $6, case when $5 = 'completed' then now() else null end, $7)
       returning *`,
      [body.workerId, body.payrollId ?? null, body.amount, body.mode, body.status, body.notes ?? null, user.id]
    );
    await audit(client, user, "payment.recorded", "payments", result.rows[0].id, null, result.rows[0]);
    return result.rows[0];
  });
  return NextResponse.json(row, { status: 201 });
}
