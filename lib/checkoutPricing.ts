// Real checkout pricing constants and math — pure functions only (no
// Prisma, no DB), so this file is safe to import from both server routes
// AND client components (CartItemsList needs to show the same numbers
// the server will actually charge).

export const FREE_DELIVERY_THRESHOLD_PAISE = 50000; // ₹500 — confirmed real, checked against PRODUCT subtotal only

// TODO: placeholder — confirm the real delivery fee amount. Currently
// ₹49 as a provisional stand-in. See NOT_BUILT.md.
export const DELIVERY_FEE_PAISE = 4900;

export const GST_RATE = 0.18; // confirmed real, 18% — prices are GST-INCLUSIVE (see below)

export const WELCOME10_CODE = "WELCOME10";
export const WELCOME10_DISCOUNT_RATE = 0.10; // 10% off product subtotal — matches the existing real homepage offer

// 1 PawPoint = ₹0.25 of real discount — the same rate already
// established for the wallet's redemption value elsewhere in the app.
export const PAWPOINTS_REDEMPTION_PAISE_PER_POINT = 25;

// 1 point per ₹10 of real BASE price — same documented rate as
// calculateEarnedPoints in lib/pawPoints.ts. Duplicated here (rather than
// imported) because that file also imports Prisma at module scope, which
// isn't safe to bundle into a client component. Used only for a live
// checkout-page ESTIMATE — the actual authoritative points are always
// computed for real in finalizeRazorpayOrder at payment confirmation.
export function estimateEarnedPoints(baseSubtotalPaise: number): number {
  return Math.floor(baseSubtotalPaise / 1000);
}

export type CartTotalsInput = {
  productSubtotalPaise: number;
  serviceSellingPaise: number;
  serviceBasePaise: number;
  maintenanceFeePaise: number;
  productCompareSavingsPaise: number;
  couponCode: string | null;
  redeemPoints: number;
  pawPointsBalance: number;
};

export type CartTotals = {
  itemsTotalPaise: number;
  couponValid: boolean;
  couponDiscountPaise: number;
  deliveryFeePaise: number;
  freeDeliveryRemainingPaise: number;
  // The GST already embedded inside the item/service/delivery prices —
  // NOT an amount added on top. grandTotalPaise does not add this in;
  // it's shown purely as a real breakdown of what's already included.
  gstPaise: number;
  actualPointsSpent: number;
  pointsDiscountPaise: number;
  grandTotalPaise: number;
  totalSavingsPaise: number;
  estimatedPointsEarned: number;
};

export function computeCartTotals(input: CartTotalsInput): CartTotals {
  const itemsTotalPaise = input.productSubtotalPaise + input.serviceSellingPaise;

  const couponValid = input.couponCode?.trim().toUpperCase() === WELCOME10_CODE;
  const couponDiscountPaise = couponValid ? Math.round(input.productSubtotalPaise * WELCOME10_DISCOUNT_RATE) : 0;

  // Delivery is a real product-shipping charge only — a booking-only cart
  // (no accessories) is never charged delivery, since there's nothing
  // being shipped. Threshold and remaining-amount are both checked
  // against the PRODUCT subtotal alone, not combined with service value.
  const hasProducts = input.productSubtotalPaise > 0;
  const deliveryFeePaise = hasProducts && input.productSubtotalPaise < FREE_DELIVERY_THRESHOLD_PAISE ? DELIVERY_FEE_PAISE : 0;
  const freeDeliveryRemainingPaise = hasProducts ? Math.max(0, FREE_DELIVERY_THRESHOLD_PAISE - input.productSubtotalPaise) : 0;

  // Real GST-inclusive pricing: item/service prices, the maintenance fee,
  // and the delivery fee are all treated as ALREADY containing 18% GST
  // (standard Indian MRP-inclusive convention) — not taxed on top. The
  // coupon discount is subtracted first, same as before.
  const inclusiveTotalPaise = Math.max(0, itemsTotalPaise + input.maintenanceFeePaise + deliveryFeePaise - couponDiscountPaise);
  const gstPaise = Math.round(inclusiveTotalPaise - inclusiveTotalPaise / (1 + GST_RATE));

  const totalBeforePoints = inclusiveTotalPaise; // GST is already inside this — never added again

  const safeRedeemPoints = Math.max(0, Math.min(Math.floor(input.redeemPoints), input.pawPointsBalance));
  const requestedPointsDiscountPaise = safeRedeemPoints * PAWPOINTS_REDEMPTION_PAISE_PER_POINT;
  const pointsDiscountPaise = Math.min(requestedPointsDiscountPaise, totalBeforePoints);
  const actualPointsSpent = Math.round(pointsDiscountPaise / PAWPOINTS_REDEMPTION_PAISE_PER_POINT);

  const grandTotalPaise = Math.max(0, totalBeforePoints - pointsDiscountPaise);

  const totalSavingsPaise = input.productCompareSavingsPaise + couponDiscountPaise + pointsDiscountPaise;

  const estimatedPointsEarned = estimateEarnedPoints(input.productSubtotalPaise + input.serviceBasePaise);

  return {
    itemsTotalPaise,
    couponValid,
    couponDiscountPaise,
    deliveryFeePaise,
    freeDeliveryRemainingPaise,
    gstPaise,
    actualPointsSpent,
    pointsDiscountPaise,
    grandTotalPaise,
    totalSavingsPaise,
    estimatedPointsEarned,
  };
}