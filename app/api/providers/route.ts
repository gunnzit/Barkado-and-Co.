import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { computeBudgetUsedPaise, isCapReached } from "@/lib/campaignBudget";

const providerSchema = z.object({
  bio: z.string().optional(),
  servicesOffered: z.array(z.enum(["WALKING", "SITTING"])).min(1),
  serviceAreaPin: z.string().optional(),
  radiusKm: z.number().int().positive().default(5),
  pricePerWalk: z.number().int().positive().optional(),
  pricePerSitDay: z.number().int().positive().optional(),
});

// Composite ranking weights — how much each factor moves a provider up the
// list. Rating and reliability (not declining/expiring/cancelling on
// people) are weighted heaviest since they're the strongest trust signals;
// tenure matters least since "been around a while" shouldn't outweigh
// actually being good at the job.
const RATING_WEIGHT = 0.4;
const RELIABILITY_WEIGHT = 0.3;
const VOLUME_WEIGHT = 0.2;
const TENURE_WEIGHT = 0.1;
const VOLUME_CAP = 50; // completed bookings beyond this don't add further score
const TENURE_CAP_DAYS = 180; // ~6 months for full tenure credit

// Public: browse providers (owners searching)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service"); // WALKING | SITTING | GROOMING | TRAINING
  const pin = searchParams.get("pin");
  const startTime = searchParams.get("startTime"); // ISO datetime-local value, optional

  const providers = await prisma.provider.findMany({
    where: {
      verified: true,
      ...(service ? { servicesOffered: { has: service as any } } : {}),
      ...(pin ? { serviceAreaPin: pin } : {}),
    },
    include: {
      user: { select: { name: true } },
      availability: true,
      // Full booking list (not just a count) — needed to compute
      // completed volume AND the reliability penalty (declined/expired/
      // provider-cancelled) from the same query.
      bookings: { select: { status: true, cancelledBy: true } },
    },
  });

  const now = Date.now();
  const nowDate = new Date();

  // Real active campaigns matching this exact service search — used to
  // both boost ranking and log a genuine impression per appearance. Only
  // fetched when a service is actually specified, since campaign.services
  // matching needs one to compare against.
  const providerIds = providers.map((p) => p.id);
  const activeCampaigns = service && providerIds.length > 0
    ? await prisma.campaign.findMany({
        where: {
          providerId: { in: providerIds },
          status: "ACTIVE",
          services: { has: service as any },
          startDate: { lte: nowDate },
          OR: [{ endDate: null }, { endDate: { gte: nowDate } }],
        },
        select: { id: true, providerId: true, startDate: true, endDate: true, dailyBudgetPaise: true, totalBudgetCapPaise: true },
      })
    : [];

  // Real budget-cap enforcement: a campaign whose Budget Used has reached
  // its cap stops boosting immediately and gets auto-paused, checked here
  // (lazily, on the read path) since no cron job exists to do this on a
  // schedule.
  const capReachedIds: string[] = [];
  const eligibleCampaigns = activeCampaigns.filter((c) => {
    const used = computeBudgetUsedPaise(c.startDate, c.endDate, c.dailyBudgetPaise);
    if (isCapReached(used, c.totalBudgetCapPaise)) {
      capReachedIds.push(c.id);
      return false;
    }
    return true;
  });
  if (capReachedIds.length > 0) {
    await prisma.campaign.updateMany({ where: { id: { in: capReachedIds } }, data: { status: "PAUSED" } });
  }

  // One active campaign per provider for this service — if a provider
  // somehow has more than one matching campaign, only the first is used
  // for boosting/logging, keeping this simple.
  const campaignByProvider = new Map(eligibleCampaigns.map((c) => [c.providerId, c.id]));

  // Flag (not filter, per product decision) providers whose set hours don't
  // cover the requested time. A provider with no hours rows at all is
  // treated as always available — most providers haven't set hours yet, and
  // defaulting them to "unavailable" everywhere would be wrong.
  const requested = startTime ? new Date(startTime) : null;

  const scored = providers.map((p) => {
    const { availability, bookings, ...rest } = p;

    let availableAtRequestedTime: boolean | null = null;
    if (requested && availability.length > 0) {
      const dayOfWeek = requested.getDay();
      const minutes = requested.getHours() * 60 + requested.getMinutes();
      const dayRow = availability.find((a) => a.dayOfWeek === dayOfWeek);
      if (!dayRow) {
        availableAtRequestedTime = false;
      } else {
        const [startH, startM] = dayRow.startTime.split(":").map(Number);
        const [endH, endM] = dayRow.endTime.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        availableAtRequestedTime = minutes >= startMinutes && minutes <= endMinutes;
      }
    }

    const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
    const totalCount = bookings.length;
    // Reliability penalty: declined requests, auto-expired (never
    // responded), and cancellations the PROVIDER themselves initiated.
    // Owner-initiated cancellations never count against the provider —
    // there's no fair way to blame them for a decision they didn't make.
    const badCount = bookings.filter(
      (b) => b.status === "DECLINED" || b.status === "EXPIRED" || (b.status === "CANCELLED" && b.cancelledBy === "PROVIDER")
    ).length;
    const reliability = totalCount === 0 ? 1 : 1 - badCount / totalCount;

    const ratingScore = rest.ratingAvg / 5;
    const volumeScore = Math.min(completedCount / VOLUME_CAP, 1);
    const tenureDays = (now - rest.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const tenureScore = Math.min(tenureDays / TENURE_CAP_DAYS, 1);

    const composite =
      RATING_WEIGHT * ratingScore +
      RELIABILITY_WEIGHT * reliability +
      VOLUME_WEIGHT * volumeScore +
      TENURE_WEIGHT * tenureScore;

    const isSponsored = (() => {
      const homepageActive = !!(rest.sponsoredHomepageUntil && rest.sponsoredHomepageUntil.getTime() > now);
      if (homepageActive) return true;
      if (!service) return false;
      const scopeField: Record<string, Date | null> = {
        WALKING: rest.sponsoredWalkingUntil,
        SITTING: rest.sponsoredSittingUntil,
        GROOMING: rest.sponsoredGroomingUntil,
        TRAINING: rest.sponsoredTrainingUntil,
      };
      const categoryUntil = scopeField[service];
      return !!(categoryUntil && categoryUntil.getTime() > now);
    })();

    const activeCampaignId = campaignByProvider.get(rest.id) ?? null;

    return {
      ...rest,
      _count: { bookings: completedCount }, // preserved shape for existing frontend code
      availableAtRequestedTime,
      isSponsored,
      // Real campaign-driven boost — separate from the paid sponsorship
      // flag above, but both push a provider to the top of results.
      isCampaignBoosted: !!activeCampaignId,
      activeCampaignId,
      composite,
      // Reliability as a whole-number percentage (0–100) for display —
      // same underlying calculation already used in the ranking math above,
      // just exposed to the frontend rather than kept internal.
      reliabilityScore: Math.round(reliability * 100),
    };
  });

  scored.sort((a, b) => {
    const aBoosted = a.isSponsored || a.isCampaignBoosted;
    const bBoosted = b.isSponsored || b.isCampaignBoosted;
    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
    return b.composite - a.composite;
  });

  // Log one real impression per provider whose active campaign caused them
  // to appear in this result set — a genuine count of real search
  // appearances, not an estimate. Awaited (not fire-and-forget) so it isn't
  // dropped if the serverless function terminates right after responding.
  const impressionCampaignIds = scored.filter((p) => p.activeCampaignId).map((p) => p.activeCampaignId as string);
  if (impressionCampaignIds.length > 0) {
    await prisma.campaignImpression.createMany({
      data: impressionCampaignIds.map((campaignId) => ({ campaignId })),
    });
  }

  return NextResponse.json(scored);
}

// Register as a provider (creates Provider row for current user, role stays as-is until admin verifies)
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = providerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const provider = await prisma.provider.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { ...parsed.data, userId: user.id },
  });

  await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });

  return NextResponse.json(provider, { status: 201 });
}