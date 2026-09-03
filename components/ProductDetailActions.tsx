"use client";

import { useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { useCart } from "@/components/CartProvider";

const COLOR_DOT: Record<string, string> = {
  brown: "#8b5a3c", tan: "#c9a876", black: "#2b2b2b", white: "#f5f5f0",
  grey: "#9a9a9a", gray: "#9a9a9a", green: "#4a7c59", blue: "#4a6c9c",
  red: "#a83e3e", beige: "#d9c7a8", natural: "#d9c7a8", cream: "#f0e6d2",
};

export default function ProductDetailActions({
  productId,
  price,
  colorOptions = [],
  sizeOptions = [],
}: {
  productId: string;
  price: number;
  colorOptions?: string[];
  sizeOptions?: string[];
}) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[productId] ?? 0;
  const hasVariants = colorOptions.length > 0 || sizeOptions.length > 0;

  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? null);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] ?? null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState("");

  // Same reasoning as AccessoryCard: a variant selection has to be sent
  // to /api/cart directly (the shared useCart().setQuantity doesn't know
  // about color/size), so this uses its own call rather than guessing at
  // that function's internals.
  const addWithVariant = async () => {
    setAdding(true);
    setError("");
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: 1,
        selectedColor: selectedColor ?? undefined,
        selectedSize: selectedSize ?? undefined,
      }),
    });
    setAdding(false);
    if (res.ok) setJustAdded(true);
    else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Couldn't add to cart.");
    }
  };

  return (
    <>
      {hasVariants && (
        <div className="px-6 pb-4 space-y-4">
          {colorOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Color</p>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => {
                  const dot = COLOR_DOT[c.toLowerCase()] ?? "#c9a876";
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: dot, border: active ? "2px solid var(--panel-dark)" : "2px solid transparent", boxShadow: "0 0 0 1px var(--border)" }}
                      title={c}
                      aria-label={c}
                    >
                      {active && <Check size={14} color="white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {sizeOptions.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Size</p>
              <div className="flex items-center gap-2 flex-wrap">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className="tap-scale px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: selectedSize === s ? "var(--panel-dark)" : "var(--cream)", color: selectedSize === s ? "white" : "inherit" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-xs" style={{ color: "var(--terracotta)" }}>{error}</p>}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", zIndex: 50 }}>
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="shrink-0">
            <p className="font-bold text-lg">₹{price}</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>Inclusive of all taxes</p>
          </div>
          <div className="flex-1">
            {hasVariants ? (
              <button onClick={addWithVariant} disabled={adding || justAdded} className="btn-primary w-full tap-scale flex items-center justify-center gap-2">
                {justAdded ? (<><Check size={16} /> Added to Cart</>) : adding ? "Adding…" : "Add to cart"}
              </button>
            ) : qty === 0 ? (
              <button onClick={() => setQuantity(productId, 1)} className="btn-primary w-full tap-scale">
                Add to cart
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity(productId, qty - 1)}
                  className="tap-scale w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQuantity(productId, qty + 1)}
                  className="tap-scale w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--panel-dark)" }}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} color="white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}