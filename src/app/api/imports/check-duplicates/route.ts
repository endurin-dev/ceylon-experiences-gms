import { NextRequest, NextResponse } from "next/server";
import { previewBookingDuplicates, type MappedRow } from "@/lib/import-engine";
// ADJUST: use whatever your other /api/imports routes use for staff auth,
// e.g. getServerSession(authOptions) + requirePermission("BOOKINGS", "canImport")
// This is read-only (no writes) but should still require an authenticated
// staff session — don't leave it open.
// import { requirePermission } from "@/lib/permissions";

interface CheckDuplicatesBody {
  destination: string;
  rows: MappedRow[];
}

export async function POST(req: NextRequest) {
  // ADJUST: enforce auth/permission here, matching your /api/imports route.
  // const authError = await requirePermission("BOOKINGS", "canImport");
  // if (authError) return authError;

  let body: CheckDuplicatesBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { destination, rows } = body;

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  if (destination !== "BOOKINGS") {
    // Only BOOKINGS has a single-column natural key (bookingReference) that
    // batches cleanly. GUESTS/HOTELS dedupe on case-insensitive name
    // matching, which doesn't preview the same way — extend
    // previewBookingDuplicates-style logic for them if you need this later.
    return NextResponse.json({ supported: false });
  }

  if (rows.length === 0) {
    return NextResponse.json({
      supported: true,
      totalRows: 0,
      newCount: 0,
      duplicateCount: 0,
      unstableRefCount: 0,
      unstableRows: [],
    });
  }

  try {
    const preview = await previewBookingDuplicates(rows);
    return NextResponse.json({ supported: true, ...preview });
  } catch (err) {
    console.error("check-duplicates failed:", err);
    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 });
  }
}