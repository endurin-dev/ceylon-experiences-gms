import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GuestVerifyForm from "./verify-form";

function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial}.`;
}

function formatDate(value: Date | null) {
  if (!value) return "—";
  return value.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default async function GuestVerifyPage({ params }: { params: { bookingId: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { guest: true, hotel: true },
  });

  if (!booking || !booking.guest) {
    notFound();
  }

  const summary = {
    bookingReference: booking.bookingReference,
    guestNameMasked: maskName(booking.guest.fullName),
    hotelName: booking.hotel?.name ?? null,
    checkIn: formatDate(booking.checkInDate),
    checkOut: formatDate(booking.checkOutDate),
  };

  return <GuestVerifyForm bookingId={booking.id} summary={summary} />;
}