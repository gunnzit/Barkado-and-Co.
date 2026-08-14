"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";

type CartContextType = {
  quantities: Record<string, number>;
  totalCount: number;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  initialQuantities,
  initialTotal,
  children,
}: {
  initialQuantities: Record<string, number>;
  initialTotal: number;
  children: React.ReactNode;
}) {
  const [quantities, setQuantities] = useState(initialQuantities);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const router = useRouter();

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const prevQty = quantities[productId] ?? 0;
      const delta = quantity - prevQty;

      // Optimistic update — revert below if the request fails.
      setQuantities((q) => ({ ...q, [productId]: Math.max(0, quantity) }));
      setTotalCount((t) => Math.max(0, t + delta));

      try {
        if (quantity <= 0) {
          await fetch(`/api/cart/${productId}`, { method: "DELETE" });
        } else if (prevQty === 0) {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity }),
          });
          if (res.status === 401) {
            router.push("/sign-in");
            setQuantities((q) => ({ ...q, [productId]: prevQty }));
            setTotalCount((t) => t - delta);
          } else if (!res.ok) {
            throw new Error("Failed to add to cart");
          }
        } else {
          const res = await fetch(`/api/cart/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });
          if (!res.ok) throw new Error("Failed to update cart");
        }
      } catch {
        // Revert the optimistic update on failure.
        setQuantities((q) => ({ ...q, [productId]: prevQty }));
        setTotalCount((t) => t - delta);
      }
    },
    [quantities, router]
  );

  return (
    <CartContext.Provider value={{ quantities, totalCount, setQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}