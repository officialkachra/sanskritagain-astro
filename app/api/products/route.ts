import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { audit } from "@/lib/audit";

const productSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().max(60).optional(),
  category: z.string().max(80).optional(),
  ratePerUnit: z.coerce.number().min(0),
  active: z.boolean().default(true),
  qcRequired: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const rows = await query("select * from products where active = true or $1::text in ('admin','supervisor') order by name", [user.role], user);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  requireRole(user, ["admin"]);
  const body = productSchema.parse(await request.json());
  const row = await transaction(user, async (client) => {
    const result = await client.query(
      `insert into products(name, sku, category, rate_per_unit, active, qc_required)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [body.name, body.sku ?? null, body.category ?? null, body.ratePerUnit, body.active, body.qcRequired]
    );
    await audit(client, user, "product.created", "products", result.rows[0].id, null, result.rows[0]);
    return result.rows[0];
  });
  return NextResponse.json(row, { status: 201 });
}
