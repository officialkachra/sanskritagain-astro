import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin", "supervisor"]);
  const rows = await query(
    `select
      (select count(*) from workers where active = true) active_workers,
      (select count(*) from production_logs where status = 'pending') pending_approvals,
      (select coalesce(sum(quantity), 0) from production_logs where work_date = current_date and status = 'approved') production_today,
      (select coalesce(sum(amount), 0) from production_logs where status = 'approved') total_earned,
      (select coalesce(sum(amount), 0) from payments where status = 'completed') total_paid`,
    [],
    user
  );
  const productRows = await query(
    `select p.name, coalesce(sum(pl.quantity), 0) quantity
     from products p left join production_logs pl on pl.product_id = p.id and pl.status = 'approved'
     group by p.name order by quantity desc limit 10`,
    [],
    user
  );
  return NextResponse.json({ cards: rows[0], productWise: productRows });
}
