"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideRow {
  id: string;
  fullName: string;
  licenseNumber: string | null;
  phoneNumber: string | null;
  email: string | null;
  languages: string | null;
  specialization: string | null;
  status: string | null;
  username: string | null; // NEW — null means no portal login set up yet
}

interface GuidesResponse {
  guides: GuideRow[];
  total: number;
  page: number;
  totalPages: number;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function CredentialsModal({
  guide,
  onClose,
  onSaved,
}: {
  guide: GuideRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(guide.username ?? guide.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "."));
  const [password, setPassword] = useState(generateTempPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const res = await fetch(`/api/guides/${guide.id}/credentials`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error ?? "Failed to save credentials");
      }
      setSuccess(true);
      onSaved();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/guides/${guide.id}/credentials`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to revoke access");
      onSaved();
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to revoke access");
    } finally {
      setRevoking(false);
    }
  }

  async function copyCredentials() {
    await navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-950">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-brand-600" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {guide.username ? "Reset portal login" : "Set up portal login"}
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-neutral-500">
          {guide.fullName} will use these to sign in at the Guide Portal on their phone.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
              Credentials saved. Share these with {guide.fullName} — the password won't be shown again.
            </div>
            <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex justify-between">
                <span className="text-neutral-500">Username</span>
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Password</span>
                <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{password}</span>
              </div>
            </div>
            <button
              onClick={copyCredentials}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy username & password"}
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                {formError}
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {fieldErrors.username && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.username}</p>}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {guide.username ? "New temporary password" : "Temporary password"}
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-9 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
              <button
                type="button"
                onClick={() => setPassword(generateTempPassword())}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Generate new
              </button>
            </label>

            <div className="flex items-center justify-between gap-2 pt-2">
              {guide.username ? (
                <button
                  type="button"
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  {revoking && <Loader2 size={12} className="animate-spin" />}
                  Revoke portal access
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Save credentials
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function GuidesPage() {
  const [data, setData] = useState<GuidesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [credentialsGuide, setCredentialsGuide] = useState<GuideRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/guides?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load guides");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guides");
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

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/guides/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete guide");
      setConfirmId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete guide");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Guides</h1>
          <p className="text-sm text-neutral-500">{data ? `${data.total} guide${data.total === 1 ? "" : "s"}` : "Loading…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <Link
            href="/guides/new"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={14} /> Register Guide
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, license, specialization, phone, email…"
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
                <th className="whitespace-nowrap px-4 py-3 font-medium">License</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Specialization</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Languages</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Contact</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Portal login</th>
                <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                    <Loader2 size={18} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {data && data.guides.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                    No guides match this search.
                  </td>
                </tr>
              )}
              {data?.guides.map((g) => (
                <tr
                  key={g.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                    {g.fullName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g.licenseNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g.specialization ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{g.languages ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                    {g.phoneNumber ?? g.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {g.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setCredentialsGuide(g)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        g.username
                          ? "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                      )}
                      title={g.username ? `Logs in as ${g.username}` : "No portal login set up"}
                    >
                      {g.username ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                      {g.username ? "Enabled" : "Not set"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {confirmId === g.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-neutral-500">Delete?</span>
                        <button
                          onClick={() => handleDelete(g.id)}
                          disabled={deletingId === g.id}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingId === g.id ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setCredentialsGuide(g)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                          title="Portal login"
                        >
                          <KeyRound size={15} />
                        </button>
                        <Link
                          href={`/guides/${g.id}/edit`}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setConfirmId(g.id)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
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

      {credentialsGuide && (
        <CredentialsModal
          guide={credentialsGuide}
          onClose={() => setCredentialsGuide(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}