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

// List this provider's campaigns — used by Campaign History.
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

// Create a real campaign from the "New Campaign" form. Reach/Clicks/ROI
// are never written here — this only saves what the provider actually
// configured. Status is always set to ACTIVE on creation, even for a
// future-dated "Schedule for Later" start: there's no background job yet
// to flip status based on startDate, so startDate records intent but
// doesn't yet drive automatic status changes. Worth knowing before relying
// on status to mean "currently running."
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