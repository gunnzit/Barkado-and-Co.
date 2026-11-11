import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { getPawPointsBalance, redemptionValuePaise } from "@/lib/pawPoints";
import TaskHeader from "@/components/TaskHeader";
import ProfileView, { type ProfilePet } from "@/components/ProfileView";

const DUE_SOON_DAYS = 30;

export default async function OwnerProfile() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");
  const now = new Date();

  const [pets, bookingCount, activeBookingCount, wishlist, favorites, addressCount, pawPoints, upcoming] = await Promise.all([
    prisma.pet.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, name: true, breed: true, photoUrl: true, vetHospitalName: true, attendingVetName: true,
        vaccinations: { select: { vaccineName: true, nextDueDate: true } },
      },
    }),
    prisma.booking.count({ where: { ownerId: user.id } }),
    prisma.booking.count({ where: { ownerId: user.id, status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] }, endTime: { gte: now } } }),
    prisma.favorite.count({ where: { userId: user.id, productId: { not: null } } }),
    prisma.favorite.count({ where: { userId: user.id, providerId: { not: null } } }),
    prisma.address.count({ where: { userId: user.id } }),
    getPawPointsBalance(user.id),
    prisma.booking.findFirst({
      where: { ownerId: user.id, status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] }, endTime: { gte: now } },
      orderBy: { startTime: "asc" },
      select: { type: true, startTime: true, status: true, provider: { select: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
    }),
  ]);

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;

  const profilePets: ProfilePet[] = pets.map((p) => {
    const dated = p.vaccinations.filter((v) => v.nextDueDate).sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime());
    const next = dated[0] ?? null;
    const days = next ? Math.floor((next.nextDueDate!.getTime() - now.getTime()) / 86_400_000) : null;
    return {
      id: p.id,
      name: p.name,
      breed: p.breed,
      photoUrl: p.photoUrl,
      vaccine: p.vaccinations.length === 0 ? "NONE" : days !== null && days < 0 ? "OVERDUE" : days !== null && days <= DUE_SOON_DAYS ? "DUE_SOON" : "OK",
      nextDue: next ? { name: next.vaccineName, date: next.nextDueDate!.toISOString() } : null,
    };
  });

  const vetName = activePet?.vetHospitalName ?? activePet?.attendingVetName ?? null;

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto pb-12">
        <TaskHeader title="Profile" showCart={false} />
        <div className="h-2" />
        <Suspense>
          <ProfileView
            data={{
              name: user.name,
              email: user.email,
              phone: user.phone,
              address: user.address,
              pets: profilePets,
              activePetId: activePet?.id ?? null,
              upcoming: upcoming
                ? { type: upcoming.type, startTime: upcoming.startTime.toISOString(), status: upcoming.status, providerName: upcoming.provider.user.name, petName: upcoming.pet.name }
                : null,
              counts: { bookings: bookingCount, activeBookings: activeBookingCount, wishlist, favorites, addresses: addressCount },
              pawPoints,
              pawPointsValuePaise: redemptionValuePaise(pawPoints),
              vetName,
              vetEditHref: activePet ? `/owner/pets/${activePet.id}/step-2` : "/owner/pets",
            }}
          />
        </Suspense>
      </main>
    </div>
  );
}
