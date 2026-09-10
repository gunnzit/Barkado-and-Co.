"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CartIconBadge() {
  const { totalCount } = useCart();

  return (
    <Link href="/cart" className="tap-scale w-9 h-9 rounded-full flex items-center justify-center relative" style={{ border: "1px solid var(--border)" }}>
      <ShoppingBag size={16} color="var(--muted)" />
      {totalCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: "var(--terracotta)" }}
        >
          {totalCount}
        </span>
      )}
    </Link>
  );
}