import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentGuide } from "@/lib/guide-auth";

export async function GET() {
  const guide = await getCurrentGuide();
  if (!guide) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { guideId: guide.id },
    include: { guest: true, hotel: true },
    orderBy: [{ checkInDate: "asc" }],
    take: 50,
  });

  return NextResponse.json({ guide, bookings });
}