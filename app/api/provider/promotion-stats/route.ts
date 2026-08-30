import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// Real substitutes for the reference design's "Total Reach" / "Ad Spend" —
// "Reach," "Clicks," and a spend-vs-budget model don't exist in this app's
// data at all (no ad-impression tracking, no budget/campaign concept — the
// real pricing model is flat-fee per listing slot, not a drawable budget).
// Profile views and real promotion spend are the honest equivalents.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const [profileViews, spentAgg] = await Promise.all([
    prisma.activityEvent.count({
      where: { type: "PAGE_VIEW", path: `/providers/${provider.id}`, createdAt: { gte: thirtyDaysAgo() } },
    }),
    prisma.sponsorshipPurchase.aggregate({
      where: { providerId: provider.id, paidAt: { not: null } },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    profileViews,
    totalSpentPaise: spentAgg._sum.amount ?? 0,
  });
}