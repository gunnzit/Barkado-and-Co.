import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { getPawPointsBalance } from "@/lib/pawPoints";

const schema = z.object({ rewardId: z.string() });

// Claims a real reward — deducts real points (via a real REDEEMED
// transaction, consumed FIFO from the user's real ledger) and creates a
// PawPointsRewardRedemption "voucher" row. Balance is re-checked live
// right before writing (never trusted from the client); a small race
// window exists since there's no lockable balance column, same accepted
// tradeoff as Payout's "amount owed" elsewhere in this app.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reward = await prisma.pawPointsReward.findUnique({ where: { id: parsed.data.rewardId } });
  if (!reward || !reward.active) {
    return NextResponse.json({ error: "That reward isn't available." }, { status: 404 });
  }

  const balance = await getPawPointsBalance(user.id);
  if (balance < reward.costPoints) {
    return NextResponse.json({ error: `Not enough points — you need ${reward.costPoints - balance} more.` }, { status: 400 });
  }

  const [, redemption] = await prisma.$transaction([
    prisma.pawPointsTransaction.create({
      data: { userId: user.id, type: "REDEEMED", points: reward.costPoints },
    }),
    prisma.pawPointsRewardRedemption.create({
      data: { userId: user.id, rewardId: reward.id },
    }),
  ]);

  return NextResponse.json(redemption, { status: 201 });
}