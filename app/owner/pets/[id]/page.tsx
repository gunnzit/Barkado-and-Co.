import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PetProfileClient from "@/components/PetProfileClient";

export default async function PetProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: user.id },
    include: {
      vaccinations: { orderBy: { nextDueDate: "asc" } },
      bookings: {
        include: { provider: { include: { user: true } } },
        orderBy: { startTime: "desc" },
      },
    },
  });
  if (!pet) notFound();

  return <PetProfileClient pet={JSON.parse(JSON.stringify(pet))} />;
}
