"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Sparkles, ShoppingBag, User } from "lucide-react";

// Reusable across every service booking page (Walk, Training, Grooming,
// Sitting) — the small uppercase "Barkado & Co." brand text plus real
// Points/Cart/Profile, matching the reference design exactly. Distinct
// from HomeMobileHeader (Home-only, larger brand name + search +
// categories) — this is deliberately lighter, no dog selector, no theme
// toggle, per explicit product decision.
export default function ServicePageTopBar({
  cartCount,
  pawPointsBalance,
}: {
  cartCount: number;
  pawPointsBalance: number;
}) {
  const { user } = useUser();

  return (
    <div className="px-5 py-2.5 flex items-center justify-between">
      <h1 className="text-[13px] tracking-wider uppercase font-extrabold" style={{ color: "var(--muted)" }}>Barkado &amp; Co.</h1>
      <div className="flex items-center gap-2.5">
        <Link
          href="/owner/wallet"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tap-scale"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--forest, #16281f)" }}
        >
          <Sparkles size={13} color="var(--gold)" />
          {pawPointsBalance} pts
        </Link>
        <Link
          href="/cart"
          className="relative w-8 h-8 rounded-full flex items-center justify-center tap-scale"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--forest, #16281f)" }}
          aria-label="Shopping Cart"
        >
          <ShoppingBag size={15} />
          {cartCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold"
              style={{ background: "var(--terracotta)", color: "white" }}
            >
              {cartCount}
            </span>
          )}
        </Link>
        <Link href="/owner/profile" className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "var(--panel-dark)", boxShadow: "0 0 0 2px rgba(232,169,74,0.4)" }}>
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={14} color="white" />
          )}
        </Link>
      </div>
    </div>
  );
}