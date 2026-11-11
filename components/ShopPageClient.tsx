"use client";

import { useState } from "react";
import ShopHeader from "@/components/ShopHeader";
import ShopHighlights from "@/components/ShopHighlights";
import AccessoriesListClient from "@/components/AccessoriesListClient";
import PartnerBrandBanner from "@/components/PartnerBrandBanner";
import type { Accessory } from "@/components/AccessoryCard";

type Product = {
  id: string; name: string; category: string; price: number; compareAtPrice: number | null;
  description: string; imageUrls: string[]; stock: number; isBestseller?: boolean;
};
type Bundle = {
  id: string; name: string; description: string | null; bundlePricePaise: number;
  imageUrl: string | null; items: { productName: string; quantity: number }[]; realComparePaise: number;
};

export default function ShopPageClient({
  userAddress,
  products,
  featuredProduct,
  tailoredProducts,
  petName,
  bundles,
  impulseProducts,
  partnerBrandName,
  petSize = null,
}: {
  userAddress: string | null;
  products: Accessory[];
  featuredProduct: (Product & { percentOff: number }) | null;
  tailoredProducts: Product[];
  petName: string | null;
  bundles: Bundle[];
  impulseProducts: Product[];
  partnerBrandName?: string | null;
  petSize?: string | null;
}) {
  const [query, setQuery] = useState("");

  return (
    <>
      <ShopHeader userAddress={userAddress} />

      {/* Hero from the Stitch Shop design (design/stitch/03-shop) */}
      <section className="px-4 pt-1 pb-5">
        <div className="relative overflow-hidden rounded-[2rem]" style={{ background: "#6e1e3b", boxShadow: "0 12px 28px -6px rgba(110,30,59,0.22)" }}>
          <div className="relative z-10 flex items-end justify-between gap-3 pl-5 pr-3 pt-5 pb-8">
            <div className="flex-1 min-w-0 pb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "#f9dd8a", color: "#3d1426" }}>
                The Artisan Shelf
              </span>
              <h1 className="font-script mt-2 text-[36px] leading-[1.0]" style={{ color: "#f9dd8a" }}>
                Woof<br />it All!
              </h1>
              <p className="mt-2 text-xs leading-snug" style={{ color: "rgba(251,240,217,0.85)" }}>
                Handpicked accessories, treats and comfort for your dog.
              </p>
              <a href="#shop-products" className="mt-4 inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold shadow-md tap-scale" style={{ background: "#f9dd8a", color: "#3d1426", fontFamily: "var(--font-heading)" }}>
                Shop now
              </a>
            </div>
            <img src="/images/brand/golden-bandana.jpg" alt="Golden retriever wearing a plum bandana" className="w-32 h-40 sm:w-44 sm:h-52 object-cover rounded-2xl shrink-0" style={{ boxShadow: "0 8px 16px rgba(0,0,0,0.25)", border: "2px solid rgba(249,221,138,0.5)" }} />
          </div>
          <span className="brand-wave" aria-hidden="true" />
        </div>
      </section>

      {partnerBrandName && <PartnerBrandBanner partnerBrandName={partnerBrandName} />}
      {/* Products first: shoppers came to browse. Deals, bundles and add-ons follow. */}
      <AccessoriesListClient products={products} query={query} onQueryChange={setQuery} petName={petName} petSize={petSize} />
      <div className="mt-8">
        <ShopHighlights
          featuredProduct={featuredProduct}
          tailoredProducts={tailoredProducts}
          petName={petName}
          bundles={bundles}
          impulseProducts={impulseProducts}
        />
      </div>
    </>
  );
}