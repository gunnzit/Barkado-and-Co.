import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { computeBudgetUsedPaise, isCapReached } from "@/lib/campaignBudget";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  services: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1, "Pick at least one service"),
  dailyBudgetPaise: z.number().int().positive(),
  totalBudgetCapPaise: z.number().int().positive().optional(),
  startDate: z.string(), // ISO datetime
});

// List this provider's campaigns — used by Campaign History. Adds real,
// derived fields on top of the stored data (reachCount, clickCount,
// budgetUsedPaise — see lib/campaignBudget.ts for the shared math), and
// lazily auto-pauses any ACTIVE campaign whose Budget Used has reached its
// cap, same check as the search-ranking route performs.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { providerId: provider.id },
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

// Create a real campaign from the "New Campaign" form.
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

  const campaign = await prisma.campaign.create({
    data: {
      providerId: provider.id,
      name: parsed.data.name,
      services: parsed.data.services as any,
      dailyBudgetPaise: parsed.data.dailyBudgetPaise,
      totalBudgetCapPaise: parsed.data.totalBudgetCapPaise ?? null,
      startDate: new Date(parsed.data.startDate),
      status: "ACTIVE",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}