import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { transaction, query } from "@/lib/db";
import { attendanceSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const rows = await query(
    `select a.*, w.full_name worker_name
     from attendance a join workers w on w.id = a.worker_id
     where ($1::text in ('admin','supervisor') or a.worker_id = $2)
     order by attendance_date desc
     limit 200`,
    [user.role, user.id],
    user
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  const body = attendanceSchema.parse(await request.json());
  const row = await transaction(user, async (client) => {
    const field = body.action === "logout" ? "logout_at" : "login_at";
    const result = await client.query(
      `insert into attendance(worker_id, status, ${field}, gps_lat, gps_lng, selfie_url)
       values ($1, $2, now(), $3, $4, $5)
       on conflict(worker_id, attendance_date)
       do update set status = excluded.status, ${field} = now(), gps_lat = excluded.gps_lat, gps_lng = excluded.gps_lng, selfie_url = excluded.selfie_url
       returning *`,
      [user.id, body.status, body.gpsLat ?? null, body.gpsLng ?? null, body.selfieUrl ?? null]
    );
    await audit(client, user, `attendance.${body.action}`, "attendance", result.rows[0].id, null, result.rows[0]);
    return result.rows[0];
  });
  return NextResponse.json(row);
}
