import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  breed: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  temperament: z.string().optional(),
  notes: z.string().optional(),
  birthday: z.string().optional(), // ISO date
  weightKg: z.number().positive().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  favoriteTreats: z.string().optional(),
  microchipId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicy: z.string().optional(),
  photoUrl: z.string().optional(),
  themeOverride: z.string().nullable().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await prisma.pet.findFirst({
    where: { id: resolvedParams.id, ownerId: user.id },
    include: {
      vaccinations: { orderBy: { nextDueDate: "asc" } },
      bookings: {
        include: { provider: { include: { user: true } } },
        orderBy: { startTime: "desc" },
      },
    },
  });
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(pet);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.pet.findFirst({ where: { id: resolvedParams.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { birthday, ...rest } = parsed.data;

  const pet = await prisma.pet.update({
    where: { id: resolvedParams.id },
    data: {
      ...rest,
      ...(birthday ? { birthday: new Date(birthday) } : {}),
    },
  });

  return NextResponse.json(pet);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.pet.findFirst({ where: { id: resolvedParams.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pet.delete({ where: { id: resolvedParams.id } });
  return NextResponse.json({ success: true });
}