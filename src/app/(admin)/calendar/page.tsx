import { prisma } from "@/lib/prisma";
import CalendarView from "./calendar-view";

export default async function CalendarPage() {
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ checkInDate: { not: null } }, { checkOutDate: { not: null } }] },
    orderBy: [{ checkInDate: "asc" }, { checkOutDate: "asc" }],
    include: {
      guest: { select: { fullName: true, phoneNumber: true, email: true } },
      hotel: { select: { name: true, city: true } },
      guide: { select: { fullName: true } },
    },
  });

  return <CalendarView bookings={bookings.map((booking) => ({
    id: booking.id,
    bookingReference: booking.bookingReference,
    status: booking.status,
    checkInDate: booking.checkInDate?.toISOString() ?? null,
    checkOutDate: booking.checkOutDate?.toISOString() ?? null,
    numberOfGuests: booking.numberOfGuests,
    guest: booking.guest,
    hotel: booking.hotel,
    guide: booking.guide,
  }))} />;
}
