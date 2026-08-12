import Link from "next/link";
import { ArrowLeft, BedDouble } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { breedThemeClass } from "@/lib/breedTheme";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ServiceBookingFlow from "@/components/ServiceBookingFlow";

export default async function SittingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = breedThemeClass(activePet?.breed);

  return (
    <div className={`w-full ${themeClass}`} style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <div className="px-6 pt-4 flex items-center justify-between">
          <PetSwitcher />
          <ProfileMenu />
        </div>

        <div className="flex items-center gap-3 px-6 py-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BedDouble size={20} color="var(--terracotta)" /> Home Staycation
          </h1>
        </div>

        <ServiceBookingFlow
          serviceType="SITTING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          hasPets={pets.length > 0}
          showStartButton={false}
        />

        <BottomNav />
      </main>
    </div>
  );
}