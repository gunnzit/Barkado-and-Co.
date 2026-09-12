"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Minus, Plus, X, PawPrint, Scissors, GraduationCap, Home as HomeIcon,
  Tag, Sparkles, MessageSquare, Truck, CheckCircle2, Lock, Pencil,
  ShieldCheck, Award, ThumbsUp, Clock, ShoppingBag,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";
import { computeServiceCommission } from "@/lib/commission";
import { computeCartTotals, FREE_DELIVERY_THRESHOLD_PAISE, WELCOME10_CODE } from "@/lib/checkoutPricing";

const H = { fontFamily: "var(--font-heading)" } as const;

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};
const SERVICE_ICON: Record<string, any> = { WALKING: PawPrint, SITTING: HomeIcon, GROOMING: Scissors, TRAINING: GraduationCap };

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

type SuggestedProduct = { id: string; name: string; price: number; imageUrls: string[] };

export default function CartItemsList({
  petName,
  suggested,
}: {
  petName?: string | null;
  suggested?: SuggestedProduct[];
}) {
  const { items, setQuantity, removeItem, loading } = useCart();

  const serviceItems = items.filter((i) => i.kind === "SERVICE");
  const productItems = items.filter((i) => i.kind === "PRODUCT" && i.product);
  const hasProducts = productItems.length > 0;

  const productSubtotalPaise = productItems.reduce((sum, i) => sum + i.product!.price * i.quantity, 0);
  // Cart items only carry a lightweight product snapshot (id, name,
  // price, icon) — no compareAtPrice, so per-line "was ₹X" savings can't
  // be shown here. Real compareAtPrice-based savings ARE shown for the
  // "Frequently Added" suggestions below, which use the full Product
  // record fetched fresh from the server.
  const productCompareSavingsPaise = 0;
  const serviceBasePaise = serviceItems.reduce((sum, i) => sum + (i.priceAmount ?? 0), 0);
  const serviceSellingPaise = serviceItems.reduce(
    (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).sellingPricePaise,
    0
  );
  const maintenanceFeePaise = serviceItems.reduce(
    (sum, i) => sum + computeServiceCommission(i.priceAmount ?? 0).maintenanceFeePaise,
    0
  );

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
  const [instructionsSaved, setInstructionsSaved] = useState(false);
  const [editingInstructions, setEditingInstructions] = useState(false);
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

  const saveInstructions = () => {
    setInstructionsSaved(deliveryInstructions.trim().length > 0 || gateCode.trim().length > 0);
    setEditingInstructions(false);
  };

  const requestedRedeemPoints = redeemPointsEnabled ? pawPointsBalance : 0;

  const totals = computeCartTotals({
    productSubtotalPaise,
    serviceSellingPaise,
    serviceBasePaise,
    maintenanceFeePaise,
    productCompareSavingsPaise,
    couponCode: appliedCoupon,
    redeemPoints: requestedRedeemPoints,
    pawPointsBalance,
  });

  if (!loading && items.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="font-bold text-lg mb-2" style={H}>Your cart is empty</p>
        <p className="text-sm mb-6" style={{ color: "#424844" }}>
          Find a service or something special for your pet.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Browse services
        </Link>
      </div>
    );
  }

  const deliveryProgressPct = hasProducts ? Math.min(100, Math.round((productSubtotalPaise / FREE_DELIVERY_THRESHOLD_PAISE) * 100)) : 0;

  return (
    <>
      <div className="px-4 pb-3">
        <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg" style={{ ...H, color: "#02120a" }}>Your Cart</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#efeee3", color: "#424844" }}>
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>
            {hasProducts && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#ffdbcd", color: "#904c2c" }} title="Placeholder — single delivery tier only">
                <Truck size={12} /> Delivery
              </span>
            )}
          </div>
          {/* Delivery only applies to real accessories/products — a
              booking-only cart has nothing to ship, so this section
              doesn't render at all in that case. */}
          {hasProducts && (
            totals.deliveryFeePaise > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: "#424844" }}>Add ₹{(totals.freeDeliveryRemainingPaise / 100).toFixed(0)} for free delivery</span>
                  <span className="font-bold" style={{ color: "#904c2c" }}>{deliveryProgressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#efeee3" }}>
                  <div className="h-full rounded-full" style={{ width: `${deliveryProgressPct}%`, background: "#904c2c" }} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#0d1f16" }}>
                <CheckCircle2 size={14} color="#10b981" /> Free delivery unlocked
              </div>
            )
          )}
        </div>
      </div>

      {productItems.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
            <span className="flex items-center gap-2 font-bold text-sm mb-3" style={{ ...H, color: "#02120a" }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#02120a" }}>
                <Truck size={13} color="white" />
              </span>
              Doorstep Delivery
            </span>
            <div className="space-y-3">
              {productItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-3" style={{ borderBottom: "1px solid rgba(194,200,194,0.15)" }}>
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f5f4e8" }}>
                    <ShoppingBag size={22} color="#c2c8c2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ ...H, color: "#02120a" }}>{item.product!.name}</p>
                    <p className="text-sm font-extrabold mt-1" style={{ ...H, color: "#02120a" }}>₹{(item.product!.price / 100).toFixed(0)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => removeItem(item.id)} className="tap-scale" aria-label="Remove">
                      <X size={15} color="#737874" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQuantity(item.productId!, item.quantity - 1)}
                        className="tap-scale w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "#efeee3" }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs w-4 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.productId!, item.quantity + 1)}
                        className="tap-scale w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "#02120a" }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={11} color="white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {serviceItems.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
            <span className="flex items-center gap-2 font-bold text-sm mb-3" style={{ ...H, color: "#02120a" }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#ffddb3" }}>
                <Clock size={13} color="#624000" />
              </span>
              Scheduled Doorstep Care
            </span>
            <div className="space-y-3">
              {serviceItems.map((item) => {
                const Icon = SERVICE_ICON[item.serviceType ?? "WALKING"];
                const sellingPaise = computeServiceCommission(item.priceAmount ?? 0).sellingPricePaise;
                return (
                  <div key={item.id} className="flex items-start justify-between gap-3 pb-3" style={{ borderBottom: "1px solid rgba(194,200,194,0.15)" }}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#efeee3" }}>
                        <Icon size={18} color="#904c2c" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ ...H, color: "#02120a" }}>{SERVICE_LABEL[item.serviceType ?? "WALKING"]}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#424844" }}>
                          {item.pet?.name ? `For ${item.pet.name} · ` : ""}with {item.provider?.user.name ?? "a provider"}
                        </p>
                        <p className="text-xs" style={{ color: "#424844" }}>{formatWhen(item.startTime)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={() => removeItem(item.id)} className="tap-scale" aria-label="Remove">
                        <X size={15} color="#737874" />
                      </button>
                      <span className="font-extrabold text-sm" style={{ ...H, color: "#02120a" }}>₹{(sellingPaise / 100).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {suggested && suggested.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="flex items-center gap-1.5 font-bold text-sm" style={{ ...H, color: "#02120a" }}>
              <ThumbsUp size={14} color="#904c2c" /> Frequently Added{petName ? ` for ${petName}` : ""}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {suggested.slice(0, 4).map((p) => (
              <Link href={`/accessories/${p.id}`} key={p.id} className="shrink-0 rounded-xl p-2.5 tap-scale" style={{ width: 130, background: "#ffffff", border: "1px solid rgba(194,200,194,0.2)" }}>
                <div className="w-full h-20 rounded-lg overflow-hidden mb-2" style={{ background: "#f5f4e8" }}>
                  {p.imageUrls[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                </div>
                <p className="text-xs font-semibold line-clamp-1" style={{ ...H, color: "#02120a" }}>{p.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-extrabold text-xs" style={{ ...H, color: "#02120a" }}>₹{(p.price / 100).toFixed(0)}</span>
                  <span className="px-2 py-1 rounded-lg font-bold text-[10px]" style={{ background: "#efeee3", color: "#02120a" }}>+ ADD</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <>
          {pawPointsBalance > 0 && (
            <div className="px-4 pb-3">
              <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#ffdbcd" }}>
                      <PawPrint size={16} color="#904c2c" />
                    </span>
                    <div>
                      <p className="font-bold text-sm" style={{ ...H, color: "#02120a" }}>PawPoints™ Balance</p>
                      <p className="text-xs" style={{ color: "#424844" }}>{pawPointsBalance.toLocaleString("en-IN")} points available</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRedeemPointsEnabled(!redeemPointsEnabled)}
                    className="w-11 h-6 rounded-full relative tap-scale shrink-0"
                    style={{ background: redeemPointsEnabled ? "#904c2c" : "#e9e9dd" }}
                  >
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: redeemPointsEnabled ? 22 : 2 }} />
                  </button>
                </div>
                {redeemPointsEnabled && totals.actualPointsSpent > 0 && (
                  <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop: "1px solid rgba(194,200,194,0.15)" }}>
                    <span style={{ color: "#424844" }}>Redeem {totals.actualPointsSpent.toLocaleString("en-IN")} PawPoints</span>
                    <span className="font-bold" style={{ color: "#904c2c" }}>-₹{(totals.pointsDiscountPaise / 100).toFixed(2)} applied</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 pb-3">
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
              <p className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide mb-2" style={{ color: "#424844" }}>
                <Tag size={12} /> Coupons &amp; Offers
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "#d2e8d9" }}>
                  <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "#0d1f16" }}>
                    <CheckCircle2 size={15} /> {appliedCoupon} applied
                  </span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-xs font-bold" style={{ color: "#93000a" }}>Remove</button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code (try WELCOME10)"
                      className="flex-1 text-sm px-3 py-2 rounded-lg"
                      style={{ border: "1px solid rgba(194,200,194,0.4)" }}
                    />
                    <button onClick={applyCoupon} className="px-4 rounded-lg font-bold text-xs" style={{ background: "#02120a", color: "white" }}>Apply</button>
                  </div>
                  {couponError && <p className="text-xs mt-1.5" style={{ color: "#93000a" }}>{couponError}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide" style={{ color: "#424844" }}>
                  <MessageSquare size={12} /> Rider &amp; Groomer Instructions
                </p>
                {!editingInstructions && (
                  <button onClick={() => setEditingInstructions(true)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#904c2c" }}>
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
              {editingInstructions ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Ring bell softly, dog gets excited"
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-lg"
                    style={{ border: "1px solid rgba(194,200,194,0.4)" }}
                  />
                  <input
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    placeholder="Gate code (optional)"
                    className="w-full text-sm px-3 py-2 rounded-lg"
                    style={{ border: "1px solid rgba(194,200,194,0.4)" }}
                  />
                  <button onClick={saveInstructions} className="self-end px-3 py-1.5 rounded-lg font-bold text-xs" style={{ background: "#02120a", color: "white" }}>Save</button>
                </div>
              ) : instructionsSaved ? (
                <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: "#f5f4e8" }}>
                  <Lock size={13} color="#737874" className="mt-0.5 shrink-0" />
                  <p className="text-xs" style={{ color: "#424844" }}>
                    {deliveryInstructions}
                    {gateCode && <><br />Gate Code: <span className="font-bold">{gateCode}</span></>}
                  </p>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "#737874" }}>No instructions added yet.</p>
              )}
            </div>
          </div>

          <div className="px-4 mb-3">
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(194,200,194,0.25)" }}>
              <p className="font-extrabold text-sm mb-3" style={{ ...H, color: "#02120a" }}>Bill Summary</p>
              {productItems.length > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "#424844" }}>Accessories Subtotal ({productItems.length} item{productItems.length === 1 ? "" : "s"})</span>
                  <span className="font-semibold">₹{(productSubtotalPaise / 100).toFixed(0)}</span>
                </div>
              )}
              {serviceItems.length > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "#424844" }}>Service Booking{serviceItems.length > 1 ? "s" : ""}</span>
                  <span className="font-semibold">₹{(serviceSellingPaise / 100).toFixed(0)}</span>
                </div>
              )}
              {maintenanceFeePaise > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "#424844" }}>Maintenance fee</span>
                  <span className="font-semibold">₹{(maintenanceFeePaise / 100).toFixed(0)}</span>
                </div>
              )}
              {hasProducts && (
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "#424844" }}>Delivery</span>
                  {totals.deliveryFeePaise > 0 ? (
                    <span className="font-semibold">₹{(totals.deliveryFeePaise / 100).toFixed(0)}</span>
                  ) : (
                    <span className="font-bold" style={{ color: "#0d1f16" }}>FREE</span>
                  )}
                </div>
              )}
              {totals.couponDiscountPaise > 0 && (
                <div className="flex justify-between text-sm mb-2" style={{ color: "#904c2c" }}>
                  <span>Coupon ({appliedCoupon})</span>
                  <span className="font-semibold">-₹{(totals.couponDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "#424844" }}>GST (18%, inclusive of tax)</span>
                <span className="font-semibold">₹{(totals.gstPaise / 100).toFixed(0)}</span>
              </div>
              {totals.pointsDiscountPaise > 0 && (
                <div className="flex justify-between text-sm mb-2" style={{ color: "#904c2c" }}>
                  <span>PawPoints Redeemed ({totals.actualPointsSpent} pts)</span>
                  <span className="font-semibold">-₹{(totals.pointsDiscountPaise / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: "1px solid rgba(194,200,194,0.2)" }}>
                <span className="font-extrabold text-base" style={{ ...H, color: "#02120a" }}>Total Payable</span>
                <span className="font-extrabold text-base" style={{ ...H, color: "#02120a" }}>₹{(totals.grandTotalPaise / 100).toFixed(0)}</span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: "#737874" }}>All prices inclusive of tax · discounts already applied</p>

              {(totals.totalSavingsPaise > 0 || totals.estimatedPointsEarned > 0) && (
                <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2" style={{ background: "#ffdad6" }}>
                  <Sparkles size={14} color="#904c2c" />
                  <p className="text-xs font-semibold" style={{ color: "#904c2c" }}>
                    {totals.totalSavingsPaise > 0 && `You're saving ₹${(totals.totalSavingsPaise / 100).toFixed(0)} on this order`}
                    {totals.totalSavingsPaise > 0 && totals.estimatedPointsEarned > 0 && " + "}
                    {totals.estimatedPointsEarned > 0 && `Earning ~${totals.estimatedPointsEarned} PawPoints`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-2 flex items-center justify-center gap-4 text-[11px]" style={{ color: "#737874" }}>
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> 100% Pet-Safe &amp; Sterilized</span>
            <span className="flex items-center gap-1"><Award size={12} /> Trained Concierge</span>
          </div>

          <div style={{ height: 96 }} />

          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "#02120a", zIndex: 50 }}>
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px]" style={{ color: "rgba(228,227,215,0.7)" }}>Paying via Razorpay</span>
                <div className="text-right">
                  <p className="font-extrabold text-lg text-white" style={H}>₹{(totals.grandTotalPaise / 100).toFixed(0)}</p>
                  {totals.totalSavingsPaise > 0 && (
                    <p className="text-[10px] font-semibold" style={{ color: "#fcba5a" }}>Saved ₹{(totals.totalSavingsPaise / 100).toFixed(0)}</p>
                  )}
                </div>
              </div>
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
        </>
      )}
    </>
  );
}