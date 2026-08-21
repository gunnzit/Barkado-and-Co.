"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CartPill() {
  const { totalCount, items } = useCart();
  const pathname = usePathname();

  if (totalCount === 0) return null;
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return null;

  const hasService = items.some((i) => i.kind === "SERVICE");
  const hasProduct = items.some((i) => i.kind === "PRODUCT");
  const label = hasService && hasProduct ? "View cart" : hasService ? "View booking" : "View cart";

  return (
    <div className="fixed left-0 right-0 flex justify-center px-6 z-40 cart-pill-in" style={{ bottom: 96 }}>
      <Link
        href="/cart"
        className="tap-scale flex items-center justify-between gap-3 rounded-full px-5 py-3 shadow-lg w-full max-w-md"
        style={{ background: "var(--panel-dark)" }}
      >
        <div className="flex items-center gap-2.5">
          <ShoppingBag size={17} color="var(--gold)" />
          <div className="text-left">
            <p className="text-white text-sm font-bold leading-tight">{label}</p>
            <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.65)" }}>
              {totalCount} item{totalCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <ChevronRight size={18} color="white" />
      </Link>

      <style jsx>{`
        @keyframes cartPillIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cart-pill-in {
          animation: cartPillIn 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}