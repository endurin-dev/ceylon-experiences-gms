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
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────
   Design tokens — brass/travel-document palette on near-black.
   Kept as literals (not Tailwind theme colors) so this screen reads
   the same regardless of the app's light-mode brand config.
   ──────────────────────────────────────────────────────────────── */
const BG = "#0A0B0D";
const SURFACE = "#15171B";
const SURFACE_RAISED = "#1B1E23";
const BORDER = "#212429";
const BORDER_SOFT = "#1A1D22";
const TEXT = "#F3F1EC";
const TEXT_SECONDARY = "#96999E";
const TEXT_TERTIARY = "#5B5E64";
const ACCENT = "#E3A853"; // brass / boarding-pass gold

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-[#E3A853]/15", text: "text-[#E3A853]" },
  CONFIRMED: { bg: "bg-[#34C77B]/15", text: "text-[#34C77B]" },
  CANCELLED: { bg: "bg-[#FF6961]/15", text: "text-[#FF6961]" },
  COMPLETED: { bg: "bg-[#8A8D93]/15", text: "text-[#8A8D93]" },
};

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
  guest: { id: string; fullName: string; phoneNumber: string | null; email: string | null } | null;
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still out there";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good evening";
}

/* ── Ticket perforation divider — bites two notches out of the
      card edges and joins them with a dashed tear-line. ── */
function TicketDivider() {
  return (
    <div className="relative my-0 h-0 border-t border-dashed" style={{ borderColor: BORDER }}>
      <span
        className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: BG }}
      />
      <span
        className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: BG }}
      />
    </div>
  );
}

function Barcode() {
  return (
    <div
      aria-hidden
      className="h-6 w-full opacity-40"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, ${TEXT_TERTIARY} 0px, ${TEXT_TERTIARY} 1px, transparent 1px, transparent 3px, ${TEXT_TERTIARY} 3px, ${TEXT_TERTIARY} 5px, transparent 5px, transparent 6px)`,
      }}
    />
  );
}

function GuestQrModal({ booking, onClose }: { booking: GuideBooking; onClose: () => void }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/guest/verify/${booking.id}`);
  }, [booking.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-[28px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]"
        style={{ backgroundColor: SURFACE_RAISED, border: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />

        <div className="mb-4 flex items-center justify-between">
          <p className="text-[15px] font-semibold" style={{ color: TEXT }}>
            Scan to view trip
          </p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-60"
            style={{ backgroundColor: SURFACE, color: TEXT_SECONDARY }}
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
          {booking.guest?.fullName ?? booking.clientsNameRaw ?? "Guest"} scans this with their phone
          camera to see their itinerary.
        </p>

        {url ? (
          <div
            className="mx-auto flex w-fit items-center justify-center rounded-2xl p-4"
            style={{ backgroundColor: "#F3F1EC", border: `2px solid ${ACCENT}33` }}
          >
            <QRCodeSVG value={url} size={200} />
          </div>
        ) : (
          <div className="flex h-[232px] items-center justify-center">
            <Loader2 size={20} className="animate-spin" style={{ color: TEXT_TERTIARY }} />
          </div>
        )}

        <div className="mt-5">
          <Barcode />
          <p
            className="mt-2 text-center font-mono text-[11px] tracking-[0.2em]"
            style={{ color: TEXT_TERTIARY }}
          >
            {booking.bookingReference}
          </p>
        </div>
      </div>
    </div>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: SURFACE_RAISED, color: TEXT_TERTIARY }}
    >
      {children}
    </div>
  );
}

function ManifestField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <IconChip>{icon}</IconChip>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: TEXT_TERTIARY }}>
          {label}
        </p>
        <p className="truncate font-mono text-[13px] tracking-wide" style={{ color: TEXT }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function BookingCard({ booking, onShowQr }: { booking: GuideBooking; onShowQr: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.PENDING;
  const hasManifest =
    booking.pickupTime || booking.mealPlan || booking.arrivalFlight || booking.departureFlight;

  return (
    <div
      className="rounded-[22px] transition-transform active:scale-[0.985]"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-start gap-2 p-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex min-w-0 flex-1 items-start text-left"
        >
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                statusStyle.bg,
                statusStyle.text
              )}
            >
              {booking.status}
            </span>
            <p className="mt-1.5 truncate text-[17px] font-semibold" style={{ color: TEXT }}>
              {booking.guest?.fullName ?? booking.clientsNameRaw ?? "Guest"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px]" style={{ color: TEXT_SECONDARY }}>
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{booking.hotel?.name ?? "No hotel assigned"}</span>
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onShowQr}
            className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-60"
            style={{ backgroundColor: `${ACCENT}1F`, color: ACCENT }}
            title="Show QR for guest"
          >
            <QrCode size={16} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-60"
            style={{ color: TEXT_TERTIARY }}
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      <div
        className="flex items-center gap-4 px-4 pb-4 text-[12px]"
        style={{ color: TEXT_SECONDARY }}
      >
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
        <>
          <div className="px-4">
            <TicketDivider />
          </div>

          <div className="space-y-4 p-4">
            {hasManifest && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                {booking.pickupTime && (
                  <ManifestField icon={<Clock size={13} />} label="Pickup" value={booking.pickupTime} />
                )}
                {booking.mealPlan && (
                  <ManifestField
                    icon={<UtensilsCrossed size={13} />}
                    label="Meal plan"
                    value={booking.mealPlan}
                  />
                )}
                {booking.arrivalFlight && (
                  <ManifestField icon={<Plane size={13} />} label="Arrival" value={booking.arrivalFlight} />
                )}
                {booking.departureFlight && (
                  <ManifestField
                    icon={<Plane size={13} className="rotate-90" />}
                    label="Departure"
                    value={booking.departureFlight}
                  />
                )}
              </div>
            )}

            <div className="flex gap-2">
              {booking.guest?.phoneNumber && (
                <a
                  href={`tel:${booking.guest.phoneNumber}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-semibold active:opacity-70"
                  style={{ backgroundColor: ACCENT, color: "#231A0B" }}
                >
                  <Phone size={13} /> Call guest
                </a>
              )}
              {booking.hotel?.phoneNumber && (
                <a
                  href={`tel:${booking.hotel.phoneNumber}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-semibold active:opacity-70"
                  style={{ backgroundColor: SURFACE_RAISED, color: TEXT }}
                >
                  <Phone size={13} /> Call hotel
                </a>
              )}
            </div>

            <div>
              <Barcode />
              <p
                className="mt-2 text-center font-mono text-[10px] tracking-[0.2em]"
                style={{ color: TEXT_TERTIARY }}
              >
                {booking.bookingReference}
              </p>
            </div>
          </div>
        </>
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
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const [contactTab, setContactTab] = useState<"completed" | "missing-whatsapp" | "missing-email">("completed");
  const [tabInitialized, setTabInitialized] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guide/bookings");
      if (!res.ok) throw new Error("Couldn't load your assignments. Pull to try again.");
      const json = await res.json();
      setBookings(json.bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your assignments. Pull to try again.");
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

  useEffect(() => {
    if (!tabInitialized && bookings) {
      setTab(today.length > 0 ? "today" : "upcoming");
      setTabInitialized(true);
    }
  }, [bookings, today.length, tabInitialized]);

  const visible = tab === "today" ? today : upcoming;
  const guests = Array.from(
    new Map(
      (bookings ?? [])
        .filter((booking) => booking.guest)
        .map((booking) => [booking.guest!.id, booking.guest!])
    ).values()
  );
  const completedGuests = guests.filter((guest) => Boolean(guest.phoneNumber && guest.email));
  const whatsappMissing = guests.filter((guest) => !guest.phoneNumber);
  const emailMissing = guests.filter((guest) => !guest.email);
  const contactTabs = [
    { key: "completed" as const, label: "Completed", count: completedGuests.length },
    { key: "missing-whatsapp" as const, label: "WhatsApp missing", count: whatsappMissing.length },
    { key: "missing-email" as const, label: "Email missing", count: emailMissing.length },
  ];
  const contactGuestIds = new Set(
    (contactTab === "completed" ? completedGuests : contactTab === "missing-whatsapp" ? whatsappMissing : emailMissing).map((guest) => guest.id)
  );
  const contactVisible = (contactTab === "completed" ? bookings ?? [] : visible).filter((booking) => booking.guest && contactGuestIds.has(booking.guest.id));
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      className="min-h-screen pb-[max(2rem,env(safe-area-inset-bottom))]"
      style={{
        backgroundColor: BG,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Nav bar */}
      <div
        className="sticky top-0 z-10 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl"
        style={{ backgroundColor: `${BG}CC`, borderBottom: `1px solid ${BORDER_SOFT}` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: ACCENT }}>
              <Compass size={12} /> {getGreeting()}
            </p>
            <h1 className="mt-0.5 text-[28px] font-bold tracking-tight" style={{ color: TEXT }}>
              Assignments
            </h1>
            <p className="text-[13px]" style={{ color: TEXT_TERTIARY }}>
              {dateLabel}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full active:opacity-60"
            style={{ backgroundColor: SURFACE, color: TEXT_SECONDARY }}
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {/* Segmented control */}
        {!loading && bookings && bookings.length > 0 && (
          <div
            className="mt-4 flex rounded-2xl p-1"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
          >
            {(["today", "upcoming"] as const).map((key) => {
              const count = key === "today" ? today.length : upcoming.length;
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? SURFACE_RAISED : "transparent",
                    color: active ? TEXT : TEXT_TERTIARY,
                  }}
                >
                  {key === "today" ? "Today" : "Upcoming"}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: active ? `${ACCENT}26` : "transparent",
                      color: active ? ACCENT : TEXT_TERTIARY,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 px-4 pt-4">
        {!loading && bookings && bookings.length > 0 && (
          <div className="-mx-4 grid grid-cols-3 gap-1.5 px-4 pb-1" aria-label="Guest contact tabs">
            {contactTabs.map((item) => {
              const active = contactTab === item.key;
              return <button key={item.key} onClick={() => setContactTab(item.key)} className="flex min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold leading-tight sm:text-[12px]" style={{ backgroundColor: active ? `${ACCENT}26` : SURFACE, border: `1px solid ${active ? `${ACCENT}66` : BORDER}`, color: active ? ACCENT : TEXT_SECONDARY }}>{item.label}<span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: active ? `${ACCENT}22` : SURFACE_RAISED, color: active ? ACCENT : TEXT_TERTIARY }}>{item.count}</span></button>;
            })}
          </div>
        )}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: TEXT_TERTIARY }} />
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl px-4 py-3 text-[13px]"
            style={{ backgroundColor: "#FF69611A", border: "1px solid #FF696133", color: "#FF9891" }}
          >
            {error}
          </div>
        )}

        {!loading && bookings && bookings.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: SURFACE }}
            >
              <MapPin size={22} style={{ color: TEXT_TERTIARY }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: TEXT }}>
              No assignments yet
            </p>
            <p className="max-w-[220px] text-[13px]" style={{ color: TEXT_TERTIARY }}>
              Bookings assigned to you will show up here.
            </p>
          </div>
        )}

        {!loading &&
          bookings &&
          bookings.length > 0 &&
          (contactVisible.length > 0 ? (
            contactVisible.map((b) => (
              <BookingCard key={b.id} booking={b} onShowQr={() => setQrBooking(b)} />
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-[13px]" style={{ color: TEXT_TERTIARY }}>
                Nothing {tab === "today" ? "for today" : "coming up"} in this contact group.
              </p>
            </div>
          ))}
      </div>

      {qrBooking && <GuestQrModal booking={qrBooking} onClose={() => setQrBooking(null)} />}
    </div>
  );
}