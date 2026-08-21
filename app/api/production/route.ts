import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { productionEntrySchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const user = await requireSession(request);
  const rows = await query(
    `select pl.*, p.name product_name, w.full_name worker_name
     from production_logs pl
     join products p on p.id = pl.product_id
     join workers w on w.id = pl.worker_id
     where ($1::text in ('admin','supervisor') or pl.worker_id = $2)
     order by pl.submitted_at desc
     limit 200`,
    [user.role, user.id],
    user
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const user = await requireSession(request);
  const body = productionEntrySchema.parse(await request.json());

  const row = await transaction(user, async (client) => {
    const product = await client.query("select rate_per_unit from products where id = $1 and active = true", [body.productId]);
    if (!product.rowCount) throw new Response("Product unavailable", { status: 400 });
    const inserted = await client.query(
      `insert into production_logs(worker_id, product_id, quantity, rate_per_unit, note, proof_url)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [user.id, body.productId, body.quantity, product.rows[0].rate_per_unit, body.note ?? null, body.proofUrl ?? null]
    );
    await audit(client, user, "production.submitted", "production_logs", inserted.rows[0].id, null, inserted.rows[0]);
    return inserted.rows[0];
  });

  return NextResponse.json(row, { status: 201 });
}
