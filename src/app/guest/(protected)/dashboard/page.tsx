"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Loader2,
  Hotel,
  CalendarRange,
  UtensilsCrossed,
  Plane,
  Clock,
  Phone,
  User,
  Languages,
  Compass,
  KeyRound,
  Home,
  ConciergeBell,
  LifeBuoy,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestBooking {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  mealPlan: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  pickupTime: string | null;
  hotel: { id: string; name: string; city: string | null; phoneNumber: string | null } | null;
  guide: { id: string; fullName: string; phoneNumber: string | null; languages: string | null } | null;
}

interface GuestProfile {
  id: string;
  fullName: string;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Awaiting confirmation", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  CONFIRMED: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  COMPLETED: { label: "Completed", color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" },
};

/* ---------- Fixed top banner ---------- */
function TopBanner({ tripCount, guestName }: { tripCount: number; guestName: string }) {
  const initial = guestName.trim().charAt(0).toUpperCase() || "G";

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/guest/logout", { method: "POST" });
    } finally {
      window.location.href = "/guest/login";
    }
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-30 overflow-hidden bg-gradient-to-br from-[#0E2A43] via-[#123452] to-[#1A4A66] pb-9
                 pt-[calc(env(safe-area-inset-top)+18px)] text-white shadow-lg"
    >
      {/* decorative motifs */}
      <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full bg-[#D9A441]/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[#D9A441]/10 blur-2xl" />

      <div className="relative mx-auto max-w-md px-4">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">🌴</span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E6BE6E]">Ayubowan</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 transition active:scale-[0.97] active:bg-white/20"
          >
            <LogOut size={12} /> Log out
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold">
            {initial}
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Welcome</p>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">{guestName}</h1>
            <p className="text-[13px] italic leading-tight text-white/60">Добро пожаловать · ආයුබෝවන්</p>
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#E6BE6E]">
          <Sparkles size={12} />
          {tripCount > 0 ? `${tripCount} trip${tripCount > 1 ? "s" : ""} with us` : "Your journey awaits"}
        </div>
      </div>
    </header>
  );
}

/* ---------- Trip card ---------- */
function TripCard({ booking }: { booking: GuestBooking }) {
  const status = STATUS_LABEL[booking.status] ?? STATUS_LABEL.PENDING;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="bg-gradient-to-r from-[#123452] to-[#1A4A66] px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", status.color)}>{status.label}</span>
          <span className="text-[11px] text-white/70">Ref: {booking.bookingReference}</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
          <Hotel size={14} className="text-[#E6BE6E]" /> {booking.hotel?.name ?? "Hotel to be confirmed"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
          <CalendarRange size={12} /> {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </p>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          {booking.mealPlan && (
            <div className="flex items-start gap-2">
              <UtensilsCrossed size={14} className="mt-0.5 shrink-0 text-[#C98A2B]" />
              <div>
                <p className="text-[11px] text-neutral-400">Meal plan</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.mealPlan}</p>
              </div>
            </div>
          )}
          {booking.pickupTime && (
            <div className="flex items-start gap-2">
              <Clock size={14} className="mt-0.5 shrink-0 text-[#C98A2B]" />
              <div>
                <p className="text-[11px] text-neutral-400">Pickup time</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.pickupTime}</p>
              </div>
            </div>
          )}
          {booking.arrivalFlight && (
            <div className="flex items-start gap-2">
              <Plane size={14} className="mt-0.5 shrink-0 text-[#C98A2B]" />
              <div>
                <p className="text-[11px] text-neutral-400">Arrival flight</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.arrivalFlight}</p>
              </div>
            </div>
          )}
          {booking.departureFlight && (
            <div className="flex items-start gap-2">
              <Plane size={14} className="mt-0.5 shrink-0 rotate-90 text-[#C98A2B]" />
              <div>
                <p className="text-[11px] text-neutral-400">Departure flight</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.departureFlight}</p>
              </div>
            </div>
          )}
        </div>

        {booking.guide && (
          <div className="rounded-xl bg-[#FBF3E3] p-3 dark:bg-[#3A2F14]/30">
            <a
              href={`tel:${booking.guide.phoneNumber}`}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-[#C98A2B] py-2 text-sm font-medium text-white active:scale-[0.98] active:bg-[#B37A24] transition"
            >
              <Phone size={13} /> Call your guide
            </a>
          </div>
        )}

        {booking.hotel?.phoneNumber && (
          <div className="rounded-xl bg-[#FBF3E3] p-3 dark:bg-[#3A2F14]/30">
            <a
              href={`tel:${booking.hotel.phoneNumber}`}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 active:scale-[0.98] active:bg-neutral-50 transition dark:border-neutral-700 dark:text-neutral-300"
            >
              <Phone size={13} /> Call hotel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Bottom tab bar (native app style) ---------- */
function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/guest/dashboard", label: "Home", icon: Home },
    { href: "/guest/excursions", label: "Excursions", icon: Compass },
    { href: "/guest/services", label: "Services", icon: ConciergeBell },
    { href: "/guest/support", label: "Support", icon: LifeBuoy },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200/70 bg-white/95 backdrop-blur-lg
                 pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-neutral-900/95"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition",
                  active ? "bg-[#C98A2B] text-white" : "text-neutral-400"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span className={active ? "text-[#C98A2B] font-semibold" : "text-neutral-400"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function GuestDashboardPage() {
  const [bookings, setBookings] = useState<GuestBooking[] | null>(null);
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, meRes] = await Promise.all([
        fetch("/api/guest/bookings"),
        fetch("/api/guest/me"),
      ]);

      if (!bookingsRes.ok) throw new Error("Failed to load your trip");
      const bookingsJson = await bookingsRes.json();
      setBookings(bookingsJson.bookings);

      if (meRes.ok) {
        const meJson = await meRes.json();
        setGuest(meJson.guest ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load your trip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const guestName = guest?.fullName ?? "Guest";

  return (
    <div className="relative min-h-screen bg-[#FAF6EF] dark:bg-neutral-950">
      <TopBanner tripCount={bookings?.length ?? 0} guestName={guestName} />

      {/* Content sits below the banner initially, then scrolls up and passes
          underneath it (fixed + higher z-index) as the page scrolls */}
      <main className="relative z-10 mx-auto max-w-md px-4 pb-28 pt-[calc(env(safe-area-inset-top)+205px)]">
        <div className="-mt-8 rounded-t-[28px] bg-[#FAF6EF] pt-6 shadow-[0_-14px_24px_-20px_rgba(0,0,0,0.2)] dark:bg-neutral-950">
          <div className="space-y-4">
            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 size={22} className="animate-spin text-[#C98A2B]" />
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}

            {!loading && bookings && bookings.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Compass size={28} className="text-[#D9A441]" />
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No trips found yet</p>
              </div>
            )}

            {!loading && bookings?.map((b) => <TripCard key={b.id} booking={b} />)}

            {!loading && bookings && bookings.length > 0 && (
              <Link
                href="/guest/set-password"
                className="flex items-center justify-center gap-1.5 pt-2 text-xs font-medium text-[#9C6B14] dark:text-[#E6BE6E]"
              >
                <KeyRound size={12} /> Change password
              </Link>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}