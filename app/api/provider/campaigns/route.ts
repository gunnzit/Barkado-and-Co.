import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { computeBudgetUsedPaise, isCapReached } from "@/lib/campaignBudget";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  services: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1, "Pick at least one service"),
  dailyBudgetPaise: z.number().int().positive(),
  // Required now — the one-time Razorpay charge on launch is for exactly
  // this amount, so there's nothing to charge for an uncapped campaign.
  totalBudgetCapPaise: z.number().int().positive(),
  startDate: z.string(), // ISO datetime
});

// List this provider's REAL campaigns — only ones with a confirmed
// payment (paidAt not null). A campaign whose checkout was abandoned or
// failed never surfaces here, same principle as Order/Booking: existing
// in the DB isn't the same as being real yet.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { providerId: provider.id, paidAt: { not: null } },
    include: { _count: { select: { impressions: true, clicks: true } } },
    orderBy: { createdAt: "desc" },
  });

  const capReachedIds: string[] = [];
  const withComputed = campaigns.map((c) => {
    const budgetUsedPaise = computeBudgetUsedPaise(c.startDate, c.endDate, c.dailyBudgetPaise);
    const capReached = isCapReached(budgetUsedPaise, c.totalBudgetCapPaise);
    if (capReached && c.status === "ACTIVE") capReachedIds.push(c.id);

    const { _count, ...rest } = c;
    return {
      ...rest,
      status: capReached && c.status === "ACTIVE" ? ("PAUSED" as const) : c.status,
      reachCount: _count.impressions,
      clickCount: _count.clicks,
      budgetUsedPaise,
      capReached,
    };
  });

  if (capReachedIds.length > 0) {
    await prisma.campaign.updateMany({ where: { id: { in: capReachedIds } }, data: { status: "PAUSED" } });
  }

  return NextResponse.json(withComputed);
}

// Step 1 of launching a real campaign: creates a Razorpay order for the
// full totalBudgetCapPaise amount (one-time upfront charge, per product
// decision — not a recurring daily bill), and creates the Campaign row
// immediately but UNPAID (paidAt: null). The row only becomes real once
// /api/provider/campaigns/[id]/verify confirms the payment — same
// two-step pattern as checkout/verify already used for cart orders.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: parsed.data.totalBudgetCapPaise,
    currency: "INR",
    notes: { purpose: "campaign_launch", providerId: provider.id },
  });

  const campaign = await prisma.campaign.create({
    data: {
      providerId: provider.id,
      name: parsed.data.name,
      services: parsed.data.services as any,
      dailyBudgetPaise: parsed.data.dailyBudgetPaise,
      totalBudgetCapPaise: parsed.data.totalBudgetCapPaise,
      startDate: new Date(parsed.data.startDate),
      status: "ACTIVE",
      razorpayOrderId: razorpayOrder.id,
      paidAt: null,
    },
  });

  return NextResponse.json({
    campaignId: campaign.id,
    razorpayOrderId: razorpayOrder.id,
    amount: parsed.data.totalBudgetCapPaise,
  }, { status: 201 });
}