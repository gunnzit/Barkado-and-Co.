import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import ServicePageTopBar from "@/components/ServicePageTopBar";
import WalkBookingFlow from "@/components/WalkBookingFlow";
import { getPawPointsBalance } from "@/lib/pawPoints";

export default async function WalkBookingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  // Real "first walk" definition, matching the same check enforced
  // server-side in /api/cart/service/route.ts exactly: has this owner
  // ever actually PAID for a walk before.
  const [priorPaidWalk, cartCount, pawPointsBalance] = await Promise.all([
    prisma.booking.findFirst({ where: { ownerId: user.id, type: "WALKING", paidAt: { not: null } } }),
    prisma.cartItem.count({ where: { userId: user.id } }),
    getPawPointsBalance(user.id),
  ]);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto">
        <ServicePageTopBar cartCount={cartCount} pawPointsBalance={pawPointsBalance} />

        <div className="px-4 pb-3 flex items-center gap-3">
          <Link href="/" aria-label="Back to home" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 tap-scale" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <ArrowLeft size={17} />
          </Link>
          <p className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--terracotta)" }}>Book a walk</p>
        </div>

        <WalkBookingFlow
          pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, breed: p.breed }))}
          activePetId={activePet?.id ?? null}
          isFirstWalk={!priorPaidWalk}
          address={user.address}
          phone={user.phone}
        />
      </main>
    </div>
  );
}
