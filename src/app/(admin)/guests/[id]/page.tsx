"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface GuestDetail {
  id: string;
  fullName: string;
  passportNumber: string | null;
  nationality: string | null;
  phoneNumber: string | null;
  email: string | null;
  country: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  notes: string | null;
  bookings: {
    id: string;
    bookingReference: string;
    status: string;
    checkInDate: string | null;
    checkOutDate: string | null;
    hotel: { name: string } | null;
  }[];
  tours: { id: string; tourName: string; tourDate: string | null; status: string }[];
  transfers: { id: string; pickupLocation: string | null; dropoffLocation: string | null; pickupDateTime: string | null; status: string }[];
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">{value ?? "—"}</p>
    </div>
  );
}

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [guest, setGuest] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/guests/${id}`);
        if (res.status === 404) throw new Error("Guest not found");
        if (!res.ok) throw new Error("Failed to load guest");
        const json = await res.json();
        if (!cancelled) setGuest(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load guest");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error ?? "Guest not found"}
        </p>
        <Link href="/guests" className="text-sm font-medium text-brand-600 hover:underline">
          Back to guests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/guests"
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft size={16} /> Back to guests
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{guest.fullName}</h1>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Passport" value={guest.passportNumber} />
          <Field label="Nationality" value={guest.nationality} />
          <Field label="Country" value={guest.country} />
          <Field label="Phone" value={guest.phoneNumber} />
          <Field label="Email" value={guest.email} />
          <Field label="Arrival" value={formatDate(guest.arrivalDate)} />
          <Field label="Departure" value={formatDate(guest.departureDate)} />
        </div>
        {guest.notes && (
          <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-900">
            <Field label="Notes" value={guest.notes} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Bookings ({guest.bookings.length})
        </h2>
        {guest.bookings.length === 0 ? (
          <p className="text-sm text-neutral-500">No bookings for this guest.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {guest.bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <Link href={`/bookings/${b.id}`} className="font-medium text-neutral-800 hover:underline dark:text-neutral-200">
                    {b.bookingReference}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {b.hotel?.name ?? "No hotel"} · {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(guest.tours.length > 0 || guest.transfers.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {guest.tours.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Tours</h2>
              <ul className="space-y-2 text-sm">
                {guest.tours.map((t) => (
                  <li key={t.id} className="text-neutral-700 dark:text-neutral-300">
                    {t.tourName} — {formatDate(t.tourDate)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {guest.transfers.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Transfers</h2>
              <ul className="space-y-2 text-sm">
                {guest.transfers.map((t) => (
                  <li key={t.id} className="text-neutral-700 dark:text-neutral-300">
                    {t.pickupLocation ?? "—"} → {t.dropoffLocation ?? "—"} ({formatDate(t.pickupDateTime)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}