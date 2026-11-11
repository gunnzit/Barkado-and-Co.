import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import HomeUnified from "@/components/HomeUnified";
import { derivePassportNumber } from "@/lib/passportId";
import { passportProgress } from "@/lib/passportProgress";
import { getPawPointsBalance, redemptionValuePaise } from "@/lib/pawPoints";

// Same base price and first-walk discount the cart API charges
// (app/api/cart/service/route.ts). Shown on the home page so price is visible
// before the first tap; the server stays the source of truth.
const WALK_FROM_PAISE = 30000;
const FIRST_WALK_DISCOUNT = 0.1;

const minOf = (values: (number | null | undefined)[]) => {
  const real = values.filter((v): v is number => typeof v === "number" && v > 0);
  return real.length > 0 ? Math.min(...real) : null;
};

export default async function Home() {
  const user = await getOrCreateUser().catch(() => null);
  const now = new Date();

  const [verifiedProviders, groomingPackages, trainingPackages, productsWithPhotos, activeProductCount, reviewRows] = await Promise.all([
    prisma.provider.findMany({
      where: { verified: true },
      select: {
        id: true,
        photoUrl: true,
        ratingAvg: true,
        ratingCount: true,
        servicesOffered: true,
        pricePerGroom: true,
        pricePerTrain: true,
        user: { select: { name: true } },
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
    }),
    prisma.groomingPackage.findMany({ where: { provider: { verified: true } }, select: { pricesBySize: true } }),
    prisma.trainingPackage.findMany({ where: { provider: { verified: true } }, select: { pricePaise: true } }),
    prisma.product.findMany({
      where: { active: true },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, price: true, compareAtPrice: true, imageUrls: true, suitableSizes: true },
    }),
    prisma.product.count({ where: { active: true } }),
    // Real, written reviews only (4★ and up, with a comment of some substance).
    prisma.review.findMany({
      where: { rating: { gte: 4 }, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        rating: true,
        comment: true,
        booking: { select: { type: true, pet: { select: { name: true } }, owner: { select: { name: true } } } },
      },
    }),
  ]);
  const reviews = reviewRows
    .filter((r) => (r.comment ?? "").trim().length >= 20)
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment!.trim(),
      ownerFirstName: (r.booking.owner.name ?? "A pet parent").split(" ")[0],
      petName: r.booking.pet.name,
      service: r.booking.type,
    }));

  const offers = (type: string) => verifiedProviders.filter((p) => p.servicesOffered.includes(type as never));
  const walkers = offers("WALKING");
  const groomers = offers("GROOMING");
  const trainers = offers("TRAINING");

  const groomPackagePrices = groomingPackages.flatMap((g) =>
    Object.values(g.pricesBySize as Record<string, number>).filter((v) => typeof v === "number"),
  );
  const groomFromPaise = minOf([...groomers.map((p) => p.pricePerGroom), ...groomPackagePrices]);
  const trainFromPaise = minOf([...trainers.map((p) => p.pricePerTrain), ...trainingPackages.map((t) => t.pricePaise)]);

  // Only pros with a real photo and at least one real rating are featured.
  const featuredPros = verifiedProviders
    .filter((p) => p.photoUrl && p.ratingCount > 0)
    .sort((a, b) => b.ratingAvg - a.ratingAvg)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      name: p.user.name,
      photoUrl: p.photoUrl!,
      ratingAvg: p.ratingAvg,
      completed: p._count.bookings,
      services: p.servicesOffered.filter((s) => s === "WALKING" || s === "GROOMING" || s === "TRAINING"),
    }));

  // ===== Signed-in data =====
  const pets = user
    ? await prisma.pet.findMany({ where: { ownerId: user.id }, include: { vaccinations: { select: { vaccineName: true, nextDueDate: true } }, _count: { select: { emergencyContacts: true } } } })
    : [];
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  let pawPointsBalance = 0;
  let cartCount = 0;
  let isFirstWalk = true;
  let upcoming: {
    id: string; type: string; startTime: Date; status: string; providerName: string; petName: string;
  } | null = null;
  let lastCompleted: { type: string; providerName: string; petName: string; priceAmount: number } | null = null;

  if (user) {
    const [balance, cart, paidWalk, nextBooking, lastBooking] = await Promise.all([
      getPawPointsBalance(user.id),
      prisma.cartItem.count({ where: { userId: user.id } }),
      prisma.booking.findFirst({ where: { ownerId: user.id, type: "WALKING", paidAt: { not: null } }, select: { id: true } }),
      prisma.booking.findFirst({
        where: { ownerId: user.id, status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] }, endTime: { gte: now } },
        orderBy: { startTime: "asc" },
        include: { provider: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
      }),
      prisma.booking.findFirst({
        where: { ownerId: user.id, status: "COMPLETED" },
        orderBy: { startTime: "desc" },
        include: { provider: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
      }),
    ]);
    pawPointsBalance = balance as number;
    cartCount = cart;
    isFirstWalk = !paidWalk;
    if (nextBooking) {
      upcoming = {
        id: nextBooking.id,
        type: nextBooking.type,
        startTime: nextBooking.startTime,
        status: nextBooking.status,
        providerName: nextBooking.provider.user.name,
        petName: nextBooking.pet.name,
      };
    }
    if (lastBooking) {
      lastCompleted = {
        type: lastBooking.type,
        providerName: lastBooking.provider.user.name,
        petName: lastBooking.pet.name,
        priceAmount: lastBooking.priceAmount,
      };
    }
  }

  const nextVaccine = activePet
    ? activePet.vaccinations
        .filter((v) => v.nextDueDate)
        .sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime())[0] ?? null
    : null;

  // Shop: products that fit the active dog's size first, then photos first.
  const petSize = activePet?.size ?? null;
  const shopPicks = [...productsWithPhotos]
    .map((p) => ({ ...p, fits: !!petSize && p.suitableSizes.includes(petSize) }))
    .sort((a, b) => Number(b.fits) - Number(a.fits) || Number(b.imageUrls.length > 0) - Number(a.imageUrls.length > 0))
    .slice(0, 6)
    .map(({ suitableSizes: _s, ...p }) => p);

  const passport = activePet
    ? (() => {
        const prog = passportProgress({ ...activePet, vaccinationCount: activePet.vaccinations.length, emergencyContactCount: activePet._count.emergencyContacts });
        return { number: derivePassportNumber(activePet.id), pct: prog.pct, next: prog.next?.label ?? null, shared: !!activePet.shareToken };
      })()
    : null;

  return (
    <div className={`w-full ${themeClass}`}>
      <HomeUnified
        isSignedIn={!!user}
        userName={user?.name ?? null}
        userAddress={user?.address ?? null}
        userPhone={user?.phone ?? null}
        cartCount={cartCount}
        pawPointsBalance={pawPointsBalance}
        pawPointsValuePaise={redemptionValuePaise(pawPointsBalance)}
        activePet={activePet ? { id: activePet.id, name: activePet.name, breed: activePet.breed, photoUrl: activePet.photoUrl } : null}
        nextVaccine={nextVaccine ? { name: nextVaccine.vaccineName, dueDate: nextVaccine.nextDueDate! } : null}
        upcoming={upcoming}
        lastCompleted={lastCompleted}
        prices={{
          walkFromPaise: WALK_FROM_PAISE,
          walkFirstPaise: isFirstWalk ? Math.round(WALK_FROM_PAISE * (1 - FIRST_WALK_DISCOUNT)) : null,
          groomFromPaise,
          trainFromPaise,
        }}
        counts={{ walkers: walkers.length, groomers: groomers.length, trainers: trainers.length, products: activeProductCount }}
        featuredPros={featuredPros}
        products={shopPicks}
        passport={passport}
        reviews={reviews}
      />
    </div>
  );
}
