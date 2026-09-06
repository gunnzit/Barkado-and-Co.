import Link from "next/link";
import {
  PawPrint, Scissors, GraduationCap, Home as HomeIcon, Stethoscope, BookOpen,
  Star, ShieldCheck, ChevronRight, ArrowRight, Gift, Heart, Calendar,
  CheckCircle2, HeartPulse, FileCheck, Infinity as InfinityIcon,
  MapPin, Building2, Phone,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import { SAMPLE_ROLE_TITLES, sampleIndexFor } from "@/lib/trainerSampleData";

// Per-category colors from the REAL, authoritative design system
// (DESIGN.md) — not the mockup's generic placeholder tokens: Adventure
// Walk = Deep Forest Green, Home Staycation = Terracotta, Luxury Spa =
// Honey Gold, Good Manners = Heritage Red.
const OFFERINGS = [
  { label: "Walks", icon: PawPrint, href: "/walk-booking", bg: "rgba(22,40,31,0.12)", fg: "var(--forest, #16281f)" },
  { label: "Grooming", icon: Scissors, href: "/grooming", bg: "rgba(232,169,74,0.18)", fg: "var(--gold)" },
  { label: "Training", icon: GraduationCap, href: "/training", bg: "rgba(192,57,43,0.12)", fg: "var(--heritage-red, #c0392b)" },
  { label: "Vet Care", icon: Stethoscope, href: "/owner/pets", bg: "var(--cream)", fg: "var(--forest, #16281f)" },
  { label: "Staycation", icon: HomeIcon, href: "/sitting", bg: "rgba(201,122,86,0.18)", fg: "var(--terracotta)" },
  { label: "Passport", icon: BookOpen, href: "/owner/pets", bg: "var(--cream)", fg: "var(--forest, #16281f)" },
];

export default function HomeNewUserMobile({
  verifiedCount,
  avgRating,
  products,
  bestsellerIds,
  providers,
  mostPopularServiceType,
  userAddress,
  userPhone,
  cartCount,
  pawPointsBalance,
}: {
  verifiedCount: number;
  avgRating: number | null;
  completedCount: number;
  products: { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[] }[];
  bestsellerIds: Set<string>;
  providers: { id: string; user: { name: string }; photoUrl?: string | null; ratingAvg: number; _count: { bookings: number } }[];
  mostPopularServiceType: string | null;
  activeBreed: string | undefined;
  userAddress: string | null;
  userPhone: string | null;
  cartCount: number;
  pawPointsBalance: number;
}) {
  return (
    <div style={{ background: "var(--cream)" }}>
      <EmergencyButton />
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      {/* ===== Signature Offerings ===== */}
      <section className="mt-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Signature Offerings</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--terracotta)", background: "rgba(201,122,86,0.12)" }}>
            <Gift size={12} /> New Member Perks
          </span>
        </div>
        <div className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {OFFERINGS.map((o) => {
            const Icon = o.icon;
            return (
              <Link key={o.label} href={o.href} className="flex flex-col items-center gap-1.5 shrink-0 tap-scale">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: o.bg }}>
                  <Icon size={26} color={o.fg} />
                </div>
                <span className="font-heading font-semibold text-xs" style={{ color: "var(--forest, #16281f)" }}>{o.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== Hero Narrative ===== */}
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

            {/* Welcome Gift — real: the 100-point signup bonus is
                genuinely credited, not a mockup claim. */}
            <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--cream)" }}>
              <div className="flex items-center gap-2">
                <Gift size={18} color="var(--terracotta)" />
                <span className="font-heading font-bold text-[11px]" style={{ color: "var(--forest, #16281f)" }}>Welcome Gift: 100 Bonus PawPoints</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>Real &amp; Credited</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Link href="/walk-booking" className="w-full h-11 rounded-full flex items-center justify-center gap-2 font-heading font-bold text-xs" style={{ background: "var(--panel-dark)", color: "white" }}>
                Book First Service <ArrowRight size={14} />
              </Link>
              <Link href="/owner/pets" className="w-full h-11 rounded-full flex items-center justify-center gap-1.5 font-heading font-semibold text-xs shadow-sm" style={{ background: "var(--card)", color: "var(--forest, #16281f)", border: "1px solid var(--border)" }}>
                <BookOpen size={14} /> Create Free Paw Passport
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Purposeful Living =====
          NOTE: the descriptive tags on Walks/Training/Staycation below
          ("GPS tracked route", "Live photo logs", "Solo & Pack Options",
          "Vetted Ethologists", "24/7 Concierge Cam") are the reference
          design's exact copy, kept verbatim per explicit instruction to
          match exactly — but these describe features that AREN'T real
          yet (no GPS tracking, no live photo feed, no solo/pack booking
          distinction, no 24/7 concierge monitoring exists in this app).
          This is aspirational marketing copy, not a working feature list
          — flagged here so it's traceable, not a surprise later. */}
      <section className="mt-6 px-4">
        <div className="mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>Purposeful Living</span>
          <h3 className="font-heading font-bold text-lg leading-tight mt-0.5" style={{ color: "var(--forest, #16281f)" }}>
            Not a marketplace, an experience for every part of their week
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {/* Grooming — featured showcase */}
          <div className="p-4 rounded-2xl shadow-sm relative" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(232,169,74,0.25)", color: "var(--gold)" }}>
                <Star size={12} fill="var(--gold)" /> Most Popular First Visit
              </span>
              <span className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>from ₹499</span>
            </div>
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                {products[0]?.imageUrls[0] && <img src={products[0].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-heading font-bold text-sm truncate" style={{ color: "var(--forest, #16281f)" }}>Artisanal Spa &amp; Gentle Grooming</h4>
                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--muted)" }}>Organic botanical wash, hydro-massage therapy &amp; stress-free scissor styling.</p>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 w-max" style={{ background: "rgba(232,169,74,0.2)", color: "var(--gold)" }}>
                  First-timer stress-free trial
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between -mx-4 -mb-4 px-4 py-2.5" style={{ background: "var(--cream)" }}>
              <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "var(--muted)" }}>
                100% hypoallergenic natural balms
              </span>
              <Link href="/grooming" className="font-heading font-bold text-xs flex items-center gap-0.5" style={{ color: "var(--terracotta)" }}>
                Select Slot <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Adventure Walks */}
          <Link href="/walk-booking" className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
              {products[1]?.imageUrls[0] && <img src={products[1].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Adventure Walks</h4>
                <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>from ₹299</span>
              </div>
              <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>GPS tracked route • Certified handlers • Live photo logs</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ background: "rgba(22,40,31,0.1)", color: "var(--forest, #16281f)" }}>Solo &amp; Pack Options</span>
            </div>
          </Link>

          {/* Behavior & Training */}
          <Link href="/training" className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
              {products[2]?.imageUrls[0] && <img src={products[2].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Behavior &amp; Training</h4>
                <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>from ₹799</span>
              </div>
              <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>In-home positive reinforcement &amp; puppy foundations</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ background: "rgba(192,57,43,0.12)", color: "var(--heritage-red, #c0392b)" }}>Vetted Ethologists</span>
            </div>
          </Link>

          {/* Home Staycation */}
          <Link href="/sitting" className="p-3.5 rounded-xl shadow-sm flex items-center gap-3 tap-scale" style={{ background: "var(--card)" }}>
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
              {products[3]?.imageUrls[0] && <img src={products[3].imageUrls[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Home Staycation</h4>
                <span className="text-xs font-bold shrink-0" style={{ color: "var(--forest, #16281f)" }}>₹899/night</span>
              </div>
              <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "var(--muted)" }}>100% cage-free vetted host family environments</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ background: "rgba(201,122,86,0.18)", color: "var(--terracotta)" }}>24/7 Concierge Cam</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ===== The Artisan Shelf — real products ===== */}
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
          <div className="grid grid-cols-2 gap-2.5">
            {products.slice(0, 4).map((p) => {
              const photo = p.imageUrls[0];
              return (
                <Link key={p.id} href={`/accessories/${p.id}`} className="p-2.5 rounded-xl shadow-sm flex flex-col justify-between tap-scale relative" style={{ background: "var(--card)" }}>
                  <div className="w-full h-28 rounded-lg overflow-hidden mb-2 relative" style={{ background: "var(--cream)" }}>
                    {photo && <img src={photo} alt={p.name} className="w-full h-full object-cover" />}
                    {bestsellerIds.has(p.id) && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                        Bestseller
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>{p.name}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="font-heading font-bold text-xs" style={{ color: "var(--forest, #16281f)" }}>₹{(p.price / 100).toFixed(0)}</span>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--cream)" }}>+</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== Trust Beats Discounts — real providers/ratings/completed
          counts. Role titles are SAMPLE data (same established, disclosed
          pattern already used on Training/Grooming profiles). Trust
          badges are real company-wide policy commitments, not
          per-provider tracked flags (no such tracking exists yet). ===== */}
      {providers.length > 0 && (
        <section className="mt-6 px-4">
          <div className="p-4 rounded-2xl shadow-sm" style={{ background: "var(--card)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={16} color="var(--forest, #16281f)" />
              <h3 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Trust Beats Discounts</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Every single partner is vetted in-person through a rigorous 28-point certification protocol.</p>
            <div className="flex flex-col gap-2.5">
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

      {/* ===== "One Ecosystem" CTA — the insurance line is real, per
          explicit confirmation. "Artisan nutrition" copy is kept verbatim
          per exact-match instruction, but no such program exists — same
          aspirational-copy caveat as above. ===== */}
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
              Your pet's physical safety and emotional wellbeing is unconditionally insured on every single appointment. Free lifetime Paw Passport, vetted handlers, transparent pricing, and artisan nutrition in a single connected experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Link href="/walk-booking" className="h-11 px-5 rounded-full font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-md" style={{ background: "var(--gold)", color: "var(--forest, #16281f)" }}>
                Book First Service <ArrowRight size={14} />
              </Link>
              <Link href="/owner/pets" className="h-11 px-5 rounded-full font-heading font-semibold text-xs flex items-center justify-center gap-1.5" style={{ background: "rgba(255,255,255,0.12)" }}>
                Create Paw Passport
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Community Pack Meetups — explicit placeholder, per product
          decision. No fabricated specific events/dates. ===== */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--terracotta)" }}>Canine Community</span>
            <h3 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Community Pack Meetups</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: "var(--cream)", color: "var(--muted)" }}>Coming Soon</span>
        </div>
        <div className="flex flex-col gap-2.5 opacity-60">
          <div className="p-3 rounded-xl shadow-sm flex items-center justify-between gap-3" style={{ background: "var(--card)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                <span className="font-heading font-bold text-xs">TBD</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-heading font-bold text-xs truncate" style={{ color: "var(--forest, #16281f)" }}>Local dog meetups</h4>
                <span className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                  <MapPin size={12} color="var(--terracotta)" /> Details coming soon
                </span>
              </div>
            </div>
            <button disabled className="h-8 px-3 rounded-full font-heading font-bold text-xs shrink-0" style={{ background: "var(--cream)", color: "var(--muted)", cursor: "not-allowed" }}>
              RSVP
            </button>
          </div>
        </div>
      </section>

      {/* ===== Footer — real guarantee text, real background-check
          policy language, placeholder concierge digits per product
          decision. ===== */}
      <footer className="mt-8 px-4 pb-8 pt-6 rounded-t-3xl" style={{ background: "var(--card)" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "var(--panel-dark)" }}>
            <PawPrint size={20} color="var(--gold)" />
          </div>
          <h4 className="font-heading font-bold text-sm" style={{ color: "var(--forest, #16281f)" }}>Barkado &amp; Co. Guarantee</h4>
          <p className="text-xs max-w-xs mt-1" style={{ color: "var(--muted)" }}>
            Your pet's physical safety and emotional wellbeing is unconditionally insured on every single appointment.
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
          <span className="text-[10px] mt-4" style={{ color: "var(--muted)" }}>© 2026 Barkado &amp; Co. All rights reserved. Crafted with devotion.</span>
        </div>

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
  );
}