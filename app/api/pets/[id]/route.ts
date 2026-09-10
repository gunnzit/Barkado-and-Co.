import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  breed: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "GIANT"]).optional(),
  species: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  neutered: z.boolean().optional(),
  coatColor: z.string().optional(),
  temperament: z.string().optional(),
  temperamentTags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  birthday: z.string().optional(), // ISO date
  weightKg: z.number().positive().optional(),
  allergies: z.string().optional(),
  allergyTags: z.array(z.string()).optional(),
  medicalHistory: z.string().optional(),
  favoriteTreats: z.string().optional(),
  microchipId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicy: z.string().optional(),
  insuranceCoveragePaise: z.number().nonnegative().optional(),
  insuranceExpiryDate: z.string().optional(), // ISO date
  photoUrl: z.string().optional(),
  themeOverride: z.string().nullable().optional(),
  // Primary veterinary hospital — real fields for the Add Pet Step 2
  // "Primary Veterinary Hospital" section.
  vetHospitalName: z.string().optional(),
  vetHospitalAddress: z.string().optional(),
  vetHospitalLicense: z.string().optional(),
  attendingVetName: z.string().optional(),
  vetEmergencyPhone: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pet = await prisma.pet.findFirst({
    where: { id: resolvedParams.id, ownerId: user.id },
    include: {
      vaccinations: { orderBy: { nextDueDate: "asc" } },
      medications: { where: { active: true }, orderBy: { createdAt: "desc" } },
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

  const { birthday, insuranceExpiryDate, ...rest } = parsed.data;

  const pet = await prisma.pet.update({
    where: { id: resolvedParams.id },
    data: {
      ...rest,
      ...(birthday ? { birthday: new Date(birthday) } : {}),
      ...(insuranceExpiryDate ? { insuranceExpiryDate: new Date(insuranceExpiryDate) } : {}),
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