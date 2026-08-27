import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CalendarSearch, Eye, Search, X } from "lucide-react";

type SearchParams = { [key: string]: string | string[] | undefined };

function valueOf(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

function dateValue(value: string, end = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function integerValue(value: string) {
  if (!value) return undefined;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : undefined;
}

function inputClass() {
  return "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900";
}

function Field({ label, name, value, type = "text", placeholder }: { label: string; name: string; value: string; type?: string; placeholder?: string }) {
  return <label className="space-y-1 text-xs font-medium text-neutral-600 dark:text-neutral-400"><span>{label}</span><input className={inputClass()} name={name} defaultValue={value} type={type} placeholder={placeholder} /></label>;
}

function SelectField({ label, name, value, options }: { label: string; name: string; value: string; options: { value: string; label: string }[] }) {
  return <label className="space-y-1 text-xs font-medium text-neutral-600 dark:text-neutral-400"><span>{label}</span><select className={inputClass()} name={name} defaultValue={value}><option value="">Any</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString() : "—";
}

export default async function AdvancedBookingSearchPage({ searchParams }: { searchParams: Promise<SearchParams> | SearchParams }) {
  const params = await searchParams;
  const q = valueOf(params, "q");
  const status = valueOf(params, "status");
  const guestName = valueOf(params, "guestName");
  const guestPhone = valueOf(params, "guestPhone");
  const guestEmail = valueOf(params, "guestEmail");
  const nationality = valueOf(params, "nationality");
  const hotelId = valueOf(params, "hotelId");
  const guideId = valueOf(params, "guideId");
  const importId = valueOf(params, "importId");
  const hasHotel = valueOf(params, "hasHotel");
  const hasGuide = valueOf(params, "hasGuide");
  const hasGuestPhone = valueOf(params, "hasGuestPhone");
  const hasGuestEmail = valueOf(params, "hasGuestEmail");
  const bookingReference = valueOf(params, "bookingReference");
  const confirmation = valueOf(params, "confirmation");
  const agent = valueOf(params, "agent");
  const bookingOwner = valueOf(params, "bookingOwner");
  const guideName = valueOf(params, "guideName");
  const tourType = valueOf(params, "tourType");
  const transferType = valueOf(params, "transferType");
  const mealPlan = valueOf(params, "mealPlan");
  const arrivalFlight = valueOf(params, "arrivalFlight");
  const departureFlight = valueOf(params, "departureFlight");
  const arrivalAirport = valueOf(params, "arrivalAirport");
  const departureAirport = valueOf(params, "departureAirport");
  const checkInFrom = valueOf(params, "checkInFrom");
  const checkInTo = valueOf(params, "checkInTo");
  const checkOutFrom = valueOf(params, "checkOutFrom");
  const checkOutTo = valueOf(params, "checkOutTo");
  const createdFrom = valueOf(params, "createdFrom");
  const createdTo = valueOf(params, "createdTo");
  const minGuests = valueOf(params, "minGuests");
  const maxGuests = valueOf(params, "maxGuests");
  const minRooms = valueOf(params, "minRooms");
  const maxRooms = valueOf(params, "maxRooms");

  const checkInStart = dateValue(checkInFrom);
  const checkInEnd = dateValue(checkInTo, true);
  const checkOutStart = dateValue(checkOutFrom);
  const checkOutEnd = dateValue(checkOutTo, true);
  const createdStart = dateValue(createdFrom);
  const createdEnd = dateValue(createdTo, true);
  const hasFilters = Object.values(params).some((value) => typeof value === "string" && value.trim() !== "");

  const guestConditions: Prisma.GuestWhereInput[] = [];
  if (guestName) guestConditions.push({ fullName: { contains: guestName, mode: "insensitive" } });
  if (guestPhone) guestConditions.push({ phoneNumber: { contains: guestPhone, mode: "insensitive" } });
  if (guestEmail) guestConditions.push({ email: { contains: guestEmail, mode: "insensitive" } });
  if (nationality) guestConditions.push({ nationality: { contains: nationality, mode: "insensitive" } });
  if (hasGuestPhone === "yes") guestConditions.push({ phoneNumber: { not: null } });
  if (hasGuestPhone === "no") guestConditions.push({ phoneNumber: null });
  if (hasGuestEmail === "yes") guestConditions.push({ email: { not: null } });
  if (hasGuestEmail === "no") guestConditions.push({ email: null });

  const where: Prisma.BookingWhereInput = {
    ...(status && status !== "ALL" ? { status: status as Prisma.EnumBookingStatusFilter["equals"] } : {}),
    ...(bookingReference ? { bookingReference: { contains: bookingReference, mode: "insensitive" } } : {}),
    ...(confirmation ? { confirmation: { contains: confirmation, mode: "insensitive" } } : {}),
    ...(agent ? { agent: { contains: agent, mode: "insensitive" } } : {}),
    ...(bookingOwner ? { bookingOwner: { contains: bookingOwner, mode: "insensitive" } } : {}),
    ...(guideName ? { guideName: { contains: guideName, mode: "insensitive" } } : {}),
    ...(tourType ? { tourType: { contains: tourType, mode: "insensitive" } } : {}),
    ...(transferType ? { transferType: { contains: transferType, mode: "insensitive" } } : {}),
    ...(mealPlan ? { mealPlan: { contains: mealPlan, mode: "insensitive" } } : {}),
    ...(arrivalFlight ? { arrivalFlight: { contains: arrivalFlight, mode: "insensitive" } } : {}),
    ...(departureFlight ? { departureFlight: { contains: departureFlight, mode: "insensitive" } } : {}),
    ...(arrivalAirport ? { arrivalAirport: { contains: arrivalAirport, mode: "insensitive" } } : {}),
    ...(departureAirport ? { departureAirport: { contains: departureAirport, mode: "insensitive" } } : {}),
    ...(hotelId ? { hotelId } : {}),
    ...(guideId ? { guideId } : {}),
    ...(importId ? { importId } : {}),
    ...(hasHotel === "yes" ? { hotelId: { not: null } } : hasHotel === "no" ? { hotelId: null } : {}),
    ...(hasGuide === "yes" ? { guideId: { not: null } } : hasGuide === "no" ? { guideId: null } : {}),
    ...(guestConditions.length > 0 ? { guest: { is: { AND: guestConditions } } } : {}),
    ...(q ? { OR: [
      { bookingReference: { contains: q, mode: "insensitive" } },
      { samoRef: { contains: q, mode: "insensitive" } },
      { resNo: { contains: q, mode: "insensitive" } },
      { clientsNameRaw: { contains: q, mode: "insensitive" } },
      { confirmation: { contains: q, mode: "insensitive" } },
      { guideName: { contains: q, mode: "insensitive" } },
      { agent: { contains: q, mode: "insensitive" } },
      { guest: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      { hotel: { is: { name: { contains: q, mode: "insensitive" } } } },
    ] } : {}),
    ...(checkInStart || checkInEnd ? { checkInDate: { ...(checkInStart ? { gte: checkInStart } : {}), ...(checkInEnd ? { lte: checkInEnd } : {}) } } : {}),
    ...(checkOutStart || checkOutEnd ? { checkOutDate: { ...(checkOutStart ? { gte: checkOutStart } : {}), ...(checkOutEnd ? { lte: checkOutEnd } : {}) } } : {}),
    ...(createdStart || createdEnd ? { createdAt: { ...(createdStart ? { gte: createdStart } : {}), ...(createdEnd ? { lte: createdEnd } : {}) } } : {}),
    ...(minGuests || maxGuests ? { numberOfGuests: { ...(integerValue(minGuests) !== undefined ? { gte: integerValue(minGuests) } : {}), ...(integerValue(maxGuests) !== undefined ? { lte: integerValue(maxGuests) } : {}) } } : {}),
    ...(minRooms || maxRooms ? { numberOfRooms: { ...(integerValue(minRooms) !== undefined ? { gte: integerValue(minRooms) } : {}), ...(integerValue(maxRooms) !== undefined ? { lte: integerValue(maxRooms) } : {}) } } : {}),
  };

  const [results, hotels, guides, imports] = await Promise.all([
    hasFilters
      ? prisma.booking.findMany({ where, include: { guest: true, hotel: true, guide: true }, orderBy: { createdAt: "desc" }, take: 200 })
      : Promise.resolve([]),
    prisma.hotel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.guide.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.excelImport.findMany({ where: { destinationTable: "BOOKINGS" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, fileName: true } }),
  ]);

  return <div className="mx-auto max-w-[1500px] space-y-6">
    <div><h1 className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100"><CalendarSearch size={21} /> Advanced booking search</h1><p className="text-sm text-neutral-500">Search across every booking using detailed operational filters</p></div>

    <form action="/advanced-booking-search" method="GET" className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Search criteria</h2>{hasFilters && <Link href="/advanced-booking-search" className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"><X size={14} /> Clear all</Link>}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><Field label="Keyword across booking, guest, hotel, guide, agent, refs" name="q" value={q} placeholder="Search anything..." /></div>
        <SelectField label="Booking status" name="status" value={status} options={["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((item) => ({ value: item, label: item }))} />
        <Field label="Booking reference" name="bookingReference" value={bookingReference} />
        <Field label="Confirmation number" name="confirmation" value={confirmation} />
        <Field label="Agent" name="agent" value={agent} />
        <Field label="Booking owner" name="bookingOwner" value={bookingOwner} />
        <Field label="Raw guide name" name="guideName" value={guideName} />
        <Field label="Tour type" name="tourType" value={tourType} />
        <Field label="Transfer type" name="transferType" value={transferType} />
        <Field label="Meal plan" name="mealPlan" value={mealPlan} />
        <Field label="Arrival flight" name="arrivalFlight" value={arrivalFlight} />
        <Field label="Departure flight" name="departureFlight" value={departureFlight} />
        <Field label="Arrival airport" name="arrivalAirport" value={arrivalAirport} />
        <Field label="Departure airport" name="departureAirport" value={departureAirport} />
        <SelectField label="Hotel" name="hotelId" value={hotelId} options={hotels.map((hotel) => ({ value: hotel.id, label: hotel.name }))} />
        <SelectField label="Assigned guide" name="guideId" value={guideId} options={guides.map((guide) => ({ value: guide.id, label: guide.fullName }))} />
        <SelectField label="Import file" name="importId" value={importId} options={imports.map((item) => ({ value: item.id, label: item.fileName }))} />
        <SelectField label="Hotel assigned" name="hasHotel" value={hasHotel} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <SelectField label="Guide assigned" name="hasGuide" value={hasGuide} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <SelectField label="WhatsApp / phone added" name="hasGuestPhone" value={hasGuestPhone} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <SelectField label="Guest email added" name="hasGuestEmail" value={hasGuestEmail} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
        <Field label="Guest name" name="guestName" value={guestName} />
        <Field label="Guest phone" name="guestPhone" value={guestPhone} />
        <Field label="Guest email" name="guestEmail" value={guestEmail} />
        <Field label="Guest nationality" name="nationality" value={nationality} />
      </div>
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Date ranges</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"><Field label="Check-in from" name="checkInFrom" value={checkInFrom} type="date" /><Field label="Check-in to" name="checkInTo" value={checkInTo} type="date" /><Field label="Check-out from" name="checkOutFrom" value={checkOutFrom} type="date" /><Field label="Check-out to" name="checkOutTo" value={checkOutTo} type="date" /><Field label="Created from" name="createdFrom" value={createdFrom} type="date" /><Field label="Created to" name="createdTo" value={createdTo} type="date" /></div></div>
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Group size</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Minimum guests" name="minGuests" value={minGuests} type="number" /><Field label="Maximum guests" name="maxGuests" value={maxGuests} type="number" /><Field label="Minimum rooms" name="minRooms" value={minRooms} type="number" /><Field label="Maximum rooms" name="maxRooms" value={maxRooms} type="number" /></div></div>
      <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"><Search size={16} /> Search bookings</button>
    </form>

    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800"><div><h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Results</h2><p className="text-xs text-neutral-500">{hasFilters ? `${results.length} booking${results.length === 1 ? "" : "s"}${results.length === 200 ? " · showing first 200" : ""}` : "Run a search to load bookings"}</p></div></div>
      {hasFilters && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"><th className="whitespace-nowrap px-4 py-3 font-medium">Reference</th><th className="whitespace-nowrap px-4 py-3 font-medium">Guest</th><th className="whitespace-nowrap px-4 py-3 font-medium">Contact</th><th className="whitespace-nowrap px-4 py-3 font-medium">Hotel</th><th className="whitespace-nowrap px-4 py-3 font-medium">Guide</th><th className="whitespace-nowrap px-4 py-3 font-medium">Stay</th><th className="whitespace-nowrap px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Action</th></tr></thead><tbody>{results.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">No bookings match these criteria.</td></tr> : results.map((booking) => <tr key={booking.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"><td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">{booking.bookingReference}<p className="text-xs font-normal text-neutral-400">{booking.confirmation ?? "No confirmation"}</p></td><td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{booking.guest?.fullName ?? booking.clientsNameRaw ?? "—"}<p className="text-xs text-neutral-400">{booking.guest?.nationality ?? "Nationality not set"}</p></td><td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{booking.guest?.phoneNumber ?? "No WhatsApp"}<p className="text-xs">{booking.guest?.email ?? "No email"}</p></td><td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{booking.hotel?.name ?? booking.hotelCity ?? "—"}</td><td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{booking.guide?.fullName ?? booking.guideName ?? "—"}</td><td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-neutral-400">{formatDate(booking.checkInDate)}<br />{formatDate(booking.checkOutDate)}</td><td className="px-4 py-3"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{booking.status}</span></td><td className="px-4 py-3"><Link href={`/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"><Eye size={14} /> View</Link></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
