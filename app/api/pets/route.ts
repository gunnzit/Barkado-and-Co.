import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  species: z.string().optional(),
  breed: z.string().optional(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE", "GIANT"]).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  neutered: z.boolean().optional(),
  coatColor: z.string().optional(),
  birthday: z.string().optional(), // ISO date
  weightKg: z.number().positive().optional(),
  microchipId: z.string().optional(),
  allergyTags: z.array(z.string()).optional(),
  temperamentTags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  // Legacy fields still sent by the quick-add form's old body shape, if
  // anything still posts them.
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  favoriteTreats: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicy: z.string().optional(),
  temperament: z.string().optional(),
  // true -> saved as an in-progress draft (Save Draft button)
  // false/omitted -> fully created (Create PawPassport button)
  isDraft: z.boolean().optional(),
});

// List the current user's own pets. PetsClient's "Your pets" page depends
// on this — each pet includes vaccinations so the "N vaccines on record"
// badge on the pet list can render without a second request per pet.
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { birthday, isDraft, ...rest } = parsed.data;

  const pet = await prisma.pet.create({
    data: {
      ownerId: user.id,
      ...rest,
      status: isDraft ? "DRAFT" : "ACTIVE",
      ...(birthday ? { birthday: new Date(birthday) } : {}),
    },
  });

  return NextResponse.json(pet);
}