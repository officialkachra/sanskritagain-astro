import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/auth";
import { calculateWorkerPayroll } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const url = new URL(request.url);
  const workerId = url.searchParams.get("workerId") ?? user.id;
  if (workerId !== user.id) requireRole(user, ["admin", "supervisor"]);
  const periodStart = url.searchParams.get("periodStart") ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = url.searchParams.get("periodEnd") ?? new Date().toISOString().slice(0, 10);
  const summary = await calculateWorkerPayroll(user, workerId, periodStart, periodEnd);
  return NextResponse.json({ workerId, periodStart, periodEnd, ...summary });
}
