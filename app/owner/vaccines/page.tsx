import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import VaccinesClient from "@/components/VaccinesClient";

export default async function VaccinesPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const [pets, entries] = await Promise.all([
    prisma.pet.findMany({ where: { ownerId: user.id } }),
    prisma.vaccination.findMany({
      where: { pet: { ownerId: user.id } },
      include: { pet: { select: { id: true, name: true } } },
      orderBy: { dateGiven: "desc" },
    }),
  ]);

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0];
  const initialThemeClass = resolveThemeClass(activePet);

  return (
    <VaccinesClient
      initialThemeClass={initialThemeClass}
      pets={JSON.parse(JSON.stringify(pets))}
      initialEntries={JSON.parse(JSON.stringify(entries))}
    />
  );
}