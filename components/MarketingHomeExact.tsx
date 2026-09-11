"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  Sparkles, Bell, ShoppingBag, User, MapPin, ChevronRight, Search, Mic, Gift,
  Footprints, Droplet, Brain, Stethoscope, Home as HomeIcon, BadgeCheck,
  ArrowRight, Star, Shield, ShieldCheck, CheckCircle2, Syringe, FileCheck,
  Infinity as InfinityIcon, Headset, Store, Wallet, Calendar, PawPrint, Plus,
} from "lucide-react";
import UpcomingEvents from "./UpcomingEvents";

const HEADLINE = { fontFamily: "var(--font-heading)" } as const;

const SUPPORT_PHONE = "+91 00000 00000";

type Provider = {
  id: string;
  photoUrl: string | null;
  ratingAvg: number;
  user: { name: string };
  _count: { bookings: number };
};
type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrls: string[];
};

const CATEGORIES = [
  { label: "Walks", icon: Footprints, bg: "#d2e8d9", fg: "#02120a", href: "/walk-booking" },
  { label: "Grooming", icon: Droplet, bg: "#ffdbcd", fg: "#723517", href: "/grooming" },
  { label: "Training", icon: Brain, bg: "#ffddb3", fg: "#291800", href: "/training" },
  { label: "Vet Care", icon: Stethoscope, bg: "#e9e9dd", fg: "#16281f", href: "/owner/pets" },
  { label: "Staycation", icon: HomeIcon, bg: "#fea67f66", fg: "#904c2c", href: "/sitting" },
  { label: "Passport", icon: BadgeCheck, bg: "#e4e3d7", fg: "#02120a", href: "/owner/pets" },
];

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walks",
  SITTING: "Home Staycation",
  GROOMING: "Artisanal Spa & Gentle Grooming",
  TRAINING: "Behavior & Training",
};

export default function MarketingHomeExact({
  verifiedCount,
  avgRating,
  providers,
  products,
  mostPopularServiceType,
}: {
  verifiedCount: number;
  avgRating: number | null;
  providers: Provider[];
  products: Product[];
  mostPopularServiceType: string | null;
}) {
  const { openSignIn } = useClerk();

  return (
    <div className="min-h-screen" style={{ background: "#fbfaee", color: "#1b1c15" }}>
      {/* ===== Header ===== */}
      <header className="fixed top-0 w-full z-50 pt-safe" style={{ background: "rgba(251,250,238,0.9)", backdropFilter: "blur(20px)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-2xl tracking-tight" style={{ ...HEADLINE, color: "#16281f" }}>Barkado &amp; Co.</span>
            <span className="text-[11px] font-medium tracking-wide" style={{ color: "#424844" }}>Everything a dog needs, from birth to death</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#efeee3", color: "#16281f" }}>
              <Sparkles size={14} color="#fcba5a" />
              <span>0 PTS</span>
            </div>
            <button onClick={() => openSignIn()} aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-full tap-scale" style={{ color: "#16281f" }}>
              <Bell size={20} />
            </button>
            <Link href="/cart" aria-label="Shopping Cart" className="w-9 h-9 flex items-center justify-center rounded-full relative tap-scale" style={{ color: "#16281f" }}>
              <ShoppingBag size={22} />
            </Link>
            <button onClick={() => openSignIn()} aria-label="Sign in" className="w-9 h-9 rounded-full flex items-center justify-center tap-scale" style={{ background: "#16281f", color: "#ffffff" }}>
              <User size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pb-24 pt-20">
        {/* ===== Masthead: location + search ===== */}
        <section className="px-4 pt-3 pb-4 rounded-b-xl shadow-sm" style={{ background: "#ffffff" }}>
          <button
            onClick={() => openSignIn()}
            className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg mb-3 tap-scale text-left"
            style={{ background: "#f5f4e8" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={20} color="#904c2c" className="shrink-0" />
              <span className="font-semibold text-xs truncate" style={{ ...HEADLINE, color: "#16281f" }}>Set Delivery &amp; Service Location</span>
              <ChevronRight size={14} color="#424844" />
            </div>
            {verifiedCount > 0 && (
              <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#d2e8d9", color: "#0d1f16" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#02120a" }} />
                <span>{verifiedCount} Verified Pro{verifiedCount === 1 ? "" : "s"}</span>
              </div>
            )}
          </button>

          <div className="relative">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="#737874" />
            <input
              className="w-full h-11 pl-10 pr-10 rounded-lg text-sm shadow-inner"
              style={{ background: "#efeee3", color: "#1b1c15" }}
              placeholder="Search 'puppy spa', 'gentle walk', 'harness'..."
              readOnly
              onFocus={() => openSignIn()}
            />
            <Mic size={19} className="absolute right-3 top-1/2 -translate-y-1/2" color="#737874" />
          </div>
        </section>

        {/* ===== Signature Offerings ===== */}
        <section className="mt-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#424844" }}>Signature Offerings</span>
            {/* Welcome Gift banner — copy only, not wired to a real bonus amount */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "#ffdbcd", background: "#352000" }}>
              <Gift size={12} /> New Member Perks
            </span>
          </div>
          <div className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Link key={c.label} href={c.href} className="flex flex-col items-center gap-1.5 shrink-0 tap-scale">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: c.bg, color: c.fg }}>
                    <Icon size={26} />
                  </div>
                  <span className="font-semibold text-xs" style={{ ...HEADLINE, color: "#16281f" }}>{c.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ===== Hero Narrative ===== */}
        <section className="mt-4 px-4">
          <div className="rounded-2xl p-5 shadow-sm overflow-hidden relative" style={{ background: "#f5f4e8" }}>
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full w-max shadow-sm" style={{ color: "#7c9084", background: "#efeee3" }}>
                {avgRating !== null && avgRating > 0 && <span style={{ color: "#fcba5a" }}>★ {avgRating.toFixed(2)}</span>}
                <span>• {verifiedCount} Local Provider{verifiedCount === 1 ? "" : "s"} • Zero Cancellation Fees</span>
              </div>
              <h2 className="font-bold text-2xl leading-tight tracking-tight" style={{ ...HEADLINE, color: "#16281f" }}>
                Everything your dog needs, from birth to death. One ecosystem.
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "#424844" }}>
                Boutique walks, certified grooming spas, wellness records &amp; artisanal gear — vetted forever.
              </p>

              <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-inner my-1 flex items-center justify-center" style={{ background: "#e4e3d7" }}>
                <PawPrint size={48} color="#c2c8c2" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(22,40,31,0.8), transparent 60%)" }} />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)" }}>
                  <div className="flex items-center gap-2">
                    <Gift size={18} color="#904c2c" />
                    <span className="font-bold text-[11px]" style={{ ...HEADLINE, color: "#16281f" }}>Welcome Gift: 100 Bonus PawPoints</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "#ffdbcd", background: "#16281f" }}>First Booking</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button onClick={() => openSignIn()} className="w-full h-11 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md tap-scale" style={{ background: "#16281f", color: "#ffffff", ...HEADLINE }}>
                  Book First Service <ArrowRight size={14} />
                </button>
                <button onClick={() => openSignIn()} className="w-full h-11 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm tap-scale" style={{ background: "#ffffff", color: "#16281f", ...HEADLINE }}>
                  <BadgeCheck size={14} /> Create Free Paw Passport
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Purposeful Living ===== */}
        <section className="mt-6 px-4">
          <div className="mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#904c2c" }}>Purposeful Living</span>
            <h3 className="font-bold text-lg leading-tight mt-0.5" style={{ ...HEADLINE, color: "#16281f" }}>
              Not a marketplace, an experience for every part of their week
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl shadow-sm relative overflow-hidden" style={{ background: "#ffffff" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#ffdbcd", color: "#360f00" }}>
                  <Star size={12} fill="#360f00" /> Most Popular First Visit
                </span>
                <span className="font-bold text-sm" style={{ ...HEADLINE, color: "#16281f" }}>from ₹499</span>
              </div>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "#efeee3" }}>
                  <Droplet size={28} color="#c2c8c2" />
                </div>
                <div className="flex flex-col min-w-0 justify-center">
                  <h4 className="font-bold text-sm truncate" style={{ ...HEADLINE, color: "#16281f" }}>
                    {mostPopularServiceType ? SERVICE_LABEL[mostPopularServiceType] : "Artisanal Spa & Gentle Grooming"}
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: "#424844" }}>Organic botanical wash, hydro-massage therapy &amp; stress-free scissor styling.</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-max mt-2" style={{ color: "#624000", background: "#ffddb3" }}>First-timer stress-free trial</span>
                </div>
              </div>
              <div className="mt-3 pt-3 flex items-center justify-between -mx-4 -mb-4 px-4 py-2.5" style={{ background: "#f5f4e8" }}>
                <span className="text-[11px] flex items-center gap-1 font-medium" style={{ color: "#424844" }}>
                  <Sparkles size={14} color="#02120a" /> 100% hypoallergenic natural balms
                </span>
                <button onClick={() => openSignIn()} className="font-bold text-xs flex items-center gap-0.5" style={{ ...HEADLINE, color: "#904c2c" }}>
                  Select Slot <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl shadow-sm flex items-center gap-3" style={{ background: "#ffffff" }}>
              <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#efeee3" }}>
                <Footprints size={24} color="#c2c8c2" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs truncate" style={{ ...HEADLINE, color: "#16281f" }}>Adventure Walks</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "#16281f" }}>from ₹299</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "#424844" }}>GPS tracked route • Certified handlers • Live photo logs</p>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ color: "#384b41", background: "#d2e8d9" }}>Solo &amp; Pack Options</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl shadow-sm flex items-center gap-3" style={{ background: "#ffffff" }}>
              <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#efeee3" }}>
                <Brain size={24} color="#c2c8c2" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs truncate" style={{ ...HEADLINE, color: "#16281f" }}>Behavior &amp; Training</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "#16281f" }}>from ₹799</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "#424844" }}>In-home positive reinforcement &amp; puppy foundations</p>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ color: "#624000", background: "#ffddb3" }}>Vetted Ethologists</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl shadow-sm flex items-center gap-3" style={{ background: "#ffffff" }}>
              <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#efeee3" }}>
                <HomeIcon size={24} color="#c2c8c2" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs truncate" style={{ ...HEADLINE, color: "#16281f" }}>Home Staycation</h4>
                  <span className="text-xs font-bold shrink-0" style={{ color: "#16281f" }}>₹899/night</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "#424844" }}>100% cage-free vetted host family environments</p>
                {/* TODO: "24/7 Concierge Cam" not a real feature yet — see NOT_BUILT.md */}
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5" style={{ color: "#360f00", background: "#ffdbcd", opacity: 0.6 }} title="Coming soon">24/7 Concierge Cam</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== The Artisan Shelf — real products ===== */}
        {products.length > 0 && (
          <section className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#737874" }}>Small-Batch Supplies</span>
                <h3 className="font-bold text-sm" style={{ ...HEADLINE, color: "#16281f" }}>The Artisan Shelf — Handcrafted Goods</h3>
              </div>
              <Link href="/accessories" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#904c2c" }}>
                Explore <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {products.slice(0, 4).map((p) => (
                <Link href="/accessories" key={p.id} className="p-2.5 rounded-xl shadow-sm flex flex-col justify-between tap-scale" style={{ background: "#ffffff" }}>
                  <div className="w-full h-28 rounded-lg overflow-hidden mb-2 flex items-center justify-center" style={{ background: "#efeee3" }}>
                    {p.imageUrls?.[0] ? (
                      <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={28} color="#c2c8c2" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs truncate" style={{ ...HEADLINE, color: "#16281f" }}>{p.name}</h4>
                    <span className="text-[10px]" style={{ color: "#424844" }}>{p.category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="font-bold text-xs" style={{ ...HEADLINE, color: "#16281f" }}>₹{(p.price / 100).toFixed(0)}</span>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#efeee3", color: "#16281f" }}>
                      <Plus size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ===== Trust Beats Discounts — real providers, placeholder verification badges ===== */}
        {providers.length > 0 && (
          <section className="mt-6 px-4">
            <div className="p-4 rounded-2xl shadow-sm" style={{ background: "#f5f4e8" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck size={18} color="#02120a" />
                <h3 className="font-bold text-sm" style={{ ...HEADLINE, color: "#16281f" }}>Trust Beats Discounts</h3>
              </div>
              {/* TODO: no real "28-point certification protocol" exists — see NOT_BUILT.md */}
              <p className="text-xs mb-3" style={{ color: "#424844" }}>Every partner is verified and reviewed by real customers.</p>
              <div className="flex flex-col gap-2.5">
                {providers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl shadow-sm" style={{ background: "#ffffff" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#efeee3" }}>
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.user.name} className="w-full h-full object-cover" /> : <User size={18} color="#c2c8c2" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs" style={{ ...HEADLINE, color: "#16281f" }}>{p.user.name}</span>
                          <CheckCircle2 size={13} color="#02120a" fill="#d2e8d9" />
                        </div>
                        <span className="text-[11px]" style={{ color: "#424844" }}>{p._count.bookings} completed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#624000", background: "#ffddb3" }}>
                      ★ {p.ratingAvg.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Placeholder verification badges — TODO: none of these are backed by a real verification process yet, see NOT_BUILT.md */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3">
                <div className="flex flex-col items-center text-center p-2 rounded-lg" style={{ background: "#efeee3", opacity: 0.55 }} title="Coming soon">
                  <Shield size={18} color="#02120a" />
                  <span className="text-[10px] font-semibold mt-1" style={{ color: "#16281f" }}>100% Background Checked</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-lg" style={{ background: "#efeee3", opacity: 0.55 }} title="Coming soon">
                  <Syringe size={18} color="#02120a" />
                  <span className="text-[10px] font-semibold mt-1" style={{ color: "#16281f" }}>Pet First-Aid Certified</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-lg" style={{ background: "#efeee3", opacity: 0.55 }} title="Coming soon">
                  <FileCheck size={18} color="#02120a" />
                  <span className="text-[10px] font-semibold mt-1" style={{ color: "#16281f" }}>Insured &amp; Bonded</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== One Ecosystem CTA ===== */}
        <section className="mt-6 px-4">
          <div className="rounded-2xl p-6 shadow-md relative overflow-hidden" style={{ background: "#16281f", color: "#ffffff" }}>
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold w-max" style={{ background: "#190d00", color: "#fcba5a" }}>
                <InfinityIcon size={12} /> The Holistic Lifeline
              </span>
              <h3 className="font-bold text-xl leading-tight" style={HEADLINE}>
                Everything your dog needs, from birth to death. One ecosystem.
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#e4e3d7" }}>
                Free lifetime Paw Passport, vetted handlers, transparent pricing, and artisan nutrition in a single connected experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button onClick={() => openSignIn()} className="h-11 px-5 rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-md tap-scale" style={{ background: "#fcba5a", color: "#291800", ...HEADLINE }}>
                  Book First Service <ArrowRight size={14} />
                </button>
                <button onClick={() => openSignIn()} className="h-11 px-5 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 tap-scale" style={{ background: "rgba(255,255,255,0.15)", color: "#fbfaee", ...HEADLINE }}>
                  Create Paw Passport
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Community events — real component, mockup's header style ===== */}
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#904c2c" }}>Canine Community</span>
              <h3 className="font-bold text-sm" style={{ ...HEADLINE, color: "#16281f" }}>Community Pack Meetups</h3>
            </div>
            <button className="text-xs font-semibold" style={{ color: "#904c2c" }}>All Events</button>
          </div>
        </section>
        <UpcomingEvents />

        {/* ===== Guarantee footer ===== */}
        <footer className="mt-8 px-4 pb-20 pt-6 rounded-t-3xl" style={{ background: "#f5f4e8" }}>
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: "#16281f", color: "#fbfaee" }}>
              <PawPrint size={20} />
            </div>
            <h4 className="font-bold text-sm" style={{ ...HEADLINE, color: "#16281f" }}>Barkado &amp; Co. Guarantee</h4>
            {/* TODO: "unconditionally insured on every appointment" is not a real, verified claim — see NOT_BUILT.md */}
            <p className="text-xs max-w-xs mt-1" style={{ color: "#424844" }}>
              Verified handlers, transparent pricing, and real support on every booking.
            </p>
            <Link href="/provider" className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#904c2c" }}>
              Become a Verified Provider <ArrowRight size={12} />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[11px] font-medium" style={{ color: "#424844" }}>
              <Link href="/legal/terms">Terms of Service</Link>
              <span>•</span>
              <Link href="/legal/privacy">Privacy Policy</Link>
              <span>•</span>
              <Link href="/legal/refund">Cancellation &amp; Refund</Link>
              <span>•</span>
              <Link href="/legal/contact">Contact Us</Link>
            </div>
            <span className="text-[10px] mt-4" style={{ color: "#737874" }}>© {new Date().getFullYear()} Barkado &amp; Co. All rights reserved.</span>
          </div>

          {/* SOS pill — placeholder support number, same as the one on the Profile page */}
          <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="mt-4 flex items-center justify-between p-2.5 rounded-xl tap-scale" style={{ background: "#ffdad6", color: "#93000a" }}>
            <div className="flex items-center gap-2">
              <Headset size={18} color="#ba1a1a" />
              <span className="font-bold text-xs" style={HEADLINE}>Need Urgent Pet Help?</span>
            </div>
            <span className="px-3 py-1 rounded-full font-bold text-[11px]" style={{ background: "#ba1a1a", color: "#ffffff" }}>{SUPPORT_PHONE}</span>
          </a>
        </footer>
      </main>

      {/* ===== Bottom nav ===== */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe" style={{ background: "rgba(251,250,238,0.9)", backdropFilter: "blur(20px)", boxShadow: "0 -4px 16px rgba(22,40,31,0.06)" }}>
        <div className="h-16 px-4 flex items-center justify-around">
          <button className="flex flex-col items-center gap-1" style={{ color: "#16281f" }}>
            <HomeIcon size={22} />
            <span className="text-[10px] font-bold tracking-tight" style={HEADLINE}>Services</span>
          </button>
          <Link href="/accessories" className="flex flex-col items-center gap-1" style={{ color: "#424844" }}>
            <Store size={22} />
            <span className="text-[10px] font-medium tracking-tight" style={HEADLINE}>Shop</span>
          </Link>
          <button onClick={() => openSignIn()} className="flex flex-col items-center gap-1" style={{ color: "#424844" }}>
            <Wallet size={22} />
            <span className="text-[10px] font-medium tracking-tight" style={HEADLINE}>Wallet</span>
          </button>
          <button onClick={() => openSignIn()} className="flex flex-col items-center gap-1" style={{ color: "#424844" }}>
            <Calendar size={22} />
            <span className="text-[10px] font-medium tracking-tight" style={HEADLINE}>Activity</span>
          </button>
          <button onClick={() => openSignIn()} className="flex flex-col items-center gap-1" style={{ color: "#424844" }}>
            <PawPrint size={22} />
            <span className="text-[10px] font-medium tracking-tight" style={HEADLINE}>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}