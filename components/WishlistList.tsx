"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";

// Renders the owner's saved providers and products, each with its own
// "Remove" button — a separate, plainly-labeled action from the heart-icon
// toggle used elsewhere in the app, per how removal on this page specifically
// was asked for. Both call the same underlying toggleProvider/toggleProduct
// functions from FavoritesProvider; only the button's appearance differs.
export default function WishlistList() {
  const { favorites, loading, toggleProduct, toggleProvider } = useFavorites();

  const providerFavorites = favorites.filter((f) => f.provider);
  const productFavorites = favorites.filter((f) => f.product);

  if (loading && favorites.length === 0) {
    return <p className="text-sm py-10 text-center" style={{ color: "var(--muted)" }}>Loading…</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart size={32} color="var(--muted)" className="mx-auto mb-3" />
        <p className="font-bold text-lg mb-1">Nothing saved yet</p>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Tap the heart on any provider or product to save it here.
        </p>
        <Link href="/" className="btn-primary inline-block">Browse</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {providerFavorites.length > 0 && (
        <section>
          <h2 className="font-bold text-sm mb-3">Saved providers</h2>
          <div className="space-y-3">
            {providerFavorites.map((f) => (
              <div key={f.id} className="card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={f.provider!.photoUrl || `https://i.pravatar.cc/150?u=${f.provider!.id}`}
                    alt={f.provider!.user.name}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                    style={{ border: "1px solid var(--border)" }}
                  />
                  <div>
                    <p className="font-semibold text-sm">{f.provider!.user.name}</p>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                      <Star size={11} fill="var(--gold)" color="var(--gold)" /> {f.provider!.ratingAvg.toFixed(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleProvider(f.provider!.id)}
                  className="tap-scale text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {productFavorites.length > 0 && (
        <section>
          <h2 className="font-bold text-sm mb-3">Saved products</h2>
          <div className="space-y-3">
            {productFavorites.map((f) => (
              <div key={f.id} className="card flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "var(--cream)" }}
                  >
                    {f.product!.imageUrls?.[0] ? (
                      <img src={f.product!.imageUrls[0]} alt={f.product!.name} className="w-full h-full object-cover" />
                    ) : (
                      <Heart size={16} color="var(--muted)" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.product!.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>₹{(f.product!.price / 100).toFixed(0)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleProduct(f.product!.id)}
                  className="tap-scale text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}