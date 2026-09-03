import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PawPrint, Calendar, Heart, Sparkles, PawPrint as ProviderIcon, ChevronRight, Wallet } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { getPawPointsBalance } from "@/lib/pawPoints";

export default async function OwnerProfile() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [petCount, bookingCount, wishlistCount, pawPointsBalance] = await Promise.all([
    prisma.pet.count({ where: { ownerId: user.id } }),
    prisma.booking.count({ where: { ownerId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    getPawPointsBalance(user.id),
  ]);

  const links = [
    { href: "/owner/pets", icon: PawPrint, label: "Manage pets & vaccines", sub: `${petCount} pet${petCount === 1 ? "" : "s"}` },
    { href: "/owner/bookings", icon: Calendar, label: "Booking history", sub: `${bookingCount} booking${bookingCount === 1 ? "" : "s"}` },
    { href: "/owner/wallet", icon: Wallet, label: "PawPoints Wallet", sub: `${pawPointsBalance.toLocaleString("en-IN")} pts` },
    { href: "/owner/wishlist", icon: Heart, label: "Wishlist", sub: `${wishlistCount} saved` },
    { href: "/provider/onboarding", icon: ProviderIcon, label: "Become a provider", sub: "Earn on your own schedule" },
  ];

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      {/* max-w-lg on mobile (unchanged single column); a real two-column
          split from desktop up — profile summary sticky on the left,
          settings list on the right — this page previously had zero
          responsive treatment at any width. */}
      <main className="pb-24 lg:pb-12 max-w-lg lg:max-w-4xl mx-auto px-5 pt-6 lg:pt-10">
        <div className="flex items-center justify-between mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* ===== Profile summary — sticky on desktop ===== */}
          <div className="hidden lg:block lg:w-72 lg:shrink-0 lg:sticky lg:top-10">
            <div className="card text-center py-8">
              <div className="flex justify-center mb-4">
                <UserButton />
              </div>
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{user.email}</p>
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* ===== Stat cards — 3-up on desktop, 1-up on mobile ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="card">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Pets</p>
                <p className="text-2xl font-extrabold">{petCount}</p>
              </div>
              <div className="card">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Bookings</p>
                <p className="text-2xl font-extrabold">{bookingCount}</p>
              </div>
              <div className="card flex items-center justify-between sm:block">
                <div>
                  <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--muted)" }}>
                    <Sparkles size={12} color="var(--gold)" /> PawPoints
                  </p>
                  <p className="text-2xl font-extrabold">{pawPointsBalance.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {links.map((link) => {
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}