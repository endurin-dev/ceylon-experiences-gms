import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/permissions";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const guide = await prisma.guide.findUnique({ where: { id: params.id } });
  if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

  return NextResponse.json(guide);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("GUIDES", "canEdit");
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
    const guide = await prisma.guide.update({
      where: { id: params.id },
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
    return NextResponse.json(guide);
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e) {
      const code = (e as { code: string }).code;
      if (code === "P2025") {
        return NextResponse.json({ error: "Guide not found" }, { status: 404 });
      }
      if (code === "P2002") {
        return NextResponse.json({ error: "A guide with this license number already exists" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Failed to update guide" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("GUIDES", "canDelete");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    const status = message === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    await prisma.guide.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete guide" }, { status: 500 });
  }
}