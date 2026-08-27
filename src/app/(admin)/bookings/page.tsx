import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, FileSpreadsheet, Search, X, Eye } from "lucide-react";

const STATUS_META: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, className: "text-brand-600", label: "Completed" },
  COMPLETED_WITH_ERRORS: { icon: AlertTriangle, className: "text-amber-600", label: "Completed with errors" },
  FAILED: { icon: XCircle, className: "text-red-600", label: "Failed" },
  PENDING: { icon: Loader2, className: "text-neutral-400", label: "Pending" },
  PROCESSING: { icon: Loader2, className: "text-neutral-400", label: "Processing" },
};

type SearchParams = { [key: string]: string | string[] | undefined };

function getStringParam(params: SearchParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

// Parses a `YYYY-MM-DD` value from an <input type="date"> as the start of
// that day in local time. Returns undefined for empty/invalid input, so it
// can be spread straight into a Prisma date filter.
function parseDateStart(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// Same as above but anchored to the end of the day, so an inclusive "to"
// filter still captures bookings dated anywhere on that day.
function parseDateEnd(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await searchParams;
  const q = getStringParam(params, "q");

  const checkInFromRaw = getStringParam(params, "checkInFrom");
  const checkInToRaw = getStringParam(params, "checkInTo");
  const checkOutFromRaw = getStringParam(params, "checkOutFrom");
  const checkOutToRaw = getStringParam(params, "checkOutTo");

  const checkInFrom = parseDateStart(checkInFromRaw);
  const checkInTo = parseDateEnd(checkInToRaw);
  const checkOutFrom = parseDateStart(checkOutFromRaw);
  const checkOutTo = parseDateEnd(checkOutToRaw);

  const hasQuery = q.length > 0;
  const hasDateFilter = Boolean(checkInFrom || checkInTo || checkOutFrom || checkOutTo);
  const hasActiveFilter = hasQuery || hasDateFilter;

  const imports = await prisma.excelImport.findMany({
    where: { destinationTable: "BOOKINGS" },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: true,
      _count: { select: { bookings: true } },
    },
    take: 100,
  });

  const totalBookings = imports.reduce((sum, i) => sum + i._count.bookings, 0);

  // Search across all bookings, regardless of which import they came from.
  // Guest name and hotel name live on related models (Guest.fullName,
  // Hotel.name); clientsNameRaw / hotelCity are the raw imported fallbacks
  // kept on Booking itself for rows where the relation may not resolve to
  // exactly what was in the sheet.
  //
  // Apply date filters to the persisted booking date fields.
  const bookingResults = hasActiveFilter
    ? await prisma.booking.findMany({
        where: {
          AND: [
            hasQuery
              ? {
                  OR: [
                    { guest: { fullName: { contains: q, mode: "insensitive" } } },
                    { clientsNameRaw: { contains: q, mode: "insensitive" } },
                    { hotel: { name: { contains: q, mode: "insensitive" } } },
                    { hotelCity: { contains: q, mode: "insensitive" } },
                    { confirmation: { contains: q, mode: "insensitive" } },
                    { guideName: { contains: q, mode: "insensitive" } },
                    { agent: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {},
            checkInFrom || checkInTo
              ? {
                  checkInDate: {
                    ...(checkInFrom ? { gte: checkInFrom } : {}),
                    ...(checkInTo ? { lte: checkInTo } : {}),
                  },
                }
              : {},
            checkOutFrom || checkOutTo
              ? {
                  checkOutDate: {
                    ...(checkOutFrom ? { gte: checkOutFrom } : {}),
                    ...(checkOutTo ? { lte: checkOutTo } : {}),
                  },
                }
              : {},
          ],
        },
        include: {
          guest: true,
          hotel: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Bookings</h1>
        <p className="text-sm text-neutral-500">
          {imports.length} import file{imports.length === 1 ? "" : "s"} · {totalBookings} booking
          {totalBookings === 1 ? "" : "s"} total. Select a file to view its bookings.
        </p>
      </div>

      {/* Search all bookings */}
      <details
        className="group rounded-xl border border-neutral-200 bg-white open:pb-4 dark:border-neutral-800 dark:bg-neutral-950"
        open={hasActiveFilter}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <span className="flex items-center gap-2">
            <Search size={16} />
            Search all bookings
          </span>
          <span className="text-xs text-neutral-400 group-open:hidden">Expand</span>
          <span className="hidden text-xs text-neutral-400 group-open:inline">Collapse</span>
        </summary>

        <div className="border-t border-neutral-200 px-4 pt-4 dark:border-neutral-800">
          <form className="flex flex-col gap-3" action="/bookings" method="GET">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by guest name, hotel, confirmation no, guide, or agent..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="checkInFrom" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Check-in from
                </label>
                <input
                  type="date"
                  id="checkInFrom"
                  name="checkInFrom"
                  defaultValue={checkInFromRaw}
                  className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkInTo" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Check-in to
                </label>
                <input
                  type="date"
                  id="checkInTo"
                  name="checkInTo"
                  defaultValue={checkInToRaw}
                  className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkOutFrom" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Check-out from
                </label>
                <input
                  type="date"
                  id="checkOutFrom"
                  name="checkOutFrom"
                  defaultValue={checkOutFromRaw}
                  className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkOutTo" className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Check-out to
                </label>
                <input
                  type="date"
                  id="checkOutTo"
                  name="checkOutTo"
                  defaultValue={checkOutToRaw}
                  className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Search
              </button>
              {hasActiveFilter && (
                <Link
                  href="/bookings"
                  className="flex items-center justify-center gap-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <X size={16} />
                  Clear
                </Link>
              )}
            </div>
          </form>

          {hasActiveFilter && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Hotel</th>
                    <th className="px-4 py-3 font-medium">Confirmation</th>
                    <th className="px-4 py-3 font-medium">Check-in</th>
                    <th className="px-4 py-3 font-medium">Check-out</th>
                    <th className="px-4 py-3 font-medium">Guide</th>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingResults.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                        No bookings match the selected filters{q ? ` for "${q}"` : ""}.
                      </td>
                    </tr>
                  )}
                  {bookingResults.map((b) => (
                    <tr key={b.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        {b.guest?.fullName || b.clientsNameRaw || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {b.hotel?.name || b.hotelCity || "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{b.confirmation || "—"}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{b.guideName || "—"}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{b.agent || "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                        >
                          <Eye size={14} /> View full detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Uploaded by</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Rows</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {imports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No booking imports yet — run one from Excel Import.
                </td>
              </tr>
            )}
            {imports.map((imp) => {
              const meta = STATUS_META[imp.status] ?? STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <tr key={imp.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/imports/${imp.id}`}
                      className="flex items-center gap-2 font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                      <FileSpreadsheet size={14} className="flex-shrink-0" />
                      {imp.fileName}
                    </Link>
                    <p className="text-xs text-neutral-500">{imp.worksheetName}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{imp.uploadedBy.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {imp.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {imp.successRows}/{imp.totalRows}
                    {imp.duplicateRows > 0 && <span className="text-amber-600"> · {imp.duplicateRows} dup</span>}
                    {imp.failedRows > 0 && <span className="text-red-600"> · {imp.failedRows} failed</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{imp._count.bookings}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 ${meta.className}`}>
                      <Icon size={14} /> {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}