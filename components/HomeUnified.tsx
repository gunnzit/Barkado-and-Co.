"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  RotateCcw, History, Footprints, Bath, Stethoscope, Utensils,
  GraduationCap, Home as HomeIcon, BadgeCheck, ArrowRight,
  ChevronRight, ShieldCheck, MapPin, PhoneCall, Plus, Star, Check, PawPrint, MoreVertical,
} from "lucide-react";
import EmergencyButton from "@/components/EmergencyButton";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import UpcomingEvents from "@/components/UpcomingEvents";
import PetSwitcher from "@/components/PetSwitcher";
import { derivePassportNumber } from "@/lib/passportId";
import { formatPetAge } from "@/lib/petAge";
import { vaccineStatusChip } from "@/lib/petVaccineStatus";

const H = { fontFamily: "var(--font-heading)" } as const;
const SUPPORT_PHONE = "+91 00000 00000";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
};
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", SITTING: "/sitting", GROOMING: "/grooming", TRAINING: "/training" };

// Service grid from the Stitch "Home" design (design/stitch/01-home). No speed or
// discount badges: none of those promises are backed by real dispatch data yet.
const SERVICES = [
  { label: "Dog Walks", icon: Footprints, href: "/walk-booking" },
  { label: "Home Spa", icon: Bath, href: "/grooming" },
  { label: "Vet at Home", icon: Stethoscope, href: "/owner/pets" },
  { label: "Training", icon: GraduationCap, href: "/training" },
  { label: "Staycation", icon: HomeIcon, href: "/sitting" },
  { label: "Shop", icon: Utensils, href: "/accessories" },
];

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const YELLOW = "#f9dd8a";
const IVORY = "#fbf0d9";
const CARD_SHADOW = "0 8px 24px -4px rgba(61,20,38,0.06)";

/** Golden-yellow wavy band — the brand's signature edge for plum panels. */
function WaveBand({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 10 C 50 0, 100 20, 150 10 S 250 0, 300 10 S 380 20, 400 8 L400 24 L0 24 Z" fill={YELLOW} />
    </svg>
  );
}

type Pet = {
  id: string; name: string; breed: string | null; photoUrl: string | null;
  birthday: Date | null; microchipId: string | null; size: string;
  gender?: string | null; weightKg?: number | null;
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

  const age = activePet ? formatPetAge(activePet.birthday) : null;
  const vChip = activePet ? vaccineStatusChip(activePet.vaccinations) : null;

  return (
    <div style={{ background: IVORY }}>
      <EmergencyButton />
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      <main className="flex flex-col relative w-full pt-2 pb-24" style={{ background: IVORY }}>
        <div className="max-w-6xl mx-auto w-full">

          {/* Hero — plum card, cut-out dog, golden wave (Stitch Home) */}
          <section className="px-4 pt-2 pb-3">
            <div className="relative overflow-hidden rounded-[2rem]" style={{ background: PLUM, boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
              <PawPrint size={150} className="absolute -top-6 -right-6 pointer-events-none" style={{ color: "rgba(255,255,255,0.07)" }} aria-hidden="true" />
              <div className="relative z-10 flex items-end justify-between gap-2 pl-5 pr-3 pt-5 pb-8">
                <div className="flex-1 min-w-0 pb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: YELLOW, color: INK }}>
                    <PawPrint size={11} /> Chandigarh
                  </span>
                  <h1 className="mt-2 text-[28px] leading-[1.1] font-bold tracking-tight text-white" style={H}>
                    A Hug in every Paw
                  </h1>
                  <p className="mt-1.5 text-xs leading-snug" style={{ color: "rgba(251,240,217,0.85)" }}>
                    Verified walkers, groomers and sitters at your doorstep.
                  </p>
                  <Link href="/walk-booking" onClick={gate} className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold shadow-md tap-scale" style={{ background: YELLOW, color: INK, ...H }}>
                    Book a walk <ArrowRight size={15} />
                  </Link>
                </div>
                <img src="/images/brand/hero-golden.jpg" alt="Happy golden retriever with its tongue out" className="w-32 h-40 sm:w-44 sm:h-52 object-cover rounded-2xl shrink-0" style={{ boxShadow: "0 8px 16px rgba(0,0,0,0.25)" }} />
              </div>
              <WaveBand className="absolute bottom-0 left-0 w-full h-5" />
            </div>
          </section>

          {activeProviderCount > 0 && (
            <div className="px-4 py-2">
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl" style={{ background: "#6e1e3b", color: "white" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34d399" }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#10b981" }} />
                  </span>
                  <div className="truncate text-xs">
                    <span className="font-bold text-white">{activeProviderCount} Pro{activeProviderCount === 1 ? "" : "s"} active</span>
                    <span style={{ color: "rgba(240,224,200,0.8)" }}> around your area</span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: "#6e1e3b", color: "white", ...H }} title="Not a real ETA yet">
                  ⚡ ETA
                </span>
              </div>
            </div>
          )}

          <section className="px-4 pt-2 pb-2.5">
            {activePet ? (
              <div className="relative overflow-hidden rounded-[1.75rem] p-4" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.06)", boxShadow: CARD_SHADOW }}>
                <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ background: PLUM }} />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-3">
                    <PetSwitcher display="viewing" hideThemeSwitch />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: "#6e1e3b", color: "#fff8ec" }}>Active</span>
                      <Link href={`/owner/pets/${activePet.id}`} onClick={gate} className="w-7 h-7 rounded-lg flex items-center justify-center" aria-label="Pet options">
                        <MoreVertical size={16} color="#a29887" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: "#ebe5d8", border: "2px solid white", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        {activePet.photoUrl ? <img src={activePet.photoUrl} alt={activePet.name} className="w-full h-full object-cover" /> : <PawPrint size={22} color="#a29887" />}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full" style={{ border: "2px solid #1e8e47", background: "white" }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#6f6759" }}>
                        {[activePet.breed ?? "Mixed", activePet.gender ? (activePet.gender === "MALE" ? "Male" : "Female") : null].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#8f8574" }}>
                        {[age, activePet.weightKg ? `${activePet.weightKg} kg` : null].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #f2ece1" }}>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#dbe5f3", color: INK }}>
                      <Check size={11} /> PawPassport™ #{derivePassportNumber(activePet.id)}
                    </span>
                    {vChip && (
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: "#faf2e6", color: "#a6611b", border: "1px solid #f2e0c7" }}>
                        {vChip.text}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3.5 pt-2" style={{ borderTop: "1px solid #f5f0e6" }}>
                    {rebookCandidate ? (
                      <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: "#877d6d" }}>
                        <MapPin size={11} /> Next: {SERVICE_LABEL[rebookCandidate.type]}
                        {rebookCandidate.startTime ? ` ${rebookCandidate.startTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : ""}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Link href={`/owner/pets/${activePet.id}`} onClick={gate} className="inline-flex items-center text-xs font-bold tap-scale ml-auto" style={{ color: "#2a0c18" }}>
                      Passport &amp; Care <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/owner/pets" onClick={gate} className="relative overflow-hidden rounded-[1.75rem] p-4 flex items-center gap-3 tap-scale" style={{ background: "#fef3dc", border: "1px solid rgba(61,20,38,0.06)", boxShadow: CARD_SHADOW }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#dbe5f3" }}>
                  <BadgeCheck size={22} color={PLUM} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[17px] leading-tight" style={{ ...H, color: PLUM }}>Paw Passport</p>
                  <p className="text-xs mt-0.5" style={{ color: "#5e4752" }}>
                    {isSignedIn ? "Add your dog to keep vaccines, care notes and walks in one place." : "Sign in to create your dog's Paw Passport: vaccines, care notes and walks in one place."}
                  </p>
                </div>
                <ChevronRight size={18} color={PLUM} className="shrink-0" />
              </Link>
            )}

            {rebookCandidate && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl mt-2.5" style={{ background: "#fbf0d9", border: "1px solid rgba(227,207,196,0.3)" }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-bold truncate" style={{ ...H, color: "#2a0c18" }}>
                    <History size={14} color="#6e1e3b" />
                    <span>{SERVICE_LABEL[rebookCandidate.type]}</span>
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "#5e4752" }}>
                    {rebookCandidate.startTime ? rebookCandidate.startTime.toLocaleString("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" }) : ""}
                    {rebookCandidate.provider ? ` with ${rebookCandidate.provider.user.name}` : ""}
                    {rebookCandidate.priceAmount ? ` • ₹${(rebookCandidate.priceAmount / 100).toFixed(0)}` : ""}
                  </div>
                </div>
                <Link href={SERVICE_HREF[rebookCandidate.type]} onClick={gate} className="shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 tap-scale" style={{ background: "#6e1e3b", color: "white", ...H }}>
                  <RotateCcw size={14} /> 1-Tap Rebook
                </Link>
              </div>
            )}
          </section>

          <section className="px-4 py-3">
            <div className="mb-2.5">
              <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>Our Services</h2>
              <p className="text-xs" style={{ color: "#5e4752" }}>Crafted for wagging tails</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {SERVICES.map((o) => {
                const Icon = o.icon;
                return (
                  <Link key={o.label} href={o.href} onClick={gate} className="flex flex-col items-center text-center p-3 rounded-2xl tap-scale transition-shadow hover:shadow-md" style={{ background: "#ffffff", boxShadow: CARD_SHADOW }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2" style={{ background: "#f8edd6" }}>
                      <Icon size={21} color={PLUM} />
                    </div>
                    <span className="font-bold text-xs leading-tight" style={{ ...H, color: PLUM }}>{o.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="px-4 py-2.5">
            <div className="p-4 rounded-[1.75rem] flex flex-col gap-3.5" style={{ background: "#fef3dc", border: "1px solid rgba(61,20,38,0.06)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>Care Bundles</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "#5e4752" }}>
                    {(groomingBundles.length > 0 || trainingBundles.length > 0) ? "Real multi-session packages from your local providers." : "Sample layout — no real packages created yet."}
                  </p>
                </div>
                <Link href="/grooming" onClick={gate} className="shrink-0 text-xs font-bold flex items-center gap-0.5 pt-1" style={{ color: "#6e1e3b" }}>
                  All Bundles <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {(groomingBundles.length > 0 || trainingBundles.length > 0) ? (
                  <>
                    {groomingBundles.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl flex flex-col justify-between gap-2.5" style={{ background: "#ffffff", border: "1px solid rgba(227,207,196,0.25)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#f9dd8a", color: "#6e1e3b", ...H }}>Bundle</span>
                            <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#2a0c18" }}>{b.name}</h4>
                            <p className="text-[10px] mt-0.5" style={{ color: "#5e4752" }}>{b.providerName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-sm" style={{ ...H, color: "#2a0c18" }}>from ₹{(b.startingPricePaise / 100).toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-2" style={{ borderTop: "1px solid rgba(227,207,196,0.15)" }}>
                          <Link href="/grooming" onClick={gate} className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 tap-scale" style={{ background: "#6e1e3b", color: "white", ...H }}>
                            Choose Bundle <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                    {trainingBundles.map((b) => (
                      <div key={b.id} className="p-3 rounded-xl flex flex-col justify-between gap-2.5" style={{ background: "#ffffff", border: "1px solid rgba(227,207,196,0.25)" }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#dbe5f3", color: "#24101a", ...H }}>Bundle</span>
                            <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#2a0c18" }}>{b.name}</h4>
                            <p className="text-[10px] mt-0.5" style={{ color: "#5e4752" }}>{b.providerName} · {b.cadence.toLowerCase()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-sm" style={{ ...H, color: "#2a0c18" }}>₹{(b.pricePaise / 100).toFixed(0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-2" style={{ borderTop: "1px solid rgba(227,207,196,0.15)" }}>
                          <Link href="/training" onClick={gate} className="px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 tap-scale" style={{ background: "#6e1e3b", color: "white", ...H }}>
                            Choose Bundle <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl flex flex-col justify-between gap-2.5 opacity-70" style={{ background: "#ffffff", border: "1px dashed rgba(227,207,196,0.5)" }} title="Sample — create real packages via a provider dashboard">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#f9dd8a", color: "#6e1e3b", ...H }}>Sample</span>
                          <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#2a0c18" }}>Groom &amp; Glow Ritual (4 Sessions)</h4>
                          <p className="text-[10px] mt-0.5" style={{ color: "#5e4752" }}>Example only — no provider has created this yet</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-sm" style={{ ...H, color: "#2a0c18" }}>from ₹1,599</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl flex flex-col justify-between gap-2.5 opacity-70" style={{ background: "#ffffff", border: "1px dashed rgba(227,207,196,0.5)" }} title="Sample — create real packages via a provider dashboard">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase" style={{ background: "#dbe5f3", color: "#24101a", ...H }}>Sample</span>
                          <h4 className="font-bold text-sm leading-snug mt-1" style={{ ...H, color: "#2a0c18" }}>Master Manners &amp; Social (6 Sessions)</h4>
                          <p className="text-[10px] mt-0.5" style={{ color: "#5e4752" }}>Example only — no provider has created this yet</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-sm" style={{ ...H, color: "#2a0c18" }}>₹3,899</div>
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
                  <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>Artisanal Accessories</h2>
                  <p className="text-xs" style={{ color: "#5e4752" }}>Handcrafted goods for your dog</p>
                </div>
                <Link href="/accessories" className="text-xs font-bold underline underline-offset-2 shrink-0" style={{ color: PLUM }}>
                  Catalog
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {products.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/accessories/${p.id}`} className="shrink-0 rounded-[1.5rem] p-2.5 flex flex-col justify-between tap-scale" style={{ width: 160, background: "#ffffff", border: "1px solid rgba(61,20,38,0.06)", boxShadow: CARD_SHADOW }}>
                    <div className="img-frame relative w-full h-32 !rounded-2xl mb-2" style={{ background: IVORY }}>
                      {p.imageUrls[0] ? <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><PawPrint size={26} color="rgba(110,30,59,0.25)" /></div>}
                    </div>
                    <h4 className="font-bold text-sm line-clamp-1 px-0.5" style={{ ...H, color: PLUM }}>{p.name}</h4>
                    <div className="flex items-center justify-between mt-1.5 px-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-sm" style={{ ...H, color: INK }}>₹{(p.price / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="text-[10px] line-through" style={{ color: "#735c68" }}>₹{(p.compareAtPrice / 100).toFixed(0)}</span>
                        )}
                      </div>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: PLUM, color: "white" }} aria-hidden="true">
                        <Plus size={16} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {providers.length > 0 && (
            <section className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>Pros ready near you</h2>
                  <p className="text-xs" style={{ color: "#5e4752" }}>{verifiedCount} verified caregiver{verifiedCount === 1 ? "" : "s"} in your network</p>
                </div>
                <Link href="/walk-booking" onClick={gate} className="text-xs font-bold underline underline-offset-2 shrink-0" style={{ color: PLUM }}>
                  View all
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {providers.map((p) => (
                  <div key={p.id} className="p-4 rounded-[1.75rem] flex flex-col gap-3" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.06)", boxShadow: CARD_SHADOW }}>
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0" style={{ boxShadow: `0 0 0 2px ${YELLOW}` }}>
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "#f8edd6" }}><PawPrint size={20} color={PLUM} /></div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base truncate" style={{ ...H, color: PLUM }}>{p.user.name}</h4>
                          <BadgeCheck size={16} color="#a5bde1" className="shrink-0" aria-label="Verified" />
                        </div>
                        <p className="text-xs flex items-center gap-1" style={{ color: "#5e4752" }}>
                          <Star size={12} fill="#e9b949" color="#e9b949" />
                          <span className="font-semibold" style={{ color: INK }}>{p.ratingAvg > 0 ? p.ratingAvg.toFixed(2) : "New"}</span>
                          <span>· {p._count.bookings} completed</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: YELLOW, color: INK }}>
                        <ShieldCheck size={13} /> ID verified
                      </span>
                      <Link href="/walk-booking" onClick={gate} className="px-5 py-2 rounded-full font-bold text-xs shadow-sm flex items-center gap-1 tap-scale" style={{ background: PLUM, color: "white", ...H }}>
                        Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="px-4 py-2">
            {/* Trust strip (Stitch Home). Only claims the product backs today. */}
            <div className="grid grid-cols-3 rounded-[1.75rem] py-3" style={{ background: "#fef3dc", border: "1px solid rgba(61,20,38,0.06)" }}>
              {[
                { icon: ShieldCheck, label: "ID-verified pros" },
                { icon: BadgeCheck, label: "Paw Passport records" },
                { icon: Check, label: "Secure payments" },
              ].map((b, i) => (
                <div key={b.label} className="flex flex-col items-center text-center gap-1 px-1" style={i > 0 ? { borderLeft: "1px solid rgba(61,20,38,0.1)" } : undefined}>
                  <b.icon size={18} color={PLUM} />
                  <span className="font-semibold text-[11px] leading-tight" style={{ color: INK }}>{b.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="px-4 py-2.5">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>Community Pack Meetups</h2>
                <p className="text-[11px]" style={{ color: "#5e4752" }}>Socialize your pet with neighborhood dogs</p>
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