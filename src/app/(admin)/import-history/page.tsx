import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DESTINATION_LABELS } from "@/lib/import-fields";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

const STATUS_META: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, className: "text-brand-600", label: "Completed" },
  COMPLETED_WITH_ERRORS: { icon: AlertTriangle, className: "text-amber-600", label: "Completed with errors" },
  FAILED: { icon: XCircle, className: "text-red-600", label: "Failed" },
  PENDING: { icon: Loader2, className: "text-neutral-400", label: "Pending" },
  PROCESSING: { icon: Loader2, className: "text-neutral-400", label: "Processing" },
};

export default async function ImportHistoryPage() {
  const imports = await prisma.excelImport.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Import History</h1>
        <p className="text-sm text-neutral-500">Every Excel import run, with row counts and outcomes.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Uploaded by</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Rows</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {imports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No imports yet — run one from Excel Import.
                </td>
              </tr>
            )}
            {imports.map((imp) => {
              const meta = STATUS_META[imp.status] ?? STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <tr key={imp.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                  <td className="px-4 py-3">
                    <Link href={`/import-history/${imp.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                      {imp.fileName}
                    </Link>
                    <p className="text-xs text-neutral-500">{imp.worksheetName}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {DESTINATION_LABELS[imp.destinationTable as keyof typeof DESTINATION_LABELS]}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{imp.uploadedBy.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {imp.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {imp.successRows}/{imp.totalRows}
                    {imp.duplicateRows > 0 && <span className="text-amber-600"> · {imp.duplicateRows} dup</span>}
                    {imp.failedRows > 0 && <span className="text-red-600"> · {imp.failedRows} failed</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 ${meta.className}`}>
                      <Icon size={14} /> {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
