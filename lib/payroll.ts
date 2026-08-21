import { query } from "@/lib/db";
import type { SessionUser } from "@/types/domain";

export async function calculateWorkerPayroll(user: SessionUser, workerId: string, periodStart: string, periodEnd: string) {
  const rows = await query<{
    earned: string;
    paid: string;
    advances: string;
    bonuses: string;
    penalties: string;
  }>(
    `select
      coalesce((select sum(amount) from production_logs where worker_id = $1 and status = 'approved' and work_date between $2 and $3), 0) earned,
      coalesce((select sum(amount) from payments where worker_id = $1 and status = 'completed' and paid_at::date between $2 and $3), 0) paid,
      0::numeric advances,
      0::numeric bonuses,
      0::numeric penalties`,
    [workerId, periodStart, periodEnd],
    user
  );
  const summary = rows[0];
  const earned = Number(summary.earned);
  const paid = Number(summary.paid);
  const advances = Number(summary.advances);
  const bonuses = Number(summary.bonuses);
  const penalties = Number(summary.penalties);
  return {
    earned,
    paid,
    advances,
    bonuses,
    penalties,
    pending: earned + bonuses - penalties - advances - paid
  };
}
