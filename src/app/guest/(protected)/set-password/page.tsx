"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, KeyRound, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const GLASS =
  "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";

export default function GuestSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save password");
      setSuccess(true);
      setTimeout(() => {
        router.push("/guest/dashboard");
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4">
      {/* Large title */}
      <div className="flex items-center gap-3 pb-5 pt-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[#5AA6FF]", GLASS)}>
          <KeyRound size={19} />
        </span>
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-white">Set a password</h1>
          <p className="mt-0.5 text-[13px] text-white/40">Log back in without scanning a QR code</p>
        </div>
      </div>

      {success ? (
        <div className="flex items-center gap-2 rounded-[16px] border border-[#30D158]/25 bg-[#30D158]/10 px-4 py-3.5 text-[14px] text-[#30D158] backdrop-blur-md">
          <Check size={15} /> Password saved — taking you to your trip…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cn("space-y-4 rounded-[20px] p-4", GLASS)}>
          {error && (
            <p className="rounded-[12px] border border-[#FF453A]/25 bg-[#FF453A]/10 px-3.5 py-2.5 text-[13px] text-[#FF6961] backdrop-blur-md">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white/50">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-[14px] border border-white/[0.12] bg-white/[0.05] px-4 py-3 pr-11 text-[16px] text-white placeholder:text-white/25 outline-none backdrop-blur-md transition focus:border-[#0A84FF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0A84FF]/25"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 active:text-white/60"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white/50">Confirm password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-[14px] border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-white/25 outline-none backdrop-blur-md transition focus:border-[#0A84FF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0A84FF]/25"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0A84FF] py-3.5 text-[16px] font-semibold text-white shadow-[0_4px_18px_-4px_rgba(10,132,255,0.55)] transition active:scale-[0.98] active:bg-[#0972DB] disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save password
          </button>
        </form>
      )}
    </div>
  );
}