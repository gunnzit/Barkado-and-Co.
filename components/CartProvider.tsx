"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

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
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [pendingAdd, setPendingAdd] = useState<{ productId: string; quantity: number } | null>(null);

  const applyQuantity = useCallback(
    async (productId: string, quantity: number, prevQty: number) => {
      if (quantity <= 0) {
        await fetch(`/api/cart/${productId}`, { method: "DELETE" });
        return true;
      }
      if (prevQty === 0) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        if (res.status === 401) return "unauthorized" as const;
        if (!res.ok) throw new Error("Failed to add to cart");
        return true;
      }
      const res = await fetch(`/api/cart/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.status === 401) return "unauthorized" as const;
      if (!res.ok) throw new Error("Failed to update cart");
      return true;
    },
    []
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const prevQty = quantities[productId] ?? 0;
      const delta = quantity - prevQty;

      // Optimistic update — reverted below if the request fails or needs sign-in.
      setQuantities((q) => ({ ...q, [productId]: Math.max(0, quantity) }));
      setTotalCount((t) => Math.max(0, t + delta));

      try {
        const result = await applyQuantity(productId, quantity, prevQty);
        if (result === "unauthorized") {
          setQuantities((q) => ({ ...q, [productId]: prevQty }));
          setTotalCount((t) => t - delta);
          setPendingAdd({ productId, quantity });
          openSignIn();
        }
      } catch {
        setQuantities((q) => ({ ...q, [productId]: prevQty }));
        setTotalCount((t) => t - delta);
      }
    },
    [quantities, applyQuantity, openSignIn]
  );

  // Once sign-in completes, finish whatever they were trying to add.
  useEffect(() => {
    if (isSignedIn && pendingAdd) {
      const { productId, quantity } = pendingAdd;
      setPendingAdd(null);
      setQuantity(productId, quantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

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