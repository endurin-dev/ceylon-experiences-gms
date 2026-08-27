"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, ConciergeBell, LifeBuoy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent iOS-glass chrome for every /guest/* screen — Liquid Glass, blue/indigo palette.
 *
 * A fixed ambient blue-to-violet gradient sits behind everything so the frosted
 * tab bar and cards all have something coloured to refract. Panels use
 * translucent white fills + backdrop-blur + a hairline inner highlight. The top
 * nav bar was removed — each page's own hero/large-title sits flush with the
 * status bar, and logout now lives as the last tab-bar item.
 */

const TABS = [
  { href: "/guest/dashboard", label: "Trip", icon: Home },
  { href: "/guest/excursions", label: "Excursions", icon: Compass },
  { href: "/guest/services", label: "Services", icon: ConciergeBell },
  { href: "/guest/feedback", label: "Feedback", icon: LifeBuoy },
] as const;

export default function GuestShell({
  guestName,
  children,
}: {
  guestName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/guest/logout", { method: "POST" });
    router.push("/guest/no-session");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-[#05060F] text-white">
      {/* Ambient wallpaper the glass panels refract — deep indigo/blue swirl */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070818]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2559] via-[#161A3F] to-[#05060F]" />
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-[#3A4CC4] opacity-45 blur-[120px]" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-[#5B3FD9] opacity-30 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#1E3AA8] opacity-50 blur-[110px]" />
      </div>

      {/* Screen content — each page renders its own large title / hero */}
      <main
        className="relative z-10 mx-auto max-w-md"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 92px)",
        }}
      >
        {children}
      </main>

      {/* Tab bar — includes logout as the last item */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 active:opacity-50"
              >
                <Icon
                  size={23}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={active ? "text-[#5AA6FF] drop-shadow-[0_0_6px_rgba(10,132,255,0.55)]" : "text-white/35"}
                />
                <span className={cn("text-[10px]", active ? "font-semibold text-[#5AA6FF]" : "font-medium text-white/35")}>
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex flex-1 flex-col items-center gap-0.5 py-2 active:opacity-50"
          >
            <LogOut size={23} strokeWidth={1.8} className="text-[#FF6961]" />
            <span className="text-[10px] font-medium text-[#FF6961]">Log out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}