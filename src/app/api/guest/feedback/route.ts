import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/guest-auth";
import { prisma } from "@/lib/prisma";

const messageInclude = {
  orderBy: { createdAt: "asc" as const },
  select: {
    id: true,
    sender: true,
    body: true,
    createdAt: true,
  },
};

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const thread = await prisma.supportThread.upsert({
    where: { guestId: guest.id },
    create: { guestId: guest.id },
    update: {},
    include: { messages: messageInclude },
  });

  return NextResponse.json({ thread });
}

export async function POST(req: NextRequest) {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  const thread = await prisma.supportThread.upsert({
    where: { guestId: guest.id },
    create: { guestId: guest.id },
    update: { status: "OPEN" },
  });
  const created = await prisma.supportMessage.create({
    data: { threadId: thread.id, guestId: guest.id, sender: "GUEST", body: message },
    select: { id: true, sender: true, body: true, createdAt: true },
  });

  return NextResponse.json({ message: created }, { status: 201 });
}
