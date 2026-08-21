import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { calculateWorkerPayroll } from "@/lib/payroll";
import { buildSalaryMessage, sendWhatsAppStatement } from "@/lib/whatsapp";

const schema = z.object({
  workerId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string()
});

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin"]);
  const body = schema.parse(await request.json());
  const worker = await query<{ full_name: string; phone: string }>("select full_name, phone from workers where id = $1", [body.workerId], user);
  if (!worker[0]) return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  const summary = await calculateWorkerPayroll(user, body.workerId, body.periodStart, body.periodEnd);
  const lines = await query<{ product: string; quantity: number }>(
    `select p.name product, sum(pl.quantity)::int quantity
     from production_logs pl join products p on p.id = pl.product_id
     where pl.worker_id = $1 and pl.status = 'approved' and pl.work_date between $2 and $3
     group by p.name order by p.name`,
    [body.workerId, body.periodStart, body.periodEnd],
    user
  );
  const message = buildSalaryMessage(worker[0].full_name, summary, lines);
  const result = await sendWhatsAppStatement(user, worker[0].phone, message);
  return NextResponse.json(result);
}
