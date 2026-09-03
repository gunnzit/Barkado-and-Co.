import Link from "next/link";
import {
  PawPrint, Scissors, Dumbbell, Home as HomeIcon, ShoppingBag, Sparkles,
  Calendar, Heart, HelpCircle, ChevronRight, Star, ShieldCheck, Syringe,
} from "lucide-react";
import CuratedSearchBar from "@/components/CuratedSearchBar";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { GOLD_TIER_THRESHOLD, PLATINUM_TIER_THRESHOLD, redemptionValuePaise } from "@/lib/pawPoints";

const SIDEBAR_LINKS = [
  { href: "/walk-booking", label: "Adventure Walks", icon: PawPrint },
  { href: "/grooming", label: "Luxury Spa & Grooming", icon: Scissors },
  { href: "/training", label: "Good Manners Training", icon: Dumbbell },
  { href: "/sitting", label: "Home Staycation", icon: HomeIcon },
];

function ageLabel(birthday: Date | null): string | null {
  if (!birthday) return null;
  const now = new Date();
  let months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth());
  if (now.getDate() < birthday.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mo${remMonths === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"}${remMonths > 0 ? ` ${remMonths} mo` : ""}`;
}

export default function HomeDesktopDashboard({
  userName,
  userAddress,
  activePet,
  pawPointsBalance,
  rollingTierPoints,
  tier,
  cartCount,
  upcomingBooking,
  products,
  bestsellerIds,
  providers,
  verifiedCount,
}: {
  userName: string;
  userAddress: string | null;
  activePet: {
    id: string; name: string; breed: string | null; photoUrl: string | null;
    birthday: Date | null; microchipId: string | null; createdAt: Date;
    vaccinations: { nextDueDate: Date | null }[];
  } | null;
  pawPointsBalance: number;
  rollingTierPoints: number;
  tier: string;
  cartCount: number;
  upcomingBooking: {
    type: string; startTime: Date;
    provider: { user: { name: string }; ratingAvg: number } | null;
    pet: { name: string } | null;
  } | null;
  products: { id: string; name: string; price: number; imageUrls: string[] }[];
  bestsellerIds: Set<string>;
  providers: { id: string; user: { name: string }; photoUrl: string | null; ratingAvg: number; _count: { bookings: number } }[];
  verifiedCount: number;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const age = activePet ? ageLabel(activePet.birthday) : null;
  const now = new Date();
  const overdueVaccine = activePet?.vaccinations.some((v) => v.nextDueDate && v.nextDueDate < now) ?? false;
  const hasVaccineRecords = (activePet?.vaccinations.length ?? 0) > 0;

  const nextThreshold = tier === "Explorer" ? GOLD_TIER_THRESHOLD : tier === "Gold Explorer" ? PLATINUM_TIER_THRESHOLD : null;
  const nextTierName = tier === "Explorer" ? "Gold Explorer" : tier === "Gold Explorer" ? "Platinum" : null;

  const SERVICE_LABEL: Record<string, string> = {
    WALKING: "Adventure Walk", SITTING: "Home Staycation", GROOMING: "Luxury Spa Session", TRAINING: "Good Manners Programme",
  };

  return (
    <div className="hidden lg:flex" style={{ minHeight: "100vh" }}>
      {/* ===== Sidebar ===== */}
      <aside className="w-64 shrink-0 flex flex-col justify-between px-4 py-6" style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 px-2 mb-8">
            <PawPrint size={22} color="var(--forest, #16281f)" />
            <div>
              <p className="font-bold text-sm leading-tight">Barkado &amp; Co.</p>
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--muted)" }}>Marketplace &amp; Club</p>
          <nav className="space-y-0.5 mb-6">
            <Link href="/" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--cream)", color: "var(--forest, #16281f)" }}>
              <HomeIcon size={16} /> Home
            </Link>
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale" style={{ color: "inherit" }}>
                  <Icon size={16} color="var(--muted)" /> {link.label}
                </Link>
              );
            })}
            <Link href="/accessories" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale">
              <ShoppingBag size={16} color="var(--muted)" /> Artisan Shop
            </Link>
            <Link href="/owner/wallet" className="flex items-center justify-between px-2.5 py-2 rounded-lg text-sm tap-scale">
              <span className="flex items-center gap-2.5"><Sparkles size={16} color="var(--muted)" /> PawPoints Wallet</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--cream)" }}>{pawPointsBalance}</span>
            </Link>
            <Link href="/owner/bookings" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale">
              <Calendar size={16} color="var(--muted)" /> Bookings &amp; Calendar
            </Link>
            <Link href="/owner/pets" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale">
              <PawPrint size={16} color="var(--muted)" /> My Pets &amp; Passport
            </Link>
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--muted)" }}>Saved</p>
          <nav className="space-y-0.5">
            <Link href="/owner/wishlist" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale">
              <Heart size={16} color="var(--muted)" /> Wishlist &amp; Saved
            </Link>
            <Link href="/legal/contact" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm tap-scale">
              <HelpCircle size={16} color="var(--muted)" /> Help &amp; Support
            </Link>
          </nav>
        </div>

        <Link href="/owner/profile" className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg tap-scale" style={{ background: "var(--cream)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--panel-dark)" }}>
            <span className="text-xs font-bold text-white">{userName.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{userName}</p>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>{tier} Tier</p>
          </div>
        </Link>
      </aside>

      {/* ===== Main dashboard ===== */}
      <div className="flex-1 min-w-0 px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <CuratedSearchBar />
          </div>
          <Link href="/owner/wallet" className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold shrink-0" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
            <Sparkles size={13} /> {pawPointsBalance.toLocaleString("en-IN")} pts
          </Link>
          <Link href="/cart" className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shrink-0" style={{ background: "var(--cream)" }}>
            <ShoppingBag size={14} /> Bag {cartCount > 0 && <span>({cartCount})</span>}
          </Link>
          <ThemeToggle />
          <ProfileMenu />
        </div>

        <h1 className="text-2xl font-bold mb-1">{greeting}, {userName.split(" ")[0]}{activePet ? ` & ${activePet.name}` : ""}</h1>
        {userAddress && <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{userAddress.split(",")[0]}</p>}

        <div className="grid grid-cols-3 gap-5 mb-8">
          {/* Pet summary — real data only */}
          <div className="col-span-2 rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {activePet ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                    {activePet.photoUrl && <img src={activePet.photoUrl} alt={activePet.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-bold">{activePet.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {activePet.breed ?? "Mixed breed"}{age ? ` · ${age}` : ""}{activePet.microchipId ? " · Microchipped" : ""}
                    </p>
                  </div>
                  {hasVaccineRecords && (
                    <span
                      className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ background: overdueVaccine ? "#fdece5" : "#e8f4ec", color: overdueVaccine ? "#a5652a" : "#2f6fb0" }}
                    >
                      <Syringe size={11} /> {overdueVaccine ? "Vaccine Due" : "Vaccines Current"}
                    </span>
                  )}
                </div>
                <Link href={`/owner/pets/${activePet.id}`} className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                  View Paw Passport →
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm font-semibold mb-1">Add your first pet</p>
                <Link href="/owner/pets" className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>Get started →</Link>
              </div>
            )}
          </div>

          {/* PawPoints tier progress — real */}
          <div className="rounded-2xl p-5" style={{ background: "var(--panel-dark)", color: "white" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>PawPoints Perks</p>
            <p className="text-2xl font-bold mb-1">{pawPointsBalance.toLocaleString("en-IN")} pts</p>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>Worth ₹{(redemptionValuePaise(pawPointsBalance) / 100).toFixed(2)}</p>
            {nextThreshold && (
              <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                {Math.max(0, nextThreshold - rollingTierPoints)} pts to {nextTierName}
              </p>
            )}
            <Link href="/owner/wallet" className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block" style={{ background: "rgba(255,255,255,0.12)" }}>
              Redeem →
            </Link>
          </div>
        </div>

        {/* Upcoming booking — real, no fake GPS */}
        {upcomingBooking && (
          <Link href="/owner/bookings" className="rounded-2xl p-5 mb-8 flex items-center justify-between tap-scale block" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--terracotta)" }}>Upcoming</p>
              <p className="font-semibold text-sm">
                {SERVICE_LABEL[upcomingBooking.type]} {upcomingBooking.pet ? `for ${upcomingBooking.pet.name}` : ""}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {upcomingBooking.startTime.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                {upcomingBooking.provider ? ` · with ${upcomingBooking.provider.user.name}` : ""}
              </p>
            </div>
            <ChevronRight size={18} color="var(--muted)" />
          </Link>
        )}

        {/* Artisan Shop — real products, real bestseller badge, real points preview */}
        {products.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Artisan Goods for Discerning Dogs</h2>
              <Link href="/accessories" className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>View All →</Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {products.slice(0, 4).map((p) => {
                const photo = p.imageUrls[0];
                const points = Math.floor(p.price / 1000);
                return (
                  <Link key={p.id} href={`/accessories/${p.id}`} className="rounded-xl overflow-hidden tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="w-full aspect-square relative" style={{ background: "var(--cream)" }}>
                      {photo && <img src={photo} alt={p.name} className="w-full h-full object-cover" />}
                      {bestsellerIds.has(p.id) && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "var(--panel-dark)", color: "var(--gold)" }}>
                          Bestseller
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                      <p className="text-sm font-bold mt-1">₹{(p.price / 100).toFixed(0)}</p>
                      <p className="text-[10px]" style={{ color: "var(--terracotta)" }}>+{points} PawPoints</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Verified providers — real name/photo/rating only */}
        {providers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{verifiedCount} Verified Pet Professionals</h2>
              <Link href="/walk-booking" className="text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>Explore All →</Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {providers.slice(0, 3).map((p) => (
                <div key={p.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: "var(--cream)" }}>
                      {p.photoUrl && <img src={p.photoUrl} alt={p.user.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.user.name}</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                        <Star size={11} fill="var(--gold)" color="var(--gold)" /> {p.ratingAvg.toFixed(1)} · {p._count.bookings} completed
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--forest, #16281f)" }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}