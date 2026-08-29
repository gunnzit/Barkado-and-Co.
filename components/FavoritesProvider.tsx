"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export type FavoriteItem = {
  id: string;
  productId: string | null;
  product: { id: string; name: string; price: number; icon: string | null; imageUrls: string[] } | null;
  providerId: string | null;
  provider: { id: string; photoUrl: string | null; ratingAvg: number; user: { name: string } } | null;
  createdAt: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  favoritedProductIds: Set<string>;
  favoritedProviderIds: Set<string>;
  loading: boolean;
  toggleProduct: (productId: string) => Promise<void>;
  toggleProvider: (providerId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useUser();

  const favoritedProductIds = new Set(
    favorites.filter((f) => f.productId).map((f) => f.productId as string)
  );
  const favoritedProviderIds = new Set(
    favorites.filter((f) => f.providerId).map((f) => f.providerId as string)
  );

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) setFavorites(await res.json());
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Same reasoning as CartProvider: fetched client-side, after mount, once
  // sign-in state is known — never server-side in the root layout, to avoid
  // fighting Clerk's own sign-in redirect handshake.
  useEffect(() => {
    if (isSignedIn) refresh();
  }, [isSignedIn, refresh]);

  const toggle = useCallback(
    async (body: { productId: string } | { providerId: string }) => {
      // Optimistic-ish: just re-fetch after the toggle completes, since the
      // list is small and this keeps the logic simple and always correct,
      // rather than hand-maintaining local add/remove state that could
      // drift from the server.
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refresh();
    },
    [refresh]
  );

  const toggleProduct = useCallback((productId: string) => toggle({ productId }), [toggle]);
  const toggleProvider = useCallback((providerId: string) => toggle({ providerId }), [toggle]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, favoritedProductIds, favoritedProviderIds, loading, toggleProduct, toggleProvider, refresh }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}