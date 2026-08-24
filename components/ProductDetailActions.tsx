import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "@/components/ProductGallery";
import ProductDetailActions from "@/components/ProductDetailActions";
import { AccessoryCard } from "@/components/AccessoryCard";

const ICONS: Record<string, any> = {
  leash: Dog,
  collar: CircleDot,
  bowl: UtensilsCrossed,
  toy: Bone,
  bed: BedDouble,
  carrier: Briefcase,
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  const similar = await prisma.product.findMany({
    where: { active: true, category: product.category, id: { not: product.id } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  const Icon = ICONS[product.icon ?? "toy"] ?? Bone;
  const priceRupees = product.price / 100;
  const compareAtRupees = product.compareAtPrice ? product.compareAtPrice / 100 : null;
  const hasDiscount = compareAtRupees != null && compareAtRupees > priceRupees;
  const percentOff = hasDiscount ? Math.round(((compareAtRupees! - priceRupees) / compareAtRupees!) * 100) : 0;

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-32 max-w-lg mx-auto">
        <ProductGallery
          imageUrls={product.imageUrls}
          fallbackIcon={<Icon size={48} color="var(--tan)" strokeWidth={1.5} />}
          shareTitle={product.name}
        />

        <div className="px-6 mt-5">
          <p className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>{product.category}</p>
          <h1 className="text-xl font-bold mt-1">{product.name}</h1>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-bold">₹{priceRupees}</span>
            {hasDiscount && (
              <span className="text-sm line-through" style={{ color: "var(--muted)" }}>₹{compareAtRupees}</span>
            )}
          </div>
          {hasDiscount && (
            <p className="text-sm font-bold mt-0.5" style={{ color: "#2f6fb0" }}>{percentOff}% OFF on MRP</p>
          )}

          {product.description && (
            <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>{product.description}</p>
          )}
        </div>

        {similar.length > 0 && (
          <section className="px-6 mt-8">
            <h2 className="text-lg font-bold mb-4">Similar products</h2>
            <div className="grid grid-cols-2 gap-4">
              {similar.map((p) => (
                <AccessoryCard
                  key={p.id}
                  item={{
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price / 100,
                    compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : null,
                    description: p.description ?? "",
                    icon: (p.icon as any) ?? "toy",
                    imageUrls: p.imageUrls,
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <ProductDetailActions productId={product.id} price={priceRupees} />
    </div>
  );
}