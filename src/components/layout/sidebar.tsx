"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  History,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  Map,
  Car,
  Compass,       // add this
  MessageCircle,
  Bell,
  Search,
  UserCog,
  ShieldCheck,
  Settings,
  UserCircle,
  LogOut,
  Palmtree,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/excel-import", label: "Excel Import", icon: UploadCloud },
  { href: "/import-history", label: "Import History", icon: History },
  //{ href: "/guests", label: "Guests", icon: Users },
  //{ href: "/hotels", label: "Hotels", icon: Building2 },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/advanced-booking-search", label: "Advanced Booking Search", icon: Search },
 // { href: "/tours", label: "Tours", icon: Map },
  { href: "/guides", label: "Guides", icon: Compass },   // add this
 // { href: "/transfers", label: "Transfers", icon: Car },
  { href: "/feedback", label: "Guest Feedback", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/roles", label: "Roles and Permissions", icon: ShieldCheck },
  { href: "/settings", label: "System Settings", icon: Settings },
  { href: "/profile", label: "My Profile", icon: UserCircle },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-950",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Palmtree size={18} />
            </div>
            {!collapsed && (
              <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Ceylon Experiences
              </span>
            )}
          </div>
          <button onClick={onCloseMobile} className="text-neutral-500 md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
