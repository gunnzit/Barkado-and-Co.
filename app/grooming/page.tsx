import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ServiceBookingFlow from "@/components/ServiceBookingFlow";

export default async function GroomingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <div className="px-6 pt-4 flex items-center justify-between">
          <PetSwitcher avatarOnly />
          <ProfileMenu />
        </div>

        <div className="flex items-center gap-3 px-6 py-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scissors size={20} color="var(--terracotta)" /> Luxury Spa Session
          </h1>
        </div>

        <ServiceBookingFlow
          serviceType="GROOMING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          hasPets={pets.length > 0}
          showStartButton={false}
          defaultAddress={user.address}
          defaultPhone={user.phone}
        />

        <BottomNav />
      </main>
    </div>
  );
}