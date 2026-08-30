import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const serviceSchema = z.object({
  serviceType: z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"]),
  providerId: z.string(),
  petId: z.string(),
  startTime: z.string(), // ISO datetime-local value
  endTime: z.string(),
  address: z.string(),
  phone: z.string(),
  // Only used/required for GROOMING — real package + size, priced
  // server-side from the provider's own saved package, never trusted
  // from whatever the client sends.
  groomingPackageId: z.string().optional(),
  groomingSize: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
});

// Walking prices are set by the platform, not individual providers.
// Sitting and Training remain provider-set via a flat rate. Grooming is
// priced per real package + size (see below) — no flat rate involved.
const WALK_PRICING_PAISE: Record<number, number> = {
  30: 30000, // ₹300
  45: 32500, // ₹325
  60: 35000, // ₹350
};

function priceForFlatService(
  serviceType: "SITTING" | "TRAINING",
  provider: { pricePerSitDay: number | null; pricePerTrain: number | null }
): number {
  const field = { SITTING: provider.pricePerSitDay, TRAINING: provider.pricePerTrain }[serviceType];
  return field ?? 0;
}

// Adds a service booking-in-progress to the cart (time, provider, pet,
// meeting details already chosen — payment and final booking creation
// happen at checkout). Each call creates a new cart row; unlike products,
// service items aren't deduped/merged by quantity.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [provider, pet] = await Promise.all([
    prisma.provider.findUnique({ where: { id: data.providerId } }),
    prisma.pet.findFirst({ where: { id: data.petId, ownerId: user.id } }),
  ]);
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

  let priceAmount: number;
  let groomingPackageName: string | null = null;
  let groomingSize: string | null = null;

  if (data.serviceType === "WALKING") {
    // Never trust a client-supplied price for a platform-fixed service —
    // derive it from the actual start/end duration, and reject anything
    // that doesn't match one of the real tiers.
    const durationMin = Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000);
    const walkPrice = WALK_PRICING_PAISE[durationMin];
    if (walkPrice === undefined) {
      return NextResponse.json({ error: "Invalid walk duration — must be 30, 45, or 60 minutes" }, { status: 400 });
    }
    priceAmount = walkPrice;
  } else if (data.serviceType === "GROOMING") {
    if (!data.groomingPackageId || !data.groomingSize) {
      return NextResponse.json({ error: "Choose a package and size." }, { status: 400 });
    }
    const pkg = await prisma.groomingPackage.findUnique({ where: { id: data.groomingPackageId } });
    if (!pkg || pkg.providerId !== provider.id) {
      return NextResponse.json({ error: "That package no longer exists." }, { status: 404 });
    }
    const pricesBySize = pkg.pricesBySize as Record<string, number>;
    const sizePrice = pricesBySize[data.groomingSize];
    if (sizePrice == null) {
      return NextResponse.json({ error: "This package isn't available for that size." }, { status: 400 });
    }
    priceAmount = sizePrice;
    groomingPackageName = pkg.name;
    groomingSize = data.groomingSize;
  } else {
    priceAmount = priceForFlatService(data.serviceType, provider);
  }

  const item = await prisma.cartItem.create({
    data: {
      userId: user.id,
      kind: "SERVICE",
      serviceType: data.serviceType,
      providerId: provider.id,
      petId: pet.id,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      address: data.address,
      phone: data.phone,
      priceAmount,
      groomingPackageName,
      groomingSize: groomingSize as any,
    },
  });

  return NextResponse.json(item, { status: 201 });
}