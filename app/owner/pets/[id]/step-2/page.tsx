import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddPetStep2 from "@/components/AddPetStep2";

export default async function AddPetStep2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: user.id },
    include: {
      vaccinations: { orderBy: { nextDueDate: "asc" } },
      medications: { where: { active: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!pet) notFound();

  return <AddPetStep2 pet={JSON.parse(JSON.stringify(pet))} />;
}