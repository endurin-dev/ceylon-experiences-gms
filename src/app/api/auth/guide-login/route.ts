import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { signGuideSession, GUIDE_COOKIE_NAME, GUIDE_COOKIE_MAX_AGE } from "@/lib/guide-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const guide = await prisma.guide.findUnique({ where: { username } });

  // Same error for "no such user" and "wrong password" — don't leak which one.
  if (!guide || !guide.passwordHash) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (guide.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This account is inactive. Contact your administrator." },
      { status: 403 }
    );
  }

  const valid = await compare(password, guide.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await prisma.guide.update({ where: { id: guide.id }, data: { lastLoginAt: new Date() } });

  const token = signGuideSession(guide.id);
  const res = NextResponse.json({ id: guide.id, fullName: guide.fullName });
  res.cookies.set(GUIDE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUIDE_COOKIE_MAX_AGE,
  });
  return res;
}