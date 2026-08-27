"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Loader2, MapPin, Clock, Gauge, Compass, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- types ----------
   Adjust to match your actual API shape — this assumes:
   GET /api/guest/excursions            -> { excursions: GuestExcursion[] }
   POST /api/guest/excursion-bookings   -> { booking: ... }  body: { excursionId }
*/

interface GuestExcursion {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: string | null;
  location: string | null;
  durationHours: number | null;
  difficulty: "EASY" | "MODERATE" | "CHALLENGING" | null;
  price: number | null;
  currency: string | null;
}

function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return "Price on request";
  return `${currency ?? "$"}${price % 1 === 0 ? price : price.toFixed(2)}`;
}

const DIFFICULTY: Record<string, { label: string; text: string }> = {
  EASY: { label: "Easy", text: "text-[#30D158]" },
  MODERATE: { label: "Moderate", text: "text-[#FF9F0A]" },
  CHALLENGING: { label: "Challenging", text: "text-[#FF453A]" },
};

const GLASS =
  "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";

/* Glassy blue — translucent tint instead of a solid fill, used for the
   Reserve button and the active category chip. */
const GLASS_BLUE =
  "border border-[#0A84FF]/40 bg-[#0A84FF]/[0.18] text-[#8FC1FF] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_4px_18px_-4px_rgba(10,132,255,0.45)]";

/* ---------- hardcoded sample data ----------
   Drop-in stand-in for the API response. Shaped exactly like
   { excursions: GuestExcursion[] } so swapping the fetch call back on in
   `load()` below is a one-line change. */

const SAMPLE_EXCURSIONS: GuestExcursion[] = [
  {
    id: "exc-sigiriya",
    title: "Sigiriya Rock Fortress Sunrise Climb",
    description:
      "Climb the ancient rock fortress before dawn, past the ruined frescoes and lion's-paw gate, for sunrise views over the jungle.",
    imageUrl: "https://images.unsplash.com/photo-1612862862126-865765df2ded?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Cultural",
    location: "Sigiriya",
    durationHours: 4,
    difficulty: "MODERATE",
    price: 45,
    currency: "$",
  },
  {
    id: "exc-yala",
    title: "Yala National Park Safari",
    description: "Half-day jeep safari through Yala in search of leopards, elephants, and sloth bears, with an experienced local tracker.",
    imageUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1200",
    category: "Wildlife",
    location: "Yala",
    durationHours: 5,
    difficulty: "EASY",
    price: 60,
    currency: "$",
  },
  {
    id: "exc-ella",
    title: "Nine Arch Bridge & Little Adam's Peak Hike",
    description: "A scenic walk through tea country to the iconic Nine Arch Bridge, followed by a gentle sunset hike up Little Adam's Peak.",
    imageUrl: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?q=80&w=1200",
    category: "Adventure",
    location: "Ella",
    durationHours: 3,
    difficulty: "EASY",
    price: 25,
    currency: "$",
  },
  {
    id: "exc-whales",
    title: "Mirissa Whale & Dolphin Watching",
    description: "Early-morning boat trip off Mirissa to spot blue whales, sperm whales, and pods of spinner dolphins in open water.",
    imageUrl: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?q=80&w=1200",
    category: "Wildlife",
    location: "Mirissa",
    durationHours: 4,
    difficulty: "MODERATE",
    price: 55,
    currency: "$",
  },
  {
    id: "exc-spa",
    title: "Ayurvedic Spa & Herbal Steam Ritual",
    description: "Traditional Ayurvedic massage and herbal steam treatment at a beachside wellness spa, finished with a coconut-oil head massage.",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200",
    category: "Relaxation",
    location: "Bentota",
    durationHours: 2,
    difficulty: "EASY",
    price: 40,
    currency: "$",
  },
  {
    id: "exc-tea",
    title: "Nuwara Eliya Tea Plantation Tour",
    description: "Walk through terraced tea gardens, tour a working factory, and finish with a tasting of freshly brewed Ceylon high-grown tea.",
    imageUrl: "https://images.unsplash.com/photo-1563822249366-3efb23b8e0c9?q=80&w=1200",
    category: "Cultural",
    location: "Nuwara Eliya",
    durationHours: 3,
    difficulty: "EASY",
    price: 20,
    currency: "$",
  },
];

/* ---------- primitives ---------- */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-1.5 pt-5 text-[13px] font-semibold uppercase tracking-wide text-white/35">{children}</p>;
}

function Tag({ icon: Icon, children, tone }: { icon: React.ElementType; children: React.ReactNode; tone?: string }) {
  return (
    <span className={cn("flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.06] px-2 py-1 text-[11px] font-medium backdrop-blur-md", tone ?? "text-white/60")}>
      <Icon size={11} />
      {children}
    </span>
  );
}

/* ---------- catalog card ---------- */

function ExcursionCard({
  excursion,
  onReserve,
  reserving,
  reserved,
}: {
  excursion: GuestExcursion;
  onReserve: (id: string) => void;
  reserving: boolean;
  reserved: boolean;
}) {
  const difficulty = excursion.difficulty ? DIFFICULTY[excursion.difficulty] : null;

  return (
    <div className={cn("overflow-hidden rounded-[20px]", GLASS)}>
      <div className="relative aspect-[16/9] w-full bg-white/[0.04]">
        {excursion.imageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${excursion.imageUrl}')` }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/15">
            <Compass size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {excursion.price != null && (
          <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
            {formatPrice(excursion.price, excursion.currency)}
          </span>
        )}

        <p className="absolute bottom-3 left-4 right-4 text-[17px] font-semibold leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">
          {excursion.title}
        </p>
      </div>

      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-[13px] leading-snug text-white/50">{excursion.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {excursion.durationHours != null && (
            <Tag icon={Clock}>{excursion.durationHours < 1 ? `${excursion.durationHours * 60} min` : `${excursion.durationHours} hr`}</Tag>
          )}
          {difficulty && (
            <Tag icon={Gauge} tone={difficulty.text}>
              {difficulty.label}
            </Tag>
          )}
          {excursion.location && <Tag icon={MapPin}>{excursion.location}</Tag>}
        </div>

        <button
          onClick={() => onReserve(excursion.id)}
          disabled={reserving || reserved}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-60",
            reserved ? "border border-[#30D158]/35 bg-[#30D158]/[0.14] text-[#30D158] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]" : GLASS_BLUE
          )}
        >
          {reserving && <Loader2 size={15} className="animate-spin" />}
          {reserved ? (
            <>
              <Check size={15} /> Requested
            </>
          ) : reserving ? (
            "Requesting…"
          ) : (
            "Reserve spot"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function GuestExcursionsPage() {
  const [excursions, setExcursions] = useState<GuestExcursion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: swap back to the real API once it's ready —
      //
      // const res = await fetch("/api/guest/excursions");
      // if (!res.ok) throw new Error("Couldn't load excursions. Pull down to try again.");
      // const json = await res.json();
      // setExcursions(json.excursions);

      // Hardcoded sample data for now:
      await new Promise((r) => setTimeout(r, 300));
      setExcursions(SAMPLE_EXCURSIONS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load excursions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReserve(excursionId: string) {
    setReservingId(excursionId);
    try {
      // TODO: swap back to the real API once it's ready —
      //
      // const res = await fetch("/api/guest/excursion-bookings", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ excursionId }),
      // });
      // if (!res.ok) throw new Error();

      // Hardcoded stand-in for now:
      await new Promise((r) => setTimeout(r, 500));
      setReservedIds((prev) => new Set(prev).add(excursionId));
    } catch {
      setError("Couldn't request that excursion. Try again in a moment.");
    } finally {
      setReservingId(null);
    }
  }

  const categories = useMemo(() => {
    if (!excursions) return ["All"];
    const set = new Set(excursions.map((e) => e.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(set)];
  }, [excursions]);

  const filtered = useMemo(() => {
    if (!excursions) return [];
    if (activeCategory === "All") return excursions;
    return excursions.filter((e) => e.category === activeCategory);
  }, [excursions, activeCategory]);

  return (
    <div className="px-4">
      {/* Large title */}
      <div className="pb-4 pt-3">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-white">Excursions</h1>
        <p className="mt-0.5 text-[14px] text-white/40">Optional adventures to add to your stay</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 size={22} className="animate-spin text-[#5AA6FF]" />
        </div>
      )}

      {error && !loading && (
        <div className="mb-4 rounded-[16px] border border-[#FF453A]/25 bg-[#FF453A]/10 px-4 py-3 text-[14px] text-[#FF6961] backdrop-blur-md">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {categories.length > 1 && (
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition active:scale-95",
                      active ? cn(GLASS_BLUE, "text-white") : "border border-white/[0.10] bg-white/[0.06] text-white/55 backdrop-blur-md"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className={cn("flex h-16 w-16 items-center justify-center rounded-full text-white/30", GLASS)}>
                <Compass size={26} />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-white/85">No excursions here yet</p>
                <p className="mt-0.5 text-[13px] text-white/35">Check back soon, or try a different category.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {filtered.map((excursion) => (
                <ExcursionCard
                  key={excursion.id}
                  excursion={excursion}
                  onReserve={handleReserve}
                  reserving={reservingId === excursion.id}
                  reserved={reservedIds.has(excursion.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}