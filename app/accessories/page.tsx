import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import AccessoriesListClient from "@/components/AccessoriesListClient";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { resolveThemeClass } from "@/lib/breedTheme";

export default async function AccessoriesPage() {
  const user = await getOrCreateUser();

  const [products, pets, topSellingIds] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    user ? prisma.pet.findMany({ where: { ownerId: user.id } }) : Promise.resolve([]),
    // Real bestseller signal — same real order-count ranking already used
    // on the homepage, not a decorative label.
    prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const bestsellerIds = new Set(topSellingIds.filter((t) => t._count.productId > 0).map((t) => t.productId));

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = resolveThemeClass(activePet);

  // Within-pet-size sort still applies before handing off to the client
  // component, same logic as before.
  const sortForActivePet = (items: typeof products) => {
    if (!activePet) return items;
    return [...items].sort((a, b) => {
      const aFits = a.suitableSizes.length === 0 || a.suitableSizes.includes(activePet.size);
      const bFits = b.suitableSizes.length === 0 || b.suitableSizes.includes(activePet.size);
      if (aFits === bFits) return 0;
      return aFits ? -1 : 1;
    });
  };

  const serialized = sortForActivePet(products).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price / 100,
    description: item.description ?? "",
    icon: (item.icon as any) ?? "toy",
    compareAtPrice: item.compareAtPrice ? item.compareAtPrice / 100 : null,
    imageUrls: item.imageUrls,
    stock: item.stock,
    isBestseller: bestsellerIds.has(item.id),
    colorOptions: item.colorOptions,
    sizeOptions: item.sizeOptions,
  }));

  return (
    <div className={`w-full ${themeClass}`} style={{ backgroundColor: "var(--cream)", backgroundImage: "var(--page-bg-image)", backgroundRepeat: "repeat", backgroundSize: "cover, 260px", minHeight: "100vh" }}>
    <main className="pb-28 max-w-lg sm:max-w-4xl mx-auto">
      <div className="px-6 pt-4 flex items-center justify-between">
        <PetSwitcher avatarOnly />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-5">
        <Link href="/" className="tap-scale">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag size={20} color="var(--tan)" /> Accessories
        </h1>
      </div>

      <p className="px-6 text-sm mb-5" style={{ color: "var(--muted)" }}>
        {activePet
          ? `Everyday essentials — sorted for ${activePet.name}'s size.`
          : "Everyday essentials for your pet, picked to last."}
      </p>

      {products.length === 0 ? (
        <p className="px-6 text-sm" style={{ color: "var(--muted)" }}>
          No products yet — run the seed script to load sample accessories.
        </p>
      ) : (
        <AccessoriesListClient products={serialized} />
      )}
    </main>
    </div>
  );
}