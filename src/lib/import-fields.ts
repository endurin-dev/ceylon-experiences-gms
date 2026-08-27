// lib/import-fields.ts
// Defines the importable fields per destination table, and auto-suggests a
// mapping from an Excel header to one of those fields.

export type ImportDestination = "GUESTS" | "HOTELS" | "BOOKINGS" | "TOURS" | "TRANSFERS";

export const DESTINATION_LABELS: Record<ImportDestination, string> = {
  GUESTS: "Guests",
  HOTELS: "Hotels",
  BOOKINGS: "Bookings (guest + hotel + stay, one row per booking)",
  TOURS: "Tours",
  TRANSFERS: "Transfers",
};

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
}

export const IMPORT_FIELDS: Record<ImportDestination, ImportField[]> = {
  GUESTS: [
    { key: "fullName", label: "Full name", required: true },
    { key: "passportNumber", label: "Passport number" },
    { key: "nationality", label: "Nationality" },
    { key: "phoneNumber", label: "Phone number" },
    { key: "email", label: "Email" },
    { key: "country", label: "Country" },
    { key: "arrivalDate", label: "Arrival date" },
    { key: "departureDate", label: "Departure date" },
    { key: "notes", label: "Notes" },
  ],
  HOTELS: [
    { key: "name", label: "Hotel name", required: true },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "phoneNumber", label: "Phone number" },
    { key: "email", label: "Email" },
  ],
  // One row = one booking. The engine derives/creates the linked Guest and
  // Hotel records itself, so you map columns straight to Booking fields.
  //
  // Updated for the WINTER 26/27 template — added: tourType, transferType,
  // arrivalAirport, departureAirport, hotelCity, and appliedBy (previously
  // "Applied By" was folded into bookingOwner, but the new sheet has both
  // "Booking Owner" and "Applied By" as separate columns).
  //
  // "guideName" stays as the raw imported string (kept verbatim from the
  // sheet); the engine additionally attempts to resolve it against an
  // existing Guide record and, if found, populates the guideId FK. See
  // findOrCreateGuideByName in import-engine.ts for the matching behavior.
  BOOKINGS: [
    { key: "clientsNameRaw", label: "Guest(s) / Clients name", required: true },
    { key: "hotelName", label: "Hotel name", required: true },
    { key: "bookingReference", label: "Booking reference (Samo Ref / Res No)" },
    { key: "tourType", label: "Tour type" },
    { key: "agent", label: "Agent" },
    { key: "agentTourNo", label: "Agent's Tour No" },
    { key: "samoRef", label: "Samo Ref." },
    { key: "resNo", label: "Res No" },
    { key: "transferType", label: "Transfer type" },
    { key: "remarks", label: "Remarks / Notes" },
    { key: "paxAdults", label: "No. of PAX (Adults)" },
    { key: "paxChildren", label: "No. of PAX (Children)" },
    { key: "paxInfants", label: "No. of PAX (Infants)" },
    { key: "arrivalDate", label: "Arrival date" },
    { key: "arrivalFlight", label: "Arrival flight" },
    { key: "arrivalAirport", label: "Arrival airport" },
    { key: "departureDate", label: "Departure date" },
    { key: "departureFlight", label: "Departure flight" },
    { key: "departureAirport", label: "Departure airport" },
    { key: "pickupTime", label: "Pick up time" },
    { key: "bookingOwner", label: "Booking owner" },
    { key: "hotelCity", label: "Hotel city" },
    { key: "mealPlan", label: "Meal plan" },
    { key: "checkInDate", label: "Hotel check-in date" },
    { key: "checkOutDate", label: "Hotel check-out date" },
    { key: "appliedBy", label: "Applied by" },
    { key: "confirmation", label: "Confirmation" },
    { key: "guideName", label: "Guide name" },
  ],
  TOURS: [
    { key: "tourName", label: "Tour name", required: true },
    { key: "guestFullName", label: "Guest full name", required: true },
    { key: "tourDate", label: "Tour date" },
    { key: "pickupLocation", label: "Pickup location" },
    { key: "destination", label: "Destination" },
    { key: "numberOfParticipants", label: "No. of participants" },
    { key: "notes", label: "Notes" },
  ],
  TRANSFERS: [
    { key: "guestFullName", label: "Guest full name", required: true },
    { key: "pickupLocation", label: "Pickup location" },
    { key: "dropoffLocation", label: "Dropoff location" },
    { key: "pickupDateTime", label: "Pickup date/time" },
    { key: "vehicleType", label: "Vehicle type" },
    { key: "driver", label: "Driver" },
    { key: "notes", label: "Notes" },
  ],
};

// Header -> field key synonyms. Keys here are normalized (lowercase,
// punctuation stripped, collapsed whitespace) so "Samo Ref." and "samo ref"
// both match "samo ref".
const SYNONYMS: Record<ImportDestination, Record<string, string>> = {
  GUESTS: {
    "clients name": "fullName",
    "full name": "fullName",
    "guest name": "fullName",
    passport: "passportNumber",
    "passport number": "passportNumber",
    nationality: "nationality",
    phone: "phoneNumber",
    "phone number": "phoneNumber",
    email: "email",
    country: "country",
    "arr date": "arrivalDate",
    "arrival date": "arrivalDate",
    "dep date": "departureDate",
    "departure date": "departureDate",
    remarks: "notes",
    notes: "notes",
  },
  HOTELS: {
    hotel: "name",
    "hotel name": "name",
    city: "city",
    country: "country",
    phone: "phoneNumber",
    email: "email",
  },
  BOOKINGS: {
    "tour type": "tourType",
    agent: "agent",
    "agents tour no": "agentTourNo",
    "samo ref": "samoRef",
    "res no": "resNo",
    "clients name": "clientsNameRaw",
    "transfer type": "transferType",
    remarks: "remarks",
    "no of pax adults": "paxAdults",
    "no of pax children": "paxChildren",
    "no of pax inf": "paxInfants",
    "arr date": "arrivalDate",
    "arrival flight": "arrivalFlight",
    "arrival airport": "arrivalAirport",
    "dep date": "departureDate",
    "departure flight": "departureFlight",
    "departure airport": "departureAirport",
    "pick up time": "pickupTime",
    "booking owner": "bookingOwner",
    "hotel city": "hotelCity",
    hotel: "hotelName",
    "meal plan": "mealPlan",
    "hotel check in date": "checkInDate",
    "hotel check out date": "checkOutDate",
    "applied by": "appliedBy",
    confirmation: "confirmation",
    "guide name": "guideName",
  },
  TOURS: {
    "tour name": "tourName",
    "clients name": "guestFullName",
    "guest name": "guestFullName",
    "tour date": "tourDate",
    "pickup location": "pickupLocation",
    destination: "destination",
    "no of participants": "numberOfParticipants",
    remarks: "notes",
  },
  TRANSFERS: {
    "clients name": "guestFullName",
    "guest name": "guestFullName",
    "pickup location": "pickupLocation",
    "dropoff location": "dropoffLocation",
    "pick up time": "pickupDateTime",
    "vehicle type": "vehicleType",
    driver: "driver",
    remarks: "notes",
  },
};

function normalize(header: string): string {
  return header
    .toLowerCase()
    .replace(/[.()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestFieldForHeader(header: string, destination: ImportDestination): string | undefined {
  const norm = normalize(header);
  const table = SYNONYMS[destination];
  if (table[norm]) return table[norm];

  // fall back: exact key match against the field list itself
  const fields = IMPORT_FIELDS[destination];
  const direct = fields.find((f) => normalize(f.label) === norm || normalize(f.key) === norm);
  return direct?.key;
}

// ---------------------------------------------------------------------------
// Worksheet filtering
// ---------------------------------------------------------------------------
//
// Newer workbook templates (e.g. WINTER 26/27) ship extra tabs alongside the
// actual booking rows:
//   - "INDEX"                 -> a nav sheet linking to the other tabs
//   - "Sheet_Data_donotchange" -> the source list backing the in-sheet
//                                 dropdown validations (hotel list, tour
//                                 types, pax counts, meal plans, etc). Not
//                                 booking rows at all.
//   - "Flight 01".."Flight 05", "OTHER ARRIVALS" -> these DO contain real
//     booking rows (same header/shape as "ALL BOOKINGS"), they're just the
//     same bookings split out by arrival flight for print handouts, so they
//     usually duplicate what's in "ALL BOOKINGS" rather than being additive.
//
// isLikelyDataSheet() only filters out the clearly non-booking tabs (INDEX,
// donotchange) from the worksheet picker. It deliberately does NOT try to
// dedupe "ALL BOOKINGS" vs "Flight 0X" — that's a business decision for the
// user importing, not something to silently guess at. Surface a hint in the
// UI instead (see NON_DATA_SHEET_PATTERNS usage note below).
const NON_DATA_SHEET_PATTERNS = [/^index$/i, /donotchange/i];

export function isLikelyDataSheet(sheetName: string): boolean {
  const trimmed = sheetName.trim();
  return !NON_DATA_SHEET_PATTERNS.some((p) => p.test(trimmed));
}

// Sheets that contain real booking rows but are commonly a subset/duplicate
// of another "primary" sheet in the same workbook (e.g. per-flight splits
// of "ALL BOOKINGS"). Used only to show an informational hint in the
// worksheet picker — never to block or auto-skip a selection.
const LIKELY_DUPLICATE_SHEET_PATTERNS = [/^flight\s*0?\d+$/i, /^other arrivals$/i];

export function isLikelyDuplicateBookingSheet(sheetName: string): boolean {
  const trimmed = sheetName.trim();
  return LIKELY_DUPLICATE_SHEET_PATTERNS.some((p) => p.test(trimmed));
}