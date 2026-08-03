import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const guest = await prisma.guest.findUnique({
    where: { id: params.id },
    include: {
      bookings: { include: { hotel: true }, orderBy: { checkInDate: "asc" } },
      tours: { orderBy: { tourDate: "asc" } },
      transfers: { orderBy: { pickupDateTime: "asc" } },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}