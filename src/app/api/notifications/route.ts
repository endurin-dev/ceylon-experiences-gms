import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { guest: { select: { id: true, fullName: true } }, sender: { select: { name: true } } },
  });
  const guests = await prisma.guest.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true, email: true } });
  return NextResponse.json({ notifications, guests });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.clearAll === true) {
    const result = await prisma.notification.deleteMany();
    return NextResponse.json({ success: true, deleted: result.count });
  }

  const notificationId = typeof body?.notificationId === "string" ? body.notificationId : "";
  if (!notificationId) return NextResponse.json({ error: "Notification is required" }, { status: 400 });

  const result = await prisma.notification.deleteMany({ where: { id: notificationId } });
  if (!result.count) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const guestId = typeof body?.guestId === "string" ? body.guestId : "";
  if (!title || !message || !guestId) return NextResponse.json({ error: "Guest, title, and message are required" }, { status: 400 });
  if (title.length > 120 || message.length > 2000) return NextResponse.json({ error: "Notification is too long" }, { status: 400 });

  if (guestId === "ALL") {
    const guests = await prisma.guest.findMany({ select: { id: true } });
    await prisma.notification.createMany({ data: guests.map((guest) => ({ guestId: guest.id, senderId: user.id, title, body: message })) });
    return NextResponse.json({ sent: guests.length }, { status: 201 });
  }

  const guest = await prisma.guest.findUnique({ where: { id: guestId }, select: { id: true } });
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  const notification = await prisma.notification.create({
    data: { guestId, senderId: user.id, title, body: message },
    include: { guest: { select: { id: true, fullName: true } }, sender: { select: { name: true } } },
  });
  return NextResponse.json({ notification }, { status: 201 });
}
