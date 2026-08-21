import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const rows = await query(
    `select * from notifications
     where worker_id = $1 or $2::text in ('admin','supervisor')
     order by created_at desc limit 100`,
    [user.id, user.role],
    user
  );
  return NextResponse.json(rows);
}
