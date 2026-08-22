import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const hoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
);

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const hours = await prisma.providerAvailability.findMany({
    where: { providerId: provider.id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(hours);
}

// Replaces the provider's whole weekly schedule in one go — simpler and
// safer than trying to diff individual day changes client-side.
export async function PUT(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = hoursSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.providerAvailability.deleteMany({ where: { providerId: provider.id } }),
    ...parsed.data.map((d) =>
      prisma.providerAvailability.create({
        data: { providerId: provider.id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime },
      })
    ),
  ]);

  const hours = await prisma.providerAvailability.findMany({
    where: { providerId: provider.id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(hours);
}