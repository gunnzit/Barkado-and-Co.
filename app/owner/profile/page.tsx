import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import { UserButton } from "@clerk/nextjs";

export default async function OwnerProfile() {
  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const petCount = await prisma.pet.count({ where: { ownerId: user.id } });

  return (
    <main className="pb-24 px-5 pt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <UserButton />
          <div>
            <p className="font-bold text-lg">{user.name}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="card mb-4">
        <p className="text-sm" style={{ color: "var(--muted)" }}>Pets</p>
        <p className="text-2xl font-extrabold">{petCount}</p>
      </div>

      <div className="space-y-2">
        <Link href="/owner/pets" className="card flex justify-between items-center">
          <span>🐾 Manage pets &amp; vaccines</span>
          <span>›</span>
        </Link>
        <Link href="/owner/bookings" className="card flex justify-between items-center">
          <span>📅 Booking history</span>
          <span>›</span>
        </Link>
        <Link href="/provider/onboarding" className="card flex justify-between items-center">
          <span>🚶 Become a provider</span>
          <span>›</span>
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
