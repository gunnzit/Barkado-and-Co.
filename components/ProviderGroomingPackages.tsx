"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";

type PetSize = "SMALL" | "MEDIUM" | "LARGE";
type GroomingPackage = { id: string; name: string; pricesBySize: Partial<Record<PetSize, number>> };

const SIZE_LABEL: Record<PetSize, string> = { SMALL: "Small", MEDIUM: "Medium", LARGE: "Large" };

// No real per-package duration data exists yet — this defaults every
// grooming booking to a fixed 90-minute window. A placeholder, not a real
// per-package figure; worth adding a real `durationMin` field to
// GroomingPackage later if this needs to vary.
const DEFAULT_SESSION_MINUTES = 90;

export default function ProviderGroomingPackages({
  providerId,
  packages,
  availableSizes,
  petId,
  petSize,
  start,
  address,
  phone,
}: {
  providerId: string;
  packages: GroomingPackage[];
  availableSizes: PetSize[];
  petId: string | null;
  petSize: PetSize | null;
  start: string | null;
  address: string | null;
  phone: string | null;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<PetSize | null>(
    petSize && availableSizes.includes(petSize) ? petSize : availableSizes[0] ?? null
  );
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  const canAddToCart = petId && start && address && phone;

  const addToCart = async (pkg: GroomingPackage) => {
    if (!selectedSize || !canAddToCart) return;
    setAddingId(pkg.id);
    setError("");

    const startDate = new Date(start!);
    const endDate = new Date(startDate.getTime() + DEFAULT_SESSION_MINUTES * 60000);

    const res = await fetch("/api/cart/service", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "GROOMING",
        providerId,
        petId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        address,
        phone,
        groomingPackageId: pkg.id,
        groomingSize: selectedSize,
      }),
    });
    setAddingId(null);
    if (res.ok) {
      setAddedId(pkg.id);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Couldn't add to cart — please try again.");
    }
  };

  if (packages.length === 0) {
    return (
      <div>
        <h3 className="font-bold text-lg mb-3">Grooming Packages</h3>
        <p className="text-sm" style={{ color: "var(--muted)" }}>This groomer hasn't added any packages yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-bold text-lg">Grooming Packages</h3>
        {availableSizes.length > 1 && (
          <div className="flex p-1 rounded-full" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
            {availableSizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className="tap-scale px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: selectedSize === s ? "var(--card)" : "transparent",
                  color: selectedSize === s ? "var(--forest, #16281f)" : "var(--muted)",
                  boxShadow: selectedSize === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {!canAddToCart && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: "var(--cream)", color: "var(--muted)" }}>
          Missing booking details — go back and pick a pet, date, and time first.
        </p>
      )}
      {error && <p className="text-xs mb-3" style={{ color: "var(--terracotta)" }}>{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packages.map((pkg) => {
          const price = selectedSize ? pkg.pricesBySize[selectedSize] : undefined;
          const isAdded = addedId === pkg.id;
          return (
            <div key={pkg.id} className="rounded-xl p-5" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
              <p className="font-bold text-base mb-1">{pkg.name}</p>
              {price != null ? (
                <p className="font-bold text-2xl mb-4">₹{(price / 100).toFixed(0)}</p>
              ) : (
                <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Not available for this size</p>
              )}
              <button
                onClick={() => addToCart(pkg)}
                disabled={price == null || addingId === pkg.id || isAdded || !canAddToCart}
                className="w-full py-2.5 rounded-lg text-sm font-semibold tap-scale flex items-center justify-center gap-2"
                style={{
                  background: isAdded ? "var(--cream)" : "var(--panel-dark)",
                  color: isAdded ? "var(--forest, #16281f)" : "white",
                  opacity: price == null || !canAddToCart ? 0.5 : 1,
                  cursor: price == null || !canAddToCart ? "not-allowed" : "pointer",
                }}
              >
                {isAdded ? (
                  <>
                    <Check size={15} /> Added
                  </>
                ) : addingId === pkg.id ? (
                  "Adding…"
                ) : (
                  <>
                    <ShoppingBag size={15} /> Add to Cart
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {addedId && (
        <button onClick={() => router.push("/cart")} className="btn-primary w-full tap-scale mt-4">
          View Cart
        </button>
      )}
    </div>
  );
}