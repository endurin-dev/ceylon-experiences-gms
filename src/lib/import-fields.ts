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
  BOOKINGS: [
    { key: "clientsNameRaw", label: "Guest(s) / Clients name", required: true },
    { key: "hotelName", label: "Hotel name", required: true },
    { key: "bookingReference", label: "Booking reference (Samo Ref / Res No)" },
    { key: "agent", label: "Agent" },
    { key: "agentTourNo", label: "Agent's Tour No" },
    { key: "samoRef", label: "Samo Ref." },
    { key: "resNo", label: "Res No" },
    { key: "remarks", label: "Remarks / Notes" },
    { key: "paxAdults", label: "No. of PAX (Adults)" },
    { key: "paxChildren", label: "No. of PAX (Children)" },
    { key: "paxInfants", label: "No. of PAX (Infants)" },
    { key: "arrivalDate", label: "Arrival date" },
    { key: "arrivalFlight", label: "Arrival flight" },
    { key: "departureDate", label: "Departure date" },
    { key: "departureFlight", label: "Departure flight" },
    { key: "pickupTime", label: "Pick up time" },
    { key: "bookingOwner", label: "Booking owner" },
    { key: "mealPlan", label: "Meal plan" },
    { key: "checkInDate", label: "Hotel check-in date" },
    { key: "checkOutDate", label: "Hotel check-out date" },
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
    agent: "agent",
    "agents tour no": "agentTourNo",
    "samo ref": "samoRef",
    "res no": "resNo",
    "clients name": "clientsNameRaw",
    remarks: "remarks",
    "no of pax adults": "paxAdults",
    "no of pax children": "paxChildren",
    "no of pax inf": "paxInfants",
    "arr date": "arrivalDate",
    "arrival flight": "arrivalFlight",
    "dep date": "departureDate",
    "departure flight": "departureFlight",
    "pick up time": "pickupTime",
    "booking owner": "bookingOwner",
    "applied by": "bookingOwner",
    hotel: "hotelName",
    "meal plan": "mealPlan",
    "hotel check in date": "checkInDate",
    "hotel check out date": "checkOutDate",
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