import { prisma } from "./prisma";

// 1 point earned per ₹10 (1000 paise) of a purchase's real BASE price —
// a booking's priceAmount before the maintenance fee, or a product's
// listed price. Never the inflated total an owner actually pays.
export const POINTS_EARN_DIVISOR_PAISE = 1000;

// 1 point = ₹0.25 (25 paise) of real redemption value. Per product
// decision, flexible redemption can cover up to 100% of an order — no cap.
export const PAISE_PER_POINT_REDEMPTION = 25;

// Points expire 60 days after being earned, FIFO — spending consumes the
// oldest still-valid points first, so actively redeeming keeps them
// alive; only points nobody touches for a full 60 days actually vanish.
export const POINTS_EXPIRY_DAYS = 60;

// Membership tier thresholds — real, but explicitly adjustable later per
// product decision (not finalized by the founders yet). Based on the
// SAME rolling 60-day window as expiry, re-evaluated continuously: tier
// reflects recent earning activity, not a lifetime total.
export const GOLD_TIER_THRESHOLD = 550;
export const PLATINUM_TIER_THRESHOLD = 1100;

export function calculateEarnedPoints(basePricePaise: number): number {
  return Math.floor(basePricePaise / POINTS_EARN_DIVISOR_PAISE);
}

export function redemptionValuePaise(points: number): number {
  return points * PAISE_PER_POINT_REDEMPTION;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

type Batch = { points: number; createdAt: Date; expiresAt: Date; consumed: number };

// Core FIFO + expiry ledger reconstruction, shared by balance and
// per-batch expiry-warning logic. Not exported directly — callers use
// getPawPointsBalance() or getExpiringBatches() below.
//
// Algorithm: every EARNED (and REDEEMED_REVERSED — a refund of previously
// spent points is treated as a fresh batch earned right now, rather than
// trying to retroactively restore whichever older batch it originally
// came from) creates a new batch with its own 60-day expiry from ITS OWN
// createdAt. Every REDEEMED (and EARNED_REVERSED — a clawback from a
// refunded/cancelled purchase) is a debit, applied FIFO against batches in
// the order they were created — oldest first — regardless of whether
// that specific batch has since expired. (EARNED_REVERSED consuming
// FIFO rather than targeting its exact originating batch is a known
// simplification, worth revisiting once real refund/cancellation
// integration is built — flagged here rather than silently assumed
// precise.)
async function buildBatches(userId: string): Promise<Batch[]> {
  const transactions = await prisma.pawPointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const batches: Batch[] = [];
  let totalDebits = 0;

  for (const tx of transactions) {
    if (tx.type === "EARNED" || tx.type === "REDEEMED_REVERSED") {
      batches.push({ points: tx.points, createdAt: tx.createdAt, expiresAt: addDays(tx.createdAt, POINTS_EXPIRY_DAYS), consumed: 0 });
    } else {
      totalDebits += tx.points;
    }
  }

  let remainingDebit = totalDebits;
  for (const batch of batches) {
    if (remainingDebit <= 0) break;
    const take = Math.min(batch.points, remainingDebit);
    batch.consumed = take;
    remainingDebit -= take;
  }

  return batches;
}

// Live spendable balance right now — sum of each batch's unconsumed
// points, excluding any batch whose 60-day window has passed. Always
// recomputed from the real transaction ledger, never a stored running
// total that could drift or fail to reflect expiry.
export async function getPawPointsBalance(userId: string): Promise<number> {
  const batches = await buildBatches(userId);
  const now = new Date();
  return batches.reduce((sum, b) => (b.expiresAt > now ? sum + (b.points - b.consumed) : sum), 0);
}

// Points earned within the trailing 60 days, gross (not reduced by
// redemptions) — this is what determines membership tier. Re-evaluated
// continuously: a 60-day gap with no new earning activity can genuinely
// lower someone's tier, same as it can raise it.
export async function getRollingTierPoints(userId: string): Promise<number> {
  const windowStart = addDays(new Date(), -POINTS_EXPIRY_DAYS);
  const result = await prisma.pawPointsTransaction.aggregate({
    where: { userId, type: "EARNED", createdAt: { gte: windowStart } },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

export type MembershipTier = "Explorer" | "Gold Explorer" | "Platinum";

export function tierForPoints(rollingPoints: number): MembershipTier {
  if (rollingPoints >= PLATINUM_TIER_THRESHOLD) return "Platinum";
  if (rollingPoints >= GOLD_TIER_THRESHOLD) return "Gold Explorer";
  return "Explorer";
}

// Points that will expire within the next `withinDays` — useful for a
// real "550 pts expiring soon" warning, rather than silence until they're
// already gone.
export async function getExpiringPoints(userId: string, withinDays = 7): Promise<number> {
  const batches = await buildBatches(userId);
  const now = new Date();
  const cutoff = addDays(now, withinDays);
  return batches.reduce((sum, b) => {
    const remaining = b.points - b.consumed;
    if (remaining > 0 && b.expiresAt > now && b.expiresAt <= cutoff) return sum + remaining;
    return sum;
  }, 0);
}