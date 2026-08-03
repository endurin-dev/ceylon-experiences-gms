"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Save,
} from "lucide-react";
import {
  IMPORT_FIELDS,
  DESTINATION_LABELS,
  suggestFieldForHeader,
  type ImportDestination,
} from "@/lib/import-fields";
import { cn } from "@/lib/utils";

type Step = "upload" | "configure" | "result";
type DuplicateStrategy = "skip" | "update" | "createOnly";

interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

interface ImportResult {
  importId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  duplicateRows: number;
  errors: { rowNumber: number; columnName?: string; errorMessage: string }[];
}

const IGNORE = "__ignore__";

export default function ExcelImportPage() {
  const [step, setStep] = useState<Step>("upload");

  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [parsed, setParsed] = useState<ParsedSheet | null>(null);

  const [destination, setDestination] = useState<ImportDestination>("BOOKINGS");
  const [mapping, setMapping] = useState<Record<string, string>>({}); // header -> field key | IGNORE
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");

  const [mappingName, setMappingName] = useState("");
  const [savingMapping, setSavingMapping] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = IMPORT_FIELDS[destination];

  function loadSheet(wb: XLSX.WorkBook, sheetName: string) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    const headers =
      rows.length > 0
        ? Object.keys(rows[0])
        : (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[] | undefined) ?? [];
    setParsed({ headers, rows });
    setSelectedSheet(sheetName);

    // Auto-suggest mapping for the current destination.
    const initialMapping: Record<string, string> = {};
    for (const h of headers) {
      initialMapping[h] = suggestFieldForHeader(h, destination) ?? IGNORE;
    }
    setMapping(initialMapping);
  }

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    setWorkbook(wb);
    setSheetNames(wb.SheetNames);
    if (wb.SheetNames.length === 1) {
      loadSheet(wb, wb.SheetNames[0]);
    }
  }

  function reMapForDestination(dest: ImportDestination) {
    setDestination(dest);
    if (!parsed) return;
    const initialMapping: Record<string, string> = {};
    for (const h of parsed.headers) {
      initialMapping[h] = suggestFieldForHeader(h, dest) ?? IGNORE;
    }
    setMapping(initialMapping);
  }

  const mappedRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((row, i) => {
      const values: Record<string, unknown> = {};
      for (const [header, fieldKey] of Object.entries(mapping)) {
        if (fieldKey === IGNORE) continue;
        values[fieldKey] = row[header] instanceof Date ? (row[header] as Date).toISOString() : row[header];
      }
      return { rowNumber: i + 2, values }; // +2: header row is row 1
    });
  }, [parsed, mapping]);

  const requiredFieldsMapped = fields
    .filter((f) => f.required)
    .every((f) => Object.values(mapping).includes(f.key));

  async function handleSaveMapping() {
    if (!mappingName.trim()) return;
    setSavingMapping(true);
    try {
      await fetch("/api/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mappingName.trim(), destination, mapping }),
      });
      setMappingName("");
    } finally {
      setSavingMapping(false);
    }
  }

  async function handleImport() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          worksheetName: selectedSheet,
          destination,
          duplicateStrategy,
          rows: mappedRows,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Import failed");
      }
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStep("upload");
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setParsed(null);
    setMapping({});
    setResult(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Excel Import</h1>
        <p className="text-sm text-neutral-500">Upload, preview, map columns, and import tourism data.</p>
      </div>

      <StepIndicator step={step} />

      {step === "upload" && (
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white p-12 text-center transition hover:border-brand-400 dark:border-neutral-700 dark:bg-neutral-950">
            <UploadCloud size={32} className="mb-3 text-brand-600" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Click to upload an Excel file
            </p>
            <p className="mt-1 text-xs text-neutral-500">.xlsx or .xls</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>

          {fileName && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                <FileSpreadsheet size={16} className="text-brand-600" />
                {fileName}
              </div>

              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Worksheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => workbook && loadSheet(workbook, e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Select a worksheet…
                </option>
                {sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {parsed && (
                <button
                  onClick={() => setStep("configure")}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Continue with {parsed.rows.length} rows <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {step === "configure" && parsed && (
        <div className="space-y-5">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Destination table
            </label>
            <select
              value={destination}
              onChange={(e) => reMapForDestination(e.target.value as ImportDestination)}
              className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              {Object.entries(DESTINATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Column Mapping</h2>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {parsed.headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="w-1/2 truncate text-sm text-neutral-600 dark:text-neutral-400" title={header}>
                    {header}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-neutral-400" />
                  <select
                    value={mapping[header] ?? IGNORE}
                    onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value }))}
                    className="w-1/2 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value={IGNORE}>Ignore this column</option>
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                        {f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!requiredFieldsMapped && (
              <p className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle size={14} /> Map every required field (marked *) before continuing.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <input
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                placeholder="Save this mapping as… (e.g. Kazakhstan Winter Guest Import)"
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <button
                onClick={handleSaveMapping}
                disabled={!mappingName.trim() || savingMapping}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                {savingMapping ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save mapping
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Preview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                    {fields
                      .filter((f) => Object.values(mapping).includes(f.key))
                      .map((f) => (
                        <th key={f.key} className="whitespace-nowrap py-2 pr-4 font-medium">
                          {f.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.slice(0, 10).map((r) => (
                    <tr key={r.rowNumber} className="border-b border-neutral-100 dark:border-neutral-900">
                      {fields
                        .filter((f) => Object.values(mapping).includes(f.key))
                        .map((f) => (
                          <td key={f.key} className="whitespace-nowrap py-2 pr-4 text-neutral-700 dark:text-neutral-300">
                            {String(r.values[f.key] ?? "")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Showing 10 of {mappedRows.length} rows.</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Duplicate handling</h2>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["skip", "Skip duplicate records"],
                  ["update", "Update existing records"],
                  ["createOnly", "Create only new records"],
                ] as [DuplicateStrategy, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    duplicateStrategy === value
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
                  )}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={duplicateStrategy === value}
                    onChange={() => setDuplicateStrategy(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("upload")}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleImport}
              disabled={!requiredFieldsMapped || submitting}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Import {mappedRows.length} rows
            </button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-950">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-brand-600" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Import complete</h2>
            <div className="mx-auto mt-4 grid max-w-md grid-cols-4 gap-3 text-sm">
              <Stat label="Total" value={result.totalRows} />
              <Stat label="Imported" value={result.successRows} accent="text-brand-600" />
              <Stat label="Duplicates" value={result.duplicateRows} accent="text-amber-600" />
              <Stat label="Failed" value={result.failedRows} accent="text-red-600" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {result.failedRows > 0 && (
                <a
                  href={`/api/imports/${result.importId}/errors`}
                  className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  <Download size={16} /> Download error report
                </a>
              )}
              <a
                href="/import-history"
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                View import history
              </a>
              <button
                onClick={resetAll}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Start a new import
              </button>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                First {Math.min(result.errors.length, 20)} errors
              </h3>
              <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>
                    Row {e.rowNumber}
                    {e.columnName ? ` (${e.columnName})` : ""}: {e.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <p className={cn("text-xl font-semibold", accent ?? "text-neutral-900 dark:text-neutral-100")}>{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Upload" },
    { key: "configure", label: "2. Map & Preview" },
    { key: "result", label: "3. Result" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 font-medium",
              i === currentIndex
                ? "bg-brand-600 text-white"
                : i < currentIndex
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-900"
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-neutral-300">—</span>}
        </div>
      ))}
    </div>
  );
}
