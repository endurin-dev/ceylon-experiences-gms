import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const messageInclude = {
  orderBy: { createdAt: "asc" as const },
  select: {
    id: true,
    sender: true,
    body: true,
    createdAt: true,
    admin: { select: { name: true } },
  },
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const threads = await prisma.supportThread.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      guest: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      messages: messageInclude,
    },
  });

  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const guestId = typeof body?.guestId === "string" ? body.guestId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!guestId || !message) return NextResponse.json({ error: "Guest and message are required" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  const thread = await prisma.supportThread.findUnique({ where: { guestId } });
  if (!thread) return NextResponse.json({ error: "Feedback thread not found" }, { status: 404 });

  const created = await prisma.supportMessage.create({
    data: { threadId: thread.id, adminId: user.id, sender: "ADMIN", body: message },
    select: { id: true, sender: true, body: true, createdAt: true, admin: { select: { name: true } } },
  });

  return NextResponse.json({ message: created }, { status: 201 });
}
