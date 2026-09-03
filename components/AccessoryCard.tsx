"use client";

import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Minus, Plus, Sparkles } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import FavoriteButton from "@/components/FavoriteButton";

export type Accessory = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  description: string;
  icon: "leash" | "collar" | "bowl" | "toy" | "bed" | "carrier";
  imageUrls?: string[];
  stock: number;
  isBestseller?: boolean;
};

const ICONS = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

// Real low-stock urgency — only shown when genuinely low (not invented
// "only 2 left!" pressure tactics on items that actually have plenty).
function stockLabel(stock: number): { text: string; color: string } | null {
  if (stock <= 0) return { text: "Out of stock", color: "var(--muted)" };
  if (stock <= 5) return { text: `Only ${stock} left`, color: "var(--heritage-red, #c0392b)" };
  return null;
}

export function AccessoryCard({ item }: { item: Accessory }) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[item.id] ?? 0;
  const Icon = ICONS[item.icon];
  const photo = item.imageUrls?.[0];
  const hasDiscount = item.compareAtPrice != null && item.compareAtPrice > item.price;
  const percentOff = hasDiscount ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100) : 0;
  const stock = stockLabel(item.stock);

  return (
    <div className="card flex gap-4 p-4 relative">
      <Link href={`/accessories/${item.id}`} className="block relative shrink-0">
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center relative"
          style={{ width: 96, height: 96, background: "var(--cream)" }}
        >
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={28} color="var(--tan)" strokeWidth={1.5} />
          )}
          {item.isBestseller && (
            <span
              className="absolute top-0 left-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1"
              style={{ background: "var(--panel-dark)", color: "var(--gold)", borderBottomRightRadius: 8 }}
            >
              <Sparkles size={9} /> Bestseller
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/accessories/${item.id}`} className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>{item.description}</p>
          </Link>
          <FavoriteButton productId={item.id} size={14} />
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <span className="font-bold text-base">₹{item.price}</span>
          {hasDiscount && (
            <>
              <span className="text-xs line-through" style={{ color: "var(--muted)" }}>₹{item.compareAtPrice}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#e8f4ec", color: "#2f6fb0" }}>
                {percentOff}% OFF
              </span>
            </>
          )}
        </div>
        {stock && <p className="text-[11px] font-semibold mt-0.5" style={{ color: stock.color }}>{stock.text}</p>}

        <div className="mt-2">
          {qty === 0 ? (
            <button
              onClick={() => setQuantity(item.id, 1)}
              disabled={item.stock <= 0}
              className="tap-scale px-4 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: "var(--card)",
                border: "1px solid var(--terracotta)",
                color: "var(--terracotta)",
                opacity: item.stock <= 0 ? 0.4 : 1,
                cursor: item.stock <= 0 ? "not-allowed" : "pointer",
              }}
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-1 py-1 w-fit" style={{ background: "var(--panel-dark)" }}>
              <button onClick={() => setQuantity(item.id, qty - 1)} className="tap-scale w-6 h-6 rounded flex items-center justify-center" aria-label="Decrease quantity">
                <Minus size={11} color="white" />
              </button>
              <span className="text-xs font-bold text-white w-4 text-center">{qty}</span>
              <button onClick={() => setQuantity(item.id, qty + 1)} className="tap-scale w-6 h-6 rounded flex items-center justify-center" aria-label="Increase quantity">
                <Plus size={11} color="white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}