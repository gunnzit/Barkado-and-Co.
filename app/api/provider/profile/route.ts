import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  bio: z.string().optional(),
  servicesOffered: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).min(1),
  pricePerWalk: z.number().int().nonnegative().nullable().optional(),
  pricePerSitDay: z.number().int().nonnegative().nullable().optional(),
  pricePerGroom: z.number().int().nonnegative().nullable().optional(),
  pricePerTrain: z.number().int().nonnegative().nullable().optional(),
});

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const pendingRequestsCount = await prisma.booking.count({
    where: { providerId: provider.id, status: "REQUESTED" },
  });

  return NextResponse.json({ ...provider, pendingRequestsCount });
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Prices arrive in rupees from the form — stored in paise. A service
  // that's no longer offered has its price cleared rather than left stale.
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      bio: data.bio ?? provider.bio,
      servicesOffered: data.servicesOffered,
      pricePerWalk: data.servicesOffered.includes("WALKING") ? (data.pricePerWalk != null ? data.pricePerWalk * 100 : provider.pricePerWalk) : null,
      pricePerSitDay: data.servicesOffered.includes("SITTING") ? (data.pricePerSitDay != null ? data.pricePerSitDay * 100 : provider.pricePerSitDay) : null,
      pricePerGroom: data.servicesOffered.includes("GROOMING") ? (data.pricePerGroom != null ? data.pricePerGroom * 100 : provider.pricePerGroom) : null,
      pricePerTrain: data.servicesOffered.includes("TRAINING") ? (data.pricePerTrain != null ? data.pricePerTrain * 100 : provider.pricePerTrain) : null,
    },
  });

  return NextResponse.json(updated);
}