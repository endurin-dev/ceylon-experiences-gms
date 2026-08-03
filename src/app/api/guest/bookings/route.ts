import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGuest } from "@/lib/guest-auth";

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { guestId: guest.id },
    include: {
      hotel: true,
      guide: { select: { id: true, fullName: true, phoneNumber: true, languages: true } },
    },
    orderBy: [{ checkInDate: "asc" }],
  });

  return NextResponse.json({ guest, bookings });
}