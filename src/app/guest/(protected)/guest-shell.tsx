"use client";

import { useRouter } from "next/navigation";
import { LogOut, Compass } from "lucide-react";

export default function GuestShell({
  guestName,
  children,
}: {
  guestName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/guest/logout", { method: "POST" });
    router.push("/guest/no-session");
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
      <header className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <Compass size={20} />
          <div>
            <p className="text-[11px] leading-none text-teal-100">Your trip</p>
            <p className="mt-0.5 text-sm font-semibold leading-none">{guestName}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 active:bg-white/10"
          aria-label="Log out"
        >
          <LogOut size={17} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}