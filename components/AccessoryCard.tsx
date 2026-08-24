"use client";

import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export type Accessory = {
  id: string;
  name: string;
  category: string;
  price: number; // rupees, already converted from paise for display
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

  return (
    <div className="card flex flex-col gap-3">
      <Link href={`/accessories/${item.id}`} className="contents">
        <div
          className="w-full flex items-center justify-center rounded-xl overflow-hidden"
          style={{ height: 90, background: "var(--cream)" }}
        >
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={32} color="var(--tan)" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{item.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.description}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between mt-1">
        <span className="font-bold text-sm">₹{item.price}</span>
        {qty === 0 ? (
          <button
            onClick={() => setQuantity(item.id, 1)}
            className="tap-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--panel-dark)" }}
            aria-label="Add to cart"
          >
            <Plus size={14} color="white" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(item.id, qty - 1)}
              className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="text-sm font-semibold w-4 text-center">{qty}</span>
            <button
              onClick={() => setQuantity(item.id, qty + 1)}
              className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--panel-dark)" }}
              aria-label="Increase quantity"
            >
              <Plus size={12} color="white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}