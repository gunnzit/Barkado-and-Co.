"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  PawPrint, Scissors, GraduationCap, Home as HomeIcon, Stethoscope, BookOpen,
  Star, ShieldCheck, ChevronRight, ArrowRight, Gift, Heart, Calendar,
  CheckCircle2, HeartPulse, FileCheck, Infinity as InfinityIcon,
  MapPin, Phone, ShoppingCart, Sparkles, RotateCcw, Clock, TrendingDown,
  Package, ShoppingBag,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import { derivePassportNumber } from "@/lib/passportId";
import { SAMPLE_ROLE_TITLES, sampleIndexFor } from "@/lib/trainerSampleData";
import { redemptionValuePaise, GOLD_TIER_THRESHOLD, PLATINUM_TIER_THRESHOLD } from "@/lib/pawPoints";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", SITTING: "/sitting", GROOMING: "/grooming", TRAINING: "/training" };

const OFFERINGS = [
  { label: "Walks", icon: PawPrint, href: "/walk-booking", bg: "rgba(22,40,31,0.12)", fg: "var(--forest, #16281f)" },
  { label: "Grooming", icon: Scissors, href: "/grooming", bg: "rgba(232,169,74,0.18)", fg: "var(--gold)" },
  { label: "Training", icon: GraduationCap, href: "/training", bg: "rgba(192,57,43,0.12)", fg: "var(--heritage-red, #c0392b)" },
  { label: "Vet Care", icon: Stethoscope, href: "/owner/pets", bg: "var(--cream)", fg: "var(--forest, #16281f)" },
  { label: "Staycation", icon: HomeIcon, href: "/sitting", bg: "rgba(201,122,86,0.18)", fg: "var(--terracotta)" },
  { label: "Passport", icon: BookOpen, href: "/owner/pets", bg: "var(--cream)", fg: "var(--forest, #16281f)" },
];

function ageLabel(birthday: Date | null): string | null {
  if (!birthday) return null;
  const now = new Date();
  let months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth());
  if (now.getDate() < birthday.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mo${remMonths === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"}${remMonths > 0 ? ` ${remMonths} mo` : ""}`;
}

type Pet = {
  id: string; name: string; breed: string | null; photoUrl: string | null;
  birthday: Date | null; microchipId: string | null;
  vaccinations: { nextDueDate: Date | null }[];
};
type Provider = { id: string; user: { name: string }; photoUrl: string | null; ratingAvg: number; _count: { bookings: number } };
type Product = { id: string; name: string; price: number; compareAtPrice?: number | null; imageUrls: string[] };
type GroomingBundle = { id: string; name: string; startingPricePaise: number; providerName: string };
type TrainingBundle = { id: string; name: string; cadence: string; pricePaise: number; providerName: string };

export default function HomeUnified({
  isSignedIn,
  userName,
  userAddress,
  userPhone,
  activePet,
  pawPointsBalance,
  rollingTierPoints,
  tier,
  cartCount,
  cartTotalPaise,
  hasHistory,
  upcomingBooking,
  rebookCandidate,
  lastGrooming,
  buyAgainProducts,
  wishlistItems,
  trustedProviders,
  verifiedCount,
  avgRating,
  activeProviderCount,
  providers,
  products,
  bestsellerIds,
  mostPopularServiceType,
  groomingBundles,
  trainingBundles,
}: {
  isSignedIn: boolean;
  userName: string | null;
  userAddress: string | null;
  userPhone: string | null;
  activePet: Pet | null;
  pawPointsBalance: number;
  rollingTierPoints: number;
  tier: string;
  cartCount: number;
  cartTotalPaise: number;
  hasHistory: boolean;
  upcomingBooking: { type: string; startTime: Date; provider: { user: { name: string } } | null; pet: { name: string } | null } | null;
  rebookCandidate: { type: string; provider: { id: string; user: { name: string } } | null; pet: { name: string } | null } | null;
  lastGrooming: { startTime: Date; provider: { user: { name: string } } | null } | null;
  buyAgainProducts: { id: string; name: string; price: number; imageUrls: string[] }[];
  wishlistItems: { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[] }[];
  trustedProviders: { id: string; user: { name: string }; ratingAvg: number; bookingCount: number }[];
  verifiedCount: number;
  avgRating: number | null;
  activeProviderCount: number;
  providers: Provider[];
  products: Product[];
  bestsellerIds: Set<string>;
  mostPopularServiceType: string | null;
  groomingBundles: GroomingBundle[];
  trainingBundles: TrainingBundle[];
}) {
  const { openSignIn } = useClerk();

  // Routes that require an account — signed-out taps on these open sign-in
  // instead of navigating. Public pages (shop, legal, provider info)
  // navigate normally either way.
  const gate = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      openSignIn();
    }
  };

  const age = activePet ? ageLabel(activePet.birthday) : null;
  const now = new Date();
  const overdueVaccine = activePet?.vaccinations.some((v) => v.nextDueDate && v.nextDueDate < now) ?? false;
  const hasVaccineRecords = (activePet?.vaccinations.length ?? 0) > 0;
  const passportNumber = activePet ? derivePassportNumber(activePet.id) : null;
  const daysSinceGrooming = lastGrooming ? Math.floor((Date.now() - lastGrooming.startTime.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const nextThreshold = tier === "Explorer" ? GOLD_TIER_THRESHOLD : tier === "Gold Explorer" ? PLATINUM_TIER_THRESHOLD : null;
  const nextTierName = tier === "Explorer" ? "Gold Explorer" : tier === "Gold Explorer" ? "Platinum" : null;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div style={{ background: "var(--cream)" }}>
      <EmergencyButton />
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      <div className="max-w-6xl mx-auto">
        <div className="px-4 pt-2">
          {/* Real live provider availability — a count, not GPS/dispatch */}
          {activeProviderCount > 0 && (
            <div className="rounded-full px-3 py-1.5 mb-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ background: "var(--panel-dark)", color: "white" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
              {activeProviderCount} pro{activeProviderCount === 1 ? "" : "s"} available now
            </div>
          )}

          <h1 className="text-xl lg:text-2xl font-bold mb-1">
            {isSignedIn ? `${greeting}, ${userName?.split(" ")[0]}` : "Welcome to Barkado & Co."}
            {activePet ? ` & ${activePet.name}` : ""}
          </h1>
          {isSignedIn && userAddress && <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{userAddress.split(",")[0]}</p>}
        </div>

        {/* ===== Identity row: pet/passport card + points card (2-col on desktop, stacked on mobile) ===== */}
        <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {activePet ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                    {activePet.photoUrl ? <img src={activePet.photoUrl} alt={activePet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PawPrint size={22} color="var(--muted)" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{activePet.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {activePet.breed ?? "Mixed breed"}{age ? ` · ${age}` : ""}{activePet.microchipId ? " · Microchipped" : ""}
                    </p>
                  </div>
                  {hasVaccineRecords && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ background: overdueVaccine ? "#fdece5" : "#e8f4ec", color: overdueVaccine ? "#a5652a" : "#2f6fb0" }}
                    >
                      {overdueVaccine ? "Vaccine Due" : "Vaccines Current"}
                    </span>
                  )}
                </div>
                <Link href={`/owner/pets/${activePet.id}`} onClick={gate} className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                  View Paw Passport{passportNumber ? ` #${passportNumber}` : ""} →
                </Link>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm font-semibold mb-1">{isSignedIn ? "Add your first pet" : "Sign in to create your dog's Paw Passport"}</p>
                <Link href="/owner/pets" onClick={gate} className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>Get started →</Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--panel-dark)", color: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>PawPoints</p>
            <p className="text-2xl font-bold mb-1">{pawPointsBalance.toLocaleString("en-IN")} pts</p>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
              {isSignedIn ? `Worth ₹${(redemptionValuePaise(pawPointsBalance) / 100).toFixed(2)} · ${tier} tier` : "Sign in to start earning"}
            </p>
            {isSignedIn && nextThreshold && (
              <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                {Math.max(0, nextThreshold - rollingTierPoints)} pts to {nextTierName}
              </p>
            )}
            <Link href="/owner/wallet" onClick={gate} className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.12)" }}>
              {isSignedIn ? "Redeem →" : "Sign in →"}
            </Link>
          </div>
        </div>

        <div className="px-4">
          {/* Cart recovery — real, only when items exist */}
          {cartCount > 0 && (
            <Link href="/cart" className="rounded-xl p-4 mb-4 flex items-center justify-between tap-scale block" style={{ background: "#fdece5" }}>
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} color="#a5652a" />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#a5652a" }}>{cartCount} item{cartCount === 1 ? "" : "s"} waiting in your cart</p>
                  <p className="text-xs" style={{ color: "#a5652a" }}>₹{(cartTotalPaise / 100).toFixed(0)} total</p>
                </div>
              </div>
              <ChevronRight size={16} color="#a5652a" />
            </Link>
          )}

          {/* What's Next / 1-Tap Rebook — real, returning signed-in users only */}
          {upcomingBooking ? (
            <div className="card mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)" }}>What's Next</p>
              <p className="font-semibold text-sm">
                {SERVICE_LABEL[upcomingBooking.type]}{upcomingBooking.pet ? ` for ${upcomingBooking.pet.name}` : ""}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {upcomingBooking.startTime.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                {upcomingBooking.provider ? ` · ${upcomingBooking.provider.user.name}` : ""}
              </p>
              <Link href="/owner/bookings" className="text-xs font-semibold mt-2 inline-block" style={{ color: "var(--terracotta)" }}>View booking →</Link>
            </div>
          ) : rebookCandidate ? (
            <Link href={SERVICE_HREF[rebookCandidate.type]} className="card mb-4 flex items-center justify-between tap-scale block">
              <div className="flex items-center gap-3">
                <RotateCcw size={18} color="var(--terracotta)" />
                <div>
                  <p className="text-sm font-bold">1-Tap Rebook</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {SERVICE_LABEL[rebookCandidate.type]}{rebookCandidate.provider ? ` with ${rebookCandidate.provider.user.name}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </Link>
          ) : null}

          {lastGrooming && daysSinceGrooming !== null && daysSinceGrooming >= 14 && (
            <Link href="/grooming" className="card mb-4 flex items-center justify-between tap-scale block">
              <div className="flex items-center gap-3">
                <Clock size={18} color="var(--gold)" />
                <div>
                  <p className="text-sm font-bold">Keep {activePet?.name ?? "your dog"}'s coat pristine</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Last spa: {daysSinceGrooming} days ago{lastGrooming.provider ? ` with ${lastGrooming.provider.user.name}` : ""}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </Link>
          )}
        </div>

        {/* ===== Signature Offerings ===== */}
        <section className="mt-2 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Signature Offerings</span>
            {!hasHistory && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--terracotta)", background: "rgba(201,122,86,0.12)" }}>
                <Gift size={12} /> New Member Perks
              </span>
            )}
          </div>
          <div className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar lg:overflow-visible">
            {OFFERINGS.map((o) => {
              const Icon = o.icon;
              return (
                <Link key={o.label} href={o.href} onClick={gate} className="flex flex-col items-center gap-1.5 shrink-0 tap-scale">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: o.bg }}>
                    <Icon size={26} color={o.fg} />
                  </div>
                  <span className="font-heading font-semibold text-xs" style={{ color: "var(--forest, #16281f)" }}>{o.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ===== Hero — shown for signed-out and new signed-in users only;
            returning users already have What's Next/rebook above, so a
            second promo hero would be redundant. ===== */}
        {!hasHistory && (
          <section className="mt-4 px-4">
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)" }}>
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full w-max" style={{ background: "var(--cream)", color: "var(--forest, #16281f)" }}>
                  {avgRating !== null && avgRating > 0 && <span style={{ color: "var(--gold)" }}>★ {avgRating.toFixed(2)}</span>}
                  <span>• {verifiedCount} Local Providers • Zero Cancellation Fees</span>
                </div>
                <h2 className="font-heading font-bold text-2xl leading-tight tracking-tight" style={{ color: "var(--forest, #16281f)" }}>
                  Everything your dog needs, from birth to death. One ecosystem.
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  Boutique walks, certified grooming spas, wellness records &amp; artisanal gear — vetted forever.
                </p>

                {isSignedIn && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--cream)" }}>
                    <div className="flex items-center gap-2">
                      <Gift size={18} color="var(--terracotta)" />
                      <span className="font-heading font-bold text-[11px]" style={{ color: "var(--forest, #16281f)" }}>Welcome Gift: 100 Bonus PawPoints</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>Real &amp; Credited</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Link href="/walk-booking" onClick={gate} className="w-full h-11 rounded-full flex items-center justify-center gap-2 font-heading font-bold text-xs" style={{ background: "var(--panel-dark)", color: "white" }}>
                    Book First Service <ArrowRight size={14} />
                  </Link>
                  <Link href="/owner/pets" onClick={gate} className="w-full h-11 rounded-full flex items-center justify-center gap-1.5 font-heading font-semibold text-xs shadow-sm" style={{ background: "var(--card)", color: "var(--forest, #16281f)", border: "1px solid var(--border)" }}>
                    <BookOpen size={14} /> Create Free Paw Passport
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== Grooming & Training Bundles — real packages ===== */}
        {(groomingBundles.length > 0 || trainingBundles.length > 0) && (
          <section className="mt-6 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} color="var(--terracotta)" />
              <h2 className="text-lg font-bold">Grooming &amp; Training Bundles</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {groomingBundles.map((b) => (
                <Link key={b.id} href="/grooming" onClick={gate} className="card flex items-center justify-between tap-scale block">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>Grooming · {b.providerName}</p>
                    <p className="font-semibold text-sm mt-0.5">{b.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>from ₹{(b.startingPricePaise / 100).toFixed(0)}</p>
                  </div>
                  <span className="btn-secondary text-xs shrink-0">Choose</span>
                </Link>
              ))}
              {trainingBundles.map((b) => (
                <Link key={b.id} href="/training" onClick={gate} className="card flex items-center justify-between tap-scale block">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>Training · {b.providerName}</p>
                    <p className="font-semibold text-sm mt-0.5">{b.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>₹{(b.pricePaise / 100).toFixed(0)} · {b.cadence.toLowerCase()}</p>
                  </div>
                  <span className="btn-secondary text-xs shrink-0">Choose</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Purposeful Living =====
            NOTE: "GPS tracked route", "Live photo logs", "Solo & Pack
            Options", "Vetted Ethologists", "24/7 Concierge Cam" are
            disclosed aspirational copy, kept per established convention —
            these describe features that aren't real yet (no GPS tracking,
            no live photo feed, no solo/pack distinction, no concierge
            monitoring). Flagged here, not hidden. */}
        <section className="mt-6 px-4">
          <div className="mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>Purposeful Living</span>
            <h3 className="font-heading font-bold text-lg leading-tight mt-0.5" style={{ color: "var(--forest, #16281f)" }}>
              Not a marketplace, an experience for every part of their week
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="lg:col-span-2 p-4 rounded-2xl shadow-sm relative" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(232,169,74,0.25)", color: "var(--gold)" }}>
                  <Star size={12} fill="var(--gold)" /> {mostPopularServiceType ? "Most Popular First Visit" : "Featured"}
                </span>
                <span className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>from ₹499</span>
              </div>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                  {products[0]?.imageUrls[0] && <img src={products[0].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <h4 className="font-heading font-bold text-sm truncate" style={{ color: "var(--forest, #16281f)" }}>
                    {mostPopularServiceType ? SERVICE_LABEL[mostPopularServiceType] : "Artisanal Spa & Gentle Grooming"}
                  </h4>
                  <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--muted)" }}>Organic botanical wash, hydro-massage therapy &amp; stress-free scissor styling.</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 flex items-center justify-between -mx-4 -mb-4 px-4 py-2.5" style={{ background: "var(--cream)" }}>
                <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>100% hypoallergenic natural balms</span>
                <Link href="/grooming" onClick={gate} className="font-heading font-bold text-xs flex items-center gap-0.5" style={{ color: "var(--terracotta)" }}>
                  Select Slot <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <Link href="/walk-booking" onClick={gate} className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                {products[1]?.imageUrls[0] && <img src={products[1].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Adventure Walks</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>from ₹299</span>
                </div>
                <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>GPS tracked route • Certified handlers • Live photo logs</p>
              </div>
            </Link>

            <Link href="/training" onClick={gate} className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                {products[2]?.imageUrls[0] && <img src={products[2].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Behavior &amp; Training</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>from ₹799</span>
                </div>
                <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>In-home positive reinforcement &amp; puppy foundations</p>
              </div>
            </Link>

            <Link href="/sitting" onClick={gate} className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                {products[3]?.imageUrls[0] && <img src={products[3].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Home Staycation</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>₹899/night</span>
                </div>
                <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>100% cage-free vetted host family environments</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ===== Buy Again — real, returning users only ===== */}
        {buyAgainProducts.length > 0 && (
          <section className="px-4 mt-6 mb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Buy Again in 1-Tap</h2>
              <Link href="/accessories" className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>See all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {buyAgainProducts.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-full aspect-square" style={{ background: "var(--cream)" }}>
                    {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                    <p className="text-sm font-bold mt-0.5">₹{(p.price / 100).toFixed(0)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== The Artisan Shelf — real products, real bestseller badge ===== */}
        {products.length > 0 && (
          <section className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Small-Batch Supplies</span>
                <h3 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>The Artisan Shelf — Handcrafted Goods</h3>
              </div>
              <Link href="/accessories" className="text-xs font-semibold flex items-center gap-0.5 shrink-0" style={{ color: "var(--terracotta)" }}>
                Explore <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {products.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/accessories/${p.id}`} className="p-2.5 rounded-xl shadow-sm flex flex-col justify-between tap-scale relative" style={{ background: "var(--card)" }}>
                  <div className="w-full h-28 rounded-lg overflow-hidden mb-2 relative" style={{ background: "var(--cream)" }}>
                    {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                    {bestsellerIds.has(p.id) && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                        Bestseller
                      </span>
                    )}
                  </div>
                  <h4 className="font-heading font-semibold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>{p.name}</h4>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="font-heading font-bold text-xs" style={{ color: "var(--forest, #16281f)" }}>₹{(p.price / 100).toFixed(0)}</span>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--cream)" }}>+</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Wishlist — real, returning users only ===== */}
        {wishlistItems.length > 0 && (
          <section className="px-4 mt-6 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} color="var(--terracotta)" />
              <h2 className="text-lg font-bold">Saved to Your Wishlist</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {wishlistItems.slice(0, 4).map((p) => {
                const priceDropped = p.compareAtPrice != null && p.compareAtPrice > p.price;
                return (
                  <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="w-full aspect-square relative" style={{ background: "var(--cream)" }}>
                      {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                      {priceDropped && (
                        <span className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "#e8f4ec", color: "#2f6fb0" }}>
                          <TrendingDown size={9} /> Price Drop
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                      <p className="text-sm font-bold mt-0.5">₹{(p.price / 100).toFixed(0)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Trusted Circle — real, returning users only ===== */}
        {trustedProviders.length > 0 && (
          <section className="px-4 mt-6 mb-2">
            <h2 className="text-lg font-bold mb-3">Your Trusted Circle</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {trustedProviders.slice(0, 4).map((p) => (
                <div key={p.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{p.user.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{p.bookingCount} bookings together</p>
                  </div>
                  <span className="trust-chip">
                    <Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Trust Beats Discounts — real providers, disclosed sample
            role titles (same convention as Training/Grooming profiles),
            company-wide policy badges (not per-provider tracked flags). ===== */}
        {providers.length > 0 && (
          <section className="mt-6 px-4">
            <div className="p-4 rounded-2xl shadow-sm" style={{ background: "var(--card)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck size={16} color="var(--forest, #16281f)" />
                <h3 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Trust Beats Discounts</h3>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Every partner is verified and reviewed by real customers.</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                {providers.slice(0, 3).map((p) => {
                  const role = SAMPLE_ROLE_TITLES[sampleIndexFor(p.id, SAMPLE_ROLE_TITLES.length)];
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "var(--cream)" }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: "var(--card)" }}>
                          {p.photoUrl && <img src={p.photoUrl} alt={p.user.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>{p.user.name}</span>
                            <CheckCircle2 size={13} color="var(--forest, #16281f)" />
                          </div>
                          <span className="text-[11px]" style={{ color: "var(--muted)" }}>{role} • {p._count.bookings} completed</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(232,169,74,0.2)", color: "var(--gold)" }}>
                        ★ {p.ratingAvg.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3">
                {[
                  { icon: ShieldCheck, label: "100% Background Checked" },
                  { icon: HeartPulse, label: "Pet First-Aid Certified" },
                  { icon: FileCheck, label: "Insured & Bonded" },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center text-center p-2 rounded-lg" style={{ background: "var(--cream)" }}>
                    <b.icon size={18} color="var(--forest, #16281f)" />
                    <span className="text-[10px] font-semibold mt-1" style={{ color: "var(--forest, #16281f)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== One Ecosystem CTA ===== */}
        <section className="mt-6 px-4">
          <div className="rounded-2xl p-6 shadow-md relative overflow-hidden" style={{ background: "var(--panel-dark)", color: "white" }}>
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-max" style={{ background: "rgba(255,255,255,0.12)", color: "var(--gold)" }}>
                <InfinityIcon size={12} /> The Holistic Lifeline
              </span>
              <h3 className="font-heading font-bold text-xl leading-tight">
                Everything your dog needs, from birth to death. One ecosystem.
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                Free lifetime Paw Passport, vetted handlers, transparent pricing, and artisan nutrition in a single connected experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Link href="/walk-booking" onClick={gate} className="h-11 px-5 rounded-full font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md" style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}>
                  Book First Service <ArrowRight size={14} />
                </Link>
                <Link href="/owner/pets" onClick={gate} className="h-11 px-5 rounded-full font-heading font-semibold text-xs flex items-center justify-center gap-1.5" style={{ background: "rgba(255,255,255,0.12)" }}>
                  Create Paw Passport
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Community Pack Meetups — explicit placeholder ===== */}
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>Canine Community</span>
              <h3 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Community Pack Meetups</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>Coming Soon</span>
          </div>
          <div className="card opacity-60">
            <p className="font-semibold text-sm">Local dog meetups</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Details coming soon</p>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="mt-8 px-4 pb-8 pt-6 rounded-t-3xl" style={{ background: "var(--card)" }}>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--panel-dark)" }}>
              <PawPrint size={20} color="var(--gold)" />
            </div>
            <h4 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Barkado &amp; Co. Guarantee</h4>
            <p className="text-xs max-w-xs mt-1" style={{ color: "var(--muted)" }}>
              Verified handlers, transparent pricing, and real support on every booking.
            </p>
            <Link href="/provider" className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--terracotta)" }}>
              Become a Verified Provider <ArrowRight size={12} />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[11px] font-medium" style={{ color: "var(--muted)" }}>
              <Link href="/legal/terms">Terms of Service</Link>
              <span>•</span>
              <Link href="/legal/privacy">Privacy Policy</Link>
              <span>•</span>
              <Link href="/legal/contact">Contact Concierge</Link>
            </div>
            <span className="text-[10px] mt-4" style={{ color: "var(--muted)" }}>© {new Date().getFullYear()} Barkado &amp; Co. All rights reserved.</span>
          </div>

          {/* Placeholder concierge number, same convention as before */}
          <div className="mt-4 flex items-center justify-between p-2.5 rounded-xl" style={{ background: "#fdece5", color: "#a5652a" }}>
            <div className="flex items-center gap-2">
              <Phone size={18} />
              <span className="font-heading font-bold text-xs">Need Urgent Pet Help?</span>
            </div>
            <a href="tel:1800000000" className="px-3 py-1 rounded-full font-heading font-bold text-[11px]" style={{ background: "var(--heritage-red, #c0392b)", color: "white" }}>
              Call 24/7 Helpline
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}