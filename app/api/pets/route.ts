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
  // true -> saved as an in-progress draft (Save Draft button)
  // false/omitted -> fully created (Create PawPassport button)
  isDraft: z.boolean().optional(),
});

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