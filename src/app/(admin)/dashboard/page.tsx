import { Users, Building2, CalendarCheck, Map, Car, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";

export default async function DashboardPage() {
  const [guests, hotels, bookings, tours, transfers, users, recentImports, recentBookings] =
    await Promise.all([
      prisma.guest.count(),
      prisma.hotel.count(),
      prisma.booking.count(),
      prisma.tour.count(),
      prisma.transfer.count(),
      prisma.user.count(),
      prisma.excelImport.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { guest: true, hotel: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <p className="text-sm text-neutral-500">Overview of Ceylon Experiences operations</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Guests" value={guests} icon={Users} />
        <StatCard label="Hotels" value={hotels} icon={Building2} />
        <StatCard label="Bookings" value={bookings} icon={CalendarCheck} />
        <StatCard label="Tours" value={tours} icon={Map} />
        <StatCard label="Transfers" value={transfers} icon={Car} />
        <StatCard label="Users" value={users} icon={UserCog} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Imports</h2>
          {recentImports.length === 0 ? (
            <p className="text-sm text-neutral-500">No Excel imports yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentImports.map((imp) => (
                <li key={imp.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">{imp.fileName}</span>
                  <span className="text-xs text-neutral-500">{imp.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-neutral-500">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate text-neutral-700 dark:text-neutral-300">
                    {b.guest.fullName} — {b.hotel?.name ?? "No hotel"}
                  </span>
                  <span className="text-xs text-neutral-500">{b.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
