import { prisma } from "./prisma";

// Uber/Rapido-style model: owners get a few free cancellations, then start
// paying a small deterrent fee. Both numbers here are easy to tune —
// genuine placeholders, not researched figures.
export const FREE_CANCELLATIONS_BEFORE_FEE = 2;
export const CANCELLATION_FEE_PAISE = 4900; // ₹49
export const CANCELLATION_WINDOW_DAYS = 30;

// Counts this owner's own cancellations (not provider-initiated ones, not
// declines/expiries) within the rolling window, and reports whether their
// NEXT cancellation would require paying the fee.
export async function getOwnerCancellationStatus(ownerId: string) {
  const windowStart = new Date(Date.now() - CANCELLATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const recentCancellations = await prisma.booking.count({
    where: {
      ownerId,
      status: "CANCELLED",
      cancelledBy: "OWNER",
      createdAt: { gte: windowStart },
    },
  });

  return {
    recentCancellations,
    feeRequired: recentCancellations >= FREE_CANCELLATIONS_BEFORE_FEE,
    feeAmount: CANCELLATION_FEE_PAISE,
  };
}