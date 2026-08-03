"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Moon, Sun, ChevronRight } from "lucide-react";

function toTitle(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Topbar({
  onToggleSidebar,
  onToggleMobile,
}: {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const segments = (pathname ?? "").split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 md:block"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={onToggleMobile}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 md:hidden"
        >
          <Menu size={18} />
        </button>

        <nav className="hidden items-center gap-1 text-sm text-neutral-500 sm:flex">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">Home</span>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={14} />
              <span className={i === segments.length - 1 ? "text-neutral-900 dark:text-neutral-100" : ""}>
                {toTitle(seg)}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark((d) => !d)}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-neutral-900 dark:text-neutral-100">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs leading-tight text-neutral-500">{(session?.user as any)?.role ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
