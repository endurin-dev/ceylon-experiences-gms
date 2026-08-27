"use client";

import { useMemo, useState } from "react";
import {
  Bike,
  BusFront,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  Hotel,
  MapPinned,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceCategory = "Transport" | "Activities" | "Stay support";

type Service = {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  icon: React.ElementType;
  accent: string;
  details: string[];
};

const SERVICES: Service[] = [
  {
    id: "car-rental",
    title: "Car rental",
    description: "A comfortable car for independent days out or airport transfers.",
    category: "Transport",
    icon: CarFront,
    accent: "from-[#1769aa] to-[#0a84ff]",
    details: ["With or without driver", "Flexible daily rental", "Airport delivery available"],
  },
  {
    id: "van-rental",
    title: "Van rental",
    description: "Room for your whole group, luggage, and every scenic stop along the way.",
    category: "Transport",
    icon: BusFront,
    accent: "from-[#166534] to-[#30d158]",
    details: ["Up to 8 passengers", "Great for day trips", "Driver option available"],
  },
  {
    id: "bus-rental",
    title: "Bus rental",
    description: "Reliable group transport for larger parties, events, and multi-day tours.",
    category: "Transport",
    icon: BusFront,
    accent: "from-[#9a3412] to-[#ff9f0a]",
    details: ["Small and large coaches", "Dedicated local driver", "Custom route planning"],
  },
  {
    id: "bike-rental",
    title: "Bike rental",
    description: "Explore nearby streets, coastlines, and villages at your own pace.",
    category: "Transport",
    icon: Bike,
    accent: "from-[#9f1239] to-[#ff375f]",
    details: ["City and mountain bikes", "Helmet included", "Daily and weekly rates"],
  },
  {
    id: "surfing-classes",
    title: "Surfing classes",
    description: "Learn the basics with a local instructor on Sri Lanka's warm southern coast.",
    category: "Activities",
    icon: Waves,
    accent: "from-[#075985] to-[#22d3ee]",
    details: ["Beginner-friendly", "Board included", "Private lessons available"],
  },
  {
    id: "guided-day-tour",
    title: "Guided day tour",
    description: "See more with a local guide who knows the quiet roads and best viewpoints.",
    category: "Activities",
    icon: MapPinned,
    accent: "from-[#7c2d12] to-[#fb7185]",
    details: ["Custom itinerary", "Local guide included", "Hotel pickup available"],
  },
  {
    id: "hotel-upgrade",
    title: "Hotel assistance",
    description: "Need a room change, late checkout, or help arranging something at your stay?",
    category: "Stay support",
    icon: Hotel,
    accent: "from-[#4338ca] to-[#818cf8]",
    details: ["Room requests", "Late checkout", "Special arrangements"],
  },
];

const GLASS =
  "border border-white/[0.10] bg-white/[0.055] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_8px_30px_-8px_rgba(0,0,0,0.6)]";

function ServiceCard({ service, requested, onRequest }: { service: Service; requested: boolean; onRequest: () => void }) {
  const Icon = service.icon;

  return (
    <article className={cn("overflow-hidden rounded-[20px]", GLASS)}>
      <div className={cn("relative overflow-hidden bg-gradient-to-br px-4 pb-5 pt-4", service.accent)}>
        <div className="absolute -right-6 -top-8 opacity-15">
          <Icon size={132} strokeWidth={1} />
        </div>
        <div className="relative flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/20 bg-black/10 text-white backdrop-blur-md">
            <Icon size={22} strokeWidth={1.9} />
          </span>
          <span className="rounded-full border border-white/20 bg-black/10 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-md">
            {service.category}
          </span>
        </div>
        <h2 className="relative mt-5 text-[20px] font-semibold leading-tight text-white">{service.title}</h2>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-[14px] leading-snug text-white/55">{service.description}</p>
        <div className="space-y-2">
          {service.details.map((detail) => (
            <div key={detail} className="flex items-center gap-2 text-[13px] text-white/55">
              <Check size={14} className="shrink-0 text-[#5AA6FF]" />
              {detail}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onRequest}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] font-semibold transition active:scale-[0.98]",
            requested
              ? "border border-[#30D158]/30 bg-[#30D158]/10 text-[#30D158]"
              : "bg-[#0A84FF] text-white shadow-[0_4px_16px_-4px_rgba(10,132,255,0.5)] active:bg-[#0972DB]"
          )}
        >
          {requested ? <><Check size={15} /> Requested</> : <>Request service <ChevronRight size={16} /></>}
        </button>
      </div>
    </article>
  );
}

export default function GuestServicesPage() {
  const [activeCategory, setActiveCategory] = useState<"All" | ServiceCategory>("All");
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const categories = ["All", "Transport", "Activities", "Stay support"] as const;
  const filteredServices = useMemo(
    () => activeCategory === "All" ? SERVICES : SERVICES.filter((service) => service.category === activeCategory),
    [activeCategory]
  );

  function handleRequest(serviceId: string) {
    setRequestedIds((current) => {
      const next = new Set(current);
      next.add(serviceId);
      return next;
    });
  }

  return (
    <div className="px-4">
      <header className="pb-4 pt-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#8FC1FF]">
          <Sparkles size={14} /> Make it yours
        </div>
        <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-white">Services</h1>
        <p className="mt-0.5 text-[14px] text-white/40">Everything you need for an easier stay</p>
      </header>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const active = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition active:scale-95",
                active ? "border-[#5AA6FF]/40 bg-[#0A84FF]/25 text-white" : "border-white/[0.10] bg-white/[0.06] text-white/55 backdrop-blur-md"
              )}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-[#5AA6FF]/20 bg-[#0A84FF]/10 px-4 py-3 text-[13px] text-white/60">
        <Clock3 size={17} className="shrink-0 text-[#5AA6FF]" />
        <span>Send a request now and your travel team will confirm availability and pricing.</span>
      </div>

      <div className="space-y-3 pb-2">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            requested={requestedIds.has(service.id)}
            onRequest={() => handleRequest(service.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-white/30">
        <Users size={14} /> More services can be added to your trip
      </div>
    </div>
  );
}
