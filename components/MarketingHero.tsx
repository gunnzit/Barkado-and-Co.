"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { User, ShoppingBag, Sparkles, MapPin, ShieldCheck, Star, ChevronRight, Gift } from "lucide-react";
import CuratedSearchBar from "./CuratedSearchBar";
import CategoryTabs from "./CategoryTabs";
import HeroImageRotator from "./HeroImageRotator";

export default function MarketingHero({
  verifiedCount,
  avgRating,
  completedAgg,
  activeBreed,
}: {
  verifiedCount: number;
  avgRating: number | null;
  completedAgg: number;
  activeBreed?: string;
}) {
  const { openSignIn } = useClerk();

  return (
    <>
      {/* ===== Top bar: logo+tagline left, profile → cart → points right ===== */}
      <nav className="flex justify-between items-center px-4 sm:px-6 pt-3 sm:pt-4 pb-2 max-w-6xl mx-auto">
        <div className="flex flex-col">
          <span className="font-extrabold text-base leading-tight">Barkado &amp; Co.</span>
          {/* Real established brand tagline — the mockup's own "Artisanal
              Canine Care" wording isn't documented anywhere else, so using
              the real one instead. Swap this line if you want it literal. */}
          <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
            Everything a dog needs, from birth to death
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSignIn()}
            className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: "1px solid var(--border)" }}
            aria-label="Sign in"
          >
            <User size={16} color="var(--terracotta)" />
          </button>
          <Link
            href="/cart"
            className="tap-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <ShoppingBag size={16} color="var(--muted)" />
          </Link>
          {/* Signed-out — no real balance exists yet, so this shows an
              honest 0 rather than a fabricated number. */}
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Sparkles size={13} color="var(--gold)" />
            0 <span className="font-medium" style={{ color: "var(--muted)" }}>pts</span>
          </span>
        </div>
      </nav>

      {/* ===== Location row — real click target, opens sign-in since a
          signed-out visitor has no address to set yet ===== */}
      <button
        onClick={() => openSignIn()}
        className="w-full flex items-center gap-1.5 px-4 sm:px-6 py-2 max-w-6xl mx-auto text-left tap-scale"
      >
        <MapPin size={14} color="var(--terracotta)" />
        <span className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>Set delivery &amp; service location</span>
        <ChevronRight size={12} color="var(--terracotta)" />
      </button>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-3">
        <CuratedSearchBar />
      </div>

      <CategoryTabs />

      {/* ===== Hero ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-3 grid md:grid-cols-2 gap-4 md:gap-10 items-center">
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {avgRating !== null && avgRating > 0 && (
              <span className="trust-chip">
                <Star size={12} fill="var(--gold)" color="var(--gold)" /> {avgRating.toFixed(1)} average
              </span>
            )}
            {verifiedCount > 0 && (
              <span className="trust-chip">
                <ShieldCheck size={12} /> {verifiedCount} Local Provider{verifiedCount === 1 ? "" : "s"}
              </span>
            )}
            <span className="trust-chip">Zero Cancellation Fees</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1.5 leading-tight">
            Everything your dog needs,
            <br />
            from birth to death.
            <br />
            <span style={{ color: "var(--terracotta)" }}>One ecosystem.</span>
          </h1>
          <p className="text-xs sm:text-sm mb-3 max-w-md" style={{ color: "var(--muted)" }}>
            Boutique walks, vetted grooming spas, wellness records &amp; artisan gear — vetted forever.
          </p>
          <div className="flex gap-2.5 mb-3">
            <button onClick={() => openSignIn()} className="btn-primary text-sm whitespace-nowrap tap-scale">Book First Service</button>
            <button onClick={() => openSignIn()} className="btn-secondary text-sm whitespace-nowrap tap-scale">Create Free Paw Passport</button>
          </div>
          {completedAgg > 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>{completedAgg} bookings completed · Verified handlers</p>
          )}
        </div>

        <div className="relative">
          <HeroImageRotator activeBreed={activeBreed} />
          {/* Welcome Gift banner — copy only, not wired to a real signup
              bonus amount. Kept per explicit instruction, "for now". */}
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white tap-scale"
            style={{ background: "linear-gradient(135deg, #e8a94a 0%, #c97a56 100%)" }}
          >
            <Gift size={13} /> Welcome Gift: 100 Bonus PawPoints
          </div>
        </div>
      </section>
    </>
  );
}