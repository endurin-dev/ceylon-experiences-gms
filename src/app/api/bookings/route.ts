import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "25", 10) || 25));
  const q = sp.get("q")?.trim();
  const status = sp.get("status");

  const where: Prisma.BookingWhereInput = {
    ...(status && status !== "ALL" ? { status: status as any } : {}),
    ...(q
      ? {
          OR: [
            { bookingReference: { contains: q, mode: "insensitive" } },
            { samoRef: { contains: q, mode: "insensitive" } },
            { resNo: { contains: q, mode: "insensitive" } },
            { clientsNameRaw: { contains: q, mode: "insensitive" } },
            { guideName: { contains: q, mode: "insensitive" } },
            { guest: { fullName: { contains: q, mode: "insensitive" } } },
            { hotel: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { guest: true, hotel: true, guide: true },
      orderBy: [{ checkInDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    bookings,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}