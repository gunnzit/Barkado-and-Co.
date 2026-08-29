"use client";

import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import FavoriteButton from "@/components/FavoriteButton";

export type Accessory = {
  id: string;
  name: string;
  category: string;
  price: number; // rupees, already converted from paise for display
  compareAtPrice?: number | null; // rupees, optional
  description: string;
  icon: "leash" | "collar" | "bowl" | "toy" | "bed" | "carrier";
  imageUrls?: string[];
};

const ICONS = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

export function AccessoryCard({ item }: { item: Accessory }) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[item.id] ?? 0;
  const Icon = ICONS[item.icon];
  const photo = item.imageUrls?.[0];
  const hasDiscount = item.compareAtPrice != null && item.compareAtPrice > item.price;
  const percentOff = hasDiscount ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100) : 0;

  return (
    <div className="card flex flex-col gap-2 p-0 overflow-hidden relative">
      <Link href={`/accessories/${item.id}`} className="block relative">
        <div
          className="w-full flex items-center justify-center overflow-hidden"
          style={{ height: 110, background: "var(--cream)" }}
        >
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={32} color="var(--tan)" strokeWidth={1.5} />
          )}
        </div>

        {item.imageUrls && item.imageUrls.length > 1 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {item.imageUrls.map((_, i) => (
              <span key={i} className="rounded-full" style={{ width: 4, height: 4, background: i === 0 ? "white" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        )}
      </Link>

      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute"
        style={{ top: 8, right: 8, zIndex: 2 }}
      >
        <FavoriteButton productId={item.id} size={14} />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute"
        style={{ top: 84, right: 8, zIndex: 2 }}
      >
        {qty === 0 ? (
          <button
            onClick={() => setQuantity(item.id, 1)}
            className="tap-scale px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "var(--card)", border: "1px solid var(--terracotta)", color: "var(--terracotta)", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
            aria-label="Add to cart"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg px-1 py-1" style={{ background: "var(--panel-dark)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            <button
              onClick={() => setQuantity(item.id, qty - 1)}
              className="tap-scale w-6 h-6 rounded flex items-center justify-center"
              aria-label="Decrease quantity"
            >
              <Minus size={11} color="white" />
            </button>
            <span className="text-xs font-bold text-white w-4 text-center">{qty}</span>
            <button
              onClick={() => setQuantity(item.id, qty + 1)}
              className="tap-scale w-6 h-6 rounded flex items-center justify-center"
              aria-label="Increase quantity"
            >
              <Plus size={11} color="white" />
            </button>
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-bold text-sm">₹{item.price}</span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: "var(--muted)" }}>₹{item.compareAtPrice}</span>
          )}
        </div>
        {hasDiscount && (
          <p className="text-[11px] font-bold mb-1" style={{ color: "#2f6fb0" }}>{percentOff}% OFF</p>
        )}
        <p className="font-semibold text-xs leading-tight">{item.name}</p>
        <span
          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1.5"
          style={{ background: "var(--cream)", color: "var(--muted)" }}
        >
          {item.category}
        </span>
      </div>
    </div>
  );
}