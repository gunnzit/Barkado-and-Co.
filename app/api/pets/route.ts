import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const petSchema = z.object({
  name: z.string().min(1),
  breed: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).default("MEDIUM"),
  temperament: z.string().optional(),
  notes: z.string().optional(),
  birthday: z.string().optional(),
  weightKg: z.number().positive().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  favoriteTreats: z.string().optional(),
  microchipId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicy: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pets = await prisma.pet.findMany({
    where: { ownerId: user.id },
    include: { vaccinations: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pets);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = petSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { birthday, ...rest } = parsed.data;

  const pet = await prisma.pet.create({
    data: {
      ...rest,
      ownerId: user.id,
      ...(birthday ? { birthday: new Date(birthday) } : {}),
    },
  });
  return NextResponse.json(pet, { status: 201 });
}