import { NextRequest, NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/guest-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { guestId: guest.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, readAt: true, createdAt: true },
  });

  return NextResponse.json({ notifications, unreadCount: notifications.filter((notification) => !notification.readAt).length });
}

export async function PATCH(req: NextRequest) {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const notificationId = typeof body?.notificationId === "string" ? body.notificationId : "";
  if (!notificationId) return NextResponse.json({ error: "Notification is required" }, { status: 400 });

  const result = await prisma.notification.updateMany({
    where: { id: notificationId, guestId: guest.id },
    data: { readAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
