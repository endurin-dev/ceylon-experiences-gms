"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Loader2, Printer, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  numberOfRooms: number | null;
  notes: string | null;
  agent: string | null;
  agentTourNo: string | null;
  samoRef: string | null;
  resNo: string | null;
  clientsNameRaw: string | null;
  paxAdults: number | null;
  paxChildren: number | null;
  paxInfants: number | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  pickupTime: string | null;
  bookingOwner: string | null;
  mealPlan: string | null;
  confirmation: string | null;
  guideName: string | null;
  guide: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  guest: {
    id: string;
    fullName: string;
    passportNumber: string | null;
    nationality: string | null;
    phoneNumber: string | null;
    email: string | null;
    country: string | null;
  } | null;
  hotel: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    phoneNumber: string | null;
  } | null;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    CONFIRMED: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
    CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    COMPLETED: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  };
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", styles[status] ?? styles.PENDING)}>
      {status}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">
        {value === null || value === undefined || value === "" ? "—" : value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 print:break-inside-avoid">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanUrl, setScanUrl] = useState("");

  useEffect(() => {
    // Built client-side so it always reflects the actual host (localhost
    // while developing, the real domain once deployed) rather than a
    // hardcoded env var that's easy to forget to set.
    setScanUrl(`${window.location.origin}/bookings/${id}`);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.status === 404) throw new Error("Booking not found");
        if (!res.ok) throw new Error("Failed to load booking");
        const json = await res.json();
        if (!cancelled) setBooking(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function copyLink() {
    await navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error ?? "Booking not found"}
        </p>
        <button
          onClick={() => router.push("/bookings")}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/bookings"
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={16} /> Back to bookings
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Header + QR */}
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row sm:items-center print:break-inside-avoid">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Booking reference</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {booking.bookingReference}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <span className="text-sm text-neutral-500">
              Created {new Date(booking.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {scanUrl && (
            <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800">
              <QRCodeSVG value={scanUrl} size={128} />
            </div>
          )}
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 print:hidden"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy scan link"}
          </button>
        </div>
      </div>

      <Section title="Guest">
        <Field label="Name" value={booking.guest?.fullName ?? booking.clientsNameRaw} />
        <Field label="All travellers on booking" value={booking.clientsNameRaw} />
        <Field label="Passport" value={booking.guest?.passportNumber} />
        <Field label="Nationality" value={booking.guest?.nationality} />
        <Field label="Phone" value={booking.guest?.phoneNumber} />
        <Field label="Email" value={booking.guest?.email} />
        <Field label="PAX adults" value={booking.paxAdults} />
        <Field label="PAX children" value={booking.paxChildren} />
        <Field label="PAX infants" value={booking.paxInfants} />
      </Section>

      <Section title="Stay">
        <Field label="Hotel" value={booking.hotel?.name} />
        <Field label="Hotel city" value={booking.hotel?.city} />
        <Field label="Check-in" value={formatDate(booking.checkInDate)} />
        <Field label="Check-out" value={formatDate(booking.checkOutDate)} />
        <Field label="Meal plan" value={booking.mealPlan} />
        <Field label="Rooms" value={booking.numberOfRooms} />
      </Section>

      <Section title="Travel">
  <Field label="Arrival flight" value={booking.arrivalFlight} />
  <Field label="Departure flight" value={booking.departureFlight} />
  <Field label="Pick up time" value={booking.pickupTime} />
  <Field label="Guide" value={booking.guide?.fullName ?? booking.guideName} />
</Section>

      <Section title="Agent & reference numbers">
        <Field label="Agent" value={booking.agent} />
        <Field label="Agent's tour no" value={booking.agentTourNo} />
        <Field label="Samo ref." value={booking.samoRef} />
        <Field label="Res no" value={booking.resNo} />
        <Field label="Booking owner" value={booking.bookingOwner} />
        <Field label="Confirmation" value={booking.confirmation} />
      </Section>

      {booking.notes && (
        <Section title="Notes">
          <div className="col-span-full">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.notes}</p>
          </div>
        </Section>
      )}
    </div>
  );
}