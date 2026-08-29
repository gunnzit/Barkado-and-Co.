import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

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

    const isSponsored = !!(rest.sponsoredUntil && rest.sponsoredUntil.getTime() > now);

    return {
      ...rest,
      _count: { bookings: completedCount }, // preserved shape for existing frontend code
      availableAtRequestedTime,
      isSponsored,
      composite,
    };
  });

  scored.sort((a, b) => {
    if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;
    return b.composite - a.composite;
  });

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