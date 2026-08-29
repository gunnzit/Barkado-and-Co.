// Commission model: 8% total from owners (split into two 4% pieces — one
// baked into the displayed "selling price", one shown separately at
// checkout as a "Maintenance fee"), 15% from providers (deducted from
// their payout). These numbers are genuine business decisions, not
// arbitrary — change them here and every place that uses this function
// stays in sync.
export const USER_SELLING_PRICE_MARKUP = 0.04;
export const USER_MAINTENANCE_FEE_RATE = 0.04;
export const PROVIDER_COMMISSION_RATE = 0.15;

export function computeServiceCommission(basePaise: number) {
  const sellingPricePaise = Math.round(basePaise * (1 + USER_SELLING_PRICE_MARKUP));
  const maintenanceFeePaise = Math.round(basePaise * USER_MAINTENANCE_FEE_RATE);
  const ownerTotalPaise = sellingPricePaise + maintenanceFeePaise;
  const providerPayoutPaise = Math.round(basePaise * (1 - PROVIDER_COMMISSION_RATE));
  return { sellingPricePaise, maintenanceFeePaise, ownerTotalPaise, providerPayoutPaise };
}