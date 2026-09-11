"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, ShoppingBag, User, Search, Mic } from "lucide-react";
import LocationHeader from "@/components/LocationHeader";

const H = { fontFamily: "var(--font-heading)" } as const;

// NOTE: the mockup's location row ("Home • Indiranagar 5th Main...
// Change") is rebuilt here using the REAL LocationHeader component
// rather than a custom lookalike row — I don't have LocationHeader's
// internals, so duplicating its UI risked either guessing wrong or
// silently breaking real address switching. If LocationHeader's own
// rendered output doesn't match the mockup's exact pill/chevron styling,
// paste that file and I'll adjust it to match, instead of working around
// it from the outside.
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

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe max-w-6xl mx-auto lg:relative lg:pt-0" style={{ background: "rgba(251,250,238,0.95)", backdropFilter: "blur(20px)", boxShadow: "0 4px 20px rgba(22,40,31,0.04)", borderBottom: "1px solid rgba(194,200,194,0.2)" }}>
      <div className="px-4 pt-2.5 pb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-extrabold text-[21px] tracking-tight" style={{ ...H, color: "#02120a" }}>
              Barkado <span className="font-normal italic text-lg" style={{ fontFamily: "serif", color: "#904c2c" }}>&amp; Co.</span>
            </h1>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#904c2c" }} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/owner/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tap-scale" style={{ background: "#e9e9dd", border: "1px solid rgba(194,200,194,0.4)", ...H, color: "#02120a" }}>
              <Sparkles size={13} color="#fcba5a" />
              {pawPointsBalance.toLocaleString("en-IN")} PTS
            </Link>
            <Link href="/cart" className="relative w-8 h-8 rounded-full flex items-center justify-center tap-scale" style={{ background: "#f5f4e8", border: "1px solid rgba(194,200,194,0.3)", color: "#02120a" }} aria-label="Cart">
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#904c2c", color: "white", ...H }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/owner/profile" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 tap-scale overflow-hidden" style={{ background: "#02120a" }}>
              {user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User size={15} color="white" />}
            </Link>
          </div>
        </div>

        <LocationHeader currentAddressSnippet={userAddress ? userAddress.split(",")[0] : null} userPhone={userPhone} />

        <div className="relative flex items-center w-full h-10 rounded-xl px-3" style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(22,40,31,0.03)", border: "1px solid rgba(194,200,194,0.3)" }}>
          <Search size={18} color="#424844" className="mr-2 shrink-0" />
          <input
            className="w-full bg-transparent text-xs placeholder:text-[#737874] focus:outline-none truncate"
            placeholder="Search 'dog walking in 15m', 'puppy food', 'spa van'..."
            readOnly
          />
          <div className="flex items-center gap-1.5 pl-2 shrink-0" style={{ borderLeft: "1px solid rgba(194,200,194,0.3)" }}>
            <Mic size={17} color="#904c2c" />
          </div>
        </div>
      </div>
    </header>
  );
}