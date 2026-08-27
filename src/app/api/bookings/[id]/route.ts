import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { guest: true, hotel: true, guide: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("BOOKINGS", "canEdit");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 403 });
  }

  const body = await req.json().catch(() => null);
  const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  if (!body || typeof body.bookingReference !== "string" || !body.bookingReference.trim()) {
    return NextResponse.json({ error: "Booking reference is required" }, { status: 400 });
  }
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
  }

  const nullableString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
  const nullableInt = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  };
  const nullableDate = (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  try {
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        bookingReference: body.bookingReference.trim(),
        status: body.status ?? "PENDING",
        checkInDate: nullableDate(body.checkInDate),
        checkOutDate: nullableDate(body.checkOutDate),
        numberOfGuests: nullableInt(body.numberOfGuests),
        numberOfRooms: nullableInt(body.numberOfRooms),
        agent: nullableString(body.agent),
        agentTourNo: nullableString(body.agentTourNo),
        samoRef: nullableString(body.samoRef),
        resNo: nullableString(body.resNo),
        confirmation: nullableString(body.confirmation),
        guideName: nullableString(body.guideName),
        arrivalFlight: nullableString(body.arrivalFlight),
        departureFlight: nullableString(body.departureFlight),
        pickupTime: nullableString(body.pickupTime),
        bookingOwner: nullableString(body.bookingOwner),
        hotelCity: nullableString(body.hotelCity),
        mealPlan: nullableString(body.mealPlan),
        notes: nullableString(body.notes),
        clientsNameRaw: nullableString(body.clientsNameRaw),
        paxAdults: nullableInt(body.paxAdults),
        paxChildren: nullableInt(body.paxChildren),
        paxInfants: nullableInt(body.paxInfants),
      },
      include: { guest: true, hotel: true, guide: true },
    });
    return NextResponse.json(booking);
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e) {
      if (e.code === "P2025") return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      if (e.code === "P2002") return NextResponse.json({ error: "Booking reference already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}