import Link from "next/link";
import Image from "next/image";
import { Show } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import BottomNav from "@/components/BottomNav";
import EmergencyButton from "@/components/EmergencyButton";
import OnboardingPrompt from "@/components/OnboardingPrompt";
import LocationHeader from "@/components/LocationHeader";
import CategoryTabs from "@/components/CategoryTabs";
import CuratedSearchBar from "@/components/CuratedSearchBar";
import UpcomingEvents from "@/components/UpcomingEvents";
import ThemeToggle from "@/components/ThemeToggle";
import ScrollReveal from "@/components/ScrollReveal";
import HeroImageRotator from "@/components/HeroImageRotator";
import ProfileMenu from "@/components/ProfileMenu";
import {
  PawPrint, Scissors, Stethoscope, Home as HomeIcon, ShoppingBag,
  Dumbbell, Plane, Heart, Star, ShieldCheck, ChevronRight, ShieldQuestion,
} from "lucide-react";

const SERVICES = [
  { title: "Adventure Walk", tag: "Dog walking", desc: "GPS-tracked walks with a verified handler who sends route and photo updates.", icon: PawPrint, price: "from ₹299", href: "/walk-booking", built: true },
  { title: "Luxury Spa Session", tag: "Grooming", desc: "Coat-specific bath, blow-out, nail and ear care.", icon: Scissors, price: "from ₹499", href: "/grooming", built: true },
  { title: "Care Consult", tag: "Vet & vaccines", desc: "We track every vaccine due date so you never forget.", icon: Stethoscope, price: "Included", href: "/owner/pets", built: true },
  { title: "Home Staycation", tag: "Sitting & boarding", desc: "In-home care with daily updates while you're away.", icon: HomeIcon, price: "from ₹899 / night", href: "/sitting", built: true },
  { title: "Good Manners Programme", tag: "Training", desc: "Force-free trainers for basics, leash work and reactivity.", icon: Dumbbell, price: "from ₹599", href: "/training", built: true },
  { title: "Tail Wind Travel", tag: "Travel & relocation", desc: "Pet-friendly stays and transfers, handled end to end.", icon: Plane, price: "Coming soon", href: "#", built: false },
  { title: "Forever Home Match", tag: "Adoption", desc: "Meet shelter dogs matched to your home and hours.", icon: Heart, price: "Coming soon", href: "#", built: false },
  { title: "The Curated Shelf", tag: "Accessories", desc: "Harnesses, beds, and everyday essentials for your pet.", icon: ShoppingBag, price: "from ₹249", href: "/accessories", built: true },
];

const PASSPORT_ITEMS = [
  "Vaccination history", "Medical records", "Microchip details",
  "Favorite treats", "Insurance & emergency contact", "Care history",
];

export default async function Home() {
  const [verifiedCount, providers, completedAgg, ratingAgg, products] = await Promise.all([
    prisma.provider.count({ where: { verified: true } }),
    prisma.provider.findMany({
      where: { verified: true },
      include: {
        user: { select: { name: true } },
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
      orderBy: { ratingAvg: "desc" },
      take: 3,
    }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.provider.aggregate({ where: { verified: true }, _avg: { ratingAvg: true } }),
    prisma.product.findMany({ where: { active: true }, take: 8, orderBy: { createdAt: "desc" } }),
  ]);

  const avgRating = ratingAgg._avg.ratingAvg;

  // Signed-in visitors see the homepage themed to their active pet, same as
  // every other page. Signed-out visitors get the default look.
  const user = await getOrCreateUser().catch(() => null);
  const pets = user ? await prisma.pet.findMany({ where: { ownerId: user.id } }) : [];
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0];
  const themeClass = resolveThemeClass(activePet);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px" }}>
    <main style={{ paddingBottom: 90 }}>
      <EmergencyButton />
      {user && <OnboardingPrompt needsPhone={!user.phone} needsAddress={!user.address} />}
      {/* ===== Nav ===== */}
      <nav className="flex justify-between items-center px-4 sm:px-6 pt-3 sm:pt-4 pb-2 max-w-6xl mx-auto">
        <Show when="signed-in">
          <LocationHeader
            currentAddressSnippet={user?.address ? user.address.split(",")[0] : null}
            userPhone={user?.phone ?? null}
          />
        </Show>
        <Show when="signed-out">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: "var(--muted)" }}>Barkado & Co.</span>
            <span className="text-base font-extrabold leading-tight">Book in a few taps</span>
            <Link href="/sign-in" className="flex items-center gap-1 mt-0.5 tap-scale w-fit">
              <span className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>Add address</span>
              <ChevronRight size={12} color="var(--terracotta)" />
            </Link>
          </div>
        </Show>
        <div className="flex gap-2 sm:gap-3 items-center">
          <ThemeToggle />
          <Show when="signed-out">
            <Link href="/sign-in" className="btn-primary text-xs sm:text-sm whitespace-nowrap">Sign in</Link>
          </Show>
          <Show when="signed-in">
            <Link href="/owner/dashboard" className="btn-primary text-xs sm:text-sm whitespace-nowrap">Book now</Link>
            <ProfileMenu />
          </Show>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-3">
        <CuratedSearchBar />
      </div>

      <CategoryTabs />

      {/* ===== Hero ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-3 grid md:grid-cols-2 gap-4 md:gap-10 items-center">
        <div className="animate-fade-up">
          {verifiedCount > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="trust-chip">
                <ShieldCheck size={12} /> {verifiedCount} verified provider{verifiedCount === 1 ? "" : "s"}
              </span>
              <Link href="/provider" className="trust-chip tap-scale" style={{ color: "var(--terracotta)" }}>
                Earn as a provider →
              </Link>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1.5 leading-tight">
            Everything your dog needs.
            <br />
            <span style={{ color: "var(--terracotta)" }}>One passport.</span>
          </h1>
          <p className="text-xs sm:text-sm mb-3 max-w-md" style={{ color: "var(--muted)" }}>
            Walks, vaccines, staycations & more — booked in taps, remembered forever.
          </p>
          <div className="flex gap-2.5 mb-3">
            <Link href="/book" className="btn-primary text-sm whitespace-nowrap">Book in a few taps</Link>
            <Link href="/owner/pets" className="btn-secondary text-sm whitespace-nowrap">Paw Passport</Link>
          </div>
          {avgRating !== null && avgRating > 0 && (
            <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <Star size={14} fill="var(--gold)" color="var(--gold)" />
              {avgRating.toFixed(2)} average
              {completedAgg > 0 && ` · ${completedAgg} bookings completed`}
              {" · "}Verified handlers
            </p>
          )}
        </div>
        {/* ===== Hero photo moment ===== */}
      <HeroImageRotator activeBreed={activePet?.breed} />
      </section>

      {/* ===== Offers — real, functioning, gradient cards (moved right after hero) ===== */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>Offers</p>
        <h2 className="text-2xl md:text-3xl font-bold mb-8">On us, and 10% off.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/book?service=WALKING"
            className="tap-scale rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg, #e8a94a 0%, #c97a56 100%)" }}
          >
            <p className="font-bold text-xl mb-1 text-white">Your dog's first walk is free 🎉</p>
            <p className="text-sm text-white/85">
              Automatically applied — no code needed. Just book your pet's first Adventure Walk.
            </p>
          </Link>
          <Link
            href="/accessories"
            className="tap-scale rounded-2xl p-6"
            style={{ background: "linear-gradient(135deg, #16281f 0%, #3a5c46 100%)" }}
          >
            <p className="font-bold text-xl mb-1 text-white">10% off accessories</p>
            <p className="text-sm text-white/85">
              Use code <span className="font-mono font-bold" style={{ color: "#e8a94a" }}>WELCOME10</span> at checkout.
            </p>
          </Link>
        </div>
      </section>
      </ScrollReveal>

      {/* ===== My pet needs... tap grid ===== */}

      {/* ===== Upcoming events ===== */}
      <UpcomingEvents />

{/* ===== Shop accessories — highlighted, maximum prominence ===== */}
      {products.length > 0 && (
        <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
          <div
            className="rounded-3xl p-6 md:p-10"
            style={{ background: "linear-gradient(180deg, var(--shelf-bg-start) 0%, var(--cream) 100%)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-end mb-8 flex-wrap gap-3">
              <div>
                <span className="trust-chip mb-3" style={{ background: "var(--terracotta)", color: "white", border: "none" }}>
                  🔥 The Curated Shelf
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-3">Shop accessories.</h2>
                <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                  Everyday essentials for your dog — picked to last.
                </p>
              </div>
              <Link href="/accessories" className="btn-primary tap-scale">
                See all accessories →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p, i) => (
                <Link href="/accessories" key={p.id} className="tap-scale rounded-2xl p-5 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  {i === 0 && (
                    <span
                      className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: "var(--gold)", color: "var(--forest)" }}
                    >
                      Bestseller
                    </span>
                  )}
                  <p className="font-semibold text-sm mb-1">{p.name}</p>
                  <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{p.category}</p>
                  <p className="font-bold text-base" style={{ color: "var(--terracotta)" }}>₹{(p.price / 100).toFixed(0)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* ===== The ecosystem — services grid ===== */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>The ecosystem</p>
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl md:text-3xl font-bold max-w-lg">Not a marketplace. An experience for every part of their week.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const Wrapper = s.built ? Link : "div";
            const wrapperProps = s.built ? { href: s.href } : {};
            return (
              <Wrapper
                key={s.title}
                {...(wrapperProps as any)}
                className={`card flex items-start justify-between gap-4 ${s.built ? "tap-scale" : ""}`}
                style={{ opacity: s.built ? 1 : 0.55 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                    <Icon size={20} color="var(--terracotta)" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.title}</p>
                    <p className="text-xs mb-1" style={{ color: "var(--terracotta)" }}>{s.tag}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{s.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--forest)" }}>{s.price}</span>
                  {s.built && <ChevronRight size={14} color="var(--muted)" />}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </section>
      </ScrollReveal>

      {/* ===== Paw Passport ===== */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <div className="card grid md:grid-cols-2 gap-8 items-center" style={{ background: "var(--panel-dark)", color: "white", border: "none" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--gold)" }}>Paw Passport</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Apple Health, for your dog.</h2>
            <p className="text-sm mb-6 text-white/75">
              Vaccination history, medical records, microchip details, and care history — in one profile, always up to date.
            </p>
            <ul className="space-y-2 mb-6">
              {PASSPORT_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                  <ShieldCheck size={15} color="var(--gold)" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/owner/pets" className="btn-accent inline-flex items-center gap-1.5">
              Open your pet's passport <ChevronRight size={15} />
            </Link>
          </div>
          <div className="img-frame relative shadow-sm" style={{ minHeight: 260 }}>
            <Image src="/images/hero-large.jpg" alt="Dog" fill sizes="500px" className="object-cover" />
          </div>
        </div>
      </section>
      </ScrollReveal>

      

      

      {/* ===== Trust — real verified providers ===== */}
      {providers.length > 0 && (
        <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--terracotta)" }}>Trust beats discounts</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Every pro is verified and reviewed.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-bold">{p.user.name}</p>
                  <span className="trust-chip" style={{ background: "var(--cream)" }}>
                    <Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>{p._count.bookings} completed</p>
                <span className="trust-chip">
                  <ShieldCheck size={11} /> Verified
                </span>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>
      )}

      {/* ===== Final CTA ===== */}
      <ScrollReveal>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <div className="rounded-3xl px-8 py-16 text-center" style={{ background: "var(--panel-dark)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: "var(--gold)" }}>One ecosystem</p>
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4 max-w-xl mx-auto">
            Give your dog the whole ecosystem.
          </h2>
          <p className="text-white/70 text-sm mb-8 max-w-md mx-auto">
            Free Paw Passport, verified pros, and everything your dog needs in one place.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up" className="btn-accent">Book your first service</Link>
            <Link href="/owner/pets" className="text-white/90 text-sm font-semibold self-center">Create a Paw Passport</Link>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ===== Footer ===== */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <PawPrint size={18} color="var(--terracotta)" />
          <span className="font-bold">Barkado & Co.</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Everything your dog needs. One passport.
        </p>
        <Link href="/provider" className="text-xs font-semibold tap-scale inline-block" style={{ color: "var(--terracotta)" }}>
          Become a provider →
        </Link>
      </footer>
      <BottomNav />
    </main>
    </div>
  );
}