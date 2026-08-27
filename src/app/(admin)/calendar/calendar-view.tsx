"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, LogIn, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarBooking = {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  guest: { fullName: string; phoneNumber: string | null; email: string | null } | null;
  hotel: { name: string; city: string | null } | null;
  guide: { fullName: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  CONFIRMED: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

function dateKey(value: string | null) {
  return value ? format(new Date(value), "yyyy-MM-dd") : "";
}

function formatDate(value: string | null) {
  return value ? format(new Date(value), "EEE, MMM d, yyyy") : "Not set";
}

function BookingDetail({ booking }: { booking: CalendarBooking }) {
  return <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
    <div className="flex items-start justify-between gap-3">
      <div><p className="font-semibold text-neutral-900 dark:text-neutral-100">{booking.guest?.fullName ?? "Guest not linked"}</p><p className="mt-0.5 text-xs text-neutral-500">{booking.bookingReference} · {booking.hotel?.name ?? "No hotel"}</p></div>
      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING)}>{booking.status}</span>
    </div>
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><LogIn size={15} className="text-emerald-600" /><span>Check-in: {formatDate(booking.checkInDate)}</span></div>
      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><LogOut size={15} className="text-orange-500" /><span>Check-out: {formatDate(booking.checkOutDate)}</span></div>
      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><Users size={15} /><span>{booking.numberOfGuests ?? "—"} guests</span></div>
      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"><Clock3 size={15} /><span>{booking.guide?.fullName ?? "No guide assigned"}</span></div>
    </div>
    <Link href={`/bookings/${booking.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Open booking details <ChevronRight size={15} /></Link>
  </div>;
}

export default function CalendarView({ bookings }: { bookings: CalendarBooking[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    bookings.forEach((booking) => {
      [booking.checkInDate, booking.checkOutDate].forEach((value) => {
        const key = dateKey(value);
        if (!key) return;
        const current = map.get(key) ?? [];
        if (!current.some((item) => item.id === booking.id)) map.set(key, [...current, booking]);
      });
    });
    return map;
  }, [bookings]);
  const selectedBookings = selectedDate ? bookingsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? [] : [];
  const monthBookings = bookings.filter((booking) => (booking.checkInDate && isSameMonth(new Date(booking.checkInDate), month)) || (booking.checkOutDate && isSameMonth(new Date(booking.checkOutDate), month)));

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400"><CalendarDays size={17} /> Operations calendar</p><h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Booking calendar</h1><p className="mt-1 text-sm text-neutral-500">Track arrivals, departures, and open booking details by date.</p></div>
      <div className="flex items-center gap-2"><button type="button" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"><ArrowLeft size={16} /></button><button type="button" onClick={() => { setMonth(startOfMonth(new Date())); setSelectedDate(new Date()); }} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900">Today</button><button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"><ArrowRight size={16} /></button></div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800"><h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{format(month, "MMMM yyyy")}</h2><span className="text-sm text-neutral-500">{monthBookings.length} booking{monthBookings.length === 1 ? "" : "s"}</span></div>
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400 sm:px-3 sm:text-xs">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayBookings = bookingsByDate.get(format(day, "yyyy-MM-dd")) ?? [];
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            return <button key={day.toISOString()} type="button" onClick={() => setSelectedDate(day)} className={cn("relative min-h-[92px] border-b border-r border-neutral-100 p-1.5 text-left transition hover:bg-brand-50/60 dark:border-neutral-900 dark:hover:bg-brand-900/10 sm:min-h-[112px] sm:p-2.5", !isSameMonth(day, month) && "bg-neutral-50/70 text-neutral-300 dark:bg-neutral-900/40 dark:text-neutral-700", isSelected && "bg-brand-50 ring-2 ring-inset ring-brand-500 dark:bg-brand-900/20") }><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium", isSameDay(day, new Date()) && "bg-brand-600 text-white")}>{format(day, "d")}</span><div className="mt-1.5 space-y-1">{dayBookings.slice(0, 3).map((booking) => <span key={booking.id} className="flex items-center gap-1 truncate text-[10px] font-medium text-neutral-600 dark:text-neutral-300"><i className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dateKey(booking.checkInDate) === format(day, "yyyy-MM-dd") ? "bg-emerald-500" : "bg-orange-500")} /> <span className="truncate">{booking.guest?.fullName ?? booking.bookingReference}</span></span>)}{dayBookings.length > 3 && <span className="text-[10px] font-medium text-brand-600">+{dayBookings.length - 3} more</span>}</div></button>;
          })}
        </div>
        <div className="flex flex-wrap gap-4 border-t border-neutral-200 px-5 py-3 text-xs text-neutral-500 dark:border-neutral-800"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Check-in</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange-500" /> Check-out</span></div>
      </section>

      <aside className="space-y-4"><div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-600" /><div><h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}</h2><p className="text-xs text-neutral-500">{selectedBookings.length} booking{selectedBookings.length === 1 ? "" : "s"} on this date</p></div></div>{selectedBookings.length > 0 ? <div className="mt-4 space-y-3">{selectedBookings.map((booking) => <BookingDetail key={booking.id} booking={booking} />)}</div> : <p className="mt-5 rounded-lg bg-neutral-50 px-3 py-5 text-center text-sm text-neutral-500 dark:bg-neutral-900">Click a marked date to see booking details.</p>}</div></aside>
    </div>
  </div>;
}
