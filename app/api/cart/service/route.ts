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
});

// Walking prices are set by the platform, not individual providers.
// Grooming, Training, and Sitting remain provider-set.
const WALK_PRICING_PAISE: Record<number, number> = {
  30: 30000, // ₹300
  45: 32500, // ₹325
  60: 35000, // ₹350
};

function priceForService(
  serviceType: string,
  provider: { pricePerSitDay: number | null; pricePerGroom: number | null; pricePerTrain: number | null },
  durationMin: number
): number | null {
  if (serviceType === "WALKING") {
    // Never trust a client-supplied price for a platform-fixed service —
    // derive it from the actual start/end duration, and reject anything
    // that doesn't match one of the real tiers.
    return WALK_PRICING_PAISE[durationMin] ?? null;
  }
  const field = {
    SITTING: provider.pricePerSitDay,
    GROOMING: provider.pricePerGroom,
    TRAINING: provider.pricePerTrain,
  }[serviceType];
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

  const priceAmount = priceForService(
    data.serviceType,
    provider,
    Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000)
  );
  if (priceAmount === null) {
    return NextResponse.json({ error: "Invalid walk duration — must be 30, 45, or 60 minutes" }, { status: 400 });
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
    },
  });

  return NextResponse.json(item, { status: 201 });
}