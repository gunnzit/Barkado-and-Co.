import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { AccessoryCard } from "@/components/AccessoryCard";
import BottomNav from "@/components/BottomNav";
import PetSwitcher from "@/components/PetSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
import { breedThemeClass } from "@/lib/breedTheme";

export default async function AccessoriesPage() {
  const user = await getOrCreateUser();

  const [products, pets] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    user ? prisma.pet.findMany({ where: { ownerId: user.id } }) : Promise.resolve([]),
  ]);

  const activePetCookie = (await cookies()).get("active_pet_id")?.value;
  const activePet = pets.find((p) => p.id === activePetCookie) ?? pets[0] ?? null;
  const themeClass = breedThemeClass(activePet?.breed);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Within each category, products matching the active pet's size (or
  // tagged universal — no sizes specified) sort ahead of mismatched ones.
  const sortForActivePet = (items: typeof products) => {
    if (!activePet) return items;
    return [...items].sort((a, b) => {
      const aFits = a.suitableSizes.length === 0 || a.suitableSizes.includes(activePet.size);
      const bFits = b.suitableSizes.length === 0 || b.suitableSizes.includes(activePet.size);
      if (aFits === bFits) return 0;
      return aFits ? -1 : 1;
    });
  };

  return (
    <main className={`pb-28 max-w-5xl mx-auto ${themeClass}`} style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="px-6 pt-4 flex items-center justify-between">
        <PetSwitcher />
        <ProfileMenu />
      </div>

      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag size={20} color="var(--tan)" /> Accessories
          </h1>
        </div>
        <Link href="/cart" className="btn-secondary text-sm tap-scale">
          View cart
        </Link>
      </div>

      <p className="px-6 text-sm mb-8" style={{ color: "var(--muted)" }}>
        {activePet
          ? `Everyday essentials — sorted for ${activePet.name}'s size.`
          : "Everyday essentials for your pet, picked to last."}
      </p>

      {products.length === 0 ? (
        <p className="px-6 text-sm" style={{ color: "var(--muted)" }}>
          No products yet — run the seed script to load sample accessories.
        </p>
      ) : (
        categories.map((category) => (
          <section key={category} className="px-6 mb-10">
            <h2 className="text-lg font-bold mb-4">{category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortForActivePet(products.filter((p) => p.category === category)).map((item) => (
                <AccessoryCard
                  key={item.id}
                  item={{
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    price: item.price / 100,
                    description: item.description ?? "",
                    icon: (item.icon as any) ?? "toy",
                  }}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <BottomNav />
    </main>
  );
}