import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";
import type { AppRole, SessionUser } from "@/types/domain";
import { query } from "@/lib/db";
import { requireEnv } from "@/lib/env";

const cookieName = "factory_session";
const sessionSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string(),
  role: z.enum(["admin", "supervisor", "worker"])
});

function secretKey() {
  return new TextEncoder().encode(requireEnv("JWT_SECRET"));
}

export async function hashPasscode(passcode: string) {
  return bcrypt.hash(passcode, 12);
}

export async function verifyPasscode(passcode: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(passcode, hash);
}

export async function createSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());
}

export function setSessionCookie(token: string) {
  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });
}

export async function getSessionFromRequest(request?: NextRequest): Promise<SessionUser | null> {
  const token = request?.cookies.get(cookieName)?.value ?? cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secretKey());
    return sessionSchema.parse(verified.payload);
  } catch {
    return null;
  }
}

export async function requireSession(request?: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export function requireRole(user: SessionUser, roles: AppRole[]) {
  if (!roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
}

export async function findUserByPhone(phone: string) {
  const rows = await query<{ id: string; full_name: string; phone: string; role: AppRole; passcode_hash: string | null }>(
    "select id, full_name, phone, role, passcode_hash from workers where phone = $1 and active = true limit 1",
    [phone]
  );
  return rows[0] ?? null;
}
