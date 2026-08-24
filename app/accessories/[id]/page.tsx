import Link from "next/link";
import { ArrowLeft, Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "@/components/ProductGallery";
import ProductDetailActions from "@/components/ProductDetailActions";

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

  const Icon = ICONS[product.icon ?? "toy"] ?? Bone;

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-28 max-w-lg mx-auto">
        <div className="flex items-center gap-3 px-6 pt-4 pb-4">
          <Link href="/accessories" className="tap-scale">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="px-6">
          <ProductGallery
            imageUrls={product.imageUrls}
            fallbackIcon={<Icon size={48} color="var(--tan)" strokeWidth={1.5} />}
          />
        </div>

        <div className="px-6 mt-5">
          <p className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>{product.category}</p>
          <h1 className="text-xl font-bold mt-1">{product.name}</h1>
          {product.description && (
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{product.description}</p>
          )}
          <p className="text-2xl font-bold mt-4">₹{(product.price / 100).toFixed(0)}</p>
        </div>

        <div className="px-6 mt-6">
          <ProductDetailActions productId={product.id} />
        </div>
      </main>
    </div>
  );
}