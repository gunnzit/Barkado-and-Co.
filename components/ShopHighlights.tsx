"use client";

import Link from "next/link";
import { Sparkles, Truck, RefreshCw, ShieldCheck, Gift, Timer, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";

const H = { fontFamily: "var(--font-heading)" } as const;

type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // rupees, per existing serialization
  compareAtPrice: number | null;
  description: string;
  imageUrls: string[];
  stock: number;
  isBestseller?: boolean;
};
type Bundle = {
  id: string;
  name: string;
  description: string | null;
  bundlePricePaise: number;
  imageUrl: string | null;
  items: { productName: string; quantity: number }[];
  realComparePaise: number; // sum of real item prices, for real "you save" math
};

// 1 point per ₹10 base price — same real rate used everywhere else.
function estimatePoints(rupees: number) {
  return Math.floor((rupees * 100) / 1000);
}

export default function ShopHighlights({
  featuredProduct,
  tailoredProducts,
  petName,
  bundles,
  impulseProducts,
}: {
  featuredProduct: (Product & { percentOff: number }) | null;
  tailoredProducts: Product[];
  petName: string | null;
  bundles: Bundle[];
  impulseProducts: Product[];
}) {
  const { setQuantity, quantities } = useCart();

  return (
    <div className="mb-2">
      {/* ===== Flash Drop — only renders if a real product has a real
          discount. Countdown timer, "only N left in size M", and the
          complimentary engraving perk are marked placeholders — no
          time-limited deals or engraving/personalization system exists.
          See NOT_BUILT.md. ===== */}
      {featuredProduct && (
        <div className="px-4 mb-6">
          <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(180deg, #16281f, #02120a)", color: "white" }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: "rgba(0,0,0,0.3)" }}>
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "#fea67f" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#fea67f" }} /> Featured Deal
              </span>
              <span className="flex items-center gap-1 text-[12px] font-mono font-semibold" style={{ color: "#fcba5a" }} title="Placeholder — not a real time-limited deal">
                <Timer size={14} />
              </span>
            </div>
            <div className="relative w-full h-56" style={{ background: "#e9e9dd" }}>
              {featuredProduct.imageUrls[0] && (
                <img src={featuredProduct.imageUrls[0]} alt={featuredProduct.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "#904c2c", color: "white" }}>
                  SAVE {featuredProduct.percentOff}%
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(2,18,10,0.8)", color: "#fcba5a" }}>
                  {featuredProduct.stock} in stock
                </span>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2.5">
              <div>
                <div className="text-[11px] uppercase tracking-wider" style={{ color: "#d2e8d9" }}>{featuredProduct.category}</div>
                <h2 className="font-bold text-lg leading-tight mt-0.5" style={H}>{featuredProduct.name}</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl" style={{ ...H, color: "#fcba5a" }}>₹{featuredProduct.price}</span>
                <span className="text-sm line-through" style={{ color: "#c2c8c2" }}>₹{featuredProduct.compareAtPrice}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(254,166,127,0.2)", color: "#fea67f" }}>
                  Save ₹{(featuredProduct.compareAtPrice! - featuredProduct.price)}
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl opacity-70" style={{ background: "rgba(255,255,255,0.08)" }} title="Placeholder — no real engraving/personalization feature exists">
                <ShieldCheck size={16} color="#fcba5a" />
                <span className="text-xs">Personalization coming soon</span>
              </div>
              <Link
                href={`/accessories/${featuredProduct.id}`}
                className="w-full h-12 mt-1 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#904c2c", color: "white", ...H }}
              >
                View &amp; Add to Bag
              </Link>
            </div>
          </div>
        </div>
      )}

      {tailoredProducts.length > 0 && petName && (
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-bold text-sm" style={{ ...H, color: "#02120a" }}>
              <Sparkles size={16} color="#904c2c" /> Tailored for {petName}
            </span>
          </div>
          <div className="flex gap-3.5 overflow-x-auto px-4 pb-1">
            {tailoredProducts.map((p) => {
              const hasDiscount = p.compareAtPrice != null && p.compareAtPrice > p.price;
              return (
                <Link href={`/accessories/${p.id}`} key={p.id} className="w-44 shrink-0 rounded-2xl overflow-hidden tap-scale" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)" }}>
                  <div className="relative w-full h-32" style={{ background: "#f5f4e8" }}>
                    {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: "rgba(2,18,10,0.75)", color: "#ffddb3" }}>
                      {estimatePoints(p.price)} PawPoints
                    </span>
                  </div>
                  <div className="p-2.5 flex flex-col gap-1.5">
                    <p className="font-bold text-xs line-clamp-2" style={{ ...H, color: "#02120a" }}>{p.name}</p>
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm" style={{ ...H, color: "#02120a" }}>₹{p.price}</span>
                        {hasDiscount && <span className="text-[10px] line-through" style={{ color: "#737874" }}>₹{p.compareAtPrice}</span>}
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); setQuantity(p.id, (quantities[p.id] ?? 0) + 1); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "#02120a", color: "white" }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {bundles.length > 0 && (
        <div className="px-4 mb-6 flex flex-col gap-3">
          <div>
            <h3 className="font-bold text-base" style={{ ...H, color: "#02120a" }}>Curated Bundles</h3>
            <p className="text-xs" style={{ color: "#424844" }}>Real multi-item kits, priced together</p>
          </div>
          {bundles.map((b) => {
            const savingsPaise = Math.max(0, b.realComparePaise - b.bundlePricePaise);
            return (
              <div key={b.id} className="rounded-2xl p-4 shadow-sm flex flex-col gap-3" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)" }}>
                {b.imageUrl && (
                  <div className="w-full h-40 rounded-xl overflow-hidden" style={{ background: "#f5f4e8" }}>
                    <img src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-base" style={{ ...H, color: "#02120a" }}>{b.name}</h4>
                  {b.description && <p className="text-xs mt-1" style={{ color: "#424844" }}>{b.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                  {b.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "#f5f4e8" }}>
                      <span className="truncate">{it.quantity > 1 ? `${it.quantity}x ` : ""}{it.productName}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-xl" style={{ ...H, color: "#02120a" }}>₹{(b.bundlePricePaise / 100).toFixed(0)}</span>
                      {savingsPaise > 0 && <span className="text-xs line-through" style={{ color: "#737874" }}>₹{(b.realComparePaise / 100).toFixed(0)}</span>}
                    </div>
                    {savingsPaise > 0 && <span className="text-[11px] font-semibold" style={{ color: "#904c2c" }}>Save ₹{(savingsPaise / 100).toFixed(0)} (individually)</span>}
                  </div>
                  <span
                    className="h-11 px-5 rounded-xl font-semibold text-xs flex items-center gap-1.5"
                    style={{ background: "#e9e9dd", color: "#737874" }}
                    title="Bundle checkout pricing not built yet — see NOT_BUILT.md"
                  >
                    Coming Soon
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {impulseProducts.length > 0 && (
        <div className="px-4 mb-6">
          <div className="rounded-2xl p-4" style={{ background: "#f5f4e8" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#fea67f" }}>
                <Sparkles size={14} color="#78391b" />
              </span>
              <div>
                <h3 className="font-bold text-sm" style={{ ...H, color: "#02120a" }}>Quick Add-Ons</h3>
                <p className="text-[11px]" style={{ color: "#424844" }}>Under ₹499 — easy extras</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {impulseProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-xl p-2.5 flex flex-col justify-between" style={{ background: "#ffffff" }}>
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "#f5f4e8" }}>
                      {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                    </div>
                    <p className="text-[11px] font-bold truncate" style={{ ...H, color: "#02120a" }}>{p.name}</p>
                  </div>
                  <div className="mt-2.5 pt-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(194,200,194,0.2)" }}>
                    <span className="font-bold text-xs" style={{ ...H, color: "#02120a" }}>₹{p.price}</span>
                    <button
                      onClick={() => setQuantity(p.id, (quantities[p.id] ?? 0) + 1)}
                      className="px-2 py-1 rounded-md font-bold text-[10px]"
                      style={{ background: "#efeee3", color: "#02120a" }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== VIP Cross-Perk — TODO: no dynamic coupon-generation system
          exists (only static WELCOME10). Kept as a visual placeholder
          per instruction. See NOT_BUILT.md. ===== */}
      <div className="px-4 mb-6">
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: "linear-gradient(90deg, #02120a, #16281f)", color: "white" }}>
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fea67f" }}>
              <Gift size={20} color="#78391b" />
            </span>
            <div className="flex-1 opacity-80" title="Placeholder — no dynamic coupon system exists yet">
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1" style={{ background: "rgba(255,255,255,0.15)" }}>
                Coming Soon
              </div>
              <h4 className="font-bold text-sm leading-snug" style={H}>Cross-service perks for gear purchases</h4>
              <p className="text-xs mt-1" style={{ color: "#d2e8d9" }}>Automatic booking discounts aren't wired up yet.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-2 py-3 px-2 rounded-xl text-center" style={{ background: "#efeee3" }}>
          <div className="flex flex-col items-center gap-1">
            <Truck size={18} color="#904c2c" />
            <span className="font-bold text-[11px]" style={{ ...H, color: "#02120a" }}>Free Shipping</span>
            <span className="text-[10px]" style={{ color: "#424844" }}>On orders ₹500+</span>
          </div>
          <div className="flex flex-col items-center gap-1 opacity-60" title="Placeholder — no real return/exchange system exists yet">
            <RefreshCw size={18} color="#904c2c" />
            <span className="font-bold text-[11px]" style={{ ...H, color: "#02120a" }}>Exchanges</span>
            <span className="text-[10px]" style={{ color: "#424844" }}>Coming soon</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={18} color="#904c2c" />
            <span className="font-bold text-[11px]" style={{ ...H, color: "#02120a" }}>Pet-Safe</span>
            <span className="text-[10px]" style={{ color: "#424844" }}>Sterilized &amp; checked</span>
          </div>
        </div>
      </div>
    </div>
  );
}