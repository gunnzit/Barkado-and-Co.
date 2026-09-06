import Link from "next/link";
import Image from "next/image";
import {
  PawPrint, Scissors, Stethoscope, Home as HomeIcon, ShoppingBag,
  Dumbbell, Star, ShieldCheck, ChevronRight, Sparkles, ShieldQuestion,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";

const SERVICES = [
  { type: "GROOMING", title: "Luxury Spa Session", tag: "Grooming", desc: "Coat-specific bath, blow-out, nail and ear care.", icon: Scissors, price: "from ₹499", href: "/grooming" },
  { type: "WALKING", title: "Adventure Walk", tag: "Dog walking", desc: "Verified handlers, with route tracking coming soon.", icon: PawPrint, price: "from ₹299", href: "/walk-booking" },
  { type: "TRAINING", title: "Good Manners Programme", tag: "Training", desc: "Force-free trainers for basics, leash work and reactivity.", icon: Dumbbell, price: "from ₹599", href: "/training" },
  { type: "SITTING", title: "Home Staycation", tag: "Sitting & boarding", desc: "In-home care with daily updates while you're away.", icon: HomeIcon, price: "from ₹899 / night", href: "/sitting" },
  { type: "VET", title: "Care Consult", tag: "Vet & vaccines", desc: "We track every vaccine due date so you never forget.", icon: Stethoscope, price: "Included", href: "/owner/pets" },
];

export default function HomeNewUserMobile({
  verifiedCount,
  avgRating,
  completedCount,
  products,
  bestsellerIds,
  providers,
  mostPopularServiceType,
  activeBreed,
}: {
  verifiedCount: number;
  avgRating: number | null;
  completedCount: number;
  products: { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[] }[];
  bestsellerIds: Set<string>;
  providers: { id: string; user: { name: string }; ratingAvg: number; _count: { bookings: number } }[];
  mostPopularServiceType: string | null;
  activeBreed: string | undefined;
}) {
  return (
    <div>
      <EmergencyButton />

      {/* ===== Hero — tagline updated per product decision: "from birth
          to death" ecosystem framing leads for new/unproven visitors,
          since this is the moment to actually sell the idea of the
          platform. ===== */}
      <section className="px-4 pt-2 pb-6">
        {verifiedCount > 0 && (
          <span className="trust-chip inline-flex mb-2">
            <ShieldCheck size={12} /> {verifiedCount} verified provider{verifiedCount === 1 ? "" : "s"}
          </span>
        )}
        <h1 className="text-2xl font-bold mb-1.5 leading-tight">
          Everything your dog needs, from birth to death.
          <br />
          <span style={{ color: "var(--terracotta)" }}>One ecosystem.</span>
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Verified pros, transparent pricing, and a real safety net — not just another booking app.
        </p>
        <div className="flex gap-2.5">
          <Link href="/walk-booking" className="btn-primary text-sm whitespace-nowrap">Book First Service</Link>
          <Link href="/owner/pets" className="btn-secondary text-sm whitespace-nowrap">Create Paw Passport</Link>
        </div>
        {avgRating !== null && avgRating > 0 && (
          <p className="text-sm mt-3 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Star size={14} fill="var(--gold)" color="var(--gold)" />
            {avgRating.toFixed(2)} average{completedCount > 0 && ` · ${completedCount} bookings completed`}
          </p>
        )}
      </section>

      {/* ===== Services — grooming visually first per real revenue
          priority; "Most Popular First Visit" is a REAL computed badge
          (which service type most often is a new owner's very first
          booking), not a static claim. ===== */}
      <section className="px-4 mb-8">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>Not a marketplace</p>
        <h2 className="text-xl font-bold mb-4">An experience for every part of their week.</h2>
        <div className="space-y-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const isMostPopular = s.type === mostPopularServiceType;
            return (
              <Link key={s.title} href={s.href} className="card flex items-start justify-between gap-4 tap-scale relative">
                {isMostPopular && (
                  <span className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                    Most Popular First Visit
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <Icon size={20} color="var(--terracotta)" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.title}</p>
                    <p className="text-xs mb-1" style={{ color: "var(--terracotta)" }}>{s.tag}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{s.desc}</p>
                    {s.type === "WALKING" && (
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>
                        GPS tracking — coming soon
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--forest)" }}>{s.price}</span>
                  <ChevronRight size={14} color="var(--muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Shop — real products, secondary here since this audience
          hasn't discovered the catalog yet ===== */}
      {products.length > 0 && (
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Shop accessories</h2>
            <Link href="/accessories" className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p) => {
              const photo = p.imageUrls[0];
              return (
                <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-full aspect-square relative" style={{ background: "var(--cream)" }}>
                    {photo && <img src={photo} alt={p.name} className="w-full h-full object-cover" />}
                    {bestsellerIds.has(p.id) && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                        Bestseller
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

      {/* ===== Trust — real providers, real ratings ===== */}
      {providers.length > 0 && (
        <section className="px-4 mb-8">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>Trust beats discounts</p>
          <h2 className="text-lg font-bold mb-4">Every pro is verified and reviewed.</h2>
          <div className="space-y-3">
            {providers.slice(0, 3).map((p) => (
              <div key={p.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">{p.user.name}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{p._count.bookings} completed</p>
                </div>
                <span className="trust-chip">
                  <Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Guarantee block — real claims only. Insurance and provider
          vetting standards are real per product confirmation, stated as
          company-wide commitments (not per-provider tracked badges — no
          such individual tracking exists in the schema yet). ===== */}
      <section className="px-4 mb-8">
        <div className="rounded-2xl p-6" style={{ background: "var(--panel-dark)", color: "white" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <ShieldQuestion size={13} /> The Barkado Standard
          </p>
          <h2 className="text-xl font-bold mb-3">
            Everything your dog needs, from birth to death. Zero friction.
          </h2>
          <ul className="space-y-1.5 mb-4 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
            <li>Your pet's physical safety and emotional wellbeing is unconditionally insured on every single appointment.</li>
            <li>Providers are held to a 100% background-checked, pet first-aid certified, insured & bonded standard.</li>
          </ul>
          <div className="flex gap-2.5">
            <Link href="/walk-booking" className="btn-accent text-sm">Book First Service</Link>
            <Link href="/owner/pets" className="text-sm font-semibold self-center text-white/90">Create Paw Passport</Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <PawPrint size={18} color="var(--terracotta)" />
          <span className="font-bold">Barkado &amp; Co.</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Everything your dog needs. One passport.</p>
        <Link href="/provider" className="text-xs font-semibold tap-scale inline-block mb-4" style={{ color: "var(--terracotta)" }}>
          Become a provider →
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
          <Link href="/legal/terms">Terms &amp; Conditions</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
          <Link href="/legal/refund">Cancellation &amp; Refund</Link>
          <Link href="/legal/shipping">Shipping Policy</Link>
          <Link href="/legal/contact">Contact Us</Link>
        </div>
      </footer>
    </div>
  );
}