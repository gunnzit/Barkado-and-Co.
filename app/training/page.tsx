import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveThemeClass } from "@/lib/breedTheme";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import LocationHeader from "@/components/LocationHeader";
import ThemeToggle from "@/components/ThemeToggle";
import ServiceBookingFlow from "@/components/ServiceBookingFlow";

export default async function TrainingPage() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const pets = await prisma.pet.findMany({ where: { ownerId: user.id } });
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <nav className="flex justify-between items-center px-6 pt-4">
          <LocationHeader
            headline="Book a trainer"
            currentAddressSnippet={user.address ? user.address.split(",")[0] : null}
            userPhone={user.phone ?? null}
          />
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <PetSwitcher avatarOnly />
            <ProfileMenu />
          </div>
        </nav>

        <div className="flex items-center gap-3 px-6 py-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} color="var(--terracotta)" /> Good Manners Programme
          </h1>
        </div>

        <ServiceBookingFlow
          serviceType="TRAINING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          hasPets={pets.length > 0}
          showStartButton={false}
          defaultAddress={user.address}
          defaultPhone={user.phone}
        />

      </main>
    </div>
  );
}