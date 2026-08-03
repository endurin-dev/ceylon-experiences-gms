import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requirePermission } from "@/lib/permissions";
import { hash } from "bcryptjs";

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

/**
 * PATCH /api/guides/[id]/credentials
 * Body: { username: string, password: string }
 * Sets or resets the guide's login for the mobile Guide Portal.
 * Separate from the main guide PATCH route since this is a sensitive,
 * infrequent action (admin-only) rather than a routine profile edit.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("GUIDES", "canEdit");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 403 });
  }

  const guide = await prisma.guide.findUnique({ where: { id: params.id } });
  if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const fieldErrors: Record<string, string> = {};
  if (!USERNAME_RE.test(username)) fieldErrors.username = "3-32 chars: letters, numbers, ._-";
  if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  const usernameTaken = await prisma.guide.findFirst({
    where: { username, id: { not: params.id } },
  });
  if (usernameTaken) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { username: "Username already taken" } },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  const updated = await prisma.guide.update({
    where: { id: params.id },
    data: { username, passwordHash },
    select: { id: true, fullName: true, username: true },
  });

  const actingUser = await getCurrentUser();
  await prisma.auditLog.create({
    data: {
      userId: actingUser?.id ?? null,
      action: "UPDATE",
      module: "GUIDES",
      recordId: params.id,
      details: { action: "SET_LOGIN_CREDENTIALS", username },
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/guides/[id]/credentials
 * Revokes portal access without deleting the guide record itself.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("GUIDES", "canEdit");
  } catch (e) {
    const message = e instanceof Error ? e.message : "FORBIDDEN";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHENTICATED" ? 401 : 403 });
  }

  const guide = await prisma.guide.findUnique({ where: { id: params.id } });
  if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

  await prisma.guide.update({
    where: { id: params.id },
    data: { username: null, passwordHash: null },
  });

  return NextResponse.json({ success: true });
}