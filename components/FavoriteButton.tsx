"use client";

import { Heart } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useFavorites } from "@/components/FavoritesProvider";

// Reusable heart-toggle button. Pass exactly one of productId / providerId.
// Used on provider cards, product cards, and anywhere else a heart icon
// should appear — the wishlist page's own "Remove" button is a separate,
// differently-styled button that calls the same toggleProduct/toggleProvider
// functions directly, rather than reusing this component's heart-icon look.
export default function FavoriteButton({
  productId,
  providerId,
  size = 16,
}: {
  productId?: string;
  providerId?: string;
  size?: number;
}) {
  const { favoritedProductIds, favoritedProviderIds, toggleProduct, toggleProvider } = useFavorites();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const isFavorited = productId
    ? favoritedProductIds.has(productId)
    : providerId
    ? favoritedProviderIds.has(providerId)
    : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (productId) await toggleProduct(productId);
    else if (providerId) await toggleProvider(providerId);
  };

  return (
    <button
      onClick={handleClick}
      className="tap-scale w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={size}
        fill={isFavorited ? "var(--terracotta)" : "none"}
        color={isFavorited ? "var(--terracotta)" : "var(--muted)"}
      />
    </button>
  );
}