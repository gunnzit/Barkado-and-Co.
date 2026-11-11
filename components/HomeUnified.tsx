"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  ArrowRight, ChevronRight, ShieldCheck, BadgeCheck, RotateCcw, CalendarClock,
  Syringe, Sparkles, Plus, Star, PawPrint, Lock, Undo2, Footprints, Scissors,
  GraduationCap, ShoppingBag, Share2, QrCode,
} from "lucide-react";
import MonogramMark from "@/components/MonogramMark";
import HomeMobileHeader from "@/components/HomeMobileHeader";
import { WagglesStrip, EarnBanner, ReviewsSection, SiteFooter, type HomeReview } from "@/components/HomeExtras";

/*
 * Home page — rebuilt around the four things Barkado & Co. actually sells:
 * Walking, Grooming, Training and the Shop. Every price, count and guarantee
 * on this page comes from real data or a real policy (see app/page.tsx and
 * /legal/refund). Sections with no real data hide themselves instead of
 * showing samples or placeholders.
 */

const H = { fontFamily: "var(--font-heading)" } as const;
const PLUM = "#6e1e3b";
const INK = "#3d1426";
const YELLOW = "#f9dd8a";
const IVORY = "#fbf0d9";
const MUTED = "#5e4752";
const CARD_SHADOW = "0 8px 24px -4px rgba(61,20,38,0.06)";

const SERVICE_NAME: Record<string, string> = { WALKING: "Walk", GROOMING: "Grooming", TRAINING: "Training", SITTING: "Sitting" };
const SERVICE_HREF: Record<string, string> = { WALKING: "/walk-booking", GROOMING: "/grooming", TRAINING: "/training", SITTING: "/sitting" };

type Prices = { walkFromPaise: number; walkFirstPaise: number | null; groomFromPaise: number | null; trainFromPaise: number | null };
type Counts = { walkers: number; groomers: number; trainers: number; products: number };
type Pro = { id: string; name: string; photoUrl: string; ratingAvg: number; completed: number; services: string[] };
type Product = { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[]; fits: boolean };
type Passport = { number: string; pct: number; next: string | null; shared: boolean };
type Upcoming = { id: string; type: string; startTime: Date; status: string; providerName: string; petName: string };
type LastCompleted = { type: string; providerName: string; petName: string; priceAmount: number };

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

function WaveEdge() {
  return <span className="brand-wave" aria-hidden="true" />;
}

function SectionTitle({ title, sub, href, cta }: { title: string; sub?: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>{title}</h2>
        {sub && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{sub}</p>}
      </div>
      {href && cta && (
        <Link href={href} className="text-xs font-bold underline underline-offset-2 shrink-0 pb-0.5" style={{ color: PLUM }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

export default function HomeUnified({
  isSignedIn,
  userName,
  userAddress,
  userPhone,
  cartCount,
  pawPointsBalance,
  pawPointsValuePaise,
  activePet,
  nextVaccine,
  upcoming,
  lastCompleted,
  prices,
  counts,
  featuredPros,
  products,
  reviews = [],
  passport = null,
}: {
  isSignedIn: boolean;
  userName: string | null;
  userAddress: string | null;
  userPhone: string | null;
  cartCount: number;
  pawPointsBalance: number;
  pawPointsValuePaise: number;
  activePet: { id: string; name: string; breed: string | null; photoUrl: string | null } | null;
  nextVaccine: { name: string; dueDate: Date } | null;
  upcoming: Upcoming | null;
  lastCompleted: LastCompleted | null;
  prices: Prices;
  counts: Counts;
  featuredPros: Pro[];
  products: Product[];
  reviews?: HomeReview[];
  passport?: Passport | null;
}) {
  const { openSignIn } = useClerk();
  const gate = (e: React.MouseEvent) => {
    if (!isSignedIn) {
      e.preventDefault();
      openSignIn();
    }
  };

  const isReturning = isSignedIn && (!!upcoming || !!lastCompleted);
  const petName = activePet?.name ?? null;
  const firstName = userName?.split(" ")[0] ?? null;

  const services = [
    {
      key: "WALKING",
      title: "Dog Walking",
      line: "30, 45 or 60 minutes with an ID-verified walker.",
      icon: Footprints,
      img: "/images/tab-walking.jpg",
      imgAlt: "A dog out on a leash walk",
      price: prices.walkFirstPaise
        ? { now: rupees(prices.walkFirstPaise), was: rupees(prices.walkFromPaise), note: "first walk" }
        : { now: rupees(prices.walkFromPaise), was: null, note: null },
      href: "/walk-booking",
      cta: "Book a walk",
      count: counts.walkers,
      noun: "walker",
    },
    {
      key: "GROOMING",
      title: "Home Grooming",
      line: "Bath, trim and tidy-up at your door, priced by your dog's size.",
      icon: Scissors,
      img: "/images/brand/golden-bandana.jpg",
      imgAlt: "A freshly groomed golden retriever",
      price: prices.groomFromPaise ? { now: rupees(prices.groomFromPaise), was: null, note: null } : null,
      href: "/grooming",
      cta: "Book grooming",
      count: counts.groomers,
      noun: "groomer",
    },
    {
      key: "TRAINING",
      title: "Training",
      line: "Puppy basics, manners and behaviour, with a trainer you choose.",
      icon: GraduationCap,
      img: "/images/hero-dog-german-shepherd.jpg",
      imgAlt: "An alert German shepherd mid-stride",
      price: prices.trainFromPaise ? { now: rupees(prices.trainFromPaise), was: null, note: null } : null,
      href: "/training",
      cta: "Find a trainer",
      count: counts.trainers,
      noun: "trainer",
    },
  ];
  const [walk, ...otherServices] = services;

  return (
    <div style={{ background: IVORY }}>
      <HomeMobileHeader userAddress={userAddress} userPhone={userPhone} cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

      <main className="w-full pt-2 pb-2" style={{ background: IVORY }}>
        <div className="max-w-2xl mx-auto w-full">

          {/* ===== Greeting + one-tap starts: everything fits on the first screen ===== */}
          <section className="px-4 pt-2 pb-2">
            <div className="enter-up flex items-end justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[13px]" style={{ color: MUTED }}>{firstName ? `Hi ${firstName},` : "Hello,"}</p>
                <h1 className="font-bold text-[24px] leading-tight tracking-tight truncate" style={{ ...H, color: PLUM }}>
                  {petName ? `What does ${petName} need today?` : "What does your dog need today?"}
                </h1>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { href: "/walk-booking", label: "Walk", img: "/images/tab-walking.jpg", price: rupees(prices.walkFirstPaise ?? prices.walkFromPaise), gated: true },
                { href: "/grooming", label: "Groom", img: "/images/brand/golden-bandana.jpg", price: prices.groomFromPaise ? rupees(prices.groomFromPaise) : null, gated: true },
                { href: "/training", label: "Train", img: "/images/hero-dog-german-shepherd.jpg", price: prices.trainFromPaise ? rupees(prices.trainFromPaise) : null, gated: true },
                { href: "/accessories", label: "Shop", img: "/images/brand/collar-plum.jpg", price: counts.products > 0 ? `${counts.products} items` : null, gated: false },
              ].map((t, i) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={t.gated ? gate : undefined}
                  className="enter-up hover-lift tap-scale flex flex-col items-center rounded-[1.25rem] pt-2 pb-2.5 px-1"
                  style={{ ["--d" as string]: `${40 + i * 40}ms`, background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}
                >
                  <span className="w-14 h-14 rounded-full overflow-hidden" style={{ boxShadow: `0 0 0 2px ${t.label === "Shop" ? PLUM : YELLOW}` }}>
                    <img src={t.img} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="mt-1.5 font-bold text-[13px] leading-tight" style={{ ...H, color: PLUM }}>{t.label}</span>
                  <span className="text-[10px] leading-tight" style={{ color: MUTED }}>{t.price ? (t.label === "Shop" ? t.price : `from ${t.price}`) : " "}</span>
                </Link>
              ))}
            </div>
            {prices.walkFirstPaise && !isReturning && (
              <Link href="/walk-booking" onClick={gate} className="enter-up tap-scale mt-2.5 flex items-center justify-between gap-2 rounded-full pl-4 pr-1.5 py-1.5" style={{ ["--d" as string]: "200ms", background: YELLOW }}>
                <span className="text-xs font-bold truncate" style={{ color: INK }}>
                  First walk <span style={{ color: PLUM }}>{rupees(prices.walkFirstPaise)}</span> <span className="line-through opacity-60">{rupees(prices.walkFromPaise)}</span> · 10% off
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: PLUM, color: "white", ...H }}>
                  Book <ArrowRight size={12} />
                </span>
              </Link>
            )}
          </section>

          {/* ===== Returning customer: what's next for their dog ===== */}
          {isSignedIn && (upcoming || lastCompleted) && (
            <section className="enter-up px-4 pt-1 pb-1 space-y-2.5">
              {upcoming && (
                <Link href="/owner/bookings" className="flex items-center gap-3 p-4 rounded-[1.75rem] tap-scale" style={{ background: "#ffffff", border: `1.5px solid ${PLUM}`, boxShadow: CARD_SHADOW }}>
                  <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: YELLOW }}>
                    <CalendarClock size={20} color={PLUM} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                      {upcoming.status === "IN_PROGRESS" ? "Happening now" : upcoming.status === "REQUESTED" ? "Waiting for confirmation" : "Coming up"}
                    </p>
                    <p className="font-bold text-[15px] leading-snug truncate" style={{ ...H, color: INK }}>
                      {SERVICE_NAME[upcoming.type]} for {upcoming.petName} with {upcoming.providerName.split(" ")[0]}
                    </p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      {new Date(upcoming.startTime).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronRight size={18} color={PLUM} className="shrink-0" />
                </Link>
              )}

              {!upcoming && lastCompleted && (
                <div className="flex items-center gap-3 p-4 rounded-[1.75rem]" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Last time</p>
                    <p className="font-bold text-[15px] leading-snug truncate" style={{ ...H, color: INK }}>
                      {SERVICE_NAME[lastCompleted.type]} for {lastCompleted.petName} with {lastCompleted.providerName.split(" ")[0]}
                    </p>
                    <p className="text-xs" style={{ color: MUTED }}>{rupees(lastCompleted.priceAmount)}</p>
                  </div>
                  <Link href={SERVICE_HREF[lastCompleted.type]} className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tap-scale" style={{ background: PLUM, color: "white", ...H }}>
                    <RotateCcw size={14} /> Book again
                  </Link>
                </div>
              )}

            </section>
          )}

          {/* ===== PawPassport: one slim row, what only Barkado has ===== */}
          <section className="px-4 py-2">
            {activePet && passport ? (
              <div className="enter-up relative overflow-hidden flex items-center gap-3 rounded-[1.5rem] p-3 pr-2" style={{ ["--d" as string]: "160ms", background: PLUM, boxShadow: "0 10px 24px -12px rgba(110,30,59,0.55)" }}>
                <Link href={`/owner/pets/${activePet.id}`} className="flex items-center gap-3 min-w-0 flex-1 tap-scale" aria-label={`Open ${activePet.name}'s PawPassport`}>
                  <span className="block w-12 h-12 rounded-full p-[2px] shrink-0" style={{ background: YELLOW }}>
                    {activePet.photoUrl ? (
                      <img src={activePet.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "#5a1830" }}><PawPrint size={18} color={YELLOW} /></span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: YELLOW }}>PawPassport</span>
                    <span className="block font-bold text-[15px] leading-tight truncate" style={{ ...H, color: "#fffaf0" }}>{activePet.name}</span>
                    <span className="block text-[11px] truncate" style={{ color: "rgba(251,240,217,0.8)" }}>
                      {nextVaccine
                        ? `${nextVaccine.name} ${new Date(nextVaccine.dueDate) < new Date() ? "is overdue" : `due ${new Date(nextVaccine.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}`
                        : passport.pct < 100
                          ? `${passport.pct}% done · ${passport.next ? passport.next.toLowerCase() : ""}`
                          : "Complete"}
                    </span>
                  </span>
                </Link>
                <Link href={`/owner/pets/${activePet.id}?share=1`} aria-label={`Share ${activePet.name}'s PawPassport`} className="tap-scale shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: YELLOW }}>
                  <Share2 size={16} color={PLUM} />
                </Link>
                {passport.pct < 100 && (
                  <span className="absolute left-0 bottom-0 h-[3px] origin-left bar-in" style={{ width: "100%", background: YELLOW, transform: `scaleX(${passport.pct / 100})` }} aria-hidden="true" />
                )}
              </div>
            ) : (
              <Link href={isSignedIn ? "/owner/pets/new" : "/owner/pets"} onClick={gate} className="enter-up tap-scale flex items-center gap-3 rounded-[1.5rem] p-3 pr-3.5" style={{ ["--d" as string]: "160ms", background: PLUM, boxShadow: "0 10px 24px -12px rgba(110,30,59,0.55)" }}>
                <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: YELLOW }}><QrCode size={20} color={PLUM} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: YELLOW }}>Free · only at Barkado</span>
                  <span className="block font-bold text-[15px] leading-tight" style={{ ...H, color: "#fffaf0" }}>Get your dog a PawPassport</span>
                  <span className="block text-[11px] truncate" style={{ color: "rgba(251,240,217,0.8)" }}>Vaccine reminders, QR share, visit stamps</span>
                </span>
                <ChevronRight size={18} color={YELLOW} className="shrink-0" />
              </Link>
            )}
          </section>

          {/* ===== Shop: a swipeable row, sized for the dog where we know it ===== */}
          {products.length > 0 && (
            <section className="pt-3 pb-2">
              <div className="px-4">
                <SectionTitle
                  title={petName && products.some((p) => p.fits) ? `Shop for ${petName}` : "From the Shop"}
                  sub="Free delivery over ₹500"
                  href="/accessories"
                  cta={counts.products > products.length ? `See all ${counts.products}` : "See all"}
                />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 scroll-px-4 pb-2 snap-x">
                {products.map((p, i) => (
                  <Link key={p.id} href={`/accessories/${p.id}`} className="enter-up hover-lift tap-scale shrink-0 snap-start w-[138px] rounded-[1.25rem] p-2" style={{ ["--d" as string]: `${120 + i * 40}ms`, background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}>
                    <div className="relative img-frame aspect-square !rounded-[0.9rem] flex items-center justify-center" style={{ background: "#fef3dc" }}>
                      {p.imageUrls[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <MonogramMark className="w-10 h-10 opacity-30" color={PLUM} title="" />
                      )}
                      {p.fits && petName && (
                        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: YELLOW, color: INK }}>
                          <PawPrint size={9} /> Fits {petName}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-[13px] line-clamp-1 mt-2 px-0.5" style={{ ...H, color: PLUM }}>{p.name}</p>
                    <div className="flex items-center justify-between mt-0.5 px-0.5">
                      <span className="text-[13px]" style={{ color: INK }}>
                        <span className="font-bold" style={H}>{rupees(p.price)}</span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && <span className="ml-1 text-[10px] line-through" style={{ color: MUTED }}>{rupees(p.compareAtPrice)}</span>}
                      </span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: PLUM, color: "white" }} aria-hidden="true"><Plus size={12} /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ===== The three services ===== */}
          <section className="px-4 py-3">
            <SectionTitle title={isReturning ? "Book again" : "Care at your door"} sub="Walking, grooming and training, booked in a few taps" />

            {/* Walking leads — the most frequent, most repeatable service */}
            <Link href={walk.href} onClick={gate} className="enter-up hover-lift block relative overflow-hidden rounded-[1.75rem] mb-3 tap-scale" style={{ ["--d" as string]: "120ms", background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}>
              <div className="img-frame !rounded-none relative h-40">
                <img src={walk.img} alt={walk.imgAlt} className="w-full h-full object-cover object-[center_78%]" />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: YELLOW, color: INK }}>
                  <walk.icon size={13} /> Most booked
                </span>
              </div>
              <div className="p-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg leading-tight" style={{ ...H, color: PLUM }}>{walk.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{walk.line}</p>
                  {walk.price && (
                    <p className="mt-2 text-sm" style={{ color: INK }}>
                      from <span className="font-bold text-base" style={H}>{walk.price.now}</span>
                      {walk.price.was && <span className="ml-1 text-xs line-through" style={{ color: MUTED }}>{walk.price.was}</span>}
                      {walk.price.note && <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#dbe5f3" }}>{walk.price.note}</span>}
                    </p>
                  )}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-bold" style={{ background: PLUM, color: "white", ...H }}>
                  {walk.cta} <ArrowRight size={13} />
                </span>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              {otherServices.map((s, i) => (
                <Link key={s.key} href={s.href} onClick={gate} className="enter-up hover-lift flex flex-col overflow-hidden rounded-[1.5rem] tap-scale" style={{ ["--d" as string]: `${180 + i * 50}ms`, background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}>
                  <div className="img-frame !rounded-none h-28">
                    <img src={s.img} alt={s.imgAlt} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-[15px] leading-tight flex items-center gap-1.5" style={{ ...H, color: PLUM }}>
                      <s.icon size={15} /> {s.title}
                    </h3>
                    <p className="text-[11px] mt-1 leading-snug" style={{ color: MUTED }}>{s.line}</p>
                    <div className="mt-auto pt-2.5 flex items-center justify-between gap-1">
                      <span className="text-xs" style={{ color: INK }}>
                        {s.price ? <>from <span className="font-bold text-sm" style={H}>{s.price.now}</span></> : <span style={{ color: MUTED }}>See prices</span>}
                      </span>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: PLUM, color: "white" }} aria-hidden="true">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <WagglesStrip />

          {/* ===== How it works + real guarantees (new visitors) ===== */}
          {!isReturning && (
            <section className="px-4 py-3">
              <div className="enter-up relative overflow-hidden rounded-[1.75rem] p-5" style={{ ["--d" as string]: "280ms", background: "#e4ebf6", border: "1px solid rgba(61,20,38,0.06)" }}>
                {/* Paw-print trail walking across the corner (brand motif) */}
                <span className="absolute right-3 top-3 flex gap-1.5 rotate-[-18deg] pointer-events-none" aria-hidden="true">
                  {[0, 1, 2, 3].map((n) => (
                    <PawPrint key={n} size={14} color="rgba(110,30,59,0.18)" style={{ transform: `translateY(${n % 2 ? 6 : 0}px) rotate(${n % 2 ? 12 : -12}deg)` }} />
                  ))}
                </span>
                <h2 className="font-bold text-[20px] leading-7 tracking-tight mb-3" style={{ ...H, color: PLUM }}>How it works</h2>
                <ol className="space-y-3">
                  {[
                    { t: "Pick a service and a time", d: "Walking, grooming or training, at a slot that suits you." },
                    { t: "Choose a verified pro", d: "See their rating and completed bookings before you pick." },
                    { t: "Pay securely and relax", d: "Track the booking in the app and rebook in one tap." },
                  ].map((step, i) => (
                    <li key={step.t} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: YELLOW, color: INK, border: `2px solid ${PLUM}`, ...H }}>{i + 1}</span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: INK }}>{step.t}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{step.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.7)" }}>
                  {[
                    { icon: ShieldCheck, t: "ID-verified pros", d: "Checked before going live" },
                    { icon: Undo2, t: "Cancel any time", d: "Full refund before it starts" },
                    { icon: Lock, t: "Secure payments", d: "Processed by Razorpay" },
                  ].map((g) => (
                    <div key={g.t} className="flex flex-col items-center text-center gap-1">
                      <g.icon size={18} color={PLUM} />
                      <span className="font-bold text-[11px] leading-tight" style={{ color: INK }}>{g.t}</span>
                      <span className="text-[10px] leading-tight" style={{ color: MUTED }}>{g.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ===== Pros — only with real photos and real ratings ===== */}
          {featuredPros.length > 0 ? (
            <section className="px-4 py-3">
              <SectionTitle title="Top-rated pros" sub="Real ratings from Barkado bookings" />
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {featuredPros.map((p) => (
                  <Link key={p.id} href={`/provider/${p.id}`} className="hover-lift shrink-0 w-40 p-3 rounded-[1.5rem] text-center tap-scale" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: CARD_SHADOW }}>
                    <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover mx-auto" style={{ boxShadow: `0 0 0 2px ${YELLOW}` }} />
                    <p className="font-bold text-sm mt-2 flex items-center justify-center gap-1 truncate" style={{ ...H, color: PLUM }}>
                      {p.name.split(" ")[0]} <BadgeCheck size={14} color="#a5bde1" />
                    </p>
                    <p className="text-xs flex items-center justify-center gap-1" style={{ color: MUTED }}>
                      <Star size={11} fill="#e9b949" color="#e9b949" /> {p.ratingAvg.toFixed(1)} · {p.completed} done
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: MUTED }}>{p.services.map((s) => SERVICE_NAME[s]).join(" · ")}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : counts.walkers + counts.groomers + counts.trainers > 0 ? (
            <section className="px-4 py-2">
              <p className="flex items-center justify-center gap-1.5 text-xs text-center" style={{ color: MUTED }}>
                <ShieldCheck size={14} color={PLUM} />
                {[
                  counts.walkers > 0 && `${counts.walkers} walker${counts.walkers === 1 ? "" : "s"}`,
                  counts.groomers > 0 && `${counts.groomers} groomer${counts.groomers === 1 ? "" : "s"}`,
                  counts.trainers > 0 && `${counts.trainers} trainer${counts.trainers === 1 ? "" : "s"}`,
                ].filter(Boolean).join(", ")}{" "}
                ID-verified and ready to book
              </p>
            </section>
          ) : null}

          <ReviewsSection reviews={reviews} />



          <EarnBanner />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
