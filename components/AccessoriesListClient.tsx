"use client";

import { useMemo, useState } from "react";
import { Truck } from "lucide-react";
import { AccessoryCard, type Accessory } from "@/components/AccessoryCard";

const PAGE_SIZE = 6;

export default function AccessoriesListClient({
  products,
  query,
}: {
  products: Accessory[];
  query: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return Array.from(counts.entries());
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
      <div id="shop-products" className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar scroll-mt-24">
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

      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold" style={{ background: "var(--gold)", color: "#3d1426", border: "1.5px dashed rgba(61,20,38,0.18)" }}>
          <Truck size={14} /> Free shipping on orders over ₹500
        </div>
      </div>

      <div className="px-4">
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Showing {visible.length} of {filtered.length} {activeCategory ? activeCategory.toLowerCase() : "curated"} essentials
        </p>

        {filtered.length === 0 ? (
          <p className="text-sm py-10 text-center" style={{ color: "var(--muted)" }}>No products match your search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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