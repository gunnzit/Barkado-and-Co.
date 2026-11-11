"use client";

import { useState } from "react";
import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Sparkles, Check, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import FavoriteButton from "@/components/FavoriteButton";
import PartnerBrandTag from "@/components/PartnerBrandTag";

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
  colorOptions?: string[];
  sizeOptions?: string[];
  // Real partner tagging — set only when this product actually belongs
  // to a real PartnerBrand record. Null/undefined for everything else.
  partnerBrand?: { id: string; name: string } | null;
};

const ICONS = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

const COLOR_DOT: Record<string, string> = {
  brown: "#8b5a3c", tan: "#c9a876", black: "#2b2b2b", white: "#f5f5f0",
  grey: "#9a9a9a", gray: "#9a9a9a", green: "#4a7c59", blue: "#4a6c9c",
  red: "#a83e3e", beige: "#d9c7a8", natural: "#d9c7a8", cream: "#f0e6d2",
};

function stockLabel(stock: number): { text: string; color: string } {
  if (stock <= 0) return { text: "Out of stock", color: "var(--muted)" };
  if (stock <= 5) return { text: `Only ${stock} left`, color: "var(--heritage-red, #c0392b)" };
  return { text: `${stock} in stock & ready to ship`, color: "var(--forest, #3d1426)" };
}

/**
 * Compact 2-column product card from the Stitch Shop design
 * (design/stitch/03-shop): square photo on ivory, favourite heart, name,
 * one-line description, price and a round plum add button.
 * Cart, stock and colour/size logic is unchanged.
 */
export function AccessoryCard({ item }: { item: Accessory }) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[item.id] ?? 0;
  const Icon = ICONS[item.icon];
  const photo = item.imageUrls?.[0];
  const hasDiscount = item.compareAtPrice != null && item.compareAtPrice > item.price;
  const percentOff = hasDiscount ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100) : 0;
  const stock = stockLabel(item.stock);

  const colorOptions = item.colorOptions ?? [];
  const sizeOptions = item.sizeOptions ?? [];
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? null);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] ?? null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState("");

  const needsOptions = colorOptions.length > 0 || sizeOptions.length > 0;
  const soldOut = item.stock <= 0;

  const addToCart = async () => {
    setAdding(true);
    setError("");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: item.id,
        quantity: 1,
        selectedColor: selectedColor ?? undefined,
        selectedSize: selectedSize ?? undefined,
      }),
    });
    setAdding(false);
    if (res.ok) {
      setJustAdded(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Couldn't add to cart.");
    }
  };

  return (
    <div
      className="flex flex-col rounded-[1.5rem] overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid rgba(61,20,38,0.07)", boxShadow: "0 8px 24px -4px rgba(61,20,38,0.06)" }}
    >
      <Link href={`/accessories/${item.id}`} className="block relative p-2 pb-0">
        <div className="img-frame w-full aspect-square flex items-center justify-center relative !rounded-[1.1rem]" style={{ background: "var(--cream)" }}>
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={36} color="var(--tan)" strokeWidth={1.5} />
          )}
          {item.isBestseller && (
            <span
              className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--gold)", color: "#3d1426" }}
            >
              <Sparkles size={10} /> Bestseller
            </span>
          )}
          {hasDiscount && (
            <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbe5f3", color: "#3d1426" }}>
              {percentOff}% off
            </span>
          )}
        </div>
        <div className="absolute top-4 right-4" onClick={(e) => e.preventDefault()}>
          <FavoriteButton productId={item.id} size={14} />
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3 pt-2.5">
        <Link href={`/accessories/${item.id}`} className="min-w-0">
          <p className="font-heading font-bold text-sm leading-snug line-clamp-1" style={{ color: "var(--terracotta)" }}>{item.name}</p>
          <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>{item.description}</p>
        </Link>

        {item.partnerBrand && (
          <div className="mt-1.5">
            <PartnerBrandTag partnerBrandId={item.partnerBrand.id} partnerBrandName={item.partnerBrand.name} />
          </div>
        )}

        {needsOptions && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {colorOptions.map((c) => {
              const dot = COLOR_DOT[c.toLowerCase()] ?? "#c9a876";
              const active = selectedColor === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="tap-scale w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: dot, border: active ? "2px solid var(--panel-dark)" : "2px solid transparent", boxShadow: "0 0 0 1px var(--border)" }}
                  title={c}
                  aria-label={c}
                >
                  {active && <Check size={10} color="white" />}
                </button>
              );
            })}
            {sizeOptions.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className="tap-scale px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: selectedSize === sz ? "var(--panel-dark)" : "var(--cream)",
                  color: selectedSize === sz ? "white" : "inherit",
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        )}

        {item.stock <= 5 && (
          <p className="text-[11px] font-semibold mt-1.5" style={{ color: stock.color }}>{stock.text}</p>
        )}

        <div className="flex items-end justify-between mt-auto pt-2.5 gap-2">
          <div className="min-w-0">
            <span className="font-heading font-bold text-base">₹{item.price.toLocaleString("en-IN")}</span>
            {hasDiscount && (
              <span className="block text-[11px] line-through leading-none" style={{ color: "var(--muted)" }}>₹{item.compareAtPrice}</span>
            )}
          </div>

          {needsOptions ? (
            <button
              onClick={addToCart}
              disabled={soldOut || adding}
              className="tap-scale shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--panel-dark)", opacity: soldOut ? 0.4 : 1 }}
              aria-label={justAdded ? `${item.name} added to cart` : `Add ${item.name} to cart`}
            >
              {adding ? "…" : justAdded ? <Check size={16} /> : <Plus size={17} />}
            </button>
          ) : qty === 0 ? (
            <button
              onClick={() => setQuantity(item.id, 1)}
              disabled={soldOut}
              className="tap-scale shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--panel-dark)", opacity: soldOut ? 0.4 : 1 }}
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus size={17} />
            </button>
          ) : (
            <div className="flex items-center gap-0.5 rounded-full p-0.5 shrink-0" style={{ background: "var(--panel-dark)" }}>
              <button onClick={() => setQuantity(item.id, qty - 1)} className="tap-scale w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" aria-label="Decrease quantity">−</button>
              <span className="text-xs font-bold text-white w-4 text-center">{qty}</span>
              <button onClick={() => setQuantity(item.id, qty + 1)} className="tap-scale w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" aria-label="Increase quantity">+</button>
            </div>
          )}
        </div>
        {error && <p className="text-[11px] mt-1.5" style={{ color: "var(--heritage-red, #c0392b)" }}>{error}</p>}
      </div>
    </div>
  );
}
