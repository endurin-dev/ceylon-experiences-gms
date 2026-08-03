"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface GuestRow {
  id: string;
  fullName: string;
  nationality: string | null;
  passportNumber: string | null;
  phoneNumber: string | null;
  email: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  _count: { bookings: number; tours: number; transfers: number };
}

interface GuestsResponse {
  guests: GuestRow[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function GuestsPage() {
  const [data, setData] = useState<GuestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/guests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load guests");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Guests</h1>
          <p className="text-sm text-neutral-500">{data ? `${data.total} guest${data.total === 1 ? "" : "s"}` : "Loading…"}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, passport, nationality, email, phone…"
          className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Nationality</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Passport</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Contact</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Arrival</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                    <Loader2 size={18} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {data && data.guests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                    No guests match this search.
                  </td>
                </tr>
              )}
              {data?.guests.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                    <Link href={`/guests/${g.id}`} className="hover:underline">
                      {g.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g.nationality ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g.passportNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {g.phoneNumber ?? g.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {formatDate(g.arrivalDate)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g._count.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-40 dark:border-neutral-700"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-40 dark:border-neutral-700"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}