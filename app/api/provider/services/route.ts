import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Full current state for the Services tab — everything except the
// packages themselves (those have their own CRUD routes since they're
// lists, not single fields).
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({
    where: { userId: user.id },
    include: {
      trainingPackages: { orderBy: { createdAt: "asc" } },
      groomingPackages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  return NextResponse.json(provider);
}

const patchSchema = z.object({
  // Walking's toggle is a real on/off in servicesOffered — its rate stays
  // platform-fixed regardless (never editable here). Sitting stays a flat
  // per-day rate, per product decision — no packages/cadence for it.
  servicesOffered: z.array(z.enum(["WALKING", "SITTING", "GROOMING", "TRAINING"])).optional(),
  pricePerSitDay: z.number().int().positive().nullable().optional(),
  trainingCadences: z.array(z.enum(["WEEKLY", "MONTHLY"])).optional(),
  groomingSizes: z.array(z.enum(["SMALL", "MEDIUM", "LARGE"])).optional(),
});

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.provider.findUnique({ where: { userId: user.id } });
  if (!provider) return NextResponse.json({ error: "Not a provider" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: parsed.data as any,
  });

  return NextResponse.json(updated);
}