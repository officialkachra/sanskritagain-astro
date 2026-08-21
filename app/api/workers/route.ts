import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSession } from "@/lib/auth";
import { hashPasscode } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { audit } from "@/lib/audit";

const workerSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(8).max(16),
  role: z.enum(["admin", "supervisor", "worker"]).default("worker"),
  passcode: z.string().min(4).max(32).optional(),
  active: z.boolean().default(true),
  notes: z.string().max(1000).optional()
});

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin", "supervisor"]);
  const rows = await query(
    `select id, full_name, phone, photo_url, role, active, notes, created_at
     from workers order by active desc, full_name`,
    [],
    user
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin"]);
  const body = workerSchema.parse(await request.json());
  const passcodeHash = body.passcode ? await hashPasscode(body.passcode) : null;
  const row = await transaction(user, async (client) => {
    const result = await client.query(
      `insert into workers(full_name, phone, role, passcode_hash, active, notes)
       values ($1, $2, $3, $4, $5, $6)
       returning id, full_name, phone, role, active, notes`,
      [body.fullName, body.phone, body.role, passcodeHash, body.active, body.notes ?? null]
    );
    await audit(client, user, "worker.created", "workers", result.rows[0].id, null, result.rows[0]);
    return result.rows[0];
  });
  return NextResponse.json(row, { status: 201 });
}
