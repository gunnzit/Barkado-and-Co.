import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import ServiceBookingFlow from "@/components/ServiceBookingFlow";

export default async function WalkBookingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);
  const pastWalkCount = await prisma.booking.count({ where: { ownerId: user.id, type: "WALKING" } });
  const isFirstWalk = pastWalkCount === 0;

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "180px", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <div className="px-6 pt-4 flex items-center justify-between">
          <PetSwitcher />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        <div className="px-6 py-5">
          <Link href="/owner/dashboard" className="tap-scale inline-block">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <ServiceBookingFlow
          serviceType="WALKING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          hasPets={pets.length > 0}
          showStartButton={true}
          isFirstWalk={isFirstWalk}
        />

        <BottomNav />
      </main>
    </div>
  );
}