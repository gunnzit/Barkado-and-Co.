"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, X, PawPrint, Scissors, GraduationCap, Home as HomeIcon, Tag, Sparkles, MessageSquare, Truck, CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import { computeServiceCommission } from "@/lib/commission";
import { computeCartTotals, FREE_DELIVERY_THRESHOLD_PAISE, WELCOME10_CODE } from "@/lib/checkoutPricing";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

const SERVICE_ICON: Record<string, any> = {
  WALKING: PawPrint,
  SITTING: HomeIcon,
  GROOMING: Scissors,
  TRAINING: GraduationCap,
};

const SERVICE_COLOR: Record<string, string> = {
  WALKING: "var(--forest)",
  SITTING: "var(--terracotta)",
  GROOMING: "var(--gold)",
  TRAINING: "var(--heritage-red)",
};

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function CartItemsList() {
  const { items, setQuantity, removeItem, loading } = useCart();

  const serviceItems = items.filter((i) => i.kind === "SERVICE");
  const productItems = items.filter((i) => i.kind === "PRODUCT" && i.product);

  const productSubtotalPaise = productItems.reduce((sum, i) => sum + i.product!.price * i.quantity, 0);
  const serviceSellingPaise = serviceItems.reduce(
    (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).sellingPricePaise,
    0
  );
  const maintenanceFeePaise = serviceItems.reduce(
    (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).maintenanceFeePaise,
    0
  );

  // Real PawPoints balance — fetched client-side from the same endpoint
  // the floating PawPoints badge already uses.
  const [pawPointsBalance, setPawPointsBalance] = useState(0);
  useEffect(() => {
    fetch("/api/owner/pawpoints")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setPawPointsBalance(data.balance ?? 0))
      .catch(() => {});
  }, []);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [redeemPointsEnabled, setRedeemPointsEnabled] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [gateCode, setGateCode] = useState("");

  const applyCoupon = () => {
    setCouponError(null);
    if (couponInput.trim().toUpperCase() === WELCOME10_CODE) {
      setAppliedCoupon(WELCOME10_CODE);
    } else {
      setCouponError("Invalid or expired code");
    }
  };

  // Redeem up to the full available balance when the toggle is on —
  // computeCartTotals caps it to what's actually owed, so this never
  // over-redeems.
  const requestedRedeemPoints = redeemPointsEnabled ? pawPointsBalance : 0;

  const totals = computeCartTotals({
    productSubtotalPaise,
    serviceSellingPaise,
    maintenanceFeePaise,
    couponCode: appliedCoupon,
    redeemPoints: requestedRedeemPoints,
    pawPointsBalance,
  });

  if (!loading && items.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="font-heading text-headline-md mb-2">Your cart is empty</p>
        <p className="text-body-md mb-6" style={{ color: "var(--muted)" }}>
          Find a service or something special for your pet.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Browse services
        </Link>
      </div>
    );
  }

  const deliveryProgressPct = Math.min(100, Math.round((totals.itemsTotalPaise / FREE_DELIVERY_THRESHOLD_PAISE) * 100));

  return (
    <>
      {/* Free delivery progress — real threshold, no fake "2x points" claim */}
      {totals.deliveryFeePaise > 0 && (
        <div className="px-6 pb-3">
          <div className="card rounded-xl">
            <div className="flex items-center justify-between text-label-sm mb-2">
              <span className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <Truck size={14} /> Add ₹{(totals.freeDeliveryRemainingPaise / 100).toFixed(0)} more for free delivery
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "var(--cream)" }}>
              <div className="h-full rounded-full" style={{ width: `${deliveryProgressPct}%`, background: "var(--terracotta)" }} />
            </div>
          </div>
        </div>
      )}
      {totals.deliveryFeePaise === 0 && (
        <div className="px-6 pb-3">
          <div className="card rounded-xl flex items-center gap-2" style={{ background: "var(--cream)" }}>
            <CheckCircle2 size={16} color="var(--forest)" />
            <span className="text-label-sm font-semibold">Free delivery unlocked</span>
          </div>
        </div>
      )}

      <div className="px-6 pb-4 space-y-3">
        {serviceItems.map((item) => {
          const Icon = SERVICE_ICON[item.serviceType ?? "WALKING"];
          const color = SERVICE_COLOR[item.serviceType ?? "WALKING"];
          return (
            <div key={item.id} className="card rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${color}1A` }}
                >
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <p className="font-heading text-label-md">{SERVICE_LABEL[item.serviceType ?? "WALKING"]}</p>
                  <p className="text-label-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    {item.pet?.name ? `For ${item.pet.name} · ` : ""}with {item.provider?.user.name ?? "a provider"}
                  </p>
                  <p className="text-label-sm" style={{ color: "var(--muted)" }}>{formatWhen(item.startTime)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => removeItem(item.id)} className="tap-scale" aria-label="Remove">
                  <X size={16} color="var(--muted)" />
                </button>
                <span className="font-heading text-body-md font-bold">
                  ₹{(computeServiceCommission(item.priceAmount ?? 0).sellingPricePaise / 100).toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}

        {productItems.map((item) => (
          <div key={item.id} className="card rounded-xl flex items-center justify-between gap-3">
            <div>
              <p className="font-heading text-label-md">{item.product!.name}</p>
              <p className="text-label-sm mt-0.5" style={{ color: "var(--muted)" }}>
                ₹{(item.product!.price / 100).toFixed(0)} each
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setQuantity(item.productId!, item.quantity - 1)}
                className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--cream)", border: "1px solid var(--border)" }}
                aria-label="Decrease quantity"
              >
                <Minus size={12} />
              </button>
              <span className="text-label-md w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => setQuantity(item.productId!, item.quantity + 1)}
                className="tap-scale w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--panel-dark)" }}
                aria-label="Increase quantity"
              >
                <Plus size={12} color="white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <>
          {/* Coupon */}
          <div className="px-6 pb-3">
            <div className="card rounded-xl">
              <p className="text-label-sm font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <Tag size={13} /> Coupons &amp; Offers
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-body-md font-semibold">
                    <CheckCircle2 size={15} color="var(--forest)" /> {appliedCoupon} applied
                  </span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-label-sm font-semibold" style={{ color: "var(--terracotta)" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 text-sm px-3 py-2 rounded-lg"
                      style={{ border: "1px solid var(--border)" }}
                    />
                    <button onClick={applyCoupon} className="btn-secondary text-sm shrink-0">Apply</button>
                  </div>
                  {couponError && <p className="text-label-sm mt-1.5" style={{ color: "var(--heritage-red)" }}>{couponError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* PawPoints redemption — the main real feature here */}
          {pawPointsBalance > 0 && (
            <div className="px-6 pb-3">
              <div className="card rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} color="var(--gold)" />
                  <div>
                    <p className="font-heading text-label-md">PawPoints Balance</p>
                    <p className="text-label-sm" style={{ color: "var(--muted)" }}>{pawPointsBalance.toLocaleString("en-IN")} points available</p>
                  </div>
                </div>
                <button
                  onClick={() => setRedeemPointsEnabled(!redeemPointsEnabled)}
                  className="w-11 h-6 rounded-full relative tap-scale shrink-0"
                  style={{ background: redeemPointsEnabled ? "var(--terracotta)" : "var(--border)" }}
                  aria-label="Toggle PawPoints redemption"
                >
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: redeemPointsEnabled ? 22 : 2 }} />
                </button>
              </div>
              {redeemPointsEnabled && totals.actualPointsSpent > 0 && (
                <div className="mt-2 flex justify-between text-label-sm px-1">
                  <span style={{ color: "var(--muted)" }}>Redeem {totals.actualPointsSpent.toLocaleString("en-IN")} PawPoints</span>
                  <span className="font-semibold" style={{ color: "var(--terracotta)" }}>-₹{(totals.pointsDiscountPaise / 100).toFixed(2)} applied</span>
                </div>
              )}
            </div>
          )}

          {/* Real delivery/rider instructions */}
          <div className="px-6 pb-3">
            <div className="card rounded-xl">
              <p className="text-label-sm font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                <MessageSquare size={13} /> Rider &amp; Groomer Instructions
              </p>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Ring bell softly, dog gets excited"
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-lg mb-2"
                style={{ border: "1px solid var(--border)" }}
              />
              <input
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder="Gate code (optional)"
                className="w-full text-sm px-3 py-2 rounded-lg"
                style={{ border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          <div className="px-6 mb-28">
            <div className="card rounded-xl">
              <p className="text-label-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
                Bill details
              </p>
              <div className="flex justify-between text-body-md mb-2">
                <span style={{ color: "var(--muted)" }}>Items total</span>
                <span className="font-semibold">₹{(totals.itemsTotalPaise / 100).toFixed(0)}</span>
              </div>
              {maintenanceFeePaise > 0 && (
                <div className="flex justify-between text-body-md mb-2">
                  <span style={{ color: "var(--muted)" }}>Maintenance fee</span>
                  <span className="font-semibold">₹{(maintenanceFeePaise / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-md mb-2">
                <span style={{ color: "var(--muted)" }}>Delivery</span>
                <span className="font-semibold">{totals.deliveryFeePaise > 0 ? `₹${(totals.deliveryFeePaise / 100).toFixed(0)}` : "FREE"}</span>
              </div>
              {totals.couponDiscountPaise > 0 && (
                <div className="flex justify-between text-body-md mb-2" style={{ color: "var(--terracotta)" }}>
                  <span>Coupon ({appliedCoupon})</span>
                  <span className="font-semibold">-₹{(totals.couponDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-md mb-2">
                <span style={{ color: "var(--muted)" }}>GST (18%)</span>
                <span className="font-semibold">₹{(totals.gstPaise / 100).toFixed(0)}</span>
              </div>
              {totals.pointsDiscountPaise > 0 && (
                <div className="flex justify-between text-body-md mb-2" style={{ color: "var(--terracotta)" }}>
                  <span>PawPoints redeemed</span>
                  <span className="font-semibold">-₹{(totals.pointsDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}
              <div
                className="flex justify-between font-heading text-headline-md pt-3 mt-1"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span>Grand total</span>
                <span>₹{(totals.grandTotalPaise / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 p-4"
            style={{
              background: "var(--card)",
              borderTop: "1px solid var(--border)",
              boxShadow: "0 -8px 30px rgba(22, 40, 31, 0.08)",
              zIndex: 50,
            }}
          >
            <div className="max-w-lg mx-auto flex items-center gap-4">
              <div className="shrink-0">
                <p className="text-label-sm" style={{ color: "var(--muted)" }}>Total</p>
                <p className="font-heading text-headline-md">₹{(totals.grandTotalPaise / 100).toFixed(0)}</p>
              </div>
              <div className="flex-1">
                {/* NOTE: RazorpayCheckoutButton needs to accept and forward
                    these new checkout params to /api/checkout/create-order
                    — not yet wired since I don't have that component's
                    source. See chat note. */}
                <RazorpayCheckoutButton
                  amountLabel={`₹${(totals.grandTotalPaise / 100).toFixed(0)}`}
                  disabled={items.length === 0}
                  checkoutExtras={{
                    couponCode: appliedCoupon ?? undefined,
                    redeemPoints: totals.actualPointsSpent || undefined,
                    deliveryInstructions: deliveryInstructions.trim() || undefined,
                    gateCode: gateCode.trim() || undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}