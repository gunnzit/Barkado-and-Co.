import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// Real substitutes for the reference design's "Total Reach" / "Ad Spend" —
// "Reach," "Clicks," and a spend-vs-budget model don't exist in this app's
// data at all (no ad-impression tracking, no budget/campaign concept — the
// real pricing model is flat-fee per listing slot, not a drawable budget).
//
// "Total Budget Used" now sums real per-campaign budget consumption (same
// elapsed-days × dailyBudgetPaise math used on the Campaign History page)
// across all of this provider's campaigns — NOT a sum of old
// SponsorshipPurchase records, which went stale the moment the purchase
// flow was replaced by the campaign system and would otherwise silently
// stop updating while still looking real.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const [profileViews, campaigns] = await Promise.all([
    prisma.activityEvent.count({
      where: { type: "PAGE_VIEW", path: `/providers/${provider.id}`, createdAt: { gte: thirtyDaysAgo() } },
    }),
    prisma.campaign.findMany({
      where: { providerId: provider.id },
      select: { startDate: true, endDate: true, dailyBudgetPaise: true },
    }),
  ]);

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const totalBudgetUsedPaise = campaigns.reduce((sum, c) => {
    const startMs = c.startDate.getTime();
    const endMs = c.endDate ? c.endDate.getTime() : now;
    const effectiveEndMs = Math.min(endMs, now);
    const elapsedDays = startMs > now ? 0 : Math.max(0, Math.floor((effectiveEndMs - startMs) / DAY_MS));
    return sum + elapsedDays * c.dailyBudgetPaise;
  }, 0);

  return NextResponse.json({
    profileViews,
    totalSpentPaise: totalBudgetUsedPaise,
  });
}