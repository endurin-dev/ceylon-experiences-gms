"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Palmtree, ShieldCheck, Headset, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const GLASS =
  "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";

/* Glassy blue — translucent tint instead of a solid fill */
const GLASS_BLUE =
  "border border-[#0A84FF]/40 bg-[#0A84FF]/[0.18] text-white backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_4px_18px_-4px_rgba(10,132,255,0.45)]";

function TrustChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/55 backdrop-blur-md">
      <Icon size={12} className="text-[#5AA6FF]" />
      {label}
    </span>
  );
}

export default function GuestLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Login failed");
      router.push("/guest/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#05060F] px-6 text-white"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
      }}
    >
      {/* Ambient backdrop — the quilled "Sri Lanka" artwork, heavily blurred and
          dimmed, gives the screen local identity instead of a generic gradient.
          Asset lives at /public/images/sri-lanka-hero.jpg */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070818]">
        <div
          className="absolute inset-0 scale-125 bg-cover bg-[position:50%_20%] opacity-[0.16] blur-[6px]"
          style={{ backgroundImage: "url('/images/sri-lanka-hero.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2559]/95 via-[#161A3F]/92 to-[#05060F]" />
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-[#3A4CC4] opacity-40 blur-[120px]" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#5B3FD9] opacity-25 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#1E3AA8] opacity-45 blur-[110px]" />

        {/* A gentle coastline wave along the bottom edge, in keeping with the
            island setting */}
        <svg
          className="absolute bottom-0 left-0 w-full text-[#0A84FF]/[0.07]"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0 40 C 60 10, 100 10, 160 35 C 220 60, 260 60, 320 30 C 360 10, 380 10, 400 25 L 400 80 L 0 80 Z" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/70 backdrop-blur-md">
            <Star size={10} className="text-[#5AA6FF]" />
            Your Sri Lanka trip, in one place
          </span>

          <span className={cn("mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] text-[#5AA6FF]", GLASS)}>
            <Palmtree size={26} />
          </span>

          <h1 className="text-[30px] font-bold tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">
            Ayubowan!
          </h1>
          <p className="mt-1 text-[14px] font-medium text-white/70">Welcome back to your journey</p>
          <p className="mt-0.5 text-[13px] italic text-white/35">Добро пожаловать в Шри-Ланку · ආයුබෝවන්</p>
        </div>

        <form onSubmit={handleSubmit} className={cn("space-y-4 rounded-[24px] p-5", GLASS)}>
          {error && (
            <p className="rounded-[12px] border border-[#FF453A]/25 bg-[#FF453A]/10 px-3.5 py-2.5 text-[13px] text-[#FF6961] backdrop-blur-md">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white/50">WhatsApp number</label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+94 77 123 4567"
              className="w-full rounded-[14px] border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-[16px] text-white placeholder:text-white/25 outline-none backdrop-blur-md transition focus:border-[#0A84FF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0A84FF]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white/50">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-[14px] border border-white/[0.12] bg-white/[0.05] px-4 py-3 pr-11 text-[16px] text-white placeholder:text-white/25 outline-none backdrop-blur-md transition focus:border-[#0A84FF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#0A84FF]/25"
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-50",
              GLASS_BLUE
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Login
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <TrustChip icon={ShieldCheck} label="Verified local guides" />
          <TrustChip icon={Headset} label="24/7 concierge" />
        </div>

        <p className="relative z-10 mt-5 text-center text-[12px] text-white/35">
          First time here? Ask your guide to show you the QR code instead.
        </p>
      </div>
    </div>
  );
}