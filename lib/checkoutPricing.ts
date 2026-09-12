// Real checkout pricing constants and math — pure functions only (no
// Prisma, no DB), so this file is safe to import from both server routes
// AND client components (CartItemsList needs to show the same numbers
// the server will actually charge).

export const FREE_DELIVERY_THRESHOLD_PAISE = 50000; // ₹500 — confirmed real

// TODO: placeholder — confirm the real delivery fee amount. Currently
// ₹49 as a provisional stand-in. See NOT_BUILT.md.
export const DELIVERY_FEE_PAISE = 4900;

export const GST_RATE = 0.18; // confirmed real, 18%

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

  const deliveryFeePaise = itemsTotalPaise >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : DELIVERY_FEE_PAISE;
  const freeDeliveryRemainingPaise = Math.max(0, FREE_DELIVERY_THRESHOLD_PAISE - itemsTotalPaise);

  const preGstPaise = Math.max(0, itemsTotalPaise + input.maintenanceFeePaise + deliveryFeePaise - couponDiscountPaise);
  const gstPaise = Math.round(preGstPaise * GST_RATE);

  const totalBeforePoints = preGstPaise + gstPaise;

  const safeRedeemPoints = Math.max(0, Math.min(Math.floor(input.redeemPoints), input.pawPointsBalance));
  const requestedPointsDiscountPaise = safeRedeemPoints * PAWPOINTS_REDEMPTION_PAISE_PER_POINT;
  const pointsDiscountPaise = Math.min(requestedPointsDiscountPaise, totalBeforePoints);
  const actualPointsSpent = Math.round(pointsDiscountPaise / PAWPOINTS_REDEMPTION_PAISE_PER_POINT);

  const grandTotalPaise = Math.max(0, totalBeforePoints - pointsDiscountPaise);

  // Real total savings shown to the customer — sum of actual product
  // compareAtPrice discounts already baked into the listed prices, plus
  // the real coupon discount and real points discount. Never a fabricated
  // number.
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