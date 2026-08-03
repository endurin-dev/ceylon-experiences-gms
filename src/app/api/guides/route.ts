import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "25", 10) || 25));
  const q = sp.get("q")?.trim();

  const where: Prisma.GuideWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { licenseNumber: { contains: q, mode: "insensitive" } },
          { specialization: { contains: q, mode: "insensitive" } },
          { phoneNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, guides] = await Promise.all([
    prisma.guide.count({ where }),
    prisma.guide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    guides,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("GUIDES", "canCreate");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    const status = message === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.fullName !== "string" || !body.fullName.trim()) {
    return NextResponse.json({ error: "fullName is required" }, { status: 400 });
  }

  try {
    const guide = await prisma.guide.create({
      data: {
        fullName: body.fullName.trim(),
        licenseNumber: body.licenseNumber?.trim() || null,
        phoneNumber: body.phoneNumber?.trim() || null,
        email: body.email?.trim() || null,
        languages: body.languages?.trim() || null,
        specialization: body.specialization?.trim() || null,
        status: body.status ?? "ACTIVE",
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json(guide, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "A guide with this license number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create guide" }, { status: 500 });
  }
}