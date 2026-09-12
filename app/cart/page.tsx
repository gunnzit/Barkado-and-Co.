import Link from "next/link";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import CartItemsList from "@/components/CartItemsList";
import CartLocationPill from "@/components/CartLocationPill";
import ProfileMenu from "@/components/ProfileMenu";

export default async function CartPage() {
  const user = await getOrCreateUser();

  const pets = user ? await prisma.pet.findMany({ where: { ownerId: user.id } }) : [];
  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  const cartProductIds = user
    ? (await prisma.cartItem.findMany({ where: { userId: user.id, kind: "PRODUCT" }, select: { productId: true } })).map((c) => c.productId)
    : [];

  const suggested = await prisma.product.findMany({
    where: { active: true, id: { notIn: cartProductIds.filter((id): id is string => !!id) } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "#fbfaee", minHeight: "100vh" }}>
      <main className="pb-10 max-w-lg mx-auto">
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link href="/" className="tap-scale mt-0.5">
              <ArrowLeft size={20} color="#02120a" />
            </Link>
            <div>
              <h1 className="font-extrabold text-lg" style={{ fontFamily: "var(--font-heading)", color: "#02120a" }}>Your Cart &amp; Bookings</h1>
              <CartLocationPill userAddress={user?.address ?? null} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full flex items-center justify-center" aria-label="More options">
              <MoreVertical size={18} color="#424844" />
            </button>
            <ProfileMenu />
          </div>
        </div>

        <CartItemsList petName={activePet?.name ?? null} suggested={suggested} />
      </main>
    </div>
  );
}