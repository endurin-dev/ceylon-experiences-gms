"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface FormState {
  fullName: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  languages: string;
  specialization: string;
  status: string;
  notes: string;
}

const emptyState: FormState = {
  fullName: "",
  licenseNumber: "",
  phoneNumber: "",
  email: "",
  languages: "",
  specialization: "",
  status: "ACTIVE",
  notes: "",
};

function Input({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
    </label>
  );
}

export default function EditGuidePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/guides/${id}`);
        if (res.status === 404) throw new Error("Guide not found");
        if (!res.ok) throw new Error("Failed to load guide");
        const json = await res.json();
        if (!cancelled) {
          setForm({
            fullName: json.fullName ?? "",
            licenseNumber: json.licenseNumber ?? "",
            phoneNumber: json.phoneNumber ?? "",
            email: json.email ?? "",
            languages: json.languages ?? "",
            specialization: json.specialization ?? "",
            status: json.status ?? "ACTIVE",
            notes: json.notes ?? "",
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load guide");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/guides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update guide");
      router.push("/guides");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update guide");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/guides"
        className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <ArrowLeft size={16} /> Back to guides
      </Link>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Edit Guide</h1>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" value={form.fullName} onChange={set("fullName")} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="License number" value={form.licenseNumber} onChange={set("licenseNumber")} />
            <Input label="Specialization" value={form.specialization} onChange={set("specialization")} placeholder="Wildlife, Cultural…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone number" value={form.phoneNumber} onChange={set("phoneNumber")} />
            <Input label="Email" value={form.email} onChange={set("email")} />
          </div>
          <Input label="Languages" value={form.languages} onChange={set("languages")} placeholder="English, German, Sinhala" />

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Status</span>
            <select
              value={form.status}
              onChange={(e) => set("status")(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/guides"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}