import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, ChevronRight, Sparkles, ChevronDown } from "lucide-react";
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

function stockLabel(stock: number): { text: string; color: string } {
  if (stock <= 0) return { text: "Out of stock", color: "var(--muted)" };
  if (stock <= 5) return { text: `Only ${stock} left`, color: "var(--heritage-red, #c0392b)" };
  return { text: "In stock — ships today", color: "var(--forest, #16281f)" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  const [similar, topSellingIds] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, category: product.category, id: { not: product.id } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    // Real bestseller signal — same ranking already used on the
    // Accessories listing page, not a decorative label.
    prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const isBestseller = topSellingIds.some((t) => t.productId === product.id && t._count.productId > 0);

  const Icon = ICONS[product.icon ?? "toy"] ?? Bone;
  const priceRupees = product.price / 100;
  const compareAtRupees = product.compareAtPrice ? product.compareAtPrice / 100 : null;
  const hasDiscount = compareAtRupees != null && compareAtRupees > priceRupees;
  const percentOff = hasDiscount ? Math.round(((compareAtRupees! - priceRupees) / compareAtRupees!) * 100) : 0;
  const stock = stockLabel(product.stock);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-32 max-w-lg mx-auto">
        {/* ===== Real breadcrumb ===== */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <Link href="/accessories" className="hover:underline">Shop</Link>
          <ChevronRight size={12} />
          <span className="font-semibold" style={{ color: "var(--forest, #16281f)" }}>{product.category}</span>
        </div>

        <div className="relative">
          <ProductGallery
            imageUrls={product.imageUrls}
            fallbackIcon={<Icon size={48} color="var(--tan)" strokeWidth={1.5} />}
            shareTitle={product.name}
          />
          {isBestseller && (
            <span
              className="absolute top-3 left-9 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full z-10"
              style={{ background: "var(--panel-dark)", color: "var(--gold)" }}
            >
              <Sparkles size={10} /> Bestseller
            </span>
          )}
        </div>

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
          <p className="text-xs font-semibold mt-2" style={{ color: stock.color }}>{stock.text}</p>

          {product.description && (
            <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>{product.description}</p>
          )}
        </div>
      </main>

      {/* Variant pickers + sticky Add to Cart bar */}
      <ProductDetailActions
        productId={product.id}
        price={priceRupees}
        colorOptions={product.colorOptions}
        sizeOptions={product.sizeOptions}
      />

      <div className="max-w-lg mx-auto" style={{ paddingBottom: 140 }}>
        {/* ===== Details — real content only: the real description, and
            links to your real legal pages. No fabricated care
            instructions, certifications, or "lifetime guarantee"
            language — nothing here is invented. ===== */}
        <section className="px-6 mt-6">
          <h2 className="text-lg font-bold mb-3">Details</h2>
          <details className="rounded-xl overflow-hidden mb-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-semibold text-sm">
              Shipping &amp; Returns
              <ChevronDown size={16} color="var(--muted)" />
            </summary>
            <div className="px-4 pb-4 text-sm space-y-2" style={{ color: "var(--muted)" }}>
              <Link href="/legal/shipping" className="block hover:underline" style={{ color: "var(--terracotta)" }}>Shipping Policy →</Link>
              <Link href="/legal/refund" className="block hover:underline" style={{ color: "var(--terracotta)" }}>Cancellation &amp; Refund Policy →</Link>
            </div>
          </details>
        </section>

        {/* ===== Complete the Lifestyle — real similar products ===== */}
        {similar.length > 0 && (
          <section className="px-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Complete the Lifestyle</h2>
              <Link href="/accessories" className="text-xs font-semibold" style={{ color: "var(--terracotta)" }}>View All</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {similar.map((p) => {
                const SimIcon = ICONS[p.icon ?? "toy"] ?? Bone;
                const photo = p.imageUrls?.[0];
                return (
                  <Link
                    key={p.id}
                    href={`/accessories/${p.id}`}
                    className="w-36 shrink-0 rounded-xl p-2.5 tap-scale"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-2" style={{ background: "var(--cream)" }}>
                      {photo ? <img src={photo} alt={p.name} className="w-full h-full object-cover" /> : <SimIcon size={24} color="var(--tan)" />}
                    </div>
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                    <p className="text-sm font-bold mt-1">₹{(p.price / 100).toFixed(0)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}