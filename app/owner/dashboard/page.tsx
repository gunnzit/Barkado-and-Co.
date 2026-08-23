import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import EmergencyButton from "@/components/EmergencyButton";
import OnboardingPrompt from "@/components/OnboardingPrompt";
import WalkHero from "@/components/WalkHero";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import LocationHeader from "@/components/LocationHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { resolveThemeClass } from "@/lib/breedTheme";
import { getMascotPath } from "@/lib/mascotImage";
import { Search, Syringe, Home as HomeIcon, PawPrint, ChevronRight, Star, ShieldCheck, RotateCcw, ShoppingBag } from "lucide-react";

export default async function OwnerDashboard() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [pets, bookings, allBookingsForRebook, upcomingVaccines, providers, bestSellers, walksThisWeek] = await Promise.all([
    prisma.pet.findMany({ where: { ownerId: user.id } }),
    prisma.booking.findMany({
      where: { ownerId: user.id, type: "WALKING" },
      include: { provider: { include: { user: true } }, pet: true },
      orderBy: { startTime: "desc" },
      take: 4,
    }),
    prisma.booking.findMany({
      where: { ownerId: user.id, type: "WALKING" },
      include: { provider: { include: { user: true } }, pet: true },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
    prisma.vaccination.findMany({
      where: { pet: { ownerId: user.id }, nextDueDate: { lte: new Date(Date.now() + 30 * 86400000) } },
      include: { pet: true },
      orderBy: { nextDueDate: "asc" },
    }),
    prisma.provider.findMany({
      where: { verified: true },
      include: {
        user: { select: { name: true } },
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
      orderBy: { ratingAvg: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { orderItems: { _count: "desc" } },
      take: 4,
    }),
    prisma.booking.count({
      where: {
        ownerId: user.id,
        type: "WALKING",
        status: "COMPLETED",
        startTime: { gte: new Date(Date.now() - 7 * 86400000) },
      },
    }),
  ]);

  const seen = new Set<string>();
  const rebookOptions = allBookingsForRebook.filter((b) => {
    const key = `${b.providerId}-${b.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);

  const firstName = user.name.split(" ")[0];
  const photos = ["/images/tab-walking.jpg", "/images/tab-sitting.jpg", "/images/tab-community.jpg", "/images/promo-first-walk.jpg"];
  const PRODUCT_ICON_EMOJI: Record<string, string> = {
    leash: "🦮", collar: "🔵", bowl: "🥣", toy: "🦴", bed: "🛏️", carrier: "🧳",
  };

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0];
  const themeClass = resolveThemeClass(activePet);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
    <main className="pb-28 max-w-2xl mx-auto">
      <EmergencyButton />
      <OnboardingPrompt needsPhone={!user.phone} needsAddress={!user.address} />
      <nav className="flex justify-between items-center px-6 pt-4">
        <LocationHeader
          headline="Book a walker"
          currentAddressSnippet={user.address ? user.address.split(",")[0] : null}
          userPhone={user.phone ?? null}
        />
        <div className="flex gap-2 sm:gap-3 items-center">
          <ThemeToggle />
          <PetSwitcher avatarOnly />
          <ProfileMenu />
        </div>
      </nav>
      {/* ===== Hero photo moment — tap to book a walk ===== */}
      <WalkHero
        firstName={firstName}
        petName={activePet?.name ?? null}
        petPhoto={activePet?.photoUrl ?? null}
        petBreed={activePet?.breed ?? null}
        walksThisWeek={walksThisWeek}
      />

      {/* ===== Search ===== */}
      <div className="px-6 -mt-6 relative z-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <div className="bg-white rounded-2xl flex items-center gap-3 px-5 py-4 shadow-sm" style={{ border: "1px solid var(--border)" }}>
          <Search size={18} color="var(--muted)" />
          <span className="text-sm" style={{ color: "var(--muted)" }}>Find a walker or sitter nearby</span>
        </div>
      </div>

      {/* ===== Page label — this page is dedicated to Walking only ===== */}
      <div className="px-6 mt-6 mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PawPrint size={18} color="var(--terracotta)" /> Adventure Walks
        </h2>
      </div>

      {/* ===== Offers — moving carousel ===== */}
      <div className="mb-8 animate-fade-up overflow-hidden" style={{ animationDelay: "140ms" }}>
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, dup) => [
            <Link href="/book" key={`walk-${dup}`} className="shrink-0 tap-scale mx-2 rounded-2xl overflow-hidden relative" style={{ width: 260, height: 120 }}>
              <Image src="/images/promo-first-walk.jpg" alt="First walk free" fill sizes="260px" className="object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(43,29,20,0.8) 100%)" }}>
                <p className="text-white font-bold text-sm">First walk, on us</p>
                <p className="text-white/75 text-xs">New pets get a free trial walk</p>
              </div>
            </Link>,
            <Link href="/accessories" key={`shop-${dup}`} className="shrink-0 tap-scale mx-2 rounded-2xl overflow-hidden relative" style={{ width: 260, height: 120 }}>
              <Image src="/images/hero-large.jpg" alt="Shop accessories" fill sizes="260px" className="object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(43,29,20,0.8) 100%)" }}>
                <p className="text-white font-bold text-sm">Fresh gear for your pet</p>
                <p className="text-white/75 text-xs">Browse the accessories shop</p>
              </div>
            </Link>,
            <Link href="/owner/pets" key={`vax-${dup}`} className="shrink-0 tap-scale mx-2 rounded-2xl overflow-hidden relative" style={{ width: 260, height: 120 }}>
              <Image src="/images/promo-vaccine-reminder.jpg" alt="Never miss a vaccine" fill sizes="260px" className="object-cover" />
              <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(43,29,20,0.8) 100%)" }}>
                <p className="text-white font-bold text-sm">Never miss a vaccine</p>
                <p className="text-white/75 text-xs">We track every due date for you</p>
              </div>
            </Link>,
          ])}
        </div>
      </div>

      {/* ===== Book again — real past provider + service combos ===== */}
      {rebookOptions.length > 0 && (
        <div className="mb-10 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <h2 className="text-lg font-bold px-6 mb-4 flex items-center gap-2">
            <RotateCcw size={18} color="var(--tan)" /> Book again
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-6">
            {rebookOptions.map((b) => (
              <Link
                href={`/book?service=${b.type}`}
                key={b.id}
                className="card shrink-0 tap-scale flex flex-col justify-between"
                style={{ width: 180, minHeight: 110 }}
              >
                <p className="font-semibold text-sm">{b.type === "WALKING" ? "Adventure Walk" : "Home Staycation"}</p>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Last time with {b.provider.user.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>for {b.pet.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {upcomingVaccines.length > 0 && (
        <div className="px-6 mb-8 animate-fade-up" style={{ animationDelay: "160ms" }}>
          <Link href="/owner/pets" className="flex items-center justify-between py-3 px-4 rounded-2xl tap-scale" style={{ background: "white", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <Syringe size={16} color="var(--tan-dark, var(--tan))" />
              <span className="text-sm font-medium">
                {upcomingVaccines.length} vaccine{upcomingVaccines.length > 1 ? "s" : ""} due this month
              </span>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </Link>
        </div>
      )}

      {/* ===== Promo cards with colored icon backgrounds ===== */}
      <div className="px-6 mb-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/owner/pets" className="card tap-scale flex flex-col justify-between" style={{ minHeight: 130 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fdece0" }}>
              <PawPrint size={17} color="var(--tan)" />
            </div>
            <div>
              <p className="font-semibold text-xs">Add a pet</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Track profile</p>
            </div>
          </Link>
          <Link href="/book" className="card tap-scale flex flex-col justify-between" style={{ minHeight: 130 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#e3f0e6" }}>
              <PawPrint size={17} color="#4a8f5c" />
            </div>
            <div>
              <p className="font-semibold text-xs">First walk</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Free trial</p>
            </div>
          </Link>
          <Link href="/accessories" className="card tap-scale flex flex-col justify-between" style={{ minHeight: 130 }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#eae3f5" }}>
              <ShoppingBag size={17} color="#7c5cbf" />
            </div>
            <div>
              <p className="font-semibold text-xs">Shop</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Accessories</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ===== Providers — clean horizontal list, photo + name + rating only ===== */}
      <div className="mb-10 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="flex items-center justify-between px-6 mb-4">
          <h2 className="text-lg font-bold">Recommended near you</h2>
          <Link href="/book" className="text-sm font-medium tap-scale" style={{ color: "var(--tan-dark, var(--tan))" }}>
            See all
          </Link>
        </div>
        {providers.length === 0 ? (
          <div className="px-6 text-center py-4">
            <img src={getMascotPath(activePet?.breed, "headshot")} alt="" className="w-16 h-16 mx-auto mb-2 rounded-full" />
            <p className="text-sm" style={{ color: "var(--muted)" }}>No verified providers yet.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
            {providers.map((p, i) => (
              <Link href="/book" key={p.id} className="shrink-0 tap-scale" style={{ width: 168 }}>
                <div className="img-frame relative" style={{ height: 130 }}>
                  <Image src={photos[i % photos.length]} alt={p.user.name} fill sizes="168px" className="object-cover" />
                  <span
                    className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: "rgba(43,29,20,0.75)" }}
                  >
                    <ShieldCheck size={11} /> Verified
                  </span>
                </div>
                <p className="font-semibold text-sm mt-2">{p.user.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="var(--tan)" color="var(--tan)" />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{p.ratingAvg.toFixed(1)}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    · {p._count.bookings} walk{p._count.bookings === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== Best sellers — real order-count based ranking ===== */}
      {bestSellers.length > 0 && (
        <div className="mb-10 animate-fade-up" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag size={18} color="var(--tan)" /> Best-selling accessories
            </h2>
            <Link href="/accessories" className="text-sm font-medium tap-scale" style={{ color: "var(--tan-dark, var(--tan))" }}>
              Shop all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-6">
            {bestSellers.map((p) => (
              <Link href="/accessories" key={p.id} className="card shrink-0 tap-scale" style={{ width: 140 }}>
                <div
                  className="w-full flex items-center justify-center rounded-xl mb-2"
                  style={{ height: 70, background: "var(--cream)", fontSize: 28 }}
                >
                  {PRODUCT_ICON_EMOJI[p.icon ?? "toy"] ?? "🐾"}
                </div>
                <p className="font-semibold text-xs truncate">{p.name}</p>
                <p className="text-xs mt-0.5 font-bold">₹{(p.price / 100).toFixed(0)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}


      <div className="px-6 animate-fade-up" style={{ animationDelay: "280ms" }}>
        <h2 className="text-lg font-bold mb-4">Recent bookings</h2>
        {bookings.length === 0 ? (
          <div className="text-center py-6">
            <img src={getMascotPath(activePet?.breed, "sitting")} alt="" className="w-20 h-20 mx-auto mb-2" />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing booked yet.</p>
          </div>
        ) : (
          <div>
            {bookings.map((b, i) => (
              <div key={b.id} className={`flex justify-between items-center py-4 ${i !== bookings.length - 1 ? "hairline" : ""}`}>
                <div>
                  <p className="font-medium text-sm">{b.pet.name} · {b.type === "WALKING" ? "Adventure Walk" : "Home Staycation"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>with {b.provider.user.name}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--cream)", color: "var(--chestnut)" }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
    </div>
  );
}