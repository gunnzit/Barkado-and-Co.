import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import HomeUnified from "@/components/HomeUnified";
import { getPawPointsBalance } from "@/lib/pawPoints";

export default async function Home() {
  const [
    verifiedCount,
    ratedProviders,
    products,
    activeProviderCount,
    groomingPackagesRaw,
    trainingPackagesRaw,
  ] = await Promise.all([
    prisma.provider.count({ where: { verified: true } }),
    prisma.provider.findMany({
      where: { verified: true },
      include: {
        user: { select: { name: true } },
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
      orderBy: { ratingAvg: "desc" },
      take: 20,
    }),
    prisma.product.findMany({ where: { active: true }, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.provider.count({ where: { verified: true, isAvailableNow: true } }),
    prisma.groomingPackage.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      include: { provider: { include: { user: { select: { name: true } } } } },
    }),
    prisma.trainingPackage.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      include: { provider: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const groomingBundles = groomingPackagesRaw.map((p) => {
    const prices = Object.values(p.pricesBySize as Record<string, number>).filter((v) => typeof v === "number");
    return {
      id: p.id,
      name: p.name,
      startingPricePaise: prices.length > 0 ? Math.min(...prices) : 0,
      providerName: p.provider.user.name,
    };
  });
  const trainingBundles = trainingPackagesRaw.map((p) => ({
    id: p.id,
    name: p.name,
    cadence: p.cadence,
    pricePaise: p.pricePaise,
    providerName: p.provider.user.name,
  }));

  const now = new Date();
  const candidateIds = ratedProviders.map((p) => p.id);
  const activeCampaigns = candidateIds.length > 0
    ? await prisma.campaign.findMany({
        where: {
          providerId: { in: candidateIds },
          status: "ACTIVE",
          paidAt: { not: null },
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: { providerId: true },
      })
    : [];
  const boostedProviderIds = new Set(activeCampaigns.map((c) => c.providerId));

  const providers = [...ratedProviders]
    .sort((a, b) => {
      const aBoost = boostedProviderIds.has(a.id);
      const bBoost = boostedProviderIds.has(b.id);
      if (aBoost !== bBoost) return aBoost ? -1 : 1;
      return b.ratingAvg - a.ratingAvg;
    })
    .slice(0, 3);

  const user = await getOrCreateUser().catch(() => null);
  const pets = user ? await prisma.pet.findMany({ where: { ownerId: user.id }, include: { vaccinations: { select: { nextDueDate: true } } } }) : [];
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  const [pawPointsBalance, cartCount] = user
    ? await Promise.all([
        getPawPointsBalance(user.id),
        prisma.cartItem.count({ where: { userId: user.id } }),
      ])
    : [0, 0];

  let hasHistory = false;
  let rebookCandidate: {
    type: string;
    provider: { id: string; user: { name: string } } | null;
    pet: { name: string } | null;
    startTime: Date | null;
    priceAmount: number | null;
  } | null = null;

  if (user) {
    const [paidOrderCount, bookingCount] = await Promise.all([
      prisma.order.count({ where: { userId: user.id, status: "PAID" } }),
      prisma.booking.count({ where: { ownerId: user.id } }),
    ]);
    hasHistory = paidOrderCount > 0 || bookingCount > 0;

    if (hasHistory) {
      const lastAnyBooking = await prisma.booking.findFirst({
        where: { ownerId: user.id, status: "COMPLETED" },
        orderBy: { startTime: "desc" },
        include: { provider: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
      });
      if (lastAnyBooking) {
        rebookCandidate = {
          type: lastAnyBooking.type,
          provider: { id: lastAnyBooking.providerId, user: lastAnyBooking.provider.user },
          pet: lastAnyBooking.pet,
          startTime: lastAnyBooking.startTime,
          priceAmount: lastAnyBooking.priceAmount,
        };
      }
    }
  }

  return (
    <div className={`w-full ${themeClass}`}>
      <HomeUnified
        isSignedIn={!!user}
        userName={user?.name ?? null}
        userAddress={user?.address ?? null}
        userPhone={user?.phone ?? null}
        activePet={activePet}
        pawPointsBalance={pawPointsBalance as number}
        cartCount={cartCount as number}
        hasHistory={hasHistory}
        rebookCandidate={rebookCandidate}
        verifiedCount={verifiedCount}
        activeProviderCount={activeProviderCount}
        providers={providers}
        products={products}
        groomingBundles={groomingBundles}
        trainingBundles={trainingBundles}
      />
    </div>
  );
}