import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import {
  PawPrint, Calendar, Heart, Sparkles, PawPrint as ProviderIcon, ChevronRight, Wallet,
  MapPin, Hospital, CreditCard, Bell, Phone, LogOut, ShieldCheck, Syringe,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { getPawPointsBalance } from "@/lib/pawPoints";

// Reused from the Passport/Step-2 logic — no stored status field, always
// derived fresh from the real date.
type VaxLike = { nextDueDate: Date | null };
function vaccinationStatus(v: VaxLike): "VALID" | "DUE_SOON" | "OVERDUE" {
  if (!v.nextDueDate) return "VALID";
  const days = Math.floor((v.nextDueDate.getTime() - Date.now()) / 86400000);
  if (days < 0) return "OVERDUE";
  if (days <= 60) return "DUE_SOON";
  return "VALID";
}

function passportNumber(id: string) {
  return `#BKD-${id.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-6)}`;
}

function ageFromBirthday(birthday: Date | null) {
  if (!birthday) return null;
  const years = (Date.now() - birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return years < 1 ? `${Math.round(years * 12)} mos` : `${Math.floor(years)} yrs ${Math.round((years % 1) * 12)} mos`;
}

// Placeholder support number — real Barkado support line not set up yet.
const SUPPORT_PHONE = "+91 00000 00000";

export default async function OwnerProfile() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [pets, bookingCount, activeBookingCount, wishlistProductCount, favoriteProviderCount, addressCount, pawPointsBalance] = await Promise.all([
    prisma.pet.findMany({ where: { ownerId: user.id }, include: { vaccinations: true }, orderBy: { createdAt: "asc" } }),
    prisma.booking.count({ where: { ownerId: user.id } }),
    prisma.booking.count({ where: { ownerId: user.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] } } }),
    prisma.favorite.count({ where: { userId: user.id, productId: { not: null } } }),
    prisma.favorite.count({ where: { userId: user.id, providerId: { not: null } } }),
    prisma.address.count({ where: { userId: user.id } }),
    getPawPointsBalance(user.id),
  ]);

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const primaryPet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;

  const anyVaccineUrgent = pets.some((p) => p.vaccinations.some((v) => vaccinationStatus(v) !== "VALID"));
  const primaryPetVaxSummary = primaryPet
    ? primaryPet.vaccinations.length === 0
      ? "No records yet"
      : primaryPet.vaccinations.some((v) => vaccinationStatus(v) === "OVERDUE")
        ? "Booster overdue"
        : primaryPet.vaccinations.some((v) => vaccinationStatus(v) === "DUE_SOON")
          ? "Booster due soon"
          : "Vaccines current"
    : null;

  const pawPointsValueRupees = Math.round(pawPointsBalance * 0.25);

  const careLinks = [
    {
      href: "/owner/pets",
      icon: PawPrint,
      label: "Manage pets & vaccines",
      sub: `${pets.length} pet${pets.length === 1 ? "" : "s"} registered`,
      badge: anyVaccineUrgent ? "Action req." : null,
    },
    {
      href: primaryPet ? `/owner/pets/${primaryPet.id}` : "/owner/pets",
      icon: ShieldCheck,
      label: "PawPassport™ Credentials",
      sub: "Microchip IDs, vaccinations & insurance",
      badge: null,
    },
  ];

  const activityLinks = [
    { href: "/owner/bookings", icon: Calendar, label: "Booking history & logs", sub: `${bookingCount} booking${bookingCount === 1 ? "" : "s"} total`, badge: activeBookingCount > 0 ? `${activeBookingCount} active` : null },
    { href: "/owner/wallet", icon: Wallet, label: "PawPoints Wallet", sub: `${pawPointsBalance.toLocaleString("en-IN")} pts · ₹${pawPointsValueRupees} value`, badge: null },
    { href: "/owner/wishlist", icon: Heart, label: "Wishlist & Saved Sitters", sub: `${wishlistProductCount} saved · ${favoriteProviderCount} favorite handler${favoriteProviderCount === 1 ? "" : "s"}`, badge: null },
  ];

  const prefLinks = [
    { href: "/owner/addresses", icon: MapPin, label: "Saved Addresses", sub: `${addressCount} address${addressCount === 1 ? "" : "es"} saved` },
    {
      href: primaryPet ? `/owner/pets/${primaryPet.id}/step-2` : "/owner/pets",
      icon: Hospital,
      label: "Emergency Vet",
      sub: primaryPet?.vetHospitalName || "Not set yet — add your vet",
    },
    { href: "/owner/notifications", icon: Bell, label: "Notifications", sub: "Booking, vaccine & offer alerts" },
  ];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-24 lg:pb-12 max-w-lg lg:max-w-4xl mx-auto px-5 pt-6 lg:pt-10">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{passportNumber(user.id)}</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="lg:flex lg:gap-8 lg:items-start">
          <div className="hidden lg:block lg:w-72 lg:shrink-0 lg:sticky lg:top-10">
            <div className="card text-center py-8">
              <div className="flex justify-center mb-4">
                <UserButton />
              </div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>{user.email}</p>
              <p className="text-[10px] font-mono mb-4" style={{ color: "var(--muted)" }}>{passportNumber(user.id)}</p>
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="card">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Pets</p>
                <p className="text-2xl font-extrabold">{pets.length}</p>
              </div>
              <div className="card">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Bookings</p>
                <p className="text-2xl font-extrabold">{bookingCount}</p>
                {activeBookingCount > 0 && <p className="text-[10px] mt-0.5" style={{ color: "var(--terracotta)" }}>{activeBookingCount} scheduled</p>}
              </div>
              <div className="card">
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--muted)" }}>
                  <Sparkles size={12} color="var(--gold)" /> PawPoints
                </p>
                <p className="text-2xl font-extrabold">{pawPointsBalance.toLocaleString("en-IN")}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>₹{pawPointsValueRupees} value</p>
              </div>
            </div>

            {/* Primary pet preview — dark card, same treatment as the Passport page */}
            {primaryPet && (
              <Link href={`/owner/pets/${primaryPet.id}`} className="block rounded-2xl bg-[#02120a] text-[#fbfaee] p-4 mb-6 tap-scale">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#16281f" }}>
                    {primaryPet.photoUrl ? <img src={primaryPet.photoUrl} alt={primaryPet.name} className="w-full h-full object-cover" /> : <PawPrint size={20} color="#fcba5a" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{primaryPet.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#fcba5a] text-[#291800]">Primary Pet</span>
                    </div>
                    <p className="text-xs text-[#d2e8d9] mt-0.5">
                      {[primaryPet.breed, ageFromBirthday(primaryPet.birthday)].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: primaryPetVaxSummary === "Booster overdue" ? "#ff9d9d" : "#d2e8d9" }}>
                      <Syringe size={11} /> {primaryPetVaxSummary} · {passportNumber(primaryPet.id)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-[#16281f] text-[#d2e8d9] shrink-0">Switch Pet</span>
                </div>
              </Link>
            )}

            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Pets &amp; Care Vault</p>
            <div className="space-y-2 mb-6">
              {careLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="card flex items-center gap-3 tap-scale">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <Icon size={18} color="var(--terracotta)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{link.sub}</p>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "#ffdad6", color: "#93000a" }}>{link.badge}</span>
                    )}
                    <ChevronRight size={16} color="var(--muted)" />
                  </Link>
                );
              })}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Activity &amp; Rewards</p>
            <div className="space-y-2 mb-6">
              {activityLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="card flex items-center gap-3 tap-scale">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <Icon size={18} color="var(--terracotta)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{link.sub}</p>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--cream)", color: "var(--terracotta)" }}>{link.badge}</span>
                    )}
                    <ChevronRight size={16} color="var(--muted)" />
                  </Link>
                );
              })}
            </div>

            {/* Become a Provider */}
            <Link href="/provider/onboarding" className="block rounded-2xl p-5 mb-6 tap-scale relative overflow-hidden" style={{ background: "var(--terracotta)", color: "white" }}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <ProviderIcon size={20} color="white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">Become a Provider</p>
                  <p className="font-bold text-sm">Earn on your own schedule</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0" style={{ background: "white", color: "var(--terracotta)" }}>Apply Now</span>
              </div>
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Preferences &amp; Safety</p>
            <div className="space-y-2 mb-4">
              {prefLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="card flex items-center gap-3 tap-scale">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                      <Icon size={18} color="var(--terracotta)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{link.sub}</p>
                    </div>
                    <ChevronRight size={16} color="var(--muted)" />
                  </Link>
                );
              })}

              {/* Payment methods — honest: no saved instruments exist, just
                  a statement of how checkout actually works. Not a link. */}
              <div className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                  <CreditCard size={18} color="var(--terracotta)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Payments</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Secured by Razorpay at checkout — no card stored</p>
                </div>
              </div>

              {/* Customer Support — placeholder phone number for now */}
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="card flex items-center gap-3 tap-scale">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--cream)" }}>
                  <Phone size={18} color="var(--terracotta)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Customer Support</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{SUPPORT_PHONE}</p>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </a>
            </div>

            <SignOutButton>
              <button className="w-full text-center py-3 text-sm font-semibold flex items-center justify-center gap-2 tap-scale" style={{ color: "var(--terracotta)" }}>
                <LogOut size={15} /> Sign out of {user.name.split(" ")[0]}'s account
              </button>
            </SignOutButton>

            <p className="text-center text-[10px] mt-4" style={{ color: "var(--muted)" }}>Barkado &amp; Co. — made for dogs</p>
          </div>
        </div>
      </main>
    </div>
  );
}