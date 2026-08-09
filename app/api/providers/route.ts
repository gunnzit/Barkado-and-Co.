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

// Public: browse providers (owners searching)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service"); // WALKING | SITTING
  const pin = searchParams.get("pin");

  const providers = await prisma.provider.findMany({
    where: {
      verified: true,
      ...(service ? { servicesOffered: { has: service as "WALKING" | "SITTING" } } : {}),
      ...(pin ? { serviceAreaPin: pin } : {}),
    },
    include: {
      user: { select: { name: true } },
      _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { ratingAvg: "desc" },
  });
  return NextResponse.json(providers);
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
