import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // back to Sunday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayAgg, weekAgg, monthAgg, allBookings] = await Promise.all([
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfToday } },
      _sum: { priceAmount: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfWeek } },
      _sum: { priceAmount: true },
      _count: true,
    }),
    prisma.booking.aggregate({
      where: { providerId: provider.id, status: "COMPLETED", startTime: { gte: startOfMonth } },
      _sum: { priceAmount: true },
      _count: true,
    }),
    // Pulled once, counted in memory — simplest way to get acceptance/
    // completion rates across every status without N separate queries.
    prisma.booking.findMany({
      where: { providerId: provider.id },
      select: { status: true },
    }),
  ]);

  const total = allBookings.length;
  const accepted = allBookings.filter((b) => b.status !== "REQUESTED" && b.status !== "DECLINED").length;
  const completed = allBookings.filter((b) => b.status === "COMPLETED").length;
  const declined = allBookings.filter((b) => b.status === "DECLINED").length;
  const respondedTotal = accepted + declined;

  // Simple weekly streak goal — a fixed target for now, not per-provider
  // configurable yet.
  const weeklyGoal = 10;
  const weekCompletedCount = weekAgg._count;

  return NextResponse.json({
    today: { totalPaise: todayAgg._sum.priceAmount ?? 0, count: todayAgg._count },
    week: { totalPaise: weekAgg._sum.priceAmount ?? 0, count: weekAgg._count },
    month: { totalPaise: monthAgg._sum.priceAmount ?? 0, count: monthAgg._count },
    acceptanceRate: respondedTotal > 0 ? accepted / respondedTotal : null,
    completionRate: accepted > 0 ? completed / accepted : null,
    totalBookings: total,
    streak: { goal: weeklyGoal, current: weekCompletedCount },
  });
}