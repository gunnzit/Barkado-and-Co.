"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { hasInAppHistory } from "@/lib/navHistory";

/**
 * Slim, sticky header for task screens (booking a walk, grooming, training):
 * back on the left, the task name in the middle, the cart on the right.
 * No logo, points or profile here — those belong on browse screens, not in
 * the middle of a booking.
 */
export default function TaskHeader({ title, fallbackHref = "/", showCart = true, showBack = true }: { title: string; fallbackHref?: string; showCart?: boolean; showBack?: boolean }) {
  const router = useRouter();
  const { totalCount } = useCart();

  const goBack = () => {
    // Use real history when the user navigated here inside the app; otherwise
    // (opened from a link or a refresh) fall back to a sensible page.
    if (hasInAppHistory()) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 pt-safe"
      style={{ background: "rgba(251,240,217,0.88)", backdropFilter: "blur(16px) saturate(160%)", WebkitBackdropFilter: "blur(16px) saturate(160%)" }}
    >
      <div className="relative flex items-center justify-between h-14 px-3">
        {showBack ? (
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center tap-scale"
          style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)", color: "#3d1426" }}
        >
          <ArrowLeft size={18} />
        </button>
        ) : (
          <span className="w-10 h-10" aria-hidden="true" />
        )}

        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)", color: "#6e1e3b" }}>
          {title}
        </h1>

        {showCart ? (
        <Link
          href="/cart"
          aria-label={totalCount > 0 ? `Cart, ${totalCount} item${totalCount === 1 ? "" : "s"}` : "Cart"}
          className="relative w-10 h-10 rounded-full flex items-center justify-center tap-scale"
          style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.1)", color: "#3d1426" }}
        >
          <ShoppingBag size={17} />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#6e1e3b", color: "white" }}>
              {totalCount}
            </span>
          )}
        </Link>
        ) : (
          <span className="w-10 h-10" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
