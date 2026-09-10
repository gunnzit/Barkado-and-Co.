import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddPetStep3 from "@/components/AddPetStep3";

export default async function AddPetStep3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: user.id },
    include: {
      owner: { select: { name: true, phone: true } },
      emergencyContacts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!pet) notFound();

  return <AddPetStep3 pet={JSON.parse(JSON.stringify(pet))} />;
}