import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * POST /api/bookings/bulk-assign-guide
 * Body: { bookingIds: string[], guideId: string | null }
 * guideId null/"" unassigns the guide from all selected bookings.
 */
export async function POST(req: NextRequest) {
  try {
    await requirePermission("BOOKINGS", "canEdit");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    const status = message === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
    return NextResponse.json({ error: "bookingIds is required" }, { status: 400 });
  }
  const bookingIds: string[] = body.bookingIds.filter((id: unknown) => typeof id === "string");
  if (bookingIds.length === 0) {
    return NextResponse.json({ error: "bookingIds must contain strings" }, { status: 400 });
  }

  const guideId: string | null = body.guideId === "" || body.guideId === undefined ? null : body.guideId;

  // Validate the guide exists before assigning, so a bad id doesn't
  // silently null out every selected booking's guide.
  if (guideId) {
    const guide = await prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }

  const result = await prisma.booking.updateMany({
    where: { id: { in: bookingIds } },
    data: { guideId },
  });

  return NextResponse.json({ updatedCount: result.count });
}