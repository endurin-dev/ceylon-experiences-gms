"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, UserRound, LogOut, X, Loader2 } from "lucide-react";

/* Same tokens as the dashboard — kept local so this shell doesn't
   depend on the app's light-mode brand config. */
const BG = "#0A0B0D";
const SURFACE = "#15171B";
const SURFACE_RAISED = "#1B1E23";
const BORDER = "#212429";
const BORDER_SOFT = "#1A1D22";
const TEXT = "#F3F1EC";
const TEXT_SECONDARY = "#96999E";
const TEXT_TERTIARY = "#5B5E64";
const ACCENT = "#E3A853";

interface GuideShellProps {
  guideName: string;
  children: React.ReactNode;
}

const TABS = [{ href: "/guide/dashboard", label: "Assignments", icon: Compass }] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function AccountSheet({
  guideName,
  onClose,
}: {
  guideName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      // Adjust to match your actual auth/session teardown endpoint or server action.
      await fetch("/api/guide/logout", { method: "POST" });
    } finally {
      router.push("/guide/login");
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-[28px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px]"
        style={{ backgroundColor: SURFACE_RAISED, border: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />

        <div className="mb-5 flex items-center justify-between">
          <p className="text-[15px] font-semibold" style={{ color: TEXT }}>
            Account
          </p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full active:opacity-60"
            style={{ backgroundColor: SURFACE, color: TEXT_SECONDARY }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
            style={{ backgroundColor: `${ACCENT}26`, color: ACCENT }}
          >
            {initials(guideName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold" style={{ color: TEXT }}>
              {guideName}
            </p>
            <p className="text-[13px]" style={{ color: TEXT_TERTIARY }}>
              Tour guide
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold active:opacity-70 disabled:opacity-60"
          style={{ backgroundColor: "#FF69611A", border: "1px solid #FF696133", color: "#FF9891" }}
        >
          {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

export default function GuideShell({ guideName, children }: GuideShellProps) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: BG,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <main className="pb-[calc(78px+env(safe-area-inset-bottom))]">{children}</main>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"
        style={{ backgroundColor: `${BG}E6`, borderTop: `1px solid ${BORDER_SOFT}` }}
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-4 py-1 active:opacity-60"
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                  style={{ backgroundColor: active ? `${ACCENT}26` : "transparent" }}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} style={{ color: active ? ACCENT : TEXT_TERTIARY }} />
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? ACCENT : TEXT_TERTIARY }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setAccountOpen(true)}
            className="flex flex-col items-center gap-1 px-4 py-1 active:opacity-60"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ backgroundColor: SURFACE_RAISED, color: TEXT_TERTIARY, border: `1px solid ${BORDER_SOFT}` }}
            >
              {initials(guideName) || <UserRound size={14} />}
            </div>
            <span className="text-[10px] font-medium" style={{ color: TEXT_TERTIARY }}>
              Account
            </span>
          </button>
        </div>
      </nav>

      {accountOpen && <AccountSheet guideName={guideName} onClose={() => setAccountOpen(false)} />}
    </div>
  );
}