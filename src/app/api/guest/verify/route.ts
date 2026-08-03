import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signGuestSession, normalizePhone, GUEST_COOKIE_NAME, GUEST_COOKIE_MAX_AGE } from "@/lib/guest-auth";

/**
 * POST /api/guest/verify
 * Body: { bookingId: string, whatsapp: string }
 *
 * No identity check against existing data — this is a data-capture step,
 * not authentication. Many older records were imported without a phone
 * number, so we just save whatever the guest enters (only overwriting a
 * blank field, never clobbering a number that's already on file) and log
 * them straight into their trip.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
  const whatsapp = typeof body?.whatsapp === "string" ? body.whatsapp.trim() : "";

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking reference" }, { status: 400 });
  }

  if (normalizePhone(whatsapp).length < 7) {
    return NextResponse.json({ error: "Enter a valid WhatsApp number" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { guest: true },
  });

  if (!booking || !booking.guest) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only fill in the number if it's missing — don't overwrite an existing
  // one just because a guest typed something into this form.
  if (!booking.guest.phoneNumber) {
    await prisma.guest.update({
      where: { id: booking.guest.id },
      data: { phoneNumber: whatsapp },
    });
  }

  const token = signGuestSession(booking.guest.id);
  const res = NextResponse.json({
    guestId: booking.guest.id,
    fullName: booking.guest.fullName,
    hasPassword: !!booking.guest.passwordHash,
  });
  res.cookies.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
  });
  return res;
}