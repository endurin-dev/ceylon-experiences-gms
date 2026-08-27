import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { threadId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status === "OPEN" || body?.status === "CLOSED" ? body.status : null;
  if (!status) return NextResponse.json({ error: "Invalid thread status" }, { status: 400 });

  const thread = await prisma.supportThread.updateMany({
    where: { id: params.threadId },
    data: { status },
  });
  if (!thread.count) return NextResponse.json({ error: "Feedback thread not found" }, { status: 404 });

  return NextResponse.json({ success: true, status });
}
