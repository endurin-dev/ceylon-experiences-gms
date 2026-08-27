"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Compass } from "lucide-react";

const BG = "#0A0B0D";
const SURFACE = "#15171B";
const SURFACE_RAISED = "#1B1E23";
const BORDER = "#212429";
const TEXT = "#F3F1EC";
const TEXT_SECONDARY = "#96999E";
const TEXT_TERTIARY = "#5B5E64";
const ACCENT = "#E3A853";

export default function GuideLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guide-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Login failed");
      router.push("/guide/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6"
      style={{
        backgroundColor: BG,
        paddingTop: "calc(env(safe-area-inset-top) + 3rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Ambient glow behind the app icon */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[14%] h-64 w-64 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: ACCENT }}
      />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-9 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] shadow-lg"
            style={{
              background: `linear-gradient(160deg, ${ACCENT}, #B9812F)`,
              boxShadow: `0 8px 24px -8px ${ACCENT}66`,
            }}
          >
            <Compass size={28} color="#231A0B" strokeWidth={2.2} />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: TEXT }}>
            Guide Portal
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: TEXT_SECONDARY }}>
            Sign in to see your assignments
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[26px] p-5"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          {error && (
            <div
              className="rounded-2xl px-3.5 py-2.5 text-[13px]"
              style={{ backgroundColor: "#FF69611A", border: "1px solid #FF696133", color: "#FF9891" }}
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="px-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: TEXT_TERTIARY }}
            >
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full rounded-2xl px-4 py-3.5 text-[16px] outline-none transition-colors"
              style={{
                backgroundColor: SURFACE_RAISED,
                border: `1px solid ${BORDER}`,
                color: TEXT,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
              placeholder="your.username"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="px-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: TEXT_TERTIARY }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl px-4 py-3.5 pr-12 text-[16px] outline-none transition-colors"
                style={{
                  backgroundColor: SURFACE_RAISED,
                  border: `1px solid ${BORDER}`,
                  color: TEXT,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 active:opacity-60"
                style={{ color: TEXT_TERTIARY }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[16px] font-semibold transition-opacity active:opacity-80 disabled:opacity-60"
            style={{ backgroundColor: ACCENT, color: "#231A0B" }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[12px]" style={{ color: TEXT_TERTIARY }}>
          Trouble signing in? Contact your office to reset your credentials.
        </p>
      </div>
    </div>
  );
}