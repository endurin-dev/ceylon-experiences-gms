import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentUser } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { runImport, type MappedRow, type DuplicateStrategy } from "@/lib/import-engine";
import type { ImportDestination } from "@/lib/import-fields";

const bodySchema = z.object({
  fileName: z.string().min(1),
  worksheetName: z.string().min(1),
  destination: z.enum(["GUESTS", "HOTELS", "BOOKINGS", "TOURS", "TRANSFERS"]),
  duplicateStrategy: z.enum(["skip", "update", "createOnly"]),
  rows: z
    .array(
      z.object({
        rowNumber: z.number(),
        values: z.record(z.union([z.string(), z.number(), z.null()])),
      })
    )
    .max(20000),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getCurrentUser();
    console.log("[imports] current user:", user);
  } catch (err) {
    console.error("[imports] getCurrentUser failed:", err);
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { fileName, worksheetName, destination, duplicateStrategy, rows } = parsed.data;

  try {
    await requirePermission(destination, "canImport");
  } catch {
    return NextResponse.json({ error: "You do not have import permission for this module" }, { status: 403 });
  }

  let excelImport;
  try {
    excelImport = await prisma.excelImport.create({
      data: {
        fileName,
        destinationTable: destination as ImportDestination,
        worksheetName,
        uploadedById: user.id,
        totalRows: rows.length,
        status: "PROCESSING",
      },
    });
  } catch (err) {
    console.error("[imports] failed to create ExcelImport record:", err);
    return NextResponse.json({ error: "Could not start import — check DB connection/migrations" }, { status: 500 });
  }

  // *** This is the important change: runImport is now wrapped. ***
  // Previously an unexpected throw here (bad DB state, missing column
  // after a skipped migration, etc.) produced a bare, unexplained 500.
  let result;
  try {
    result = await runImport(
      destination as ImportDestination,
      rows as MappedRow[],
      duplicateStrategy as DuplicateStrategy,
      excelImport.id
    );
  } catch (err) {
    console.error("[imports] runImport threw:", err);
    await prisma.excelImport.update({
      where: { id: excelImport.id },
      data: { status: "FAILED" },
    });
    const message = err instanceof Error ? err.message : "Unknown error during import";
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 });
  }

  const status = result.failedRows === 0 ? "COMPLETED" : result.successRows > 0 ? "COMPLETED_WITH_ERRORS" : "FAILED";

  try {
    await prisma.excelImport.update({
      where: { id: excelImport.id },
      data: {
        successRows: result.successRows,
        failedRows: result.failedRows,
        duplicateRows: result.duplicateRows,
        status,
      },
    });

    if (result.errors.length > 0) {
      await prisma.importError.createMany({
        data: result.errors.map((e) => ({
          importId: excelImport.id,
          rowNumber: e.rowNumber,
          columnName: e.columnName,
          errorMessage: e.errorMessage,
          rawRowData: e.rawRowData as any,
        })),
      });
    }

    await logAudit({
      userId: user.id,
      action: "IMPORT",
      module: destination,
      recordId: excelImport.id,
      details: { fileName, worksheetName, ...result, errors: undefined },
    });
  } catch (err) {
    // The import itself already ran and rows may already be in the DB —
    // don't tell the user it failed, just log that the bookkeeping step
    // (saving stats/audit log) had trouble.
    console.error("[imports] post-import bookkeeping failed:", err);
  }

  return NextResponse.json({ importId: excelImport.id, ...result });
}