"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

type FormState = {
  bookingReference: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  clientsNameRaw: string;
  numberOfGuests: string;
  numberOfRooms: string;
  paxAdults: string;
  paxChildren: string;
  paxInfants: string;
  hotelCity: string;
  mealPlan: string;
  arrivalFlight: string;
  departureFlight: string;
  pickupTime: string;
  guideName: string;
  agent: string;
  agentTourNo: string;
  samoRef: string;
  resNo: string;
  confirmation: string;
  bookingOwner: string;
  notes: string;
};

const emptyForm: FormState = {
  bookingReference: "",
  status: "PENDING",
  checkInDate: "",
  checkOutDate: "",
  clientsNameRaw: "",
  numberOfGuests: "",
  numberOfRooms: "",
  paxAdults: "",
  paxChildren: "",
  paxInfants: "",
  hotelCity: "",
  mealPlan: "",
  arrivalFlight: "",
  departureFlight: "",
  pickupTime: "",
  guideName: "",
  agent: "",
  agentTourNo: "",
  samoRef: "",
  resNo: "",
  confirmation: "",
  bookingOwner: "",
  notes: "",
};

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
    </label>
  );
}

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/${id}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Failed to load booking");
        if (!cancelled) {
          setForm({
            bookingReference: json.bookingReference ?? "",
            status: json.status ?? "PENDING",
            checkInDate: dateValue(json.checkInDate),
            checkOutDate: dateValue(json.checkOutDate),
            clientsNameRaw: json.clientsNameRaw ?? "",
            numberOfGuests: json.numberOfGuests?.toString() ?? "",
            numberOfRooms: json.numberOfRooms?.toString() ?? "",
            paxAdults: json.paxAdults?.toString() ?? "",
            paxChildren: json.paxChildren?.toString() ?? "",
            paxInfants: json.paxInfants?.toString() ?? "",
            hotelCity: json.hotelCity ?? "",
            mealPlan: json.mealPlan ?? "",
            arrivalFlight: json.arrivalFlight ?? "",
            departureFlight: json.departureFlight ?? "",
            pickupTime: json.pickupTime ?? "",
            guideName: json.guideName ?? "",
            agent: json.agent ?? "",
            agentTourNo: json.agentTourNo ?? "",
            samoRef: json.samoRef ?? "",
            resNo: json.resNo ?? "",
            confirmation: json.confirmation ?? "",
            bookingOwner: json.bookingOwner ?? "",
            notes: json.notes ?? "",
          });
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (key: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.bookingReference.trim()) {
      setError("Booking reference is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Failed to update booking");
      router.push(`/bookings/${id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to update booking");
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-neutral-400" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/bookings/${id}`} className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
        <ArrowLeft size={16} /> Back to booking
      </Link>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Edit Booking</h1>
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Booking reference" value={form.bookingReference} onChange={set("bookingReference")} />
            <label className="block"><span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Status</span><select value={form.status} onChange={(event) => set("status")(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"><option>PENDING</option><option>CONFIRMED</option><option>CANCELLED</option><option>COMPLETED</option></select></label>
            <Input label="Check-in" type="date" value={form.checkInDate} onChange={set("checkInDate")} />
            <Input label="Check-out" type="date" value={form.checkOutDate} onChange={set("checkOutDate")} />
            <Input label="Travellers" value={form.clientsNameRaw} onChange={set("clientsNameRaw")} />
            <Input label="Hotel city" value={form.hotelCity} onChange={set("hotelCity")} />
            <Input label="Meal plan" value={form.mealPlan} onChange={set("mealPlan")} />
            <Input label="Rooms" type="number" value={form.numberOfRooms} onChange={set("numberOfRooms")} />
            <Input label="Guests" type="number" value={form.numberOfGuests} onChange={set("numberOfGuests")} />
            <Input label="Adults" type="number" value={form.paxAdults} onChange={set("paxAdults")} />
            <Input label="Children" type="number" value={form.paxChildren} onChange={set("paxChildren")} />
            <Input label="Infants" type="number" value={form.paxInfants} onChange={set("paxInfants")} />
          </div>
          <div><h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Travel and references</h2><div className="grid gap-4 sm:grid-cols-2"><Input label="Arrival flight" value={form.arrivalFlight} onChange={set("arrivalFlight")} /><Input label="Departure flight" value={form.departureFlight} onChange={set("departureFlight")} /><Input label="Pick up time" value={form.pickupTime} onChange={set("pickupTime")} /><Input label="Guide" value={form.guideName} onChange={set("guideName")} /><Input label="Agent" value={form.agent} onChange={set("agent")} /><Input label="Agent tour no" value={form.agentTourNo} onChange={set("agentTourNo")} /><Input label="Samo ref." value={form.samoRef} onChange={set("samoRef")} /><Input label="Res no" value={form.resNo} onChange={set("resNo")} /><Input label="Confirmation" value={form.confirmation} onChange={set("confirmation")} /><Input label="Booking owner" value={form.bookingOwner} onChange={set("bookingOwner")} /></div></div>
          <label className="block"><span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notes</span><textarea value={form.notes} onChange={(event) => set("notes")(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" /></label>
          <div className="flex justify-end gap-2"><Link href={`/bookings/${id}`} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900">Cancel</Link><button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">{submitting && <Loader2 size={14} className="animate-spin" />}Save Changes</button></div>
        </form>
      </div>
    </div>
  );
}
