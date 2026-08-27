import { NextResponse } from "next/server";
import { getCurrentGuest } from "@/lib/guest-auth";

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  return NextResponse.json({ guest });
}
