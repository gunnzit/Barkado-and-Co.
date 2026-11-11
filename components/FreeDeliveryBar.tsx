"use client";

import { useEffect, useRef, useState } from "react";
import { Truck, PartyPopper } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { FREE_DELIVERY_THRESHOLD_PAISE } from "@/lib/checkoutPricing";

/*
 * Free-delivery progress (real rule: product subtotal ≥ ₹500, see
 * lib/checkoutPricing). The bar fills with scaleX as the cart grows; reaching
 * the threshold pops a short "unlocked" moment — a rare, earned beat.
 */
export default function FreeDeliveryBar() {
  const { items } = useCart();
  const subtotal = items.reduce((sum, i) => (i.kind === "PRODUCT" && i.product ? sum + i.product.price * i.quantity : sum), 0);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD_PAISE - subtotal);
  const unlocked = subtotal > 0 && remaining === 0;
  const progress = Math.min(1, subtotal / FREE_DELIVERY_THRESHOLD_PAISE);

  // Celebrate only on the transition into "unlocked", not on every render.
  const wasUnlocked = useRef(unlocked);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (unlocked && !wasUnlocked.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 900);
      wasUnlocked.current = true;
      return () => clearTimeout(t);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: unlocked ? "#fef3dc" : "var(--gold)", border: "1.5px dashed rgba(61,20,38,0.18)", transition: "background-color 250ms ease" }}>
      <p className="flex items-center gap-2 text-xs font-bold" style={{ color: "#3d1426" }}>
        {unlocked ? (
          <span key="unlocked" className={`inline-flex items-center gap-2 ${celebrate ? "enter-pop" : ""}`}>
            <PartyPopper size={15} color="#6e1e3b" /> Free delivery unlocked!
          </span>
        ) : subtotal === 0 ? (
          <>
            <Truck size={14} /> Free delivery on orders over ₹{FREE_DELIVERY_THRESHOLD_PAISE / 100}
          </>
        ) : (
          <span key="progress" className="enter-fade inline-flex items-center gap-2">
            <Truck size={14} /> Add <b className="num-roll" key={remaining}>₹{Math.ceil(remaining / 100)}</b> more for free delivery
          </span>
        )}
      </p>
      {subtotal > 0 && (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(61,20,38,0.12)" }} aria-hidden="true">
          <div
            className="h-full rounded-full origin-left"
            style={{ background: "#6e1e3b", transform: `scaleX(${progress})`, transition: "transform 400ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          />
        </div>
      )}
    </div>
  );
}
