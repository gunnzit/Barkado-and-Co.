import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { getPawPointsBalance, getRollingTierPoints, tierForPoints, getExpiringPoints, redemptionValuePaise } from "@/lib/pawPoints";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [balance, rollingTierPoints, expiringSoon, transactions] = await Promise.all([
    getPawPointsBalance(user.id),
    getRollingTierPoints(user.id),
    getExpiringPoints(user.id, 7),
    prisma.pawPointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    balance,
    redemptionValuePaise: redemptionValuePaise(balance),
    rollingTierPoints,
    tier: tierForPoints(rollingTierPoints),
    expiringSoonPoints: expiringSoon,
    transactions,
  });
}