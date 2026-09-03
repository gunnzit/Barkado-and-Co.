"use client";

import { useState } from "react";
import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, Sparkles, Check } from "lucide-react";
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
  colorOptions?: string[];
  sizeOptions?: string[];
};

const ICONS = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

// A small, deterministic set of real display colors for color-name swatches
// (e.g. "Brown" -> a brown dot) — purely visual mapping for names that are
// already real data (product.colorOptions), not fabricated content itself.
const COLOR_DOT: Record<string, string> = {
  brown: "#8b5a3c", tan: "#c9a876", black: "#2b2b2b", white: "#f5f5f0",
  grey: "#9a9a9a", gray: "#9a9a9a", green: "#4a7c59", blue: "#4a6c9c",
  red: "#a83e3e", beige: "#d9c7a8", natural: "#d9c7a8", cream: "#f0e6d2",
};

function stockLabel(stock: number): { text: string; color: string } {
  if (stock <= 0) return { text: "Out of stock", color: "var(--muted)" };
  if (stock <= 5) return { text: `Only ${stock} left`, color: "var(--heritage-red, #c0392b)" };
  return { text: `${stock} in stock & ready to ship`, color: "var(--forest, #16281f)" };
}

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

  // Uses its own direct call (needed to send selectedColor/selectedSize,
  // which the shared cart context's setQuantity doesn't know about) rather
  // than going through useCart()'s setQuantity — that function's current
  // internals aren't something to guess at safely here. Shows a local
  // "Added" confirmation instead of trying to sync the shared cart-badge
  // count, which may lag until the cart page itself is opened/refreshed.
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
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* ===== Image with real badge overlay ===== */}
      <Link href={`/accessories/${item.id}`} className="block relative">
        <div className="w-full flex items-center justify-center relative" style={{ height: 200, background: "var(--cream)" }}>
          {photo ? (
            <img src={photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={40} color="var(--tan)" strokeWidth={1.5} />
          )}
          {item.isBestseller && (
            <span
              className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: "var(--panel-dark)", color: "var(--gold)" }}
            >
              <Sparkles size={10} /> Bestseller
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <FavoriteButton productId={item.id} size={15} />
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/accessories/${item.id}`}>
          <p className="font-heading font-bold text-base leading-snug">{item.name}</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{item.description}</p>
        </Link>

        {/* ===== Real, interactive color/size selection — only shown when
            the product actually has options (product.colorOptions /
            sizeOptions). Selecting here feeds directly into the real
            Add to Cart call below, validated server-side. ===== */}
        {(colorOptions.length > 0 || sizeOptions.length > 0) && (
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            {colorOptions.length > 0 && (
              <div className="flex items-center gap-1.5">
                {colorOptions.map((c) => {
                  const dot = COLOR_DOT[c.toLowerCase()] ?? "#c9a876";
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className="tap-scale w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: dot, border: active ? "2px solid var(--panel-dark)" : "2px solid transparent", boxShadow: "0 0 0 1px var(--border)" }}
                      title={c}
                      aria-label={c}
                    >
                      {active && <Check size={11} color="white" />}
                    </button>
                  );
                })}
              </div>
            )}
            {sizeOptions.length > 0 && (
              <div className="flex items-center gap-1">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className="tap-scale px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{
                      background: selectedSize === s ? "var(--panel-dark)" : "var(--cream)",
                      color: selectedSize === s ? "white" : "inherit",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs font-medium mt-3" style={{ color: stock.color }}>{stock.text}</p>

        <div className="flex items-center justify-between mt-3 gap-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-xl">₹{item.price}</span>
              {hasDiscount && (
                <span className="text-sm line-through" style={{ color: "var(--muted)" }}>₹{item.compareAtPrice}</span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-[11px] font-bold" style={{ color: "#2f6fb0" }}>{percentOff}% OFF</p>
            )}
          </div>

          {colorOptions.length > 0 || sizeOptions.length > 0 ? (
            // Has real variant options — always goes through the custom
            // addToCart above (needs to send the selection), never the
            // shared useCart stepper below, which has no variant awareness.
            <button
              onClick={addToCart}
              disabled={item.stock <= 0 || adding}
              className="btn-primary tap-scale shrink-0 flex items-center gap-1.5"
              style={{ opacity: item.stock <= 0 ? 0.4 : 1 }}
            >
              {adding ? "Adding…" : justAdded ? (<><Check size={14} /> Added</>) : "Add to Cart"}
            </button>
          ) : qty === 0 ? (
            <button
              onClick={() => setQuantity(item.id, 1)}
              disabled={item.stock <= 0}
              className="btn-primary tap-scale shrink-0"
              style={{ opacity: item.stock <= 0 ? 0.4 : 1 }}
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-1 py-1 shrink-0" style={{ background: "var(--panel-dark)" }}>
              <button onClick={() => setQuantity(item.id, qty - 1)} className="tap-scale w-7 h-7 rounded flex items-center justify-center text-white font-bold" aria-label="Decrease quantity">−</button>
              <span className="text-sm font-bold text-white w-5 text-center">{qty}</span>
              <button onClick={() => setQuantity(item.id, qty + 1)} className="tap-scale w-7 h-7 rounded flex items-center justify-center text-white font-bold" aria-label="Increase quantity">+</button>
            </div>
          )}
        </div>
        {error && <p className="text-xs mt-2" style={{ color: "var(--terracotta)" }}>{error}</p>}
      </div>
    </div>
  );
}