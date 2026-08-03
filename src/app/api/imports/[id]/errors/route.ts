import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const errors = await prisma.importError.findMany({
    where: { importId: params.id },
    orderBy: { rowNumber: "asc" },
  });

  const header = ["Row", "Column", "Error", "Raw Data"];
  const lines = [header.join(",")];
  for (const e of errors) {
    lines.push(
      [
        csvEscape(e.rowNumber),
        csvEscape(e.columnName ?? ""),
        csvEscape(e.errorMessage),
        csvEscape(JSON.stringify(e.rawRowData ?? {})),
      ].join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="import-${params.id}-errors.csv"`,
    },
  });
}
