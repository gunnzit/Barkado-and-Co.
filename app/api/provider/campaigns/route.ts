import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  services: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1, "Pick at least one service"),
  dailyBudgetPaise: z.number().int().positive(),
  startDate: z.string(), // ISO datetime
});

// List this provider's campaigns — used by Campaign History. Adds two
// real, derived fields on top of the stored data:
//  - reachCount: a genuine count of CampaignImpression rows (real search
//    appearances), not an estimate.
//  - budgetUsedPaise: real elapsed active days × the real daily budget.
//    Labeled "Budget Used," never "Spend" — no actual charge happens
//    anywhere in this flow, so this must never be presented as money that
//    changed hands.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { providerId: provider.id },
    include: { _count: { select: { impressions: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const withComputed = campaigns.map((c) => {
    const startMs = c.startDate.getTime();
    const endMs = c.endDate ? c.endDate.getTime() : now;
    const effectiveEndMs = Math.min(endMs, now);
    // Not started yet (future-dated "Schedule for Later") -> zero elapsed
    // days, zero budget used, regardless of status field.
    const elapsedDays = startMs > now ? 0 : Math.max(0, Math.floor((effectiveEndMs - startMs) / DAY_MS));

    const { _count, ...rest } = c;
    return {
      ...rest,
      reachCount: _count.impressions,
      budgetUsedPaise: elapsedDays * c.dailyBudgetPaise,
    };
  });

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
      startDate: new Date(parsed.data.startDate),
      status: "ACTIVE",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}