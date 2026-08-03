"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  QrCode,
  UserCheck,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingRow {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  numberOfRooms: number | null;
  clientsNameRaw: string | null;
  agent: string | null;
  samoRef: string | null;
  resNo: string | null;
  arrivalFlight: string | null;
  departureFlight: string | null;
  mealPlan: string | null;
  guideName: string | null;
  confirmation: string | null;
  bookingOwner: string | null;
  guest: { id: string; fullName: string } | null;
  hotel: { id: string; name: string; city?: string | null } | null;
  guide: { id: string; fullName: string } | null;
}

interface BookingsResponse {
  bookings: BookingRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface GuideOption {
  id: string;
  fullName: string;
  specialization: string | null;
}

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const MEAL_PLAN_OPTIONS = ["ALL", "RO", "BB", "HB", "FB", "AI"] as const;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

interface Filters {
  q: string;
  status: (typeof STATUS_OPTIONS)[number];
  checkInFrom: string;
  checkInTo: string;
  checkOutFrom: string;
  checkOutTo: string;
  agent: string;
  hotel: string;
  guide: string;
  mealPlan: (typeof MEAL_PLAN_OPTIONS)[number];
  minPax: string;
  maxPax: string;
  bookingOwner: string;
}

const EMPTY_FILTERS: Filters = {
  q: "",
  status: "ALL",
  checkInFrom: "",
  checkInTo: "",
  checkOutFrom: "",
  checkOutTo: "",
  agent: "",
  hotel: "",
  guide: "",
  mealPlan: "ALL",
  minPax: "",
  maxPax: "",
  bookingOwner: "",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    CONFIRMED: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
    CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    COMPLETED: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium leading-none", styles[status] ?? styles.PENDING)}>
      {status}
    </span>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200";

export default function BookingsPage() {
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Draft filters (edited live) vs applied filters (sent to API).
  // q is applied with a debounce; everything else applies on change or via the Apply button.
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);

  // Bulk-selection + assign state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guides, setGuides] = useState<GuideOption[] | null>(null);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [assignGuideId, setAssignGuideId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Debounce free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied((prev) => ({ ...prev, q: draft.q }));
    }, 350);
    return () => clearTimeout(t);
  }, [draft.q]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (applied.status !== "ALL") n++;
    if (applied.mealPlan !== "ALL") n++;
    if (applied.checkInFrom) n++;
    if (applied.checkInTo) n++;
    if (applied.checkOutFrom) n++;
    if (applied.checkOutTo) n++;
    if (applied.agent.trim()) n++;
    if (applied.hotel.trim()) n++;
    if (applied.guide.trim()) n++;
    if (applied.bookingOwner.trim()) n++;
    if (applied.minPax.trim()) n++;
    if (applied.maxPax.trim()) n++;
    return n;
  }, [applied]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (applied.q.trim()) params.set("q", applied.q.trim());
      if (applied.status !== "ALL") params.set("status", applied.status);
      if (applied.mealPlan !== "ALL") params.set("mealPlan", applied.mealPlan);
      if (applied.checkInFrom) params.set("checkInFrom", applied.checkInFrom);
      if (applied.checkInTo) params.set("checkInTo", applied.checkInTo);
      if (applied.checkOutFrom) params.set("checkOutFrom", applied.checkOutFrom);
      if (applied.checkOutTo) params.set("checkOutTo", applied.checkOutTo);
      if (applied.agent.trim()) params.set("agent", applied.agent.trim());
      if (applied.hotel.trim()) params.set("hotel", applied.hotel.trim());
      if (applied.guide.trim()) params.set("guide", applied.guide.trim());
      if (applied.bookingOwner.trim()) params.set("bookingOwner", applied.bookingOwner.trim());
      if (applied.minPax.trim()) params.set("minPax", applied.minPax.trim());
      if (applied.maxPax.trim()) params.set("maxPax", applied.maxPax.trim());

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, applied]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [applied, pageSize]);

  const loadGuides = useCallback(async () => {
    setLoadingGuides(true);
    try {
      const res = await fetch(`/api/guides?pageSize=100`);
      if (!res.ok) throw new Error("Failed to load guides");
      const json = await res.json();
      setGuides(json.guides);
    } catch {
      setGuides([]);
    } finally {
      setLoadingGuides(false);
    }
  }, []);

  useEffect(() => {
    if (selected.size > 0 && !guides) loadGuides();
  }, [selected.size, guides, loadGuides]);

  const allOnPageSelected = useMemo(
    () => !!data && data.bookings.length > 0 && data.bookings.every((b) => selected.has(b.id)),
    [data, selected]
  );

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAssignSuccess(null);
  }

  function toggleAllOnPage() {
    if (!data) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        data.bookings.forEach((b) => next.delete(b.id));
      } else {
        data.bookings.forEach((b) => next.add(b.id));
      }
      return next;
    });
    setAssignSuccess(null);
  }

  function clearSelection() {
    setSelected(new Set());
    setAssignGuideId("");
    setAssignError(null);
    setAssignSuccess(null);
  }

  function applyFilters() {
    setApplied(draft);
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  // Fields that should apply immediately (dropdowns/dates), not wait for the Apply button.
  function updateAndApply<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setApplied((prev) => ({ ...prev, [key]: value }));
  }

  async function handleBulkAssign() {
    if (selected.size === 0) return;
    setAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);
    try {
      const res = await fetch("/api/bookings/bulk-assign-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds: Array.from(selected), guideId: assignGuideId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to assign guide");
      const guideLabel = guides?.find((g) => g.id === assignGuideId)?.fullName ?? "guide";
      setAssignSuccess(`Assigned ${guideLabel} to ${json.updatedCount} booking${json.updatedCount === 1 ? "" : "s"}.`);
      setSelected(new Set());
      setAssignGuideId("");
      await load();
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : "Failed to assign guide");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Bookings</h1>
          <p className="text-sm text-neutral-500">
            {data ? `${data.total} booking${data.total === 1 ? "" : "s"}` : "Loading…"}
            {activeFilterCount > 0 && (
              <span className="ml-1.5 text-brand-600 dark:text-brand-400">
                · {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* ── Filters section ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          {filtersOpen ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
        </button>

        {filtersOpen && (
          <div className="space-y-4 border-t border-neutral-200 px-4 py-4 dark:border-neutral-800">
            {/* Row 1: search + status + meal plan */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="Search">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={draft.q}
                    onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
                    placeholder="Guest, hotel, reference, samo ref, guide…"
                    className={cn(inputCls, "w-full pl-8")}
                  />
                </div>
              </FilterField>

              <FilterField label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => updateAndApply("status", e.target.value as Filters["status"])}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "ALL" ? "All statuses" : s}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Meal plan">
                <select
                  value={draft.mealPlan}
                  onChange={(e) => updateAndApply("mealPlan", e.target.value as Filters["mealPlan"])}
                  className={inputCls}
                >
                  {MEAL_PLAN_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m === "ALL" ? "All meal plans" : m}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Booking owner">
                <input
                  value={draft.bookingOwner}
                  onChange={(e) => setDraft((p) => ({ ...p, bookingOwner: e.target.value }))}
                  placeholder="e.g. Nadia"
                  className={inputCls}
                />
              </FilterField>
            </div>

            {/* Row 2: date ranges */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="Check-in from">
                <input
                  type="date"
                  value={draft.checkInFrom}
                  onChange={(e) => updateAndApply("checkInFrom", e.target.value)}
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Check-in to">
                <input
                  type="date"
                  value={draft.checkInTo}
                  onChange={(e) => updateAndApply("checkInTo", e.target.value)}
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Check-out from">
                <input
                  type="date"
                  value={draft.checkOutFrom}
                  onChange={(e) => updateAndApply("checkOutFrom", e.target.value)}
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Check-out to">
                <input
                  type="date"
                  value={draft.checkOutTo}
                  onChange={(e) => updateAndApply("checkOutTo", e.target.value)}
                  className={inputCls}
                />
              </FilterField>
            </div>

            {/* Row 3: text filters + pax range */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="Agent">
                <input
                  value={draft.agent}
                  onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))}
                  placeholder="Agent name"
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Hotel">
                <input
                  value={draft.hotel}
                  onChange={(e) => setDraft((p) => ({ ...p, hotel: e.target.value }))}
                  placeholder="Hotel name"
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="Guide">
                <input
                  value={draft.guide}
                  onChange={(e) => setDraft((p) => ({ ...p, guide: e.target.value }))}
                  placeholder="Guide name"
                  className={inputCls}
                />
              </FilterField>
              <FilterField label="PAX range">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={draft.minPax}
                    onChange={(e) => setDraft((p) => ({ ...p, minPax: e.target.value }))}
                    placeholder="Min"
                    className={cn(inputCls, "w-full")}
                  />
                  <span className="text-neutral-400">–</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.maxPax}
                    onChange={(e) => setDraft((p) => ({ ...p, maxPax: e.target.value }))}
                    placeholder="Max"
                    className={cn(inputCls, "w-full")}
                  />
                </div>
              </FilterField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                <RotateCcw size={12} /> Reset all
              </button>
              <button
                onClick={applyFilters}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk assign bar — only shown once something is ticked */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-900/20">
          <span className="flex items-center gap-1.5 text-sm font-medium text-brand-800 dark:text-brand-200">
            <UserCheck size={16} />
            {selected.size} selected
          </span>

          {loadingGuides ? (
            <Loader2 size={16} className="animate-spin text-brand-700 dark:text-brand-300" />
          ) : (
            <select
              value={assignGuideId}
              onChange={(e) => setAssignGuideId(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">— Unassigned —</option>
              {guides?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName}
                  {g.specialization ? ` (${g.specialization})` : ""}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleBulkAssign}
            disabled={assigning}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {assigning && <Loader2 size={14} className="animate-spin" />}
            Assign to {selected.size} booking{selected.size === 1 ? "" : "s"}
          </button>

          <button
            onClick={clearSelection}
            className="flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {assignError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {assignError}
        </p>
      )}
      {assignSuccess && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
          {assignSuccess}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {/* ── Dense, excel-style table ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] leading-tight">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-neutral-200 bg-neutral-50 uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="w-8 whitespace-nowrap border-r border-neutral-200 px-2 py-2 dark:border-neutral-800">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    disabled={!data || data.bookings.length === 0}
                    className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-700"
                  />
                </th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Reference</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Guest</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Hotel</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">City</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Check-in</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Check-out</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">PAX</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Rooms</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Meal</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Agent</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Samo ref</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Res no</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Arrival flight</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Departure flight</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Guide</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Owner</th>
                <th className="whitespace-nowrap border-r border-neutral-200 px-2 py-2 font-semibold dark:border-neutral-800">Status</th>
                <th className="whitespace-nowrap px-2 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={19} className="px-4 py-10 text-center text-neutral-500">
                    <Loader2 size={18} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}

              {data && data.bookings.length === 0 && (
                <tr>
                  <td colSpan={19} className="px-4 py-10 text-center text-neutral-500">
                    No bookings match this search.
                  </td>
                </tr>
              )}

              {data?.bookings.map((b, i) => (
                <tr
                  key={b.id}
                  className={cn(
                    "border-b border-neutral-100 hover:bg-brand-50/50 dark:border-neutral-900 dark:hover:bg-neutral-900",
                    i % 2 === 1 && "bg-neutral-50/60 dark:bg-neutral-900/30",
                    selected.has(b.id) && "!bg-brand-50 dark:!bg-brand-900/20"
                  )}
                >
                  <td className="border-r border-neutral-100 px-2 py-1.5 dark:border-neutral-900">
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggleRow(b.id)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-700"
                    />
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 font-medium text-neutral-800 dark:border-neutral-900 dark:text-neutral-200">
                    <Link href={`/bookings/${b.id}`} className="hover:underline">
                      {b.bookingReference}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.guest?.fullName ?? b.clientsNameRaw ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.hotel?.name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.hotel?.city ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {formatDate(b.checkInDate)}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {formatDate(b.checkOutDate)}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.numberOfGuests ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.numberOfRooms ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.mealPlan ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.agent ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.samoRef ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.resNo ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.arrivalFlight ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.departureFlight ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.guide?.fullName ?? b.guideName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300">
                    {b.bookingOwner ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-r border-neutral-100 px-2 py-1.5 dark:border-neutral-900">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 rounded border border-neutral-300 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <QrCode size={10} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
              className="rounded-lg border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center gap-3">
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
      )}
    </div>
  );
}