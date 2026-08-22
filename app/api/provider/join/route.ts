import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const joinSchema = z.object({
  bio: z.string().optional(),
  servicesOffered: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1),
  pricePerWalk: z.number().int().nonnegative().optional(),
  pricePerSitDay: z.number().int().nonnegative().optional(),
  pricePerGroom: z.number().int().nonnegative().optional(),
  pricePerTrain: z.number().int().nonnegative().optional(),
  serviceAreaPin: z.string().optional(),
  radiusKm: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Already a provider" }, { status: 400 });

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Prices arrive in rupees from the form — stored in paise, matching every
  // other price field in the schema.
  //
  // NOTE: new providers now start unverified (schema default) pending
  // approval through the verification flow, rather than auto-verified.
  // Approval happens by an admin reviewing submitted documents and flipping
  // `verified` to true.
  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      bio: data.bio || null,
      servicesOffered: data.servicesOffered,
      pricePerWalk: data.pricePerWalk != null ? data.pricePerWalk * 100 : null,
      pricePerSitDay: data.pricePerSitDay != null ? data.pricePerSitDay * 100 : null,
      pricePerGroom: data.pricePerGroom != null ? data.pricePerGroom * 100 : null,
      pricePerTrain: data.pricePerTrain != null ? data.pricePerTrain * 100 : null,
      serviceAreaPin: data.serviceAreaPin || null,
      radiusKm: data.radiusKm ?? 5,
    },
  });

  return NextResponse.json(provider, { status: 201 });
}