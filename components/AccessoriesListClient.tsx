"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PawPrint, Search, X } from "lucide-react";
import { AccessoryCard, type Accessory } from "@/components/AccessoryCard";
import FreeDeliveryBar from "@/components/FreeDeliveryBar";

const PAGE_SIZE = 8;
const FITS = "__fits__";

/** Empty suitableSizes means the product suits every dog. */
const fits = (p: Accessory, size: string | null) => !size || !p.suitableSizes || p.suitableSizes.length === 0 || p.suitableSizes.includes(size);

export default function AccessoriesListClient({
  products,
  query,
  onQueryChange,
  petName = null,
  petSize = null,
}: {
  products: Accessory[];
  query: string;
  onQueryChange: (q: string) => void;
  petName?: string | null;
  petSize?: string | null;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Shadow on the pinned bar only once it's actually stuck to the top.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Only categories with two or more products get their own chip; single
  // items stay reachable under "All" instead of cluttering the row.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return Array.from(counts.entries()).filter(([, n]) => n >= 2);
  }, [products]);
  const fitCount = useMemo(() => (petSize ? products.filter((p) => fits(p, petSize)).length : 0), [products, petSize]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesChip = !active || (active === FITS ? fits(p, petSize) : p.category === active);
      return matchesQuery && matchesChip;
    });
  }, [products, query, active, petSize]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const choose = (key: string | null) => {
    setActive(key);
    setVisibleCount(PAGE_SIZE);
  };

  const chip = (key: string | null, label: React.ReactNode) => {
    const on = active === key;
    return (
      <button
        key={key ?? "all"}
        type="button"
        onClick={() => choose(key)}
        aria-pressed={on}
        className="motion-select tap-scale shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold"
        style={{
          background: on ? "var(--panel-dark)" : "var(--card)",
          color: on ? "white" : "inherit",
          border: `1px solid ${on ? "var(--panel-dark)" : "var(--border)"}`,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      {/* Search + chips stay pinned together while browsing */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <div
        id="shop-products"
        className="sticky top-0 z-30 scroll-mt-2 pt-2 pb-2.5 mb-2"
        style={{
          background: "rgba(255,250,240,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: stuck ? "0 10px 24px -14px rgba(61,20,38,0.35)" : "0 0 0 0 rgba(61,20,38,0)",
          transition: "box-shadow 200ms ease",
        }}
      >
        <div className="px-4 mb-2">
          <label className="flex items-center gap-2 h-11 px-3.5 rounded-full" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)" }}>
            <Search size={16} color="#735c68" className="shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => { onQueryChange(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Search collars, beds, treats…"
              aria-label="Search the shop"
              className="flex-1 bg-transparent text-sm outline-none min-w-0 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => onQueryChange("")} aria-label="Clear search" className="enter-pop w-7 h-7 -mr-1.5 rounded-full flex items-center justify-center tap-scale" style={{ background: "#fef3dc" }}>
                <X size={14} color="#6e1e3b" />
              </button>
            )}
          </label>
        </div>
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {petName && petSize && fitCount > 0 && chip(FITS, <><PawPrint size={13} /> Fits {petName}</>)}
          {chip(null, `All (${products.length})`)}
          {categories.map(([cat, count]) => chip(cat, `${cat} (${count})`))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <FreeDeliveryBar />
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <p className="enter-fade text-sm py-10 text-center" style={{ color: "var(--muted)" }}>No products match your search.</p>
        ) : (
          // Re-keyed when the chip changes (not on every keystroke) so the new set rises in, one card after another.
          <div key={active ?? "all"} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visible.map((item, i) => (
              <div key={item.id} className="enter-up flex" style={{ ["--d" as string]: `${Math.min(i % PAGE_SIZE, 7) * 40}ms` }}>
                <div className="flex-1 min-w-0 flex flex-col [&>*]:flex-1">
                  <AccessoryCard item={item} fitsPetName={petSize && petName && active !== FITS && item.suitableSizes && item.suitableSizes.includes(petSize) ? petName : null} />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="btn-secondary w-full tap-scale mt-5"
          >
            Show more ({filtered.length - visible.length})
          </button>
        )}
      </div>
    </div>
  );
}
