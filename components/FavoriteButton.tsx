"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useFavorites } from "@/components/FavoritesProvider";

// Six little paws that burst out when something is saved (see .paw-burst in globals.css).
const BURST_ANGLES = [0, 60, 120, 180, 240, 300];

function TinyPaw() {
  return (
    <svg viewBox="0 0 24 24" width="9" height="9" aria-hidden="true">
      <g fill="#e2b33c">
        <ellipse cx="7" cy="8" rx="2.4" ry="3" />
        <ellipse cx="12" cy="5.5" rx="2.4" ry="3" />
        <ellipse cx="17" cy="8" rx="2.4" ry="3" />
        <path d="M12 10.5c-3.6 0-6.4 3.6-6.4 6.5 0 2.2 1.7 3.3 3.5 3 1-.2 1.8-.7 2.9-.7s1.9.5 2.9.7c1.8.3 3.5-.8 3.5-3 0-2.9-2.8-6.5-6.4-6.5z" />
      </g>
    </svg>
  );
}

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
  // Bumped each time the user saves, to replay the pop and the burst.
  const [burstKey, setBurstKey] = useState(0);

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
    // Celebrate saving only; removing a favourite is a quiet colour change.
    if (!isFavorited) setBurstKey((k) => k + 1);
    if (productId) await toggleProduct(productId);
    else if (providerId) await toggleProvider(providerId);
  };

  return (
    <button
      onClick={handleClick}
      className="tap-scale relative w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isFavorited}
    >
      <span key={burstKey} className={burstKey > 0 ? "heart-pop inline-flex" : "inline-flex"}>
        <Heart
          size={size}
          fill={isFavorited ? "var(--terracotta)" : "none"}
          color={isFavorited ? "var(--terracotta)" : "var(--muted)"}
          style={{ transition: "fill 160ms ease, color 160ms ease" }}
        />
      </span>
      {burstKey > 0 &&
        BURST_ANGLES.map((deg) => (
          <span key={`${burstKey}-${deg}`} className="paw-burst" style={{ ["--r" as string]: `${deg}deg` }}>
            <TinyPaw />
          </span>
        ))}
    </button>
  );
}
