import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      {/* max-w-3xl here (wider than the max-w-lg every other page uses) so
          ServiceBookingFlow's responsive two-column layout for the Walking
          intro screen actually has room to appear on desktop — every other
          page keeps the standard mobile-width container untouched. */}
      <main className="pb-28 max-w-3xl mx-auto">
        <nav className="flex justify-between items-center px-6 pt-4">
          <LocationHeader
            headline="Book a walker"
            currentAddressSnippet={user.address ? user.address.split(",")[0] : null}
            userPhone={user.phone ?? null}
          />
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <PetSwitcher avatarOnly />
            <ProfileMenu />
          </div>
        </nav>

        <div className="px-6 py-5">
          <Link href="/" className="tap-scale inline-block">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <ServiceBookingFlow
          serviceType="WALKING"
          activePetId={activePet?.id ?? null}
          activePetName={activePet?.name ?? null}
          pets={pets.map((p) => ({ id: p.id, name: p.name, photoUrl: p.photoUrl }))}
          hasPets={pets.length > 0}
          showStartButton={true}
          isFirstWalk={isFirstWalk}
          defaultAddress={user.address}
          defaultPhone={user.phone}
        />

      </main>
    </div>
  );
}