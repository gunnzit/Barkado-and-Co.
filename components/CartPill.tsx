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
        className="tap-scale flex items-center gap-2.5 rounded-full pl-3.5 pr-3 py-2 w-full max-w-[280px]"
        style={{
          background: "rgba(22, 40, 31, 0.62)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}
      >
        <ShoppingBag size={15} color="var(--gold)" className="shrink-0" />
        <span className="text-white text-xs font-bold leading-tight flex-1 truncate">
          {label} <span className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>· {totalCount} item{totalCount === 1 ? "" : "s"}</span>
        </span>
        <ChevronRight size={15} color="white" className="shrink-0" />
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