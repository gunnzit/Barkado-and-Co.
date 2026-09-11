"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Sparkles, ShoppingBag, User } from "lucide-react";
import LocationHeader from "@/components/LocationHeader";
import CuratedSearchBar from "@/components/CuratedSearchBar";

// Matches the reference design exactly: a fixed top bar (large brand name
// + small subtitle, then Points → Cart → Profile, in that exact order —
// confirmed explicitly), and a SEPARATE card below it containing the real
// location switcher and real search bar, reusing LocationHeader and
// CuratedSearchBar rather than reinventing them.
//
// Both rows are wrapped in the same max-w-6xl mx-auto container the rest
// of HomeUnified uses, so at desktop widths this header lines up with the
// content column below it instead of stretching edge-to-edge on its own.
// On mobile, max-w-6xl is wider than the viewport, so this has no visual
// effect there — same px-4 edge padding as before.
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
    <>
      <header className="px-4 py-2.5 flex items-center justify-between max-w-6xl mx-auto" style={{ background: "var(--cream)" }}>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-2xl tracking-tight" style={{ color: "var(--forest, #16281f)" }}>Barkado &amp; Co.</span>
          <span className="text-[11px] font-medium tracking-wide" style={{ color: "var(--muted)" }}>Artisanal Canine Care</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/owner/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tap-scale" style={{ background: "var(--card)", color: "var(--forest, #16281f)" }}>
            <Sparkles size={14} color="var(--gold)" />
            {pawPointsBalance}
          </Link>
          <Link href="/cart" className="w-9 h-9 flex items-center justify-center rounded-full relative tap-scale" style={{ color: "var(--forest, #16281f)" }} aria-label="Shopping Cart">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full flex items-center justify-center" style={{ background: "var(--terracotta)", color: "white" }}>
                {cartCount}
              </span>
            )}
          </Link>
          <Link href="/owner/profile" className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "var(--panel-dark)" }}>
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={18} color="white" />
            )}
          </Link>
        </div>
      </header>

      <section className="px-4 pt-3 pb-4 rounded-b-xl max-w-6xl mx-auto" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="mb-3">
          <LocationHeader currentAddressSnippet={userAddress ? userAddress.split(",")[0] : null} userPhone={userPhone} />
        </div>
        <CuratedSearchBar />
      </section>
    </>
  );
}