import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import { AccessoryCard } from "@/components/AccessoryCard";
import CartItemsList from "@/components/CartItemsList";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

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
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
      <main className="pb-40 max-w-lg mx-auto">
        <div className="px-6 pt-4 flex items-center justify-between">
          <PetSwitcher avatarOnly />
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <ProfileMenu />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} color="var(--terracotta)" /> Checkout
          </h1>
        </div>

        <CartItemsList />

        {suggested.length > 0 && (
          <section className="px-6 mb-10">
            <h2 className="text-lg font-bold mb-4">You might also like</h2>
            <div className="grid grid-cols-2 gap-4">
              {suggested.map((item) => (
                <AccessoryCard
                  key={item.id}
                  item={{
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    price: item.price / 100,
                    description: item.description ?? "",
                    icon: (item.icon as any) ?? "toy",
                    imageUrls: item.imageUrls,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}