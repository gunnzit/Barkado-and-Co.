import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import TaskHeader from "@/components/TaskHeader";
import WalkBookingFlow from "@/components/WalkBookingFlow";

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
  const priorPaidWalk = await prisma.booking.findFirst({ where: { ownerId: user.id, type: "WALKING", paidAt: { not: null } }, select: { id: true } });

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto">
        <TaskHeader title="Book a walk" />

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
