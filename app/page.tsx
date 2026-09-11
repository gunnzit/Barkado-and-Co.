import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import HomeUnified from "@/components/HomeUnified";
import { getPawPointsBalance, getRollingTierPoints, tierForPoints } from "@/lib/pawPoints";

export default async function Home() {
  const [
    verifiedCount,
    ratedProviders,
    completedAgg,
    ratingAgg,
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
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.provider.aggregate({ where: { verified: true }, _avg: { ratingAvg: true } }),
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

  const avgRating = ratingAgg._avg.ratingAvg;

  const user = await getOrCreateUser().catch(() => null);
  const pets = user ? await prisma.pet.findMany({ where: { ownerId: user.id }, include: { vaccinations: { select: { nextDueDate: true } } } }) : [];
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  const [pawPointsBalance, rollingTierPoints, cartCount, upcomingBooking, bestsellerIdsRaw] = user
    ? await Promise.all([
        getPawPointsBalance(user.id),
        getRollingTierPoints(user.id),
        prisma.cartItem.count({ where: { userId: user.id } }),
        prisma.booking.findFirst({
          where: { ownerId: user.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] }, startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
          include: { provider: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
        }),
        prisma.orderItem.groupBy({ by: ["productId"], _count: { productId: true }, orderBy: { _count: { productId: "desc" } }, take: 5 }),
      ])
    : [0, 0, 0, null, []];
  const dashboardTier = tierForPoints(rollingTierPoints);
  const bestsellerIds = new Set((bestsellerIdsRaw as any[]).filter((t) => t._count.productId > 0).map((t) => t.productId));

  let hasHistory = false;
  let cartTotalPaise = 0;
  let buyAgainProducts: { id: string; name: string; price: number; imageUrls: string[] }[] = [];
  let wishlistItems: { id: string; name: string; price: number; compareAtPrice: number | null; imageUrls: string[] }[] = [];
  let trustedProviders: { id: string; user: { name: string }; ratingAvg: number; bookingCount: number }[] = [];
  let lastGrooming: { startTime: Date; provider: { user: { name: string } } | null } | null = null;
  let rebookCandidate: { type: string; provider: { id: string; user: { name: string } } | null; pet: { name: string } | null } | null = null;
  let mostPopularServiceType: string | null = null;

  if (user) {
    const [paidOrderCount, bookingCount] = await Promise.all([
      prisma.order.count({ where: { userId: user.id, status: "PAID" } }),
      prisma.booking.count({ where: { ownerId: user.id } }),
    ]);
    hasHistory = paidOrderCount > 0 || bookingCount > 0;

    if (hasHistory) {
      const [cartItemsFull, pastOrderItems, favorites, ownerBookings, lastGroomingBooking, lastAnyBooking] = await Promise.all([
        prisma.cartItem.findMany({ where: { userId: user.id, kind: "PRODUCT" }, include: { product: true } }),
        prisma.orderItem.findMany({
          where: { order: { userId: user.id } },
          include: { product: true },
          orderBy: { id: "desc" },
          take: 12,
        }),
        prisma.favorite.findMany({ where: { userId: user.id, productId: { not: null } }, include: { product: true } }),
        prisma.booking.findMany({ where: { ownerId: user.id }, include: { provider: { include: { user: { select: { name: true } } } } } }),
        prisma.booking.findFirst({
          where: { ownerId: user.id, type: "GROOMING", status: "COMPLETED" },
          orderBy: { startTime: "desc" },
          include: { provider: { include: { user: { select: { name: true } } } } },
        }),
        prisma.booking.findFirst({
          where: { ownerId: user.id, status: "COMPLETED" },
          orderBy: { startTime: "desc" },
          include: { provider: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
        }),
      ]);

      cartTotalPaise = cartItemsFull.reduce((sum, item) => sum + (item.product ? item.product.price * item.quantity : 0), 0);

      const seenProductIds = new Set<string>();
      for (const item of pastOrderItems) {
        if (!seenProductIds.has(item.productId)) {
          seenProductIds.add(item.productId);
          buyAgainProducts.push({ id: item.product.id, name: item.product.name, price: item.product.price, imageUrls: item.product.imageUrls });
        }
      }

      wishlistItems = favorites.filter((f) => f.product).map((f) => ({
        id: f.product!.id, name: f.product!.name, price: f.product!.price, compareAtPrice: f.product!.compareAtPrice, imageUrls: f.product!.imageUrls,
      }));

      const providerCounts = new Map<string, { user: { name: string }; ratingAvg: number; count: number }>();
      for (const b of ownerBookings) {
        const existing = providerCounts.get(b.providerId);
        if (existing) existing.count += 1;
        else providerCounts.set(b.providerId, { user: b.provider.user, ratingAvg: b.provider.ratingAvg, count: 1 });
      }
      trustedProviders = Array.from(providerCounts.entries())
        .filter(([, v]) => v.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, v]) => ({ id, user: v.user, ratingAvg: v.ratingAvg, bookingCount: v.count }));

      lastGrooming = lastGroomingBooking;
      rebookCandidate = lastAnyBooking && !upcomingBooking ? { type: lastAnyBooking.type, provider: lastAnyBooking.provider ? { id: lastAnyBooking.providerId, user: lastAnyBooking.provider.user } : null, pet: lastAnyBooking.pet } : null;
    }
  }

  const allBookingsForFirstVisit = await prisma.booking.findMany({ select: { ownerId: true, type: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  const firstBookingByOwner = new Map<string, string>();
  for (const b of allBookingsForFirstVisit) {
    if (!firstBookingByOwner.has(b.ownerId)) firstBookingByOwner.set(b.ownerId, b.type);
  }
  const firstVisitTally = new Map<string, number>();
  for (const type of firstBookingByOwner.values()) firstVisitTally.set(type, (firstVisitTally.get(type) ?? 0) + 1);
  if (firstVisitTally.size > 0) {
    mostPopularServiceType = Array.from(firstVisitTally.entries()).sort((a, b) => b[1] - a[1])[0][0];
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
        rollingTierPoints={rollingTierPoints as number}
        tier={dashboardTier}
        cartCount={cartCount as number}
        cartTotalPaise={cartTotalPaise}
        hasHistory={hasHistory}
        upcomingBooking={upcomingBooking as any}
        rebookCandidate={rebookCandidate}
        lastGrooming={lastGrooming}
        buyAgainProducts={buyAgainProducts}
        wishlistItems={wishlistItems}
        trustedProviders={trustedProviders}
        verifiedCount={verifiedCount}
        avgRating={avgRating}
        activeProviderCount={activeProviderCount}
        providers={providers}
        products={products}
        bestsellerIds={bestsellerIds}
        mostPopularServiceType={mostPopularServiceType}
        groomingBundles={groomingBundles}
        trainingBundles={trainingBundles}
      />
    </div>
  );
}