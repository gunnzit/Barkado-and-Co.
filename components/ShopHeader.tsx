"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { ShoppingBag, MapPin, ChevronDown } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import LocationPickerModal from "@/components/LocationPickerModal";
import { useCartBump } from "@/lib/cartMotion";

const H = { fontFamily: "var(--font-heading)" } as const;

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

/** "bedi book store, sector 40c, chandigarh" → "Sector 40C": prefer the locality part, else the first named part. */
function deliveryArea(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const locality = parts.find((p) => /\b(sector|phase|block|colony|nagar|vihar|enclave|market)\b/i.test(p)) ?? parts.find((p) => /[a-z]/i.test(p)) ?? parts[0];
  return locality ? locality.replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(\d+)([a-z])\b/gi, (_, n, l) => `${n}${l.toUpperCase()}`) : null;
}

/*
 * Shop top bar (row 1): logo with the delivery area under it, cart on the
 * right. Search lives in the pinned bar with the category chips
 * (AccessoriesListClient), so it stays one tap away while browsing.
 */
export default function ShopHeader({ userAddress }: { userAddress: string | null }) {
  const { items } = useCart();
  const cartRef = useCartBump<HTMLAnchorElement>();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const openPicker = async () => {
    setPickerOpen(true);
    if (addresses === null) {
      setLoadingAddresses(true);
      const res = await fetch("/api/addresses");
      if (res.ok) setAddresses(await res.json());
      else setAddresses([]);
      setLoadingAddresses(false);
    }
  };

  const productTotal = items.reduce((sum, i) => (i.kind === "PRODUCT" && i.product ? sum + i.product.price * i.quantity : sum), 0);
  const count = items.length;
  const area = deliveryArea(userAddress);

  return (
    <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3" style={{ background: "#fffaf0" }}>
      <div className="min-w-0">
        <h1><BrandLogo variant="wordmark" className="h-8 w-auto" /></h1>
        <button onClick={openPicker} className="mt-1 flex items-center gap-1 text-[11px] max-w-full tap-scale" aria-label="Change delivery address">
          <MapPin size={11} color="#6e1e3b" className="shrink-0" />
          <span className="truncate" style={{ color: "#5e4752" }}>
            {area ? <>Deliver to <b style={{ ...H, color: "#3d1426" }}>{area}</b></> : <b style={{ ...H, color: "#6e1e3b" }}>Set delivery address</b>}
          </span>
          <ChevronDown size={12} color="#5e4752" className="shrink-0" />
        </button>
      </div>

      <Link
        ref={cartRef}
        href="/cart"
        data-cart-target
        aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
        className="shrink-0 inline-flex items-center gap-2 h-11 pl-3 pr-3.5 rounded-full tap-scale"
        style={{ background: "#6e1e3b", color: "white", boxShadow: "0 8px 18px -8px rgba(110,30,59,0.55)" }}
      >
        <span className="relative">
          <ShoppingBag size={18} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center overflow-hidden" style={{ background: "#f9dd8a", color: "#3d1426", border: "2px solid #6e1e3b" }}>
              <span key={count} className="num-roll">{count}</span>
            </span>
          )}
        </span>
        {productTotal > 0 ? (
          <span className="text-sm font-bold overflow-hidden" style={H}>
            <span key={productTotal} className="num-roll">₹{(productTotal / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </span>
        ) : (
          <span className="text-sm font-bold" style={H}>Cart</span>
        )}
      </Link>

      {pickerOpen && !loadingAddresses && (
        <LocationPickerModal addresses={addresses ?? []} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
