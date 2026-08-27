// lib/import-engine.ts
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ImportDestination } from "@/lib/import-fields";
import { Prisma } from "@prisma/client";

export type DuplicateStrategy = "skip" | "update" | "createOnly";

export interface MappedRow {
  rowNumber: number;
  values: Record<string, string | number | null>;
}

export interface ImportRunResult {
  successRows: number;
  failedRows: number;
  duplicateRows: number;
  errors: { rowNumber: number; columnName?: string; errorMessage: string; rawRowData?: unknown }[];
  // Rows that imported successfully but whose "Guide name" cell didn't match
  // any existing Guide record. The booking still imports — guideName keeps
  // the raw text and guideId is left null — this is just a heads-up so
  // staff can fix typos or create the missing Guide record and re-run with
  // duplicateStrategy "update".
  unmatchedGuideNames: { rowNumber: number; guideName: string }[];
}

// NEW — result shape for the pre-import duplicate preview (dry run, no writes)
export interface DuplicatePreviewResult {
  totalRows: number;
  newCount: number;
  duplicateCount: number;
  // Rows with no stable natural key (no explicit reference, samo ref, res
  // no, or agent tour no) would get an AUTO- generated reference that is
  // NOT stable across two uploads of the same file. These can never be
  // reliably detected as duplicates on re-upload, so flag them separately.
  unstableRefCount: number;
  unstableRows: number[]; // row numbers, for surfacing in the UI if needed
}

export async function runImport(
  destination: ImportDestination,
  rows: MappedRow[],
  duplicateStrategy: DuplicateStrategy,
  importId: string
): Promise<ImportRunResult> {
  switch (destination) {
    case "BOOKINGS":
      return importBookings(rows, duplicateStrategy, importId);
    case "GUESTS":
      return importGuests(rows, duplicateStrategy);
    case "HOTELS":
      return importHotels(rows, duplicateStrategy);
    default:
      // TOURS / TRANSFERS follow the same pattern as GUESTS/HOTELS below;
      // add them the same way once you need them.
      return {
        successRows: 0,
        failedRows: rows.length,
        duplicateRows: 0,
        unmatchedGuideNames: [],
        errors: rows.map((r) => ({
          rowNumber: r.rowNumber,
          errorMessage: `Import for destination "${destination}" is not implemented yet`,
        })),
      };
  }
}

// ---------------------------------------------------------------------------
// Duplicate preview (dry run — used by the "check-duplicates" API route so
// the UI can show "X new / Y already exist" before the user commits).
// Only meaningful for BOOKINGS, since GUESTS/HOTELS dedupe on
// case-insensitive name matching rather than a single unique column, which
// doesn't batch the same way. Extend this if you need previews for those too.
// ---------------------------------------------------------------------------

export async function previewBookingDuplicates(rows: MappedRow[]): Promise<DuplicatePreviewResult> {
  const refsByRow = rows.map((row) => ({
    rowNumber: row.rowNumber,
    reference: buildBookingReference(row.values, row.rowNumber),
  }));

  const unstableRows = refsByRow.filter((r) => r.reference.startsWith("AUTO-ROW")).map((r) => r.rowNumber);

  // Only check stable references against the DB — an AUTO- reference is
  // freshly generated every time and will never match an existing row, so
  // including it would just waste a query and always report "new".
  const stableRefs = refsByRow.filter((r) => !r.reference.startsWith("AUTO-ROW")).map((r) => r.reference);

  let existingRefs = new Set<string>();
  if (stableRefs.length > 0) {
    const existing = await prisma.booking.findMany({
      where: { bookingReference: { in: stableRefs } },
      select: { bookingReference: true },
    });
    existingRefs = new Set(existing.map((b) => b.bookingReference));
  }

  let duplicateCount = 0;
  for (const r of refsByRow) {
    if (existingRefs.has(r.reference)) duplicateCount++;
  }

  return {
    totalRows: rows.length,
    newCount: rows.length - duplicateCount,
    duplicateCount,
    unstableRefCount: unstableRows.length,
    unstableRows,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function toInt(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

function toDate(v: unknown): Date | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// "TE ANTONIA / ABISHEVA AIDA" -> ["TE ANTONIA", "ABISHEVA AIDA"]
function splitClientNames(raw: string): string[] {
  return raw
    .split("/")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

async function findOrCreateHotel(name: string) {
  const clean = name.trim();
  const existing = await prisma.hotel.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.hotel.create({ data: { name: clean } });
}

// Dedupe guests by exact (case-insensitive) full name. Good enough for a
// tour-operator sheet where the "Clients Name" cell is the closest thing to
// a natural key; swap for passport-number matching once you collect that.
async function findOrCreateGuest(fullName: string, extra: { arrivalDate?: Date; departureDate?: Date }) {
  const clean = fullName.trim();
  const existing = await prisma.guest.findFirst({
    where: { fullName: { equals: clean, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.guest.create({
    data: {
      fullName: clean,
      arrivalDate: extra.arrivalDate,
      departureDate: extra.departureDate,
    },
  });
}

// Guides are staff-facing portal accounts with logins, unlike hotels/guests,
// so importing a booking should never silently mint a new Guide just
// because a name appeared in a spreadsheet cell. This ONLY links to an
// existing Guide by case-insensitive exact name match; if there's no match
// it returns null and the caller records it as "unmatched" for review.
// If you later want fuzzy matching (nicknames, misspellings) or the option
// to auto-create, add it here explicitly rather than defaulting to create.
async function findGuideByName(fullName: string) {
  const clean = fullName.trim();
  if (!clean) return null;
  return prisma.guide.findFirst({
    where: { fullName: { equals: clean, mode: "insensitive" } },
  });
}

// CHANGED: exported so the duplicate-preview dry run (above) and the API
// route can compute the exact same reference a real import would use,
// without duplicating the rule in two places.
export function buildBookingReference(v: Record<string, unknown>, rowNumber: number): string {
  const samo = toStr(v.samoRef);
  const res = toStr(v.resNo);
  const agentTour = toStr(v.agentTourNo);
  const explicit = toStr(v.bookingReference);
  // Prefer values already present on the sheet, in order of specificity.
  if (explicit) return explicit;
  if (samo) return `SAMO-${samo}`;
  if (res) return `RES-${res}`;
  if (agentTour) return `AGT-${agentTour}`;
  // No natural key on this row at all -> mint a guaranteed-unique one so
  // the row still imports instead of failing.
  return `AUTO-ROW${rowNumber}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// BOOKINGS (composite: guest + hotel + booking, one Excel row each)
// ---------------------------------------------------------------------------

async function importBookings(
  rows: MappedRow[],
  duplicateStrategy: DuplicateStrategy,
  importId: string
): Promise<ImportRunResult> {
  const result: ImportRunResult = {
    successRows: 0,
    failedRows: 0,
    duplicateRows: 0,
    errors: [],
    unmatchedGuideNames: [],
  };

  for (const row of rows) {
    const v = row.values;
    try {
      const clientsNameRaw = toStr(v.clientsNameRaw);
      const hotelName = toStr(v.hotelName);

      if (!clientsNameRaw) {
        throw new FieldError("clientsNameRaw", "Guest/clients name is required");
      }
      if (!hotelName) {
        throw new FieldError("hotelName", "Hotel name is required");
      }

      const arrivalDate = toDate(v.arrivalDate);
      const departureDate = toDate(v.departureDate);
      const checkInDate = toDate(v.checkInDate) ?? arrivalDate;
      const checkOutDate = toDate(v.checkOutDate) ?? departureDate;

      // Use the first name on the cell as the guest-of-record; the full
      // string (all travellers on this booking) is preserved verbatim in
      // clientsNameRaw so nothing is lost.
      const primaryName = splitClientNames(clientsNameRaw)[0] ?? clientsNameRaw;

      const bookingReference = buildBookingReference(v, row.rowNumber);

      const existing = await prisma.booking.findUnique({ where: { bookingReference } });

      if (existing && duplicateStrategy === "skip") {
        result.duplicateRows++;
        continue;
      }
      if (existing && duplicateStrategy === "createOnly") {
        result.duplicateRows++;
        continue;
      }

      const guest = await findOrCreateGuest(primaryName, { arrivalDate, departureDate });
      const hotel = await findOrCreateHotel(hotelName);

      const guideNameRaw = toStr(v.guideName);
      const guide = guideNameRaw ? await findGuideByName(guideNameRaw) : null;
      if (guideNameRaw && !guide) {
        result.unmatchedGuideNames.push({ rowNumber: row.rowNumber, guideName: guideNameRaw });
      }

      const paxAdults = toInt(v.paxAdults);
      const paxChildren = toInt(v.paxChildren);
      const paxInfants = toInt(v.paxInfants);
      const numberOfGuests = [paxAdults, paxChildren, paxInfants].reduce<number>(
        (sum, n) => (typeof n === "number" && n > 0 ? sum + n : sum),
        0
      ) || undefined;

      const data = {
        importId,
        bookingReference,
        guestId: guest.id,
        hotelId: hotel.id,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        notes: toStr(v.remarks),
        agent: toStr(v.agent),
        agentTourNo: toStr(v.agentTourNo),
        samoRef: toStr(v.samoRef),
        resNo: toStr(v.resNo),
        clientsNameRaw,
        paxAdults,
        paxChildren,
        paxInfants,
        arrivalFlight: toStr(v.arrivalFlight),
        departureFlight: toStr(v.departureFlight),
        pickupTime: toStr(v.pickupTime),
        bookingOwner: toStr(v.bookingOwner),
        mealPlan: toStr(v.mealPlan),
        confirmation: toStr(v.confirmation),
        guideName: guideNameRaw,
        guideId: guide?.id,
        tourType: toStr(v.tourType),
        transferType: toStr(v.transferType),
        arrivalAirport: toStr(v.arrivalAirport),
        departureAirport: toStr(v.departureAirport),
        hotelCity: toStr(v.hotelCity),
        appliedBy: toStr(v.appliedBy),
      };

      if (existing && duplicateStrategy === "update") {
        await prisma.booking.update({ where: { id: existing.id }, data });
        result.duplicateRows++;
      } else {
        await prisma.booking.create({ data });
        result.successRows++;
      }
    } catch (err) {
      result.failedRows++;
      result.errors.push(toRowError(row, err));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// GUESTS
// ---------------------------------------------------------------------------

async function importGuests(rows: MappedRow[], duplicateStrategy: DuplicateStrategy): Promise<ImportRunResult> {
  const result: ImportRunResult = {
    successRows: 0,
    failedRows: 0,
    duplicateRows: 0,
    errors: [],
    unmatchedGuideNames: [],
  };

  for (const row of rows) {
    const v = row.values;
    try {
      const fullName = toStr(v.fullName);
      if (!fullName) throw new FieldError("fullName", "Full name is required");

      const passportNumber = toStr(v.passportNumber);
      const existing = passportNumber
        ? await prisma.guest.findUnique({ where: { passportNumber } })
        : await prisma.guest.findFirst({ where: { fullName: { equals: fullName, mode: "insensitive" } } });

      if (existing && duplicateStrategy === "skip") {
        result.duplicateRows++;
        continue;
      }
      if (existing && duplicateStrategy === "createOnly") {
        result.duplicateRows++;
        continue;
      }

      const data = {
        fullName,
        passportNumber,
        nationality: toStr(v.nationality),
        phoneNumber: toStr(v.phoneNumber),
        email: toStr(v.email),
        country: toStr(v.country),
        arrivalDate: toDate(v.arrivalDate),
        departureDate: toDate(v.departureDate),
        notes: toStr(v.notes),
      };

      if (existing && duplicateStrategy === "update") {
        await prisma.guest.update({ where: { id: existing.id }, data });
        result.duplicateRows++;
      } else {
        await prisma.guest.create({ data });
        result.successRows++;
      }
    } catch (err) {
      result.failedRows++;
      result.errors.push(toRowError(row, err));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// HOTELS
// ---------------------------------------------------------------------------

async function importHotels(rows: MappedRow[], duplicateStrategy: DuplicateStrategy): Promise<ImportRunResult> {
  const result: ImportRunResult = {
    successRows: 0,
    failedRows: 0,
    duplicateRows: 0,
    errors: [],
    unmatchedGuideNames: [],
  };

  for (const row of rows) {
    const v = row.values;
    try {
      const name = toStr(v.name);
      if (!name) throw new FieldError("name", "Hotel name is required");

      const existing = await prisma.hotel.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });

      if (existing && duplicateStrategy === "skip") {
        result.duplicateRows++;
        continue;
      }
      if (existing && duplicateStrategy === "createOnly") {
        result.duplicateRows++;
        continue;
      }

      const data = {
        name,
        city: toStr(v.city),
        country: toStr(v.country),
        phoneNumber: toStr(v.phoneNumber),
        email: toStr(v.email),
      };

      if (existing && duplicateStrategy === "update") {
        await prisma.hotel.update({ where: { id: existing.id }, data });
        result.duplicateRows++;
      } else {
        await prisma.hotel.create({ data });
        result.successRows++;
      }
    } catch (err) {
      result.failedRows++;
      result.errors.push(toRowError(row, err));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------

class FieldError extends Error {
  columnName: string;
  constructor(columnName: string, message: string) {
    super(message);
    this.columnName = columnName;
  }
}

function toRowError(row: MappedRow, err: unknown) {
  if (err instanceof FieldError) {
    return { rowNumber: row.rowNumber, columnName: err.columnName, errorMessage: err.message, rawRowData: row.values };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return {
        rowNumber: row.rowNumber,
        errorMessage: `Duplicate value for unique field: ${(err.meta?.target as string[])?.join(", ")}`,
        rawRowData: row.values,
      };
    }
  }
  return {
    rowNumber: row.rowNumber,
    errorMessage: err instanceof Error ? err.message : "Unknown error",
    rawRowData: row.values,
  };
}