import { NextRequest, NextResponse } from "next/server";
import { phoneSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  phoneSchema.parse(phone);
  return NextResponse.json({
    ok: true,
    message: process.env.OTP_PROVIDER === "mock" ? "Use admin-issued passcode in development." : "OTP request queued."
  });
}
