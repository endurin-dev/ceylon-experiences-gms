"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarRange, ChevronRight, Compass, Hotel, Languages, Loader2, Phone, Plane, PlaneLanding, Sparkles, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  mealPlan: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  pickupTime: string | null;
  hotel: { name: string; phoneNumber: string | null } | null;
  guide: { fullName: string; phoneNumber: string | null; languages: string | null } | null;
};

type Notification = { id: string; title: string; body: string; readAt: string | null; createdAt: string };

const GLASS = "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";
const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  PENDING: { label: "Awaiting confirmation", dot: "#FF9F0A", text: "text-[#FF9F0A]" },
  CONFIRMED: { label: "Confirmed", dot: "#30D158", text: "text-[#30D158]" },
  CANCELLED: { label: "Cancelled", dot: "#FF453A", text: "text-[#FF453A]" },
  COMPLETED: { label: "Completed", dot: "#98989D", text: "text-white/50" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 last:border-0"><span className="flex items-center gap-2 text-[15px] text-white/45"><Icon size={15} className="text-[#5AA6FF]" />{label}</span><span className="text-right text-[15px] font-medium text-white/90">{value}</span></div>;
}

function TripCard({ booking }: { booking: Booking }) {
  const status = STATUS[booking.status] ?? STATUS.PENDING;
  return <div className={cn("overflow-hidden rounded-[20px]", GLASS)}>
    <div className="flex items-start justify-between gap-2 border-b border-white/[0.07] px-4 py-3.5"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.08] text-[#5AA6FF]"><Hotel size={16} /></span><div><p className="text-[16px] font-semibold text-white">{booking.hotel?.name ?? "Hotel to be confirmed"}</p><p className="text-[12px] text-white/35">Ref {booking.bookingReference}</p></div></div><span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-semibold"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} /> <span className={status.text}>{status.label}</span></span></div>
    <Detail icon={CalendarRange} label="Dates" value={`${formatDate(booking.checkInDate)} – ${formatDate(booking.checkOutDate)}`} />
    {booking.mealPlan && <Detail icon={UtensilsCrossed} label="Meal plan" value={booking.mealPlan} />}
    {booking.pickupTime && <Detail icon={CalendarRange} label="Pickup" value={booking.pickupTime} />}
    {booking.arrivalFlight && <Detail icon={Plane} label="Arrival flight" value={booking.arrivalFlight} />}
    {booking.departureFlight && <Detail icon={PlaneLanding} label="Departure flight" value={booking.departureFlight} />}
    {booking.guide?.languages && <Detail icon={Languages} label="Guide speaks" value={booking.guide.languages} />}
    {(booking.guide?.phoneNumber || booking.hotel?.phoneNumber) && <div className="flex divide-x divide-white/[0.07] border-t border-white/[0.07]">{booking.guide?.phoneNumber && <a className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] text-white/40" href={`tel:${booking.guide.phoneNumber}`}><Phone size={18} className="text-[#5AA6FF]" />Call guide</a>}{booking.hotel?.phoneNumber && <a className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] text-white/40" href={`tel:${booking.hotel.phoneNumber}`}><Phone size={18} className="text-[#5AA6FF]" />Call hotel</a>}</div>}
  </div>;
}

export default function GuestDashboardPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [guestName, setGuestName] = useState("Guest");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [bookingsRes, meRes, notificationsRes] = await Promise.all([fetch("/api/guest/bookings"), fetch("/api/guest/me"), fetch("/api/guest/notifications")]);
      if (!bookingsRes.ok) throw new Error("Couldn't load your trip. Pull down to try again.");
      const bookingsJson = await bookingsRes.json(); setBookings(bookingsJson.bookings);
      if (meRes.ok) { const meJson = await meRes.json(); setGuestName(meJson.guest?.fullName?.split(" ")[0] ?? "Guest"); }
      if (notificationsRes.ok) { const notificationJson = await notificationsRes.json(); setNotifications(notificationJson.notifications ?? []); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn't load your trip."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    const response = await fetch("/api/guest/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
    if (response.ok) setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification));
  }

  const unread = notifications.filter((notification) => !notification.readAt);
  return <div>
    <div className="relative h-[280px] overflow-hidden rounded-b-[32px] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]"><div className="h-full w-full bg-cover bg-[position:50%_25%]" style={{ backgroundImage: "url('/images/sri-lanka-hero.png')" }} /><div className="absolute inset-0 bg-gradient-to-t from-[#05060F] via-[#05060F]/55 to-[#0A1442]/25" /><div className="absolute inset-x-0 bottom-0 px-4 pb-5"><span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">Ayubowan · ආයුබෝවන්</span><h1 className="mt-3 text-[32px] font-bold leading-tight text-white">Welcome, {guestName}</h1><p className="mt-1 text-[14px] text-white/80">Welcome to Sri Lanka</p><span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3 py-1.5 text-[12px] font-semibold text-[#8FC1FF]"><Sparkles size={12} />{bookings?.length ? `${bookings.length} trip${bookings.length > 1 ? "s" : ""} with us` : "Your journey awaits"}</span></div></div>
    <div className="px-4">
      {unread.length > 0 && <div className="mt-4 rounded-[18px] border border-[#FF9F0A]/30 bg-[#FF9F0A]/10 p-4"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#FFCC66]"><Bell size={16} /> New update from your travel team</div><p className="mt-1 text-[13px] text-white/55">You have {unread.length} unread notification{unread.length === 1 ? "" : "s"}.</p></div>}
      {notifications.length > 0 && <><p className="px-4 pb-1.5 pt-5 text-[13px] font-semibold uppercase tracking-wide text-white/35">Notifications</p><div className="space-y-2">{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => !notification.readAt && markRead(notification.id)} className={cn("w-full rounded-[16px] p-4 text-left", GLASS, !notification.readAt && "border-[#FF9F0A]/35 bg-[#FF9F0A]/10")}><div className="flex items-start gap-3"><Bell size={17} className={cn("mt-0.5", notification.readAt ? "text-white/30" : "text-[#FFB340]")} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="text-[15px] font-semibold text-white/90">{notification.title}</p>{!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF9F0A]" />}</div><p className="mt-1 text-[13px] text-white/55">{notification.body}</p><p className="mt-2 text-[11px] text-white/30">{formatDate(notification.createdAt)}</p></div></div></button>)}</div></>}
      {loading && <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-[#5AA6FF]" /></div>}
      {error && !loading && <div className="mt-4 rounded-[16px] border border-[#FF453A]/25 bg-[#FF453A]/10 px-4 py-3 text-[14px] text-[#FF6961]">{error}</div>}
      {!loading && bookings?.length === 0 && <div className="flex flex-col items-center gap-3 py-20 text-center"><Compass size={26} className="text-white/30" /><p className="text-[16px] font-semibold text-white/85">No trips yet</p><p className="text-[13px] text-white/35">Your bookings will show up here once confirmed.</p></div>}
      {!loading && bookings && bookings.length > 0 && <><p className="px-4 pb-1.5 pt-5 text-[13px] font-semibold uppercase tracking-wide text-white/35">Your stays</p><div className="space-y-3">{bookings.map((booking) => <TripCard key={booking.id} booking={booking} />)}</div><p className="px-4 pb-1.5 pt-5 text-[13px] font-semibold uppercase tracking-wide text-white/35">Account</p><Link href="/guest/set-password" className={cn("flex items-center justify-between rounded-[16px] px-4 py-3.5 text-[15px] text-white/90", GLASS)}>Change password<ChevronRight size={16} className="text-white/25" /></Link></>}
    </div>
  </div>;
}
