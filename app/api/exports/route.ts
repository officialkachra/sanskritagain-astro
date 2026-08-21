import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin", "supervisor"]);
  const rows = await query(
    `select w.full_name worker, p.name product, pl.quantity, pl.amount, pl.status, pl.work_date
     from production_logs pl
     join workers w on w.id = pl.worker_id
     join products p on p.id = pl.product_id
     order by pl.work_date desc`,
    [],
    user
  );
  const header = "Worker,Product,Quantity,Amount,Status,Date";
  const csv = [header, ...rows.map((row: any) => [row.worker, row.product, row.quantity, row.amount, row.status, row.work_date].join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=production-report.csv"
    }
  });
}
