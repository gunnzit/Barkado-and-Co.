import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import TaskHeader from "@/components/TaskHeader";
import ProBookingFlow from "@/components/ProBookingFlow";

export default async function TrainingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [pets, pros] = await Promise.all([
    prisma.pet.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.provider.findMany({
      where: { verified: true, servicesOffered: { has: "TRAINING" } },
      select: { pricePerTrain: true },
    }),
  ]);
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  // Lowest real price any verified pro charges, for the hero's "From ₹…".
  const prices = pros.flatMap((p) => [p.pricePerTrain])
    .filter((v): v is number => typeof v === "number" && v > 0);
  const fromPaise = prices.length > 0 ? Math.min(...prices) : null;

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto">
        <TaskHeader title="Book training" />
        <ProBookingFlow
          service="TRAINING"
          pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl, breed: p.breed, size: p.size }))}
          activePetId={activePet?.id ?? null}
          address={user.address}
          phone={user.phone}
          fromPaise={fromPaise}
        />
      </main>
    </div>
  );
}
