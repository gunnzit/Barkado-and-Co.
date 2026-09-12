"use client";

import { useState } from "react";
import ShopHeader from "@/components/ShopHeader";
import ShopHighlights from "@/components/ShopHighlights";
import AccessoriesListClient from "@/components/AccessoriesListClient";
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
}: {
  userAddress: string | null;
  products: Accessory[];
  featuredProduct: (Product & { percentOff: number }) | null;
  tailoredProducts: Product[];
  petName: string | null;
  bundles: Bundle[];
  impulseProducts: Product[];
}) {
  const [query, setQuery] = useState("");

  return (
    <>
      <ShopHeader userAddress={userAddress} query={query} onQueryChange={setQuery} />
      <ShopHighlights
        featuredProduct={featuredProduct}
        tailoredProducts={tailoredProducts}
        petName={petName}
        bundles={bundles}
        impulseProducts={impulseProducts}
      />
      <AccessoriesListClient products={products} query={query} />
    </>
  );
}