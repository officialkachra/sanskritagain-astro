import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateVedicChart } from "@/lib/vedicAstrology";

export const runtime = "nodejs";

const chartRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  place: z.string().trim().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chartRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please enter name, birth place, date of birth, and birth time."
      },
      { status: 400 }
    );
  }

  const reading = await calculateVedicChart(parsed.data);
  return NextResponse.json(reading);
}
