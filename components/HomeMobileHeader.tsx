"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Sparkles, ShoppingBag, User, Search, Navigation, ChevronDown } from "lucide-react";
import LocationPickerModal from "@/components/LocationPickerModal";

const H = { fontFamily: "var(--font-heading)" } as const;

type Address = { id: string; label: string; fullAddress: string; receiverName: string; receiverPhone: string; isDefault: boolean };

export default function HomeMobileHeader({
  userAddress,
  userPhone,
  cartCount,
  pawPointsBalance,
}: {
  userAddress: string | null;
  userPhone: string | null;
  cartCount: number;
  pawPointsBalance: number;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const addressLabel = userAddress ? userAddress.split(",")[0] : "Home";
  const addressRest = userAddress ? userAddress.split(",").slice(1).join(",").trim() : "Add your address";

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

  // Real search hand-off — the moment this field is tapped/focused, it
  // opens the actual /search page (real debounced /api/search results,
  // real recent-searches, real trending chips) rather than trying to
  // duplicate any of that logic here. All real typing and suggestions
  // happen on that page, not in this header.
  const openSearch = () => router.push("/search");


  return (
    <header className="max-w-6xl mx-auto pt-safe" style={{ background: "rgba(255,250,240,0.95)", borderBottom: "1px solid rgba(227,207,196,0.2)" }}>
      <div className="px-4 pt-2.5 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-1.5">
            <BrandLogo variant="monogram" className="h-9 w-auto" alt="" />
            <BrandLogo variant="wordmark" className="h-8 w-auto" />
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={openSearch} className="w-8 h-8 rounded-full flex items-center justify-center tap-scale" style={{ background: "#fbf0d9", border: "1px solid rgba(227,207,196,0.3)", color: "#2a0c18" }} aria-label="Search">
              <Search size={16} />
            </button>
            {user && (
              <Link href="/owner/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tap-scale" style={{ background: "#f9dd8a", ...H, color: "#3d1426" }}>
                <Sparkles size={12} color="#6e1e3b" />
                {pawPointsBalance.toLocaleString("en-IN")} pts
              </Link>
            )}
            <Link href="/cart" className="relative w-8 h-8 rounded-full flex items-center justify-center tap-scale" style={{ background: "#fbf0d9", border: "1px solid rgba(227,207,196,0.3)", color: "#2a0c18" }} aria-label="Cart">
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#6e1e3b", color: "white", ...H }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/owner/profile" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 tap-scale overflow-hidden" style={{ background: "#6e1e3b" }}>
              {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User size={15} color="white" />}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={openPicker} className="flex items-center gap-1.5 min-w-0 tap-scale">
            <Navigation size={15} color="#6e1e3b" className="shrink-0" />
            <span className="font-bold text-xs truncate" style={{ ...H, color: "#2a0c18" }}>{addressLabel}</span>
            <span className="text-xs shrink-0" style={{ color: "#735c68" }}>•</span>
            <span className="text-xs truncate" style={{ color: "#5e4752" }}>{addressRest}</span>
            <ChevronDown size={14} color="#5e4752" className="shrink-0" />
          </button>
          <button onClick={openPicker} className="shrink-0 text-xs font-bold tap-scale" style={{ color: "#6e1e3b" }}>
            CHANGE
          </button>
        </div>

      </div>

      {pickerOpen && !loadingAddresses && (
        <LocationPickerModal addresses={addresses ?? []} onClose={() => setPickerOpen(false)} />
      )}
    </header>
  );
}