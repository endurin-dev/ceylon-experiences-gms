"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function GuideShell({
  guideName,
  children,
}: {
  guideName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/guide-logout", { method: "POST" });
    router.push("/guide/login");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials(guideName)}
          </div>
          <div>
            <p className="text-[11px] leading-none text-neutral-400">Welcome back</p>
            <p className="mt-0.5 text-sm font-semibold leading-none text-neutral-900 dark:text-neutral-100">
              {guideName}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-900"
          aria-label="Log out"
        >
          <LogOut size={17} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}