import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const destination = req.nextUrl.searchParams.get("destination");

  const mappings = await prisma.savedColumnMapping.findMany({
    where: destination ? { destination: destination as any } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(mappings);
}

const createSchema = z.object({
  name: z.string().min(1),
  destination: z.enum(["GUESTS", "HOTELS", "BOOKINGS", "TOURS", "TRANSFERS"]),
  mapping: z.record(z.string()),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const saved = await prisma.savedColumnMapping.create({
    data: {
      name: parsed.data.name,
      destination: parsed.data.destination,
      mapping: parsed.data.mapping,
      createdById: user.id,
    },
  });

  return NextResponse.json(saved);
}
