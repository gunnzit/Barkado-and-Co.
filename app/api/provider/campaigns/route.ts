import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// Real substitutes for the reference design's ad-performance numbers —
// "Total Budget Used" sums real per-campaign budget consumption (elapsed
// days × dailyBudgetPaise) across all of this provider's campaigns.
// "Total Clicks" is a genuine count of CampaignClick rows across all
// campaigns — never an estimate or a ratio applied to impressions.
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
      select: { startDate: true, endDate: true, dailyBudgetPaise: true, _count: { select: { clicks: true } } },
    }),
  ]);

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let totalBudgetUsedPaise = 0;
  let totalClicks = 0;
  for (const c of campaigns) {
    const startMs = c.startDate.getTime();
    const endMs = c.endDate ? c.endDate.getTime() : now;
    const effectiveEndMs = Math.min(endMs, now);
    const elapsedDays = startMs > now ? 0 : Math.max(0, Math.floor((effectiveEndMs - startMs) / DAY_MS));
    totalBudgetUsedPaise += elapsedDays * c.dailyBudgetPaise;
    totalClicks += c._count.clicks;
  }

  return NextResponse.json({
    profileViews,
    totalSpentPaise: totalBudgetUsedPaise,
    totalClicks,
  });
}