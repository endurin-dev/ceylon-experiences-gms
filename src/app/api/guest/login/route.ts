import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { signGuestSession, normalizePhone, GUEST_COOKIE_NAME, GUEST_COOKIE_MAX_AGE } from "@/lib/guest-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!phone || !password) {
    return NextResponse.json({ error: "Phone number and password are required" }, { status: 400 });
  }

  const phoneNormalized = normalizePhone(phone);
  const guest = await prisma.guest.findFirst({ where: { phoneNormalized } });

  // Same error whether the number isn't found, has no password set yet, or
  // the password is wrong — don't leak which case it is.
  if (!guest || !guest.passwordHash) {
    return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
  }

  const valid = await compare(password, guest.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
  }

  const token = signGuestSession(guest.id);
  const res = NextResponse.json({ guestId: guest.id, fullName: guest.fullName });
  res.cookies.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return res;
}