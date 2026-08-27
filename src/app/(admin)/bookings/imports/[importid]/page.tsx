import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { BookingsTable } from "./bookings-table";

export default async function ImportBookingsPage({
  params,
}: {
  params: Promise<{ importid: string }>;
}) {
  const { importid } = await params;

  const imp = await prisma.excelImport.findUnique({
    where: { id: importid },
    include: {
      uploadedBy: true,
      _count: { select: { bookings: true } },
    },
  });

  if (!imp || imp.destinationTable !== "BOOKINGS") notFound();

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <Link
        href="/bookings"
        className="flex w-fit items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft size={16} /> Back to import files
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <FileSpreadsheet size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">{imp.fileName}</h1>
            <p className="text-xs text-neutral-500">
              Imported {imp.createdAt.toLocaleString()} by {imp.uploadedBy.name}
              {imp.worksheetName ? ` · ${imp.worksheetName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
          <span>
            {imp._count.bookings} booking{imp._count.bookings === 1 ? "" : "s"}
          </span>
          {imp.failedRows > 0 && (
            <span className="font-medium text-red-600 dark:text-red-400">{imp.failedRows} failed rows</span>
          )}
          {imp.duplicateRows > 0 && <span>{imp.duplicateRows} duplicates</span>}
        </div>
      </div>

      <BookingsTable importId={imp.id} />
    </div>
  );
}