import Link from "next/link";
import { Dog, CircleDot, UtensilsCrossed, Bone, BedDouble, Briefcase, ChevronRight, ChevronDown, Sparkles, Truck, PackageCheck, RotateCcw, Info } from "lucide-react";
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

  const [similar, topSellingIds] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, category: product.category, id: { not: product.id } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    // Real bestseller signal — same ranking already used on the
    // Accessories listing page.
    prisma.orderItem.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  const isBestseller = topSellingIds.some((t) => t.productId === product.id && t._count.productId > 0);
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const Icon = ICONS[product.icon ?? "toy"] ?? Bone;
  const priceRupees = product.price / 100;
  const compareAtRupees = product.compareAtPrice ? product.compareAtPrice / 100 : null;
  const hasDiscount = compareAtRupees != null && compareAtRupees > priceRupees;
  const percentOff = hasDiscount ? Math.round(((compareAtRupees! - priceRupees) / compareAtRupees!) * 100) : 0;

  return (
    <div className="w-full" style={{ backgroundColor: "var(--cream)", minHeight: "100vh" }}>
      <main className="pb-32 lg:pb-16 max-w-lg lg:max-w-5xl mx-auto">
        {/* ===== Breadcrumb ===== */}
        <div className="px-4 py-2.5 flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar whitespace-nowrap" style={{ color: "var(--muted)" }}>
          <Link href="/accessories" className="hover:underline">Shop</Link>
          <ChevronRight size={13} />
          <span className="font-semibold" style={{ color: "var(--forest, #16281f)" }}>{product.category}</span>
        </div>

        {/* Real two-column split from desktop up — gallery sticky on the
            left, everything else on the right. Previously identical at
            every screen width. */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-4">
          <div className="lg:sticky lg:top-6">
            {/* ===== Gallery section — badges row ABOVE the image (matching
                reference layout exactly), not overlaid on top of it. Only
                Bestseller appears, since it's the only real badge — the
                reference's other two ("Artisan Atelier Handcrafted,"
                "Lifetime Guarantee") are unbacked claims, dropped entirely
                rather than faked or left as empty placeholders. ===== */}
            <section className="px-4 lg:px-0 flex flex-col gap-3">
              {isBestseller && (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: "var(--panel-dark)", color: "var(--gold)" }}
                  >
                    <Sparkles size={13} /> Bestseller
                  </span>
                </div>
              )}

              <ProductGallery
                imageUrls={product.imageUrls}
                fallbackIcon={<Icon size={48} color="var(--tan)" strokeWidth={1.5} />}
                shareTitle={product.name}
              />
            </section>
          </div>

          <div>
            {/* ===== Title & trust block ===== */}
            <section className="px-4 lg:px-0 pt-4 lg:pt-0 pb-2 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--terracotta)" }}>{product.category}</p>

              <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

              <div className="flex items-baseline gap-2.5 pt-1">
                <span className="text-2xl font-bold">₹{priceRupees}</span>
                {hasDiscount && (
                  <>
                    <span className="text-base line-through" style={{ color: "var(--muted)" }}>₹{compareAtRupees}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#e8f4ec", color: "#2f6fb0" }}>
                      Save {percentOff}%
                    </span>
                  </>
                )}
              </div>

              {product.description && (
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{product.description}</p>
              )}

              {/* Real fulfillment signal card — same shape/weight as the
                  reference, real stock status + the same real free-shipping
                  policy already shown on the Accessories listing page. */}
              <div className="mt-2 p-3 rounded-xl flex items-start gap-2.5" style={{ background: "var(--card)" }}>
                <Truck size={20} color="var(--terracotta)" className="mt-0.5 shrink-0" />
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  <p className="font-medium flex items-center gap-1.5 mb-0.5" style={{ color: inStock ? "var(--forest, #16281f)" : "var(--muted)" }}>
                    {inStock && <span className="w-2 h-2 rounded-full" style={{ background: lowStock ? "var(--heritage-red, #c0392b)" : "#2f9e5f" }} />}
                    {inStock ? (lowStock ? `Only ${product.stock} left in stock` : "In stock — ships today") : "Out of stock"}
                  </p>
                  <span>Free shipping on orders over ₹500.</span>
                </div>
              </div>
            </section>

            {/* Variant pickers (real color/size options, if any) + Add to
                Cart — fixed to the viewport bottom on mobile, flows
                normally inline here on desktop. */}
            <ProductDetailActions
              productId={product.id}
              price={priceRupees}
              colorOptions={product.colorOptions}
              sizeOptions={product.sizeOptions}
            />

            {/* ===== Details — same accordion pattern as the reference, but
                every item here is real: the actual product description (not
                fabricated "Tuscan provenance" copy), and real links to your
                actual shipping/refund policies. No materials claims, care
                instructions, or warranty language that isn't genuinely
                yours. ===== */}
            <section className="px-4 lg:px-0 py-3 flex flex-col gap-2 mt-2">
              <h2 className="font-bold text-sm mb-1">Details &amp; Policies</h2>

              {product.description && (
                <details className="rounded-2xl overflow-hidden" style={{ background: "var(--card)" }} open>
                  <summary className="flex items-center justify-between p-3.5 cursor-pointer list-none select-none">
                    <span className="flex items-center gap-2 font-semibold text-xs">
                      <Info size={16} color="var(--terracotta)" /> Product Details
                    </span>
                    <ChevronDown size={16} color="var(--muted)" />
                  </summary>
                  <div className="px-3.5 pb-3.5 text-xs" style={{ color: "var(--muted)" }}>
                    <p>{product.description}</p>
                  </div>
                </details>
              )}

              <details className="rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
                <summary className="flex items-center justify-between p-3.5 cursor-pointer list-none select-none">
                  <span className="flex items-center gap-2 font-semibold text-xs">
                    <Truck size={16} color="var(--terracotta)" /> Shipping
                  </span>
                  <ChevronDown size={16} color="var(--muted)" />
                </summary>
                <div className="px-3.5 pb-3.5 text-xs" style={{ color: "var(--muted)" }}>
                  <Link href="/legal/shipping" className="hover:underline font-semibold" style={{ color: "var(--terracotta)" }}>
                    Read our full Shipping Policy →
                  </Link>
                </div>
              </details>

              <details className="rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
                <summary className="flex items-center justify-between p-3.5 cursor-pointer list-none select-none">
                  <span className="flex items-center gap-2 font-semibold text-xs">
                    <RotateCcw size={16} color="var(--terracotta)" /> Cancellations &amp; Returns
                  </span>
                  <ChevronDown size={16} color="var(--muted)" />
                </summary>
                <div className="px-3.5 pb-3.5 text-xs" style={{ color: "var(--muted)" }}>
                  <Link href="/legal/refund" className="hover:underline font-semibold" style={{ color: "var(--terracotta)" }}>
                    Read our full Cancellation &amp; Refund Policy →
                  </Link>
                </div>
              </details>
            </section>
          </div>
        </div>

        {/* ===== Complete the Lifestyle — real similar products, full width
            below the two-column split ===== */}
        {similar.length > 0 && (
          <section className="px-4 py-4 flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">Complete the Lifestyle</h2>
              <Link href="/accessories" className="text-xs font-semibold hover:underline" style={{ color: "var(--terracotta)" }}>View All</Link>
            </div>
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 no-scrollbar">
              {similar.map((p) => {
                const SimIcon = ICONS[p.icon ?? "toy"] ?? Bone;
                const photo = p.imageUrls?.[0];
                return (
                  <Link
                    key={p.id}
                    href={`/accessories/${p.id}`}
                    className="w-40 shrink-0 p-2.5 rounded-2xl flex flex-col justify-between tap-scale"
                    style={{ background: "var(--card)" }}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 flex items-center justify-center" style={{ background: "var(--cream)" }}>
                      {photo ? <img src={photo} alt={p.name} className="w-full h-full object-cover" /> : <SimIcon size={26} color="var(--tan)" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold line-clamp-1">{p.name}</h3>
                      <p className="text-xs font-bold mt-1">₹{(p.price / 100).toFixed(0)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}