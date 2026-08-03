import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getCurrentGuest, normalizePhone } from "@/lib/guest-auth";

export async function POST(req: NextRequest) {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const fullGuest = await prisma.guest.findUnique({ where: { id: guest.id } });
  if (!fullGuest?.phoneNumber) {
    return NextResponse.json(
      { error: "No phone number on file yet. Please scan the QR code from your guide first." },
      { status: 400 }
    );
  }

  const phoneNormalized = normalizePhone(fullGuest.phoneNumber);
  const passwordHash = await hash(password, 12);

  try {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { passwordHash, phoneNormalized },
    });
  } catch (e: any) {
    // Unique constraint on phoneNormalized — extremely unlikely (would mean
    // two guest records share the same number) but handle it gracefully.
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "This phone number is already linked to another account. Please contact your travel office." },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}