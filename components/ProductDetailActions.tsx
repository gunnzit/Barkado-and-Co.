"use client";

import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function ProductDetailActions({ productId, price }: { productId: string; price: number }) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[productId] ?? 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", zIndex: 50 }}>
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="shrink-0">
          <p className="font-bold text-lg">₹{price}</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Inclusive of all taxes</p>
        </div>
        <div className="flex-1">
          {qty === 0 ? (
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
  );
}