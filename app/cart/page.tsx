import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { resolveThemeClass } from "@/lib/breedTheme";
import TaskHeader from "@/components/TaskHeader";
import CartItemsList from "@/components/CartItemsList";

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
    select: { id: true, name: true, price: true, compareAtPrice: true, imageUrls: true, colorOptions: true, sizeOptions: true },
  });

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="max-w-lg mx-auto">
        <TaskHeader title="Cart" showCart={false} />
        <CartItemsList
          petName={activePet?.name ?? null}
          suggested={suggested}
          details={user ? { name: user.name, phone: user.phone, address: user.address } : null}
        />
      </main>
    </div>
  );
}
