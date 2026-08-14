"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function CartLink() {
  const { totalCount } = useCart();

  return (
    <Link href="/cart" className="btn-secondary text-sm tap-scale relative inline-block">
      View cart
      {totalCount > 0 && (
        <span
          className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: "var(--terracotta)" }}
        >
          {totalCount}
        </span>
      )}
    </Link>
  );
}