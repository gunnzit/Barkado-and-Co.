"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export type CartItem = {
  id: string;
  kind: "PRODUCT" | "SERVICE";
  quantity: number;
  productId: string | null;
  product: { id: string; name: string; price: number; icon: string | null } | null;
  serviceType: "WALKING" | "SITTING" | "GROOMING" | "TRAINING" | null;
  providerId: string | null;
  provider: { id: string; user: { name: string } } | null;
  petId: string | null;
  pet: { id: string; name: string } | null;
  startTime: string | null;
  endTime: string | null;
  address: string | null;
  phone: string | null;
  priceAmount: number | null;
};

type CartContextType = {
  items: CartItem[];
  quantities: Record<string, number>; // productId -> quantity, for AccessoryCard
  totalCount: number;
  loading: boolean;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  addService: (data: {
    serviceType: "WALKING" | "SITTING" | "GROOMING" | "TRAINING";
    providerId: string;
    petId: string;
    startTime: string;
    endTime: string;
    address: string;
    phone: string;
  }) => Promise<"ok" | "unauthorized" | "error">;
  removeItem: (cartItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  initialItems,
  children,
}: {
  initialItems: CartItem[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [pendingAdd, setPendingAdd] = useState<{ productId: string; quantity: number } | null>(null);

  const quantities = Object.fromEntries(
    items.filter((i) => i.kind === "PRODUCT" && i.productId).map((i) => [i.productId as string, i.quantity])
  );
  const totalCount = items.reduce((sum, i) => sum + (i.kind === "PRODUCT" ? i.quantity : 1), 0);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Fetch the real cart once, client-side, after the user's sign-in state
  // is known — deliberately NOT done server-side in the root layout (see
  // the comment there for why).
  useEffect(() => {
    if (isSignedIn) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const applyQuantity = useCallback(async (productId: string, quantity: number, prevQty: number) => {
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
  }, []);

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const prevQty = quantities[productId] ?? 0;
      try {
        const result = await applyQuantity(productId, quantity, prevQty);
        if (result === "unauthorized") {
          setPendingAdd({ productId, quantity });
          openSignIn();
          return;
        }
        await refresh();
      } catch {
        // no-op — refresh() below will re-sync state on next successful call
      }
    },
    [quantities, applyQuantity, openSignIn, refresh]
  );

  const addService = useCallback(
    async (data: Parameters<CartContextType["addService"]>[0]) => {
      if (!isSignedIn) {
        openSignIn();
        return "unauthorized" as const;
      }
      const res = await fetch("/api/cart/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        openSignIn();
        return "unauthorized" as const;
      }
      if (!res.ok) return "error" as const;
      await refresh();
      return "ok" as const;
    },
    [isSignedIn, openSignIn, refresh]
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await fetch(`/api/cart/item/${cartItemId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  // Once sign-in completes, finish whatever product add they were trying to do.
  useEffect(() => {
    if (isSignedIn && pendingAdd) {
      const { productId, quantity } = pendingAdd;
      setPendingAdd(null);
      setQuantity(productId, quantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return (
    <CartContext.Provider value={{ items, quantities, totalCount, loading, setQuantity, addService, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}