import Link from "next/link";
import {
  PawPrint, Scissors, GraduationCap, Home as HomeIcon, Stethoscope, ShoppingBag,
  ShoppingCart, Heart, Star, ShieldCheck, ChevronRight, Sparkles, Calendar,
  RotateCcw, Clock, TrendingDown, Zap, Package,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import { derivePassportNumber } from "@/lib/passportId";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};
const SERVICE_ICON: Record<string, any> = { WALKING: PawPrint, SITTING: HomeIcon, GROOMING: Scissors, TRAINING: GraduationCap };
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", SITTING: "/sitting", GROOMING: "/grooming", TRAINING: "/training" };

const QUICK_LINKS = [
  { label: "Walk", icon: PawPrint, href: "/walk-booking" },
  { label: "Spa", icon: Scissors, href: "/grooming" },
  { label: "Vet Care", icon: Stethoscope, href: "/owner/pets" },
  { label: "Training", icon: GraduationCap, href: "/training" },
];

type GroomingBundle = { id: string; name: string; startingPricePaise: number; providerName: string };
type TrainingBundle = { id: string; name: string; cadence: string; pricePaise: number; providerName: string };

export default function HomeReturningUserMobile({
  userName,
  activePet,
  cartCount,
  cartTotalPaise,
  pawPointsBalance,
  tier,
  upcomingBooking,
  rebookCandidate,
  lastGrooming,
  buyAgainProducts,
  wishlistItems,
  trustedProviders,
  userAddress,
  userPhone,
  activeProviderCount,
  groomingBundles,
  trainingBundles,
}: {
  userName: string;
  activePet: { id: string; name: string } | null;
  cartCount: number;
  cartTotalPaise: number;
  pawPointsBalance: number;
  tier: string;
  upcomingBooking: { type: string; startTime: Date; provider: { user: { name: string } } | null; pet: { name: string } | null } | null;
  rebookCandidate: { type: string; provider: { id: string; user: { name: string } } | null; pet: { name: string } | null } | null;
  lastGrooming: { startTime: Date; provider: { user: { name: string } } | null } | null;
  buyAgainProducts: { id: string; name: string; price: number; imageUrls: string[] }[];
  wishlistItems: { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[] }[];
  trustedProviders: { id: string; user: { name: string }; ratingAvg: number; bookingCount: number }[];
  userAddress: string | null;
  userPhone: string | null;
  // Real count of providers currently marked available — NOT live
  // GPS/dispatch, just Provider.isAvailableNow.
  activeProviderCount: number;
  groomingBundles: GroomingBundle[];
  trainingBundles: TrainingBundle[];
}) {
  const daysSinceGrooming = lastGrooming ? Math.floor((Date.now() - lastGrooming.startTime.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const passportNumber = activePet ? derivePassportNumber(activePet.id) : null;

  return (
    <div>
      <EmergencyButton />
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      <div className="px-4 pt-2">
        {/* Real live provider availability — a count, not GPS/dispatch */}
        {activeProviderCount > 0 && (
          <div className="rounded-full px-3 py-1.5 mb-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ background: "var(--panel-dark)", color: "white" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
            {activeProviderCount} pro{activeProviderCount === 1 ? "" : "s"} available now
          </div>
        )}

        <h1 className="text-xl font-bold mb-4">Welcome back, {userName.split(" ")[0]}{activePet ? ` & ${activePet.name}` : ""}</h1>

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
          <Link
            href={rebookCandidate.provider ? `${SERVICE_HREF[rebookCandidate.type]}` : "/walk-booking"}
            className="card mb-4 flex items-center justify-between tap-scale block"
          >
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

        {/* Quick links — real routes, no fake "available in 15m" claims */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_LINKS.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.label} href={q.href} className="flex flex-col items-center gap-1.5 tap-scale">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--cream)" }}>
                  <Icon size={20} color="var(--terracotta)" />
                </div>
                <span className="text-[11px] font-semibold text-center">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== Grooming & Training Bundles — real packages from your
          actual providers, no unbacked "Free Rescheduling"/"Concierge
          Vet" perks or fake discount percentages. ===== */}
      {(groomingBundles.length > 0 || trainingBundles.length > 0) && (
        <section className="px-4 mt-2 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} color="var(--terracotta)" />
            <h2 className="text-lg font-bold">Grooming &amp; Training Bundles</h2>
          </div>
          <div className="space-y-3">
            {groomingBundles.map((b) => (
              <Link key={b.id} href="/grooming" className="card flex items-center justify-between tap-scale block">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>Grooming · {b.providerName}</p>
                  <p className="font-semibold text-sm mt-0.5">{b.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>from ₹{(b.startingPricePaise / 100).toFixed(0)}</p>
                </div>
                <span className="btn-secondary text-xs shrink-0">Choose</span>
              </Link>
            ))}
            {trainingBundles.map((b) => (
              <Link key={b.id} href="/training" className="card flex items-center justify-between tap-scale block">
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

      {buyAgainProducts.length > 0 && (
        <section className="px-4 mt-2 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Buy Again in 1-Tap</h2>
            <Link href="/accessories" className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {buyAgainProducts.slice(0, 4).map((p) => {
              const photo = p.imageUrls[0];
              return (
                <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-full aspect-square" style={{ background: "var(--cream)" }}>
                    {photo && <img src={photo} alt={p.name} className="w-full h-full object-cover" />}
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

      <section className="px-4 mb-8">
        <Link href="/owner/wallet" className="rounded-2xl p-5 flex items-center justify-between tap-scale block" style={{ background: "var(--panel-dark)", color: "white" }}>
          <div className="flex items-center gap-3">
            <Sparkles size={20} color="var(--gold)" />
            <div>
              <p className="font-bold">{pawPointsBalance.toLocaleString("en-IN")} pts</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{tier} tier</p>
            </div>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
        </Link>
      </section>

      {wishlistItems.length > 0 && (
        <section className="px-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} color="var(--terracotta)" />
            <h2 className="text-lg font-bold">Saved to Your Wishlist</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {wishlistItems.slice(0, 2).map((p) => {
              const photo = p.imageUrls[0];
              const priceDropped = p.compareAtPrice != null && p.compareAtPrice > p.price;
              return (
                <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-full aspect-square relative" style={{ background: "var(--cream)" }}>
                    {photo && <img src={photo} alt={p.name} className="w-full h-full object-cover" />}
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

      {trustedProviders.length > 0 && (
        <section className="px-4 mb-8">
          <h2 className="text-lg font-bold mb-3">Your Trusted Circle</h2>
          <div className="space-y-3">
            {trustedProviders.slice(0, 2).map((p) => (
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

      {activePet && passportNumber && (
        <section className="px-4 mb-8">
          <Link href={`/owner/pets/${activePet.id}`} className="rounded-2xl p-5 flex items-center justify-between tap-scale block" style={{ background: "var(--panel-dark)", color: "white" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Everything your dog needs, from birth to death.</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>One ecosystem. Zero friction.</p>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>Paw Passport #{passportNumber}</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </Link>
        </section>
      )}

      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold flex items-center gap-2"><Calendar size={16} color="var(--terracotta)" /> Community Events</h2>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>Coming Soon</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Local pack walks and meetups — RSVP and event details still being built.</p>
        <div className="card opacity-60">
          <p className="font-semibold text-sm">Local dog meetups</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Details coming soon</p>
        </div>
      </section>

      <section className="px-4 mb-8">
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{tier} Membership</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Concierge: 1800-XXXXXX (placeholder)</p>
          </div>
          <Link href="/owner/wallet" className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>Wallet →</Link>
        </div>
      </section>
    </div>
  );
}