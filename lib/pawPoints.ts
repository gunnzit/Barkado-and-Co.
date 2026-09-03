import { prisma } from "./prisma";

// 1 point earned per ₹10 (1000 paise) of a purchase's real BASE price —
// a booking's priceAmount before the maintenance fee, or a product's
// listed price. Never the inflated total an owner actually pays.
export const POINTS_EARN_DIVISOR_PAISE = 1000;

// 1 point = ₹0.25 (25 paise) of real redemption value. Per product
// decision, redemption can cover up to 100% of an order — no cap.
export const PAISE_PER_POINT_REDEMPTION = 25;

export function calculateEarnedPoints(basePricePaise: number): number {
  return Math.floor(basePricePaise / POINTS_EARN_DIVISOR_PAISE);
}

export function redemptionValuePaise(points: number): number {
  return points * PAISE_PER_POINT_REDEMPTION;
}

// Live balance — always computed by summing the real transaction ledger,
// never a stored running total. Same principle as Payout's "amount owed":
// nothing that can silently drift out of sync with reality.
export async function getPawPointsBalance(userId: string): Promise<number> {
  const rows = await prisma.pawPointsTransaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { points: true },
  });

  let balance = 0;
  for (const row of rows) {
    const sum = row._sum.points ?? 0;
    if (row.type === "EARNED" || row.type === "REDEEMED_REVERSED") balance += sum;
    if (row.type === "REDEEMED" || row.type === "EARNED_REVERSED") balance -= sum;
  }
  return balance;
}