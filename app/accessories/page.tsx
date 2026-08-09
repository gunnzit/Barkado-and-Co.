import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AccessoryCard } from "@/components/AccessoryCard";
import BottomNav from "@/components/BottomNav";

export default async function AccessoriesPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <main className="pb-28 max-w-5xl mx-auto" style={{ background: "var(--cream)", minHeight: "100vh" }}>
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
        Everyday essentials for your pet, picked to last.
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
              {products
                .filter((p) => p.category === category)
                .map((item) => (
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
