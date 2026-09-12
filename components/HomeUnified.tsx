"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  Sparkles, RotateCcw, History, Footprints, Bath, Stethoscope, Utensils,
  GraduationCap, Home as HomeIcon, BadgeCheck, AlertTriangle, ArrowRight,
  ChevronRight, ShieldCheck, MapPin, Truck, Clock, SlidersHorizontal, Zap,
  Radar, HeartPulse, PhoneCall, Gift, Plus, Star,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import UpcomingEvents from "@/components/UpcomingEvents";
import { derivePassportNumber } from "@/lib/passportId";

const H = { fontFamily: "var(--font-heading)" } as const;
const SUPPORT_PHONE = "+91 00000 00000";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", SITTING: "/sitting", GROOMING: "/grooming", TRAINING: "/training" };
const SIZE_LABEL: Record<string, string> = { SMALL: "Small dog", MEDIUM: "Medium dog", LARGE: "Large dog", GIANT: "Giant dog" };

const ON_DEMAND = [
  { label: "Walk in 15m", icon: Footprints, href: "/walk-booking", badge: "⚡ 15M", badgeBg: "#904c2c" },
  { label: "Mobile Spa", icon: Bath, href: "/grooming", badge: "20% OFF", badgeBg: "#fcba5a" },
  { label: "Vet At Home", icon: Stethoscope, href: "/owner/pets", badge: "24/7", badgeBg: "#02120a" },
  { label: "10m Treats", icon: Utensils, href: "/accessories", badge: "FAST", badgeBg: "#904c2c" },
  { label: "Manners", icon: GraduationCap, href: "/training", badge: null },
  { label: "Staycation", icon: HomeIcon, href: "/sitting", badge: null },
  { label: "Passport", icon: BadgeCheck, href: "/owner/pets", badge: null },
];

type Pet = {
  id: string; name: string; breed: string | null; photoUrl: string | null;
  birthday: Date | null; microchipId: string | null; size: string;
  vaccinations: { nextDueDate: Date | null }[];
};
type Provider = { id: string; user: { name: string }; photoUrl: string | null; ratingAvg: number; _count: { bookings: number } };
type Product = { id: string; name: string; price: number; compareAtPrice?: number | null; imageUrls: string[] };
type GroomingBundle = { id: string; name: string; startingPricePaise: number; providerName: string };
type TrainingBundle = { id: string; name: string; cadence: string; pricePaise: number; providerName: string };

function ageLabel(birthday: Date | null): string | null {
  if (!birthday) return null;
  const years = (Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? null : `${years.toFixed(1)} yr`;
}

export default function HomeUnified({
  isSignedIn,
  userName,
  userAddress,
  userPhone,
  activePet,
  pawPointsBalance,
  cartCount,
  hasHistory,
  rebookCandidate,
  verifiedCount,
  activeProviderCount,
  providers,
  products,
  groomingBundles,
  trainingBundles,
}: {
  isSignedIn: boolean;
  userName: string | null;
  userAddress: string | null;
  userPhone: string | null;
  activePet: Pet | null;
  pawPointsBalance: number;
  cartCount: number;
  hasHistory: boolean;
  rebookCandidate: { type: string; provider: { id: string; user: { name: string } } | null; pet: { name: string } | null; startTime: Date | null; priceAmount: number | null } | null;
  verifiedCount: number;
  activeProviderCount: number;
  providers: Provider[];
  products: Product[];
  groomingBundles: GroomingBundle[];
  trainingBundles: TrainingBundle[];
}) {
  const { openSignIn } = useClerk();
  const gate = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      openSignIn();
    }
  };

  const age = activePet ? ageLabel(activePet.birthday) : null;
  const hasVaccineRecords = (activePet?.vaccinations.length ?? 0) > 0;
  const overdueVaccine = activePet?.vaccinations.some((v) => v.nextDueDate && v.nextDueDate < new Date()) ?? false;

  // Real fallback chain for the pet subtitle: age + breed when both are
  // set (matches the mockup exactly); if either is missing (e.g. a
  // draft/incomplete Passport), fall back to whatever real info IS on
  // file — breed alone, age alone, or the pet's size (which always has
  // a real default) — rather than showing a blank gap.
  const petSubtitleParts = [age, activePet?.breed].filter(Boolean) as string[];
  const petSubtitle = petSubtitleParts.length > 0
    ? petSubtitleParts.join(" ")
    : activePet
      ? SIZE_LABEL[activePet.size] ?? "Dog"
      : "";
  const passportIncomplete = activePet && petSubtitleParts.length === 0;

  const hasRealBundles = groomingBundles.length > 0 || trainingBundles.length > 0;

  return (
    <div style={{ background: "#fbfaee" }}>
      <EmergencyButton />
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      <main className="flex flex-col relative w-full pt-2 pb-24" style={{ background: "#fbfaee" }}>
        <div className="max-w-6xl mx-auto w-full">

          {activeProviderCount > 0 && (
            <div className="px-4 py-2">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl" style={{ background: "#02120a", color: "white" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34d399" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#10b981" }} />
                  </span>
                  <div className="truncate text-xs">
                    <span className="font-bold text-white">{activeProviderCount} Pro{activeProviderCount === 1 ? "" : "s"} active</span>
                    <span style={{ color: "rgba(228,227,215,0.8)" }}> around your area</span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: "#904c2c", color: "white", ...H }} title="Not a real ETA yet">
                  ⚡ ETA
                </span>
              </div>
            </div>
          )}

          <section className="px-4 pt-1 pb-2.5">
            <div className="p-3.5 rounded-2xl flex flex-col gap-3" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid rgba(194,200,194,0.25)" }}>
              {activePet ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ boxShadow: "0 0 0 2px rgba(144,76,44,0.3)" }}>
                      {activePet.photoUrl ? <img src={activePet.photoUrl} alt={activePet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "#efeee3" }}><BadgeCheck size={18} color="#737874" /></div>}
                      {hasVaccineRecords && !overdueVaccine && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "#02120a", color: "white" }}>✓</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-bold text-sm" style={{ ...H, color: "#02120a" }}>{activePet.name}</h2>
                        {hasVaccineRecords && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#d2e8d9", color: "#0d1f16" }}>
                            {overdueVaccine ? "Vaccine Due" : "Vaccinated"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: "#424844" }}>
                        {petSubtitle}{isSignedIn ? ` • ${pawPointsBalance.toLocaleString("en-IN")} PawPoints` : ""}
                      </p>
                      {passportIncomplete && (
                        <Link href={`/owner/pets/${activePet.id}`} className="text-[10px] font-semibold" style={{ color: "#904c2c" }}>
                          Add breed &amp; birthday →
                        </Link>
                      )}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1" style={{ background: "#e9e9dd", color: "#1b1c15" }} title="Placeholder — no real voucher system yet">
                    <Gift size={14} color="#904c2c" />
                    Offers
                  </span>
                </div>
              ) : (
                <Link href="/owner/pets" onClick={gate} className="text-center py-2 block">
                  <p className="text-sm font-semibold" style={{ color: "#02120a" }}>{isSignedIn ? "Add your first pet" : "Sign in to create your dog's Paw Passport"}</p>
                </Link>
              )}

              {rebookCandidate && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl" style={{ background: "#f5f4e8", border: "1px solid rgba(194,200,194,0.3)" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-bold truncate" style={{ ...H, color: "#02120a" }}>
                      <History size={14} color="#904c2c" />
                      <span>{SERVICE_LABEL[rebookCandidate.type]}</span>
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "#424844" }}>
                      {rebookCandidate.startTime ? rebookCandidate.startTime.toLocaleString("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" }) : ""}
                      {rebookCandidate.provider ? ` with ${rebookCandidate.provider.user.name}` : ""}
                      {rebookCandidate.priceAmount ? ` • ₹${(rebookCandidate.priceAmount / 100).toFixed(0)}` : ""}
                    </div>
                  </div>
                  <Link href={SERVICE_HREF[rebookCandidate.type]} onClick={gate} className="shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 tap-scale" style={{ background: "#904c2c", color: "white", ...H }}>
                    <RotateCcw size={14} /> 1-Tap Rebook
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="py-2.5">
            <div className="flex items-center justify-between px-4 mb-2">
              <div>
                <h3 className="font-bold text-sm tracking-tight" style={{ ...H, color: "#02120a" }}>Instant On-Demand Care</h3>
                <p className="text-[11px]" style={{ color: "#424844" }}>Book real appointments in a few taps</p>
              </div>
              <Link href="/walk-booking" onClick={gate} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: "#904c2c" }}>
                Explore All <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-2.5 px-4 overflow-x-auto pb-1.5">
              {ON_DEMAND.map((o) => {
                const Icon = o.icon;
                return (
                  <Link key={o.label} href={o.href} onClick={gate} className="shrink-0 flex flex-col items-center text-center p-2 rounded-2xl tap-scale" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)", minWidth: 76 }}>
                    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-1.5" style={{ background: "#efeee3" }}>
                      <Icon size={22} color="#02120a" />
                      {o.badge && (
                        <span className="absolute -top-1.5 -right-1 px-1 py-0.5 rounded-full text-[8px] font-extrabold uppercase" style={{ background: o.badgeBg, color: "white" }} title="Placeholder — no real instant-dispatch timing exists yet">
                          {o.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[11px] leading-tight" style={{ ...H, color: "#02120a" }}>{o.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ===== Grooming & Training Bundles — real packages when they
              exist; if none exist yet (no real GroomingPackage/
              TrainingPackage rows), shows 2 marked SAMPLE placeholder
              cards instead of hiding the whole section, per instruction.
              Real data always takes priority over the placeholders. ===== */}
          <section className="px-4 py-2.5">
            <div className="p-4 rounded-2xl flex flex-col gap-3.5" style={{ background: "linear-gradient(135deg, #e9e9dd, #efeee3, #f5f4e8)", border: "1px solid rgba(194,200,194,0.3)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight leading-tight" style={{ ...H, color: "#02120a" }}>Grooming &amp; Training Care Bundles</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: "#424844" }}>
                    {hasRealBundles ? "Real multi-session packages from your local providers." : "Sample layout — no real packages created yet."}
                  </p>
                </div>
                <Link href="/grooming" onClick={gate} className="shrink-0 text-xs font-bold flex items-center gap-0.5 pt-1" style={{ color: "#904c2c" }}>
                  All Bundles <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {hasRealBundles ? (
                  <>
                    {groomingBundles.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl flex flex-col justify-between gap-2.5" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#ffdbcd", color: "#904c2c", ...H }}>Bundle</span>
                            <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#02120a" }}>{b.name}</h4>
                            <p className="text-[10px] mt-0.5" style={{ color: "#424844" }}>{b.providerName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>from ₹{(b.startingPricePaise / 100).toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-2" style={{ borderTop: "1px solid rgba(194,200,194,0.15)" }}>
                          <Link href="/grooming" onClick={gate} className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 tap-scale" style={{ background: "#904c2c", color: "white", ...H }}>
                            Choose Bundle <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                    {trainingBundles.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl flex flex-col justify-between gap-2.5" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#d2e8d9", color: "#0d1f16", ...H }}>Bundle</span>
                            <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#02120a" }}>{b.name}</h4>
                            <p className="text-[10px] mt-0.5" style={{ color: "#424844" }}>{b.providerName} · {b.cadence.toLowerCase()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>₹{(b.pricePaise / 100).toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-2" style={{ borderTop: "1px solid rgba(194,200,194,0.15)" }}>
                          <Link href="/training" onClick={gate} className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 tap-scale" style={{ background: "#02120a", color: "white", ...H }}>
                            Choose Bundle <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* SAMPLE placeholders — no real GroomingPackage/TrainingPackage exists yet, see NOT_BUILT.md */}
                    <div className="p-3 rounded-xl flex flex-col justify-between gap-2.5 opacity-70" style={{ background: "#ffffff", border: "1px dashed rgba(194,200,194,0.5)" }} title="Sample — create real packages via a provider dashboard">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#ffdbcd", color: "#904c2c", ...H }}>Sample</span>
                          <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#02120a" }}>Groom &amp; Glow Ritual (4 Sessions)</h4>
                          <p className="text-[10px] mt-0.5" style={{ color: "#424844" }}>Example only — no provider has created this yet</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>from ₹1,599</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl flex flex-col justify-between gap-2.5 opacity-70" style={{ background: "#ffffff", border: "1px dashed rgba(194,200,194,0.5)" }} title="Sample — create real packages via a provider dashboard">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#d2e8d9", color: "#0d1f16", ...H }}>Sample</span>
                          <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#02120a" }}>Master Manners &amp; Social (6 Sessions)</h4>
                          <p className="text-[10px] mt-0.5" style={{ color: "#424844" }}>Example only — no provider has created this yet</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>₹3,899</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {products.length > 0 && (
            <section className="px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="font-bold text-base tracking-tight" style={{ ...H, color: "#02120a" }}>Artisanal Accessories &amp; Essentials</h3>
                  <p className="text-[11px]" style={{ color: "#424844" }}>Handcrafted goods for your dog</p>
                </div>
                <Link href="/accessories" className="text-xs font-bold flex items-center shrink-0" style={{ color: "#904c2c" }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {products.slice(0, 6).map((p) => (
                  <div key={p.id} className="shrink-0 rounded-2xl p-2.5 flex flex-col justify-between" style={{ width: 156, background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div>
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2" style={{ background: "#f5f4e8" }}>
                        {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                      <h4 className="font-bold text-xs line-clamp-1" style={{ ...H, color: "#02120a" }}>{p.name}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1" style={{ borderTop: "1px solid rgba(194,200,194,0.15)" }}>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs" style={{ ...H, color: "#02120a" }}>₹{(p.price / 100).toFixed(0)}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-[9px] line-through" style={{ color: "#737874" }}>₹{(p.compareAtPrice / 100).toFixed(0)}</span>
                        )}
                      </div>
                      <Link href={`/accessories/${p.id}`} className="px-2.5 py-1 rounded-lg font-bold text-[11px] tap-scale" style={{ background: "#e9e9dd", color: "#02120a", ...H }}>
                        <Plus size={12} className="inline" /> ADD
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {providers.length > 0 && (
            <section className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base tracking-tight" style={{ ...H, color: "#02120a" }}>Pros Ready Right Now</h3>
                  <p className="text-[11px]" style={{ color: "#424844" }}>{verifiedCount} verified handlers in your network</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#efeee3", color: "#02120a", border: "1px solid rgba(194,200,194,0.3)" }}>
                  <SlidersHorizontal size={13} /> Filter
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {providers.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-2xl flex flex-col gap-3" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ boxShadow: "0 0 0 2px rgba(2,18,10,0.2)" }}>
                          {p.photoUrl ? <img src={p.photoUrl} alt={p.user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "#efeee3" }} />}
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full" style={{ background: "#10b981", border: "2px solid white" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm" style={{ ...H, color: "#02120a" }}>{p.user.name}</h4>
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#02120a", color: "white" }}>★ {p.ratingAvg.toFixed(2)}</span>
                          </div>
                          <p className="text-xs" style={{ color: "#424844" }}>{p._count.bookings} completed</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(194,200,194,0.15)" }}>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md font-bold text-[11px]" style={{ background: "#d2e8d9", color: "#0d1f16" }}>
                        <Clock size={14} />
                        <span>Available now</span>
                      </div>
                      <Link href="/walk-booking" onClick={gate} className="px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 tap-scale" style={{ background: "#02120a", color: "white", ...H }}>
                        Book <Zap size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="px-4 py-2">
            <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: "#f5f4e8", border: "1px solid rgba(194,200,194,0.3)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} color="#904c2c" />
                  <h3 className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>Barkado Assured Standard</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#d2e8d9", color: "#0d1f16", ...H }}>Coming Soon</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: BadgeCheck, label: "100% Vetted", sub: "Background checks" },
                  { icon: Radar, label: "Live GPS", sub: "Not built yet" },
                  { icon: HeartPulse, label: "Cashless Vet", sub: "Not built yet" },
                ].map((b) => (
                  <div key={b.label} className="p-2.5 rounded-xl flex flex-col items-center opacity-60" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)" }} title="Coming soon">
                    <b.icon size={20} color="#02120a" className="mb-1" />
                    <span className="font-bold text-[11px] leading-tight" style={{ ...H, color: "#02120a" }}>{b.label}</span>
                    <span className="text-[9px] mt-0.5" style={{ color: "#424844" }}>{b.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-2.5">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="font-bold text-sm tracking-tight" style={{ ...H, color: "#02120a" }}>Community Pack Meetups</h3>
                <p className="text-[11px]" style={{ color: "#424844" }}>Socialize your pet with neighborhood dogs</p>
              </div>
            </div>
          </section>
          <UpcomingEvents />

          <section className="px-4 py-2">
            <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: "rgba(255,218,214,0.4)", border: "1px solid rgba(186,26,26,0.25)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ba1a1a", color: "white" }}>
                  <PhoneCall size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-xs" style={{ ...H, color: "#93000a" }}>24/7 Urgent Pet Helpline</div>
                  <div className="text-[10px]" style={{ color: "rgba(147,0,10,0.8)" }}>Placeholder number for now</div>
                </div>
              </div>
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 shrink-0 tap-scale" style={{ background: "#ba1a1a", color: "white", ...H }}>
                Call SOS
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}