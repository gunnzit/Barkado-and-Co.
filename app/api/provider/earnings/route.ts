import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const SERVICE_LABEL: Record<string, string> = {
  WALKING: "Adventure Walk",
  SITTING: "Home Staycation",
  GROOMING: "Luxury Spa Session",
  TRAINING: "Good Manners Programme",
};

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [todayAgg, weekAgg, monthAgg, monthGrossAgg, lifetimeAgg, allBookings, profileViews, recentCompleted] = await Promise.all([
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfToday } },
      _sum: { providerPayoutPaise: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfWeek } },
      _sum: { providerPayoutPaise: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfMonth } },
      _sum: { providerPayoutPaise: true },
      _count: true,
    }),
    // Gross (pre-commission) figure for the current month — same date
    // window as monthAgg above, just summing priceAmount instead of
    // providerPayoutPaise, so "service fee" can be shown as the real
    // difference between the two rather than an invented number.
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfMonth } },
      _sum: { priceAmount: true },
    }),
    // Lifetime net total — shown as "Total Earned," never framed as a
    // withdrawable balance, since no payout ledger exists to track what's
    // actually been paid out versus still owed.
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED" },
      _sum: { providerPayoutPaise: true },
    }),
    prisma.booking.findMany({
      where: { providerId: provider.id },
      select: { status: true },
    }),
    prisma.activityEvent.count({
      where: { type: "PAGE_VIEW", path: `/providers/${provider.id}`, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Real recent transactions — actual completed bookings, not sample data.
    prisma.booking.findMany({
      where: { providerId: provider.id, status: "COMPLETED" },
      select: {
        id: true,
        type: true,
        startTime: true,
        endTime: true,
        priceAmount: true,
        providerPayoutPaise: true,
        pet: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
  ]);

  const total = allBookings.length;
  const accepted = allBookings.filter((b) => b.status !== "REQUESTED" && b.status !== "DECLINED").length;
  const completed = allBookings.filter((b) => b.status === "COMPLETED").length;
  const declined = allBookings.filter((b) => b.status === "DECLINED").length;
  const respondedTotal = accepted + declined;

  const weeklyGoal = 10;
  const weekCompletedCount = weekAgg._count;

  const monthGrossPaise = monthGrossAgg._sum.priceAmount ?? 0;
  const monthNetPaise = monthAgg._sum.providerPayoutPaise ?? 0;

  return NextResponse.json({
    today: { totalPaise: todayAgg._sum.providerPayoutPaise ?? 0, count: todayAgg._count },
    week: { totalPaise: weekAgg._sum.providerPayoutPaise ?? 0, count: weekAgg._count },
    month: {
      totalPaise: monthNetPaise,
      count: monthAgg._count,
      grossPaise: monthGrossPaise,
      feePaise: monthGrossPaise - monthNetPaise,
    },
    lifetimeNetPaise: lifetimeAgg._sum.providerPayoutPaise ?? 0,
    acceptanceRate: respondedTotal > 0 ? accepted / respondedTotal : null,
    completionRate: accepted > 0 ? completed / accepted : null,
    totalBookings: total,
    streak: { goal: weeklyGoal, current: weekCompletedCount },
    profileViews,
    transactions: recentCompleted.map((b) => ({
      id: b.id,
      label: `${SERVICE_LABEL[b.type] ?? b.type} with ${b.pet.name}`,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      grossPaise: b.priceAmount,
      netPaise: b.providerPayoutPaise ?? 0,
    })),
  });
}