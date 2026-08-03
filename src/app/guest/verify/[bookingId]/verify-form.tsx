"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Hotel, CalendarRange, Ticket } from "lucide-react";

interface BookingSummary {
  bookingReference: string;
  guestNameMasked: string;
  hotelName: string | null;
  checkIn: string;
  checkOut: string;
}

export default function GuestVerifyForm({
  bookingId,
  summary,
}: {
  bookingId: string;
  summary: BookingSummary;
}) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsapp.trim()) {
      setError("Enter the WhatsApp number used for this booking");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, whatsapp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Verification failed");
      router.push(json.hasPassword ? "/guest/dashboard" : "/guest/set-password");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-teal-500 to-teal-700 px-6"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
      }}
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Ticket size={26} />
          </div>
          <h1 className="text-xl font-semibold">Welcome, {summary.guestNameMasked}</h1>
          <p className="mt-1 text-sm text-teal-50">Enter your WhatsApp number to view your trip details</p>
        </div>

        <div className="mb-4 space-y-2 rounded-2xl bg-white/10 p-4 text-sm text-white backdrop-blur">
          {summary.hotelName && (
            <div className="flex items-center gap-2">
              <Hotel size={14} className="shrink-0 text-teal-100" />
              <span>{summary.hotelName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarRange size={14} className="shrink-0 text-teal-100" />
            <span>
              {summary.checkIn} → {summary.checkOut}
            </span>
          </div>
          <p className="pt-1 text-xs text-teal-100">Ref: {summary.bookingReference}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Your WhatsApp number
            </label>
            <p className="text-xs text-neutral-400">
              So your guide and our office can reach you during your trip.
            </p>
            <div className="relative">
              <MessageCircle size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-500" />
              <input
                type="tel"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+94 77 123 4567"
                autoComplete="tel"
                className="w-full rounded-xl border border-neutral-300 py-3 pl-10 pr-4 text-base outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-base font-semibold text-white active:bg-teal-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Login
          </button>
        </form>
      </div>
    </div>
  );
}