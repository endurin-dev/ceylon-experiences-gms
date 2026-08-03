import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DESTINATION_LABELS } from "@/lib/import-fields";
import { ArrowLeft, Download } from "lucide-react";

export default async function ImportDetailPage({ params }: { params: { id: string } }) {
  const imp = await prisma.excelImport.findUnique({
    where: { id: params.id },
    include: { uploadedBy: true, errors: { orderBy: { rowNumber: "asc" }, take: 200 } },
  });

  if (!imp) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/import-history"
        className="flex w-fit items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft size={16} /> Back to Import History
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{imp.fileName}</h1>
            <p className="text-sm text-neutral-500">
              {imp.worksheetName} → {DESTINATION_LABELS[imp.destinationTable as keyof typeof DESTINATION_LABELS]}
            </p>
          </div>
          {imp.failedRows > 0 && (
            <a
              href={`/api/imports/${imp.id}/errors`}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              <Download size={14} /> Error report
            </a>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Field label="Uploaded by" value={imp.uploadedBy.name} />
          <Field label="Date" value={imp.createdAt.toLocaleString()} />
          <Field label="Total rows" value={String(imp.totalRows)} />
          <Field label="Imported" value={String(imp.successRows)} />
          <Field label="Failed / Duplicate" value={`${imp.failedRows} / ${imp.duplicateRows}`} />
        </div>
      </div>

      {imp.errors.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Errors ({imp.errors.length}{imp.errors.length === 200 ? "+" : ""})
          </h2>
          <div className="max-h-96 space-y-2 overflow-y-auto text-sm">
            {imp.errors.map((e) => (
              <div key={e.id} className="rounded-lg border border-neutral-100 p-2 dark:border-neutral-900">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Row {e.rowNumber}</span>
                {e.columnName && <span className="text-neutral-500"> · {e.columnName}</span>}
                <p className="text-neutral-600 dark:text-neutral-400">{e.errorMessage}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}
