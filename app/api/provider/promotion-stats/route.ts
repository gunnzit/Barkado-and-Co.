import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { computeBudgetUsedPaise } from "@/lib/campaignBudget";

const thirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

  let totalBudgetUsedPaise = 0;
  let totalClicks = 0;
  for (const c of campaigns) {
    totalBudgetUsedPaise += computeBudgetUsedPaise(c.startDate, c.endDate, c.dailyBudgetPaise);
    totalClicks += c._count.clicks;
  }

  return NextResponse.json({
    profileViews,
    totalSpentPaise: totalBudgetUsedPaise,
    totalClicks,
  });
}