"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Loader2,
  RefreshCw,
  MapPin,
  Users,
  Plane,
  UtensilsCrossed,
  Clock,
  Phone,
  ChevronDown,
  CalendarClock,
  QrCode,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideBooking {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  clientsNameRaw: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  pickupTime: string | null;
  mealPlan: string | null;
  guest: { id: string; fullName: string; phoneNumber: string | null } | null;
  hotel: { id: string; name: string; city: string | null; phoneNumber: string | null } | null;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function isToday(value: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-400",
    CONFIRMED: "bg-brand-500",
    CANCELLED: "bg-red-400",
    COMPLETED: "bg-neutral-400",
  };
  return <span className={cn("h-2 w-2 rounded-full", colors[status] ?? colors.PENDING)} />;
}

function GuestQrModal({ booking, onClose }: { booking: GuideBooking; onClose: () => void }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/guest/verify/${booking.id}`);
  }, [booking.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Scan to view trip</p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          {booking.guest?.fullName ?? booking.clientsNameRaw ?? "Guest"} scans this with their phone camera to see
          their itinerary.
        </p>
        {url ? (
          <div className="mx-auto flex w-fit items-center justify-center rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800">
            <QRCodeSVG value={url} size={200} />
          </div>
        ) : (
          <div className="flex h-[232px] items-center justify-center">
            <Loader2 size={20} className="animate-spin text-neutral-300" />
          </div>
        )}
        <p className="mt-3 text-[11px] text-neutral-400">Ref: {booking.bookingReference}</p>
      </div>
    </div>
  );
}

function BookingCard({ booking, onShowQr }: { booking: GuideBooking; onShowQr: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded((e) => !e)} className="flex min-w-0 flex-1 items-start text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <StatusDot status={booking.status} />
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                {booking.status}
              </span>
            </div>
            <p className="mt-1 truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {booking.guest?.fullName ?? booking.clientsNameRaw ?? "Guest"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{booking.hotel?.name ?? "No hotel set"}</span>
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onShowQr}
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-600 active:bg-brand-50 dark:text-brand-400 dark:active:bg-brand-900/20"
            title="Show QR for guest"
          >
            <QrCode size={18} />
          </button>
          <button onClick={() => setExpanded((e) => !e)} className="flex h-8 w-8 items-center justify-center">
            <ChevronDown
              size={18}
              className={cn("text-neutral-400 transition-transform", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <CalendarClock size={12} /> {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </span>
        {booking.numberOfGuests != null && (
          <span className="flex items-center gap-1">
            <Users size={12} /> {booking.numberOfGuests}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-2.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-3">
            {booking.pickupTime && (
              <div className="flex items-start gap-2">
                <Clock size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-[11px] text-neutral-400">Pickup</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.pickupTime}</p>
                </div>
              </div>
            )}
            {booking.mealPlan && (
              <div className="flex items-start gap-2">
                <UtensilsCrossed size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-[11px] text-neutral-400">Meal plan</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.mealPlan}</p>
                </div>
              </div>
            )}
            {booking.arrivalFlight && (
              <div className="flex items-start gap-2">
                <Plane size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-[11px] text-neutral-400">Arrival flight</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.arrivalFlight}</p>
                </div>
              </div>
            )}
            {booking.departureFlight && (
              <div className="flex items-start gap-2">
                <Plane size={13} className="mt-0.5 shrink-0 rotate-90 text-neutral-400" />
                <div>
                  <p className="text-[11px] text-neutral-400">Departure flight</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.departureFlight}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            {booking.guest?.phoneNumber && (
              <a
                href={`tel:${booking.guest.phoneNumber}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 py-2.5 text-sm font-medium text-brand-700 active:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
              >
                <Phone size={14} /> Call guest
              </a>
            )}
            {booking.hotel?.phoneNumber && (
              <a
                href={`tel:${booking.hotel.phoneNumber}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Phone size={14} /> Call hotel
              </a>
            )}
          </div>

          <p className="pt-1 text-[11px] text-neutral-400">Ref: {booking.bookingReference}</p>
        </div>
      )}
    </div>
  );
}

export default function GuideDashboardPage() {
  const [bookings, setBookings] = useState<GuideBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrBooking, setQrBooking] = useState<GuideBooking | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guide/bookings");
      if (!res.ok) throw new Error("Failed to load your assignments");
      const json = await res.json();
      setBookings(json.bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your assignments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = bookings?.filter((b) => isToday(b.checkInDate) || isToday(b.checkOutDate)) ?? [];
  const upcoming = bookings?.filter((b) => !isToday(b.checkInDate) && !isToday(b.checkOutDate)) ?? [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Your assignments</h1>
        <button
          onClick={() => load(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-900"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin text-neutral-400" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && bookings && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MapPin size={28} className="text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No upcoming assignments</p>
          <p className="text-xs text-neutral-400">New bookings assigned to you will show up here.</p>
        </div>
      )}

      {!loading && today.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            Today
          </h2>
          <div className="space-y-3">
            {today.map((b) => (
              <BookingCard key={b.id} booking={b} onShowQr={() => setQrBooking(b)} />
            ))}
          </div>
        </section>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onShowQr={() => setQrBooking(b)} />
            ))}
          </div>
        </section>
      )}

      {qrBooking && <GuestQrModal booking={qrBooking} onClose={() => setQrBooking(null)} />}
    </div>
  );
}