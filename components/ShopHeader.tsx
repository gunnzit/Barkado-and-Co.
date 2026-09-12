"use client";

import { useState } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { Search, SlidersHorizontal, ShoppingBag, User, MapPin, ChevronDown } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import LocationPickerModal from "@/components/LocationPickerModal";

const H = { fontFamily: "var(--font-heading)" } as const;

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

export default function ShopHeader({
  userAddress,
  query,
  onQueryChange,
}: {
  userAddress: string | null;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const { items } = useCart();
  const [pawPointsBalance, setPawPointsBalance] = useState(0);
  useEffect(() => {
    fetch("/api/owner/pawpoints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPawPointsBalance(data.balance ?? 0))
      .catch(() => {});
  }, []);

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

  const cartTotal = items.reduce((sum, i) => (i.kind === "PRODUCT" && i.product ? sum + i.product.price * i.quantity : sum), 0);
  const addressLabel = userAddress ? userAddress.split(",")[0] : "Set location";

  return (
    <div className="px-4 pt-3 pb-3" style={{ background: "#fbfaee" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h1 className="font-extrabold text-lg" style={{ ...H, color: "#02120a" }}>Barkado &amp; Co.</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#ffdbcd", color: "#904c2c" }}>SHOP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#e9e9dd", color: "#02120a", ...H }}>
            <span style={{ color: "#904c2c" }}>●</span> {pawPointsBalance.toLocaleString("en-IN")} PTS
          </div>
          <Link href="/owner/profile" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#02120a" }}>
            <User size={15} color="white" />
          </Link>
        </div>
      </div>

      <button onClick={openPicker} className="flex items-center gap-1 text-xs mb-3 tap-scale">
        <MapPin size={12} color="#904c2c" />
        <span className="font-semibold" style={{ ...H, color: "#02120a" }}>{addressLabel}</span>
        <ChevronDown size={12} color="#424844" />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.3)" }}>
          <Search size={16} color="#737874" className="shrink-0" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search leashes, chews, bowls..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
          />
          <SlidersHorizontal size={15} color="#904c2c" className="shrink-0" />
        </div>
        <Link href="/cart" className="flex items-center gap-1.5 h-10 px-3 rounded-xl shrink-0" style={{ background: "#02120a", color: "white" }}>
          <span className="relative">
            <ShoppingBag size={16} />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#904c2c" }}>
                {items.length}
              </span>
            )}
          </span>
          <span className="text-xs font-bold" style={H}>₹{(cartTotal / 100).toFixed(0)}</span>
        </Link>
      </div>

      {pickerOpen && !loadingAddresses && (
        <LocationPickerModal addresses={addresses ?? []} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}