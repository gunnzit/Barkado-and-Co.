"use client";

import { useMemo, useState } from "react";
import { Search, Truck } from "lucide-react";
import { AccessoryCard, type Accessory } from "@/components/AccessoryCard";

const PAGE_SIZE = 6;

export default function AccessoriesListClient({ products }: { products: Accessory[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return Array.from(counts.entries()); // [category, count][]
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || p.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, activeCategory]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      {/* ===== Search — real, client-side over the already-loaded catalog.
          No fake/no-op search box. ===== */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search accessories..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* ===== Category filter chips — real counts ===== */}
      <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setActiveCategory(null); setVisibleCount(PAGE_SIZE); }}
          className="tap-scale shrink-0 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: activeCategory === null ? "var(--panel-dark)" : "var(--card)",
            color: activeCategory === null ? "white" : "inherit",
            border: `1px solid ${activeCategory === null ? "var(--panel-dark)" : "var(--border)"}`,
          }}
        >
          All Accessories ({products.length})
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setVisibleCount(PAGE_SIZE); }}
            className="tap-scale shrink-0 px-4 py-2 rounded-full text-sm font-semibold"
            style={{
              background: activeCategory === cat ? "var(--panel-dark)" : "var(--card)",
              color: activeCategory === cat ? "white" : "inherit",
              border: `1px solid ${activeCategory === cat ? "var(--panel-dark)" : "var(--border)"}`,
            }}
          >
            {cat} ({count})
          </button>
        ))}
      </div>

      {/* ===== Free shipping banner — real, static policy copy ===== */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--cream)", color: "var(--forest, #16281f)" }}>
          <Truck size={14} /> Free shipping on orders over ₹500
        </div>
      </div>

      <div className="px-6">
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Showing {visible.length} of {filtered.length} {activeCategory ? activeCategory.toLowerCase() : "curated"} essentials
        </p>

        {/* Single column on mobile; a real 2-column grid from tablet
            width up — this page previously looked identical at every
            screen size, which wasn't a deliberate choice. */}
        {filtered.length === 0 ? (
          <p className="text-sm py-10 text-center" style={{ color: "var(--muted)" }}>No products match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((item) => (
              <AccessoryCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="btn-secondary w-full tap-scale mt-5"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}