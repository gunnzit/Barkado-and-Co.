import Link from "next/link";
import {
  PawPrint, Scissors, GraduationCap, Home as HomeIcon, Stethoscope, ShoppingBag,
  ShoppingCart, Heart, Star, ShieldCheck, ChevronRight, Sparkles, Calendar,
  RotateCcw, Clock, TrendingDown,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import { derivePassportNumber } from "@/lib/passportId";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};
const SERVICE_ICON: Record<string, any> = { WALKING: PawPrint, SITTING: HomeIcon, GROOMING: Scissors, TRAINING: GraduationCap };
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", SITTING: "/sitting", GROOMING: "/grooming", TRAINING: "/training" };

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
}) {
  const daysSinceGrooming = lastGrooming ? Math.floor((Date.now() - lastGrooming.startTime.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const passportNumber = activePet ? derivePassportNumber(activePet.id) : null;

  return (
    <div>
      <EmergencyButton />

      <div className="px-4 pt-2">
        <h1 className="text-xl font-bold mb-4">Welcome back, {userName.split(" ")[0]}{activePet ? ` & ${activePet.name}` : ""}</h1>

        {/* ===== Real cart recovery — only shown if items actually exist ===== */}
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

        {/* ===== Real "what's next" — upcoming booking takes priority; if
            none, a real 1-tap rebook shortcut from actual booking
            history. Never both, never neither with nothing shown. ===== */}
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

        {/* ===== Real grooming reminder — only if a completed grooming
            booking actually exists. No fixed-days claim asserted as
            policy; framed as a real elapsed-time observation. ===== */}
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

      {/* ===== Buy Again — real past purchases ===== */}
      {buyAgainProducts.length > 0 && (
        <section className="px-4 mt-6 mb-8">
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

      {/* ===== PawPoints — real balance/tier ===== */}
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

      {/* ===== Wishlist — real, with a genuine price-drop flag using the
          real compareAtPrice field ===== */}
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

      {/* ===== Trusted Circle — real providers this owner has actually
          booked before, computed from real booking history ===== */}
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

      {/* ===== Real passport ID — derived from the real pet id ===== */}
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

      {/* ===== Community events — explicitly a placeholder, per product
          decision, not fabricated specific events/dates. ===== */}
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

      {/* ===== Concierge — placeholder number, per product decision ===== */}
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