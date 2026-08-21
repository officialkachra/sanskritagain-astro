import { NextRequest, NextResponse } from "next/server";
import { createSession, findUserByPhone, setSessionCookie, verifyPasscode } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = loginSchema.parse(await request.json());
  const user = await findUserByPhone(body.phone);
  if (!user || !(await verifyPasscode(body.passcode, user.passcode_hash))) {
    return NextResponse.json({ error: "Invalid phone or passcode" }, { status: 401 });
  }

  const sessionUser = { id: user.id, fullName: user.full_name, phone: user.phone, role: user.role };
  const token = await createSession(sessionUser);
  setSessionCookie(token);
  return NextResponse.json({ user: sessionUser });
}
