import Link from "next/link";
import { ArrowLeft, MapPin, ChevronRight } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import ServicePageTopBar from "@/components/ServicePageTopBar";
import ServiceBookingFlow from "@/components/ServiceBookingFlow";
import { getPawPointsBalance } from "@/lib/pawPoints";

export default async function TrainingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  const [cartCount, pawPointsBalance] = await Promise.all([
    prisma.cartItem.count({ where: { userId: user.id } }),
    getPawPointsBalance(user.id),
  ]);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      {/* max-w-3xl (wider than the standard max-w-lg) so the intro screen's
          responsive two-column layout has room to appear on desktop,
          matching the same approach used on /walk-booking. */}
      <main className="pb-28 max-w-3xl mx-auto">
        <ServicePageTopBar cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

        {/* Real sub-row — back arrow, title, real address, real verified-
            provider "Nearby" indicator. No dog selector, no theme toggle,
            per explicit product decision — matching /walk-booking exactly. */}
        <div className="px-5 pb-3 pt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight leading-tight">Book a trainer</h2>
              {user.address && (
                <Link href="/owner/profile" className="flex items-center gap-1 mt-0.5 text-xs font-semibold tap-scale" style={{ color: "var(--terracotta)" }}>
                  <MapPin size={11} /> {user.address.split(",")[0].toUpperCase()} <ChevronRight size={11} />
                </Link>
              )}
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0" style={{ background: "#e8f4ec", color: "#2f6fb0" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#2f9e5f" }} />
            Nearby
          </span>
        </div>

        <ServiceBookingFlow
          serviceType="TRAINING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }))}
          hasPets={pets.length > 0}
          showStartButton={true}
          defaultAddress={user.address}
          defaultPhone={user.phone}
        />

      </main>
    </div>
  );
}