"use client";

import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function ProductDetailActions({ productId }: { productId: string }) {
  const { quantities, setQuantity } = useCart();
  const qty = quantities[productId] ?? 0;

  if (qty === 0) {
    return (
      <button onClick={() => setQuantity(productId, 1)} className="btn-primary w-full tap-scale">
        Add to cart
      </button>
    );
  }

  return (
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
  );
}